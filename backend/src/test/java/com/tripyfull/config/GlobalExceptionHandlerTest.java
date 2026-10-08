package com.tripyfull.config;

import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;

import java.sql.SQLException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class GlobalExceptionHandlerTest {

    @Test
    void aTextOverItsColumnNamesTheLimit() {
        var ex = new DataIntegrityViolationException("could not execute statement",
                new SQLException("ERROR: value too long for type character varying(5000)", "22001"));
        assertEquals("5000", GlobalExceptionHandler.tooLongLimit(ex));
        assertEquals(400, new GlobalExceptionHandler().handleIntegrity(ex).getStatusCode().value());
    }

    @Test
    void anyOtherIntegrityFailureStaysAServerError() {
        var ex = new DataIntegrityViolationException("could not execute statement",
                new SQLException("ERROR: insert or update violates foreign key constraint", "23503"));
        assertNull(GlobalExceptionHandler.tooLongLimit(ex));
        assertEquals(500, new GlobalExceptionHandler().handleIntegrity(ex).getStatusCode().value());
    }
}
