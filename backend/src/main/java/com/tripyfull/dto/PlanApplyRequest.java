package com.tripyfull.dto;

import java.util.List;
import java.util.UUID;

/** Assignment to materialize: for each day, the ordered place ids to append as activities. */
public record PlanApplyRequest(List<DayAssignment> days) {
    public record DayAssignment(UUID dayId, List<UUID> placeIds) {}
}
