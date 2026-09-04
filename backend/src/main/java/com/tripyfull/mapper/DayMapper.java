package com.tripyfull.mapper;

import com.tripyfull.dto.DayResponse;
import com.tripyfull.model.Day;

import java.util.Comparator;
import java.util.List;
import java.util.stream.IntStream;

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
                day.getNotes(),
                day.isBuffer()
        );
    }

    public static List<DayResponse> toResponseList(List<Day> days) {
        // Reserve days have no date and belong after the dated ones.
        List<Day> sorted = days.stream()
                .sorted(Comparator.comparing(Day::getDate, Comparator.nullsLast(Comparator.naturalOrder())))
                .toList();
        return IntStream.range(0, sorted.size())
                .mapToObj(i -> toResponse(sorted.get(i), i + 1))
                .toList();
    }
}
