package com.tripyfull.util;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class GeoMathTest {

    @Test
    void clockTowerToWhiteTempleIsAboutTwelveKilometres() {
        double d = GeoMath.distanceMetres(19.9083, 99.831, 19.8243, 99.7633);
        assertThat(d).isBetween(11_500.0, 12_500.0);
    }

    @Test
    void samePointIsZeroAndPairsMatchScalars() {
        assertThat(GeoMath.distanceMetres(18.79, 98.99, 18.79, 98.99)).isZero();
        assertThat(GeoMath.distanceMetres(new double[]{1, 2}, new double[]{3, 4}))
                .isEqualTo(GeoMath.distanceMetres(1, 2, 3, 4));
    }
}
