-- TRAIN joins the transport modes. The column carries a CHECK from the original
-- schema dump listing the allowed values, so the enum alone is not enough: the
-- constraint has to be widened or every train booking is rejected by the database.
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_transport_mode_check;

ALTER TABLE bookings ADD CONSTRAINT bookings_transport_mode_check
    CHECK (transport_mode IS NULL OR transport_mode IN
        ('FLIGHT', 'TRAIN', 'FERRY', 'BUS', 'METRO', 'CAR_RENTAL', 'TAXI', 'WALK'));
