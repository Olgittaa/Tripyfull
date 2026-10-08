package com.tripyfull.mapper;

import com.tripyfull.dto.ActivityRequest;
import com.tripyfull.model.Activity;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class ActivityMapperTest {

    private static Activity timedStop() {
        Activity a = new Activity();
        a.setName("Viewpoint");
        a.setStartTime(LocalTime.of(9, 0));
        a.setEndTime(LocalTime.of(10, 0));
        a.setCostEstimate(new BigDecimal("200"));
        return a;
    }

    private static ActivityRequest request(String travelMode, Boolean replaceAll) {
        return new ActivityRequest("Viewpoint", null, null, null, null, null, null, null,
                null, null, null, travelMode, null, null, null, null, replaceAll);
    }

    @Test
    void theEditorTakesATimeAndACostAway() {
        Activity a = timedStop();
        ActivityMapper.updateEntity(a, request(null, true));
        assertNull(a.getStartTime());
        assertNull(a.getEndTime());
        assertNull(a.getCostEstimate());
    }

    @Test
    void aOneFieldPatchLeavesTheRestAlone() {
        Activity a = timedStop();
        ActivityMapper.updateEntity(a, request("foot", null));
        assertEquals(LocalTime.of(9, 0), a.getStartTime());
        assertEquals(LocalTime.of(10, 0), a.getEndTime());
        assertEquals(new BigDecimal("200"), a.getCostEstimate());
        assertEquals("foot", a.getTravelModeToNext());
    }
}
