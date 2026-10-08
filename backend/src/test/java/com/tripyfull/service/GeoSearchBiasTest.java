package com.tripyfull.service;

import com.tripyfull.model.City;
import com.tripyfull.model.Country;
import com.tripyfull.repository.CityRepository;
import com.tripyfull.repository.CountryRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * Where a free place search leans. Photon ranks by name alone, and a famous name
 * is famous in many places — "Sagrada Familia" came back as towns in Brazil and
 * Chile — so the search is given the trip's whereabouts as a point. These are
 * the rules that turn what the screen knows into that point.
 */
class GeoSearchBiasTest {

    private final CityRepository cities = mock(CityRepository.class);
    private final CountryRepository countries = mock(CountryRepository.class);
    private final GeoSearchService service =
            new GeoSearchService(cities, countries, new GooglePlacesService(""));

    private static City city(String name, String code, double lat, double lon) {
        Country country = new Country();
        country.setCode(code);
        City c = new City();
        c.setName(name);
        c.setCountry(country);
        c.setLatitude(lat);
        c.setLongitude(lon);
        return c;
    }

    @Test
    @DisplayName("a city the trip names is where the search leans")
    void cityWins() {
        when(cities.search(eq("Chiang Rai"), any())).thenReturn(List.of(city("Chiang Rai", "TH", 19.91, 99.84)));
        assertThat(service.biasFor("Chiang Rai", null)).containsExactly(19.91, 99.84);
    }

    @Test
    @DisplayName("with a country known, the city is looked up inside it")
    void cityInsideCountry() {
        when(cities.searchByCountry(eq("Valencia"), eq("ES"), any()))
                .thenReturn(List.of(city("Valencia", "ES", 39.47, -0.38)));
        assertThat(service.biasFor("Valencia", "es")).containsExactly(39.47, -0.38);
    }

    @Test
    @DisplayName("a destination that is a country's name leans on its largest city")
    void countryNameFallsBackToLargestCity() {
        Country th = new Country();
        th.setCode("TH");
        th.setName("Thailand");
        when(countries.search("Thailand")).thenReturn(List.of(th));
        when(cities.findFirstByCountryCodeOrderByPopulationDesc("TH"))
                .thenReturn(Optional.of(city("Bangkok", "TH", 13.75, 100.5)));
        assertThat(service.biasFor("Thailand", null)).containsExactly(13.75, 100.5);
    }

    @Test
    @DisplayName("a country's name is not mistaken for a city that contains it")
    void countryNameIsNotPortOfSpain() {
        Country es = new Country();
        es.setCode("ES");
        es.setName("Spain");
        when(countries.search("Spain")).thenReturn(List.of(es));
        // The trap: a substring search for "Spain" finds Trinidad's capital first.
        when(cities.search(eq("Spain"), any())).thenReturn(List.of(city("Port of Spain", "TT", 10.65, -61.5)));
        when(cities.findFirstByCountryCodeOrderByPopulationDesc("ES"))
                .thenReturn(Optional.of(city("Madrid", "ES", 40.42, -3.70)));
        assertThat(service.biasFor("Spain", null)).containsExactly(40.42, -3.70);
    }

    @Test
    @DisplayName("a city is only taken when its name is, or starts with, what the trip says")
    void containmentIsNotAMatch() {
        when(cities.search(eq("Rai"), any())).thenReturn(List.of(city("Chiang Rai", "TH", 19.91, 99.84)));
        assertThat(service.biasFor("Rai", null)).isNull();
    }

    @Test
    @DisplayName("a day that names two cities leans on the first")
    void firstOfTwoCities() {
        when(cities.search(eq("Tokyo"), any())).thenReturn(List.of(city("Tokyo", "JP", 35.68, 139.76)));
        assertThat(service.biasFor("Tokyo, Kamakura", null)).containsExactly(35.68, 139.76);
    }

    @Test
    @DisplayName("a country code alone is enough")
    void codeAlone() {
        when(cities.findFirstByCountryCodeOrderByPopulationDesc("ES"))
                .thenReturn(Optional.of(city("Madrid", "ES", 40.42, -3.70)));
        assertThat(service.biasFor(null, "ES")).containsExactly(40.42, -3.70);
    }

    @Test
    @DisplayName("knowing nothing leaves the search unbiased")
    void nothingKnown() {
        assertThat(service.biasFor(null, null)).isNull();
        assertThat(service.biasFor(" ", "")).isNull();
    }
}
