package com.tripyfull.util;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class LatinNamesTest {

    @Test
    @DisplayName("a name with no Latin letters in it is the one this asks about")
    void latinLettersAreWhatATravellerCanRead() {
        assertThat(LatinNames.hasLatinLetters("เป็น น้ำตกวชิรธาร")).isFalse();
        assertThat(LatinNames.hasLatinLetters("Wachirathan Waterfall")).isTrue();
        // One Latin letter is enough: there is something to go on.
        assertThat(LatinNames.hasLatinLetters("Café Kyoto 京都")).isTrue();
        assertThat(LatinNames.hasLatinLetters("東京")).isFalse();
        assertThat(LatinNames.hasLatinLetters(null)).isFalse();
        assertThat(LatinNames.hasLatinLetters("  ")).isFalse();
    }

    @Test
    @DisplayName("a town OSM names only in Thai gives way to a readable neighbour")
    void aReadableDistrictBeatsAThaiOnlyCity() {
        // Photon on Ko Pha-ngan: the subdistrict has no English name, the area does.
        assertThat(LatinNames.firstReadable("ตำบลเกาะพะงัน", "Baan Wok Tum", null)).isEqualTo("Baan Wok Tum");
        assertThat(LatinNames.firstReadable("Ao Nang", "Ban Klong Haeng")).isEqualTo("Ao Nang");
        // Nothing readable at all: the local name is still better than none.
        assertThat(LatinNames.firstReadable(null, "อ่าวนาง", "")).isEqualTo("อ่าวนาง");
        assertThat(LatinNames.firstReadable(null, " ")).isNull();
    }
}
