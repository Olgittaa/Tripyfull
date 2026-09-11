package com.tripyfull.util;

import com.tripyfull.model.PlaceType;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class PlaceTypesTest {

    @Test
    void readsOsmAndGoogleWords() {
        assertThat(PlaceTypes.infer("tourism:museum")).isEqualTo(PlaceType.MUSEUM);
        assertThat(PlaceTypes.infer("place_of_worship,tourist_attraction")).isEqualTo(PlaceType.SIGHTSEEING);
        assertThat(PlaceTypes.infer("Buddhist temple")).isEqualTo(PlaceType.SIGHTSEEING);
        assertThat(PlaceTypes.infer("amenity:restaurant")).isEqualTo(PlaceType.RESTAURANT);
        assertThat(PlaceTypes.infer("natural:beach")).isEqualTo(PlaceType.BEACH);
    }

    @Test
    void portIsAWordNotASubstring() {
        assertThat(PlaceTypes.infer("leisure:sports_centre")).isNotEqualTo(PlaceType.PORT);
        assertThat(PlaceTypes.infer("stadium,sports_complex")).isNotEqualTo(PlaceType.PORT);
        assertThat(PlaceTypes.infer("harbour")).isEqualTo(PlaceType.PORT);
        assertThat(PlaceTypes.infer("ferry terminal")).isEqualTo(PlaceType.PORT);
        assertThat(PlaceTypes.infer("port")).isEqualTo(PlaceType.PORT);
    }

    @Test
    void unknownIsOther() {
        assertThat(PlaceTypes.infer(null)).isEqualTo(PlaceType.OTHER);
        assertThat(PlaceTypes.infer("  ")).isEqualTo(PlaceType.OTHER);
        assertThat(PlaceTypes.infer("something else")).isEqualTo(PlaceType.OTHER);
    }
}
