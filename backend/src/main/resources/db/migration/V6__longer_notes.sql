-- A note is where a traveller keeps the memo for the day — the ferry times, what to pack, the
-- tide table. A thousand characters ran out in practice; five thousand is a page of text.
ALTER TABLE days       ALTER COLUMN notes TYPE varchar(5000);
ALTER TABLE activities ALTER COLUMN notes TYPE varchar(5000);
ALTER TABLE bookings   ALTER COLUMN notes TYPE varchar(5000);
ALTER TABLE todos      ALTER COLUMN notes TYPE varchar(5000);
