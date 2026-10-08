package com.tripyfull.util;

/**
 * Names a traveller can read without a keyboard they do not own. The geocoders
 * answer in English where OSM has an English name and in the local script where
 * it has none — so of two names for the same town, the Latin one wins.
 */
public final class LatinNames {

    private LatinNames() {}

    /**
     * A name with any Latin letter in it — "Café Kyoto 京都" — is readable; one
     * with none ("อ่าวนาง") is the case this asks about.
     */
    public static boolean hasLatinLetters(String s) {
        if (s == null) return false;
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            if ((c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z')) return true;
        }
        return false;
    }

    /**
     * The first candidate in Latin letters, else the first one at all. Candidates
     * come in order of preference — "city, district, locality" — so a readable
     * district beats an unreadable city, but an unreadable city beats nothing.
     */
    public static String firstReadable(String... candidates) {
        String fallback = null;
        for (String c : candidates) {
            if (c == null || c.isBlank()) continue;
            if (hasLatinLetters(c)) return c;
            if (fallback == null) fallback = c;
        }
        return fallback;
    }
}
