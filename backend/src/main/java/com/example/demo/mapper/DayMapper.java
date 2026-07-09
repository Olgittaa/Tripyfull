package com.example.demo.mapper;

import com.example.demo.dto.DayResponse;
import com.example.demo.model.Day;

import java.util.List;

public final class DayMapper {

    private DayMapper() {}

    public static DayResponse toResponse(Day day, int dayNumber) {
        return new DayResponse(
                day.getId(),
                dayNumber,
                day.getDate(),
                day.getCity(),
                day.getOvernightStay(),
                day.getLinkedBookingId(),
                day.getNotes()
        );
    }

    public static List<DayResponse> toResponseList(List<Day> days) {
        return days.stream()
                .sorted((a, b) -> a.getDate().compareTo(b.getDate()))
                .map((day) -> {
                    int idx = days.indexOf(day);
                    return toResponse(day, idx + 1);
                })
                .toList();
    }
}
