package com.tripyfull.service;

import com.tripyfull.service.WikipediaService.Candidate;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Which Wikipedia article a saved place is. The geosearch answers with every
 * article near the point; these are the rules that pick the place's own. The
 * cases are real: the neighbourhood named after the Sagrada Família sits six
 * metres nearer its coordinates than the basilica's article does.
 */
class WikipediaMatchTest {

    @Test
    @DisplayName("the title closest to the name wins, not the nearest article")
    void nameBeatsDistance() {
        var near = List.of(
                new Candidate("Sagrada Família (neighborhood)", 6),
                new Candidate("Sagrada Família", 40),
                new Candidate("Hospital de Sant Pau", 450));
        assertThat(WikipediaService.bestTitle("Sagrada Familia", near)).isEqualTo("Sagrada Família");
    }

    @Test
    @DisplayName("an article sharing no word with the name is not the place, however close")
    void noSharedWordNoMatch() {
        var near = List.of(new Candidate("Chiang Rai Clock Tower", 30), new Candidate("Mae Fah Luang University", 300));
        assertThat(WikipediaService.bestTitle("Nimman coffee crawl", near)).isNull();
    }

    @Test
    @DisplayName("the name's extra words do not stop a match: Wat Rong Khun is the White Temple")
    void extraWordsInTheName() {
        var near = List.of(new Candidate("Wat Rong Khun", 41), new Candidate("Rong Khun Subdistrict", 900));
        assertThat(WikipediaService.bestTitle("Wat Rong Khun (White Temple)", near)).isEqualTo("Wat Rong Khun");
    }

    @Test
    @DisplayName("equally good titles go to the nearer article")
    void tieGoesToTheNearer() {
        var near = List.of(new Candidate("Railay Beach", 209), new Candidate("Railay Beach", 50));
        assertThat(WikipediaService.bestTitle("Railay Beach", near)).isEqualTo("Railay Beach");
    }

    @Test
    @DisplayName("accents fold, short and filler words are ignored")
    void words() {
        assertThat(WikipediaService.words("Basilica de la Sagrada Família")).containsExactlyInAnyOrder("basilica", "sagrada", "familia");
    }

    @Test
    @DisplayName("a description is the opening paragraph, cut at a sentence")
    void firstParagraph() {
        String longOne = "First sentence here. ".repeat(40) + "\nSecond paragraph.";
        String cut = WikipediaService.firstParagraph(longOne);
        assertThat(cut).endsWith(".").doesNotContain("Second paragraph");
        assertThat(cut.length()).isLessThanOrEqualTo(600);
        assertThat(WikipediaService.firstParagraph("Short.\nMore.")).isEqualTo("Short.");
        assertThat(WikipediaService.firstParagraph("  ")).isNull();
    }

    @Test
    @DisplayName("a thumbnail and its original are the same file")
    void fileName() {
        assertThat(WikipediaService.fileName(
                "https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/Railay_Beach_5.jpg/1280px-Railay_Beach_5.jpg"))
                .isEqualTo("Railay_Beach_5.jpg");
        assertThat(WikipediaService.fileName("https://upload.wikimedia.org/wikipedia/commons/4/40/Railay_Beach_5.jpg"))
                .isEqualTo("Railay_Beach_5.jpg");
    }
}
