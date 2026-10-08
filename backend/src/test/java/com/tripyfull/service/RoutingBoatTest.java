package com.tripyfull.service;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class RoutingBoatTest {

    private static final double[] AO_NANG_BEACH = {8.0303, 98.8205};
    private static final double[] RAILAY_WEST = {8.0112, 98.8370};

    @Test
    @DisplayName("a longtail from Ao Nang to Railay is a short crossing plus the wait, marked as an estimate")
    void aLongtailToRailay() {
        RoutingService.RouteResult r = new RoutingService().route(List.of(AO_NANG_BEACH, RAILAY_WEST), "boat");

        assertThat(r.mode()).isEqualTo("boat");
        assertThat(r.estimated()).isTrue();
        // ~2.8 km as the crow flies, stretched for the headland.
        assertThat(r.distanceM()).isBetween(3_000.0, 4_500.0);
        // The boat ride is minutes; the wait for it is most of the leg.
        assertThat(r.durationSec() / 60).isBetween(20.0, 30.0);
        // Drawn over the water, stop to stop.
        assertThat(r.geometry()).containsExactly(List.of(8.0303, 98.8205), List.of(8.0112, 98.8370));
    }

    @Test
    @DisplayName("an island hop takes hours, not the minutes a road route would claim")
    void aFerryToPhiPhi() {
        double[] tonsai = {7.7380, 98.7690};
        RoutingService.RouteResult r = new RoutingService().route(List.of(AO_NANG_BEACH, tonsai), "boat");
        assertThat(r.durationSec() / 3600).isBetween(1.5, 2.5);
    }
}
