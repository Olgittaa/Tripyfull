package com.tripyfull.service;

import com.tripyfull.service.GeocodingService.GeocodeResult;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * The rule that decides what an imported place is called.
 *
 * A Google Maps link shared from a phone in Thailand carries the place's Thai
 * name in its own path — the only name the link has. OpenStreetMap carries an
 * English name beside the local one, so the same words are put to the OSM
 * geocoders and their naming is taken instead. The numbers below are the real
 * Wachirathan waterfall: the link's pin and Thai name, and OpenStreetMap's
 * record of it, 17 metres apart.
 */
class PlaceServiceTest {

    private static final BigDecimal LINK_LAT = new BigDecimal("18.5420155");
    private static final BigDecimal LINK_LON = new BigDecimal("98.5982137");

    private static GeocodeResult linked(String name, String city) {
        return new GeocodeResult(LINK_LAT, LINK_LON, name + " " + city + " 50160, Thailand",
                "g:ChIJC-DiwUCs2zARXw52Olv2e3Q", "TH", city, name, "natural_feature");
    }

    private static GeocodeResult osm(String name, String city, String lat, String lon) {
        return new GeocodeResult(new BigDecimal(lat), new BigDecimal(lon),
                name + ", " + city + ", Chom Thong District, Thailand",
                "osm:node/1", "TH", city, name, "tourism:waterfall");
    }

    @Test
    @DisplayName("a name with no Latin letters in it is the one this asks about")
    void latinLettersAreWhatAClientCanRead() {
        assertThat(PlaceService.hasLatinLetters("เป็น น้ำตกวชิรธาร")).isFalse();
        assertThat(PlaceService.hasLatinLetters("Wachirathan Waterfall")).isTrue();
        // One Latin letter is enough: the client has something to go on.
        assertThat(PlaceService.hasLatinLetters("Café Kyoto 京都")).isTrue();
        assertThat(PlaceService.hasLatinLetters("東京")).isFalse();
        assertThat(PlaceService.hasLatinLetters(null)).isFalse();
        assertThat(PlaceService.hasLatinLetters("  ")).isFalse();
    }

    @Test
    @DisplayName("a waterfall the link names only in Thai is named from OpenStreetMap")
    void aThaiOnlyListingTakesTheEnglishNameFromOsm() {
        GeocodeResult found = linked("เป็น น้ำตกวชิรธาร", "ตำบลบ้านหลวง");
        GeocodeResult other = osm("Wachirathan Waterfall", "Ban Sop Hat", "18.5420493", "98.5983628");

        GeocodeResult named = PlaceService.inLatinLetters(found, other);

        assertThat(named.name()).isEqualTo("Wachirathan Waterfall");
        assertThat(named.city()).isEqualTo("Ban Sop Hat");
        assertThat(named.address()).doesNotContain("เป็น");
        // Only the words change: the pin, the id and the category are the link's.
        assertThat(named.latitude()).isEqualTo(LINK_LAT);
        assertThat(named.longitude()).isEqualTo(LINK_LON);
        assertThat(named.osmId()).isEqualTo("g:ChIJC-DiwUCs2zARXw52Olv2e3Q");
        assertThat(named.category()).isEqualTo("natural_feature");
    }

    @Test
    @DisplayName("a place the link already names in Latin letters keeps that name")
    void aNameAlreadyReadableIsLeftAlone() {
        GeocodeResult found = linked("Wachirathan Waterfall", "Ban Luang");
        // The second opinion is never even asked for; offered one, it is ignored.
        assertThat(PlaceService.inLatinLetters(found, osm("Somewhere else", "Elsewhere", "18.5420493", "98.5983628")))
                .isSameAs(found);
    }

    @Test
    @DisplayName("a second opinion from down the road does not rename the place")
    void anAnswerTooFarAwayIsIgnored() {
        GeocodeResult found = linked("เป็น น้ำตกวชิรธาร", "ตำบลบ้านหลวง");
        // 700 m north: near enough to look plausible, far enough to be a different place.
        GeocodeResult far = osm("Mae Klang Waterfall", "Ban Luang", "18.5483", "98.5982137");

        assertThat(PlaceService.inLatinLetters(found, far)).isSameAs(found);
    }

    @Test
    @DisplayName("nothing changes when there is no second opinion, or it is in Thai too")
    void nothingToTakeLeavesThePlaceAsItWas() {
        GeocodeResult found = linked("เป็น น้ำตกวชิรธาร", "ตำบลบ้านหลวง");

        assertThat(PlaceService.inLatinLetters(found, null)).isSameAs(found);
        assertThat(PlaceService.inLatinLetters(found, osm("น้ำตกแม่กลาง", "บ้านหลวง", "18.5420493", "98.5983628")))
                .isSameAs(found);
        // A place with no pin cannot be checked against one, so it keeps its name.
        GeocodeResult noPin = new GeocodeResult(null, null, null, "g:x", "TH", null, "เป็น น้ำตก", null);
        assertThat(PlaceService.inLatinLetters(noPin, osm("Waterfall", "Ban Luang", "18.54", "98.59")))
                .isSameAs(noPin);
    }

    @Test
    @DisplayName("what the other answer does not carry is kept from the one that was found")
    void missingWordsFallBackToWhatWasFound() {
        GeocodeResult found = linked("เป็น น้ำตกวชิรธาร", "ตำบลบ้านหลวง");
        GeocodeResult sparse = new GeocodeResult(new BigDecimal("18.5420493"), new BigDecimal("98.5983628"),
                null, "osm:node/1", "TH", null, "Wachirathan Waterfall", null);

        GeocodeResult named = PlaceService.inLatinLetters(found, sparse);

        assertThat(named.name()).isEqualTo("Wachirathan Waterfall");
        assertThat(named.address()).isEqualTo(found.address());
        assertThat(named.city()).isEqualTo(found.city());
    }
}
