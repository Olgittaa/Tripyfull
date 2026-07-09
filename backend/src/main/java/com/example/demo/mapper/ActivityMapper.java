package com.example.demo.mapper;

import com.example.demo.dto.ActivityRequest;
import com.example.demo.dto.ActivityResponse;
import com.example.demo.model.Activity;
import com.example.demo.model.ActivityType;

public final class ActivityMapper {

    private ActivityMapper() {}

    public static Activity toEntity(ActivityRequest req) {
        Activity a = new Activity();
        a.setName(req.name());
        if (req.type() != null) a.setType(ActivityType.valueOf(req.type()));
        a.setStartTime(req.startTime());
        a.setEndTime(req.endTime());
        a.setAddress(req.address());
        a.setCostEstimate(req.costEstimate());
        a.setCostCurrency(req.costCurrency());
        a.setNotes(req.notes());
        return a;
    }

    public static void updateEntity(Activity a, ActivityRequest req) {
        if (req.name() != null) a.setName(req.name());
        if (req.type() != null) a.setType(ActivityType.valueOf(req.type()));
        if (req.startTime() != null) a.setStartTime(req.startTime());
        if (req.endTime() != null) a.setEndTime(req.endTime());
        if (req.address() != null) a.setAddress(req.address());
        if (req.costEstimate() != null) a.setCostEstimate(req.costEstimate());
        if (req.costCurrency() != null) a.setCostCurrency(req.costCurrency());
        if (req.notes() != null) a.setNotes(req.notes());
    }

    public static ActivityResponse toResponse(Activity a) {
        return new ActivityResponse(
                a.getId(),
                a.getName(),
                a.getType() != null ? a.getType().name() : null,
                a.getStartTime(),
                a.getEndTime(),
                a.getAddress(),
                a.getCostEstimate(),
                a.getCostCurrency(),
                a.getNotes(),
                a.getOrderIndex(),
                a.getPlace() != null ? a.getPlace().getId() : null,
                a.getPlace() != null ? a.getPlace().getName() : null,
                a.getPlace() != null ? a.getPlace().getLatitude() : null,
                a.getPlace() != null ? a.getPlace().getLongitude() : null
        );
    }
}
