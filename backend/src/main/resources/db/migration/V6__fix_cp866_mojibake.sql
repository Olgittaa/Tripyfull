-- Repairs text that arrived as UTF-8, was read as CP866 (DOS Cyrillic) and then
-- stored as UTF-8 again — the double encoding that came in with the imported
-- backup. "★★★★☆ · Cafe" had become "тШЕтШЕтШЕтШЕтШЖ ┬╖ Cafe", "Café" became
-- "Caf├й", and Thai and Russian turned into box-drawing soup.
--
-- Encoding to CP866 and decoding as UTF-8 undoes it exactly. But that round-trip
-- also "succeeds" by coincidence on some genuine Cyrillic input — a folder really
-- named "укаука" comes back as "㪠㪠" — so a row is only rewritten when the
-- result reads as plausible text. Coincidences land outside that set, as CJK,
-- and are left untouched.

CREATE FUNCTION tf_cp866_repair(t text) RETURNS text LANGUAGE plpgsql IMMUTABLE AS $$
BEGIN
    RETURN convert_from(convert_to(t, 'WIN866'), 'UTF8');
EXCEPTION WHEN others THEN
    -- Not representable in CP866, so it cannot be damage of this kind.
    RETURN NULL;
END $$;

-- Plausible = whitespace, Latin (incl. Extended), Greek, Cyrillic, Thai,
-- punctuation, currency, arrows and symbols/dingbats (stars live there).
CREATE FUNCTION tf_cp866_trusted(original text, repaired text) RETURNS boolean LANGUAGE sql IMMUTABLE AS $$
    SELECT repaired IS NOT NULL
       AND repaired <> original
       AND repaired !~ '[^\u0009-\u000D\u0020-\u024F\u0370-\u03FF\u0400-\u04FF\u0E00-\u0E7F\u2000-\u206F\u20A0-\u20BF\u2190-\u21FF\u2600-\u27BF\uFE0F-\uFE0F]'
$$;

DO $$
DECLARE
    col record;
    fixed bigint;
    total bigint := 0;
BEGIN
    FOR col IN
        SELECT table_name, column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND data_type IN ('text', 'character varying')
          AND table_name <> 'flyway_schema_history'
        ORDER BY table_name, column_name
    LOOP
        EXECUTE format(
            'UPDATE %I SET %I = tf_cp866_repair(%I) '
            'WHERE %I IS NOT NULL AND tf_cp866_trusted(%I, tf_cp866_repair(%I))',
            col.table_name, col.column_name, col.column_name,
            col.column_name, col.column_name, col.column_name);
        GET DIAGNOSTICS fixed = ROW_COUNT;
        IF fixed > 0 THEN
            RAISE NOTICE 'repaired %.%: % rows', col.table_name, col.column_name, fixed;
            total := total + fixed;
        END IF;
    END LOOP;
    RAISE NOTICE 'repaired % rows in total', total;
END $$;

DROP FUNCTION tf_cp866_trusted(text, text);
DROP FUNCTION tf_cp866_repair(text);
