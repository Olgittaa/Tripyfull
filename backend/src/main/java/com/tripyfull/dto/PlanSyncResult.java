package com.tripyfull.dto;

/**
 * What a "plan from bookings" run did: how many stops it wrote, over how many
 * days, and how many stale ones it dropped — enough for one honest sentence.
 */
public record PlanSyncResult(
        int created,
        int removed,
        int days,
        int skippedBookings,
        long total
) {}
