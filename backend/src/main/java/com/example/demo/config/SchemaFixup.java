package com.example.demo.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * One-off schema reconciliation that ddl-auto=update can't do itself.
 * Drops the stale places.source CHECK constraint left from before PlaceSource.IMPORTED
 * existed (Hibernate never updates value checks on existing columns). Idempotent.
 */
@Component
public class SchemaFixup implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(SchemaFixup.class);
    private final JdbcTemplate jdbc;

    public SchemaFixup(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public void run(ApplicationArguments args) {
        try {
            jdbc.execute("ALTER TABLE places DROP CONSTRAINT IF EXISTS places_source_check");
            log.info("SchemaFixup: ensured places_source_check is dropped");
        } catch (Exception e) {
            log.warn("SchemaFixup failed (non-fatal): {}", e.getMessage());
        }
    }
}
