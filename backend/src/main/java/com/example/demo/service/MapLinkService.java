package com.example.demo.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.net.URI;
import java.net.URLDecoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Resolves a place share link into name/coordinates/photo.
 *
 * Google Maps (incl. maps.app.goo.gl short links): follows redirects, then reads
 * Open Graph metadata (served to crawlers) for the place name, photo and
 * description, plus coordinates from the resolved URL.
 *
 * Tripadvisor: the place name and location live in the URL slug itself
 * (…/Attraction_Review-g187147-d188757-Reviews-Eiffel_Tower-Paris….html), so no
 * page access is required; fetching the page for og:image / embedded coordinates
 * is attempted but best-effort — Tripadvisor's bot protection usually blocks
 * server-side requests, in which case coordinates come from the geocoder via
 * {@code geoQuery}.
 */
@Service
public class MapLinkService {

    private static final Logger log = LoggerFactory.getLogger(MapLinkService.class);

    private final HttpClient http = HttpClient.newBuilder()
            .followRedirects(HttpClient.Redirect.ALWAYS)
            .connectTimeout(Duration.ofSeconds(8))
            .build();

    private static final Pattern COORD_DATA = Pattern.compile("!3d(-?\\d+\\.\\d+)!4d(-?\\d+\\.\\d+)");
    private static final Pattern COORD_AT = Pattern.compile("@(-?\\d+\\.\\d+),(-?\\d+\\.\\d+)");
    private static final Pattern COORD_Q = Pattern.compile("[?&]q=(-?\\d+\\.\\d+),(-?\\d+\\.\\d+)");
    private static final Pattern PLACE = Pattern.compile("/place/([^/@?]+)");
    private static final Pattern LIST_DESC = Pattern.compile("(?i)\\b\\d+\\s+places?\\b");

    // Any single-place Tripadvisor page: …-g<geo>-d<place>(-r<review>)?-(Reviews-)?(or30-)?Name_Slug-Location_Slug.html
    private static final Pattern TA_PLACE = Pattern.compile("-g\\d+-d\\d+(?:-r\\d+)?-(?:Reviews-)?(?:or\\d+-)?([^/]+?)\\.html");
    private static final Pattern TA_LAT = Pattern.compile("\"latitude\"\\s*:\\s*\"?(-?\\d+\\.\\d+)\"?");
    private static final Pattern TA_LON = Pattern.compile("\"longitude\"\\s*:\\s*\"?(-?\\d+\\.\\d+)\"?");

    /** {@code geoQuery} — search text for the geocoder when the link itself has no coordinates. */
    public record ParsedLink(String name, BigDecimal lat, BigDecimal lon,
                             String photo, String description, boolean isList,
                             String geoQuery) {}

    public ParsedLink parse(String url) {
        if (url == null || url.isBlank()) return null;
        if (url.toLowerCase().contains("tripadvisor.")) return parseTripAdvisor(url.trim());
        Resolved res = resolve(url.trim());
        String finalUrl = res.url != null ? res.url : url.trim();
        String body = res.body != null ? res.body : "";

        // Open Graph metadata (Google serves these to crawler user-agents)
        String ogTitle = og(body, "og:title");
        String ogImage = og(body, "og:image");
        String ogDesc = og(body, "og:description");

        boolean isList = ogDesc != null && LIST_DESC.matcher(ogDesc).find();

        // Name: prefer the URL /place/<name>, else og:title (strip "· owner" suffix)
        String name = null;
        Matcher pm = PLACE.matcher(finalUrl);
        if (pm.find()) {
            String raw = URLDecoder.decode(pm.group(1), StandardCharsets.UTF_8).replace('+', ' ').trim();
            if (!raw.isBlank() && !raw.startsWith("data=")) name = raw;
        }
        if (name == null && ogTitle != null && !ogTitle.isBlank()) {
            int dot = ogTitle.indexOf(" · ");   // "Place · Owner"
            name = (dot > 0 ? ogTitle.substring(0, dot) : ogTitle).trim();
        }

        BigDecimal lat = null, lon = null;
        for (Pattern p : new Pattern[]{COORD_DATA, COORD_AT, COORD_Q}) {
            Matcher m = p.matcher(finalUrl);
            if (m.find()) {
                try { lat = new BigDecimal(m.group(1)); lon = new BigDecimal(m.group(2)); } catch (NumberFormatException ignored) {}
                if (lat != null) break;
            }
        }

        String photo = isRealPhoto(ogImage) ? ogImage : null;
        String description = (ogDesc != null && !ogDesc.isBlank() && !isList && !isGenericDesc(ogDesc)) ? ogDesc.trim() : null;

        if (name == null && lat == null && !isList) return null;
        return new ParsedLink(name, lat, lon, photo, description, isList, null);
    }

    private ParsedLink parseTripAdvisor(String url) {
        String pageUrl = url;
        String body = "";
        // Expands short links (tripadvisor.app.link) and grabs the page body while at
        // it — usually a bot-protection page, so everything below must degrade cleanly.
        Resolved res = resolve(url);
        if (res.url != null) pageUrl = res.url;
        if (res.body != null) body = res.body;

        Matcher m = TA_PLACE.matcher(URLDecoder.decode(pageUrl, StandardCharsets.UTF_8));
        if (!m.find()) {
            // Tourism-g…/Attractions-g… destination pages have no -d<id>: not a single place.
            return new ParsedLink(null, null, null, null, null, true, null);
        }
        String[] slugParts = m.group(1).split("-", 2);
        String name = slugParts[0].replace('_', ' ').trim();
        if (name.isBlank()) return new ParsedLink(null, null, null, null, null, true, null);
        String location = slugParts.length > 1
                ? slugParts[1].replace('-', ' ').replace('_', ' ').trim()
                : null;

        BigDecimal lat = firstNum(body, TA_LAT);
        BigDecimal lon = firstNum(body, TA_LON);
        String ogImage = og(body, "og:image");
        String photo = (ogImage != null && !ogImage.isBlank()) ? ogImage : null;
        String geoQuery = (location != null && !location.isBlank()) ? name + ", " + location : name;
        return new ParsedLink(name, lat, lon, photo, null, false, geoQuery);
    }

    private BigDecimal firstNum(String body, Pattern p) {
        Matcher m = p.matcher(body);
        if (m.find()) {
            try { return new BigDecimal(m.group(1)); } catch (NumberFormatException ignored) {}
        }
        return null;
    }

    /** Google serves a real Street View / place photo, or a generic map tile/icon we skip. */
    private boolean isRealPhoto(String url) {
        if (url == null || url.isBlank()) return false;
        String u = url.toLowerCase();
        return !u.contains("/maps/vt/") && !u.contains("maps_512dp") && !u.contains("/maps/about/")
                && !u.contains("/images/icons/");
    }

    private boolean isGenericDesc(String d) {
        String s = d.toLowerCase();
        return s.contains("find local businesses") || s.contains("view maps") || s.startsWith("mit google maps");
    }

    private String og(String body, String prop) {
        Matcher m1 = Pattern.compile("property=\"" + Pattern.quote(prop) + "\"[^>]*content=\"([^\"]*)\"").matcher(body);
        if (m1.find()) return unescape(m1.group(1));
        Matcher m2 = Pattern.compile("content=\"([^\"]*)\"[^>]*property=\"" + Pattern.quote(prop) + "\"").matcher(body);
        if (m2.find()) return unescape(m2.group(1));
        return null;
    }

    private String unescape(String s) {
        if (s == null) return null;
        return s.replace("&amp;", "&").replace("&#39;", "'").replace("&quot;", "\"")
                .replace("&lt;", "<").replace("&gt;", ">");
    }

    private record Resolved(String url, String body) {}

    private Resolved resolve(String url) {
        try {
            HttpResponse<String> resp = fetch(url);
            String finalUrl = resp.uri() != null ? resp.uri().toString() : url;
            // Re-fetch the resolved URL forcing English so og metadata isn't localized.
            String metaUrl = withEnglish(finalUrl);
            String body = metaUrl.equals(finalUrl) ? resp.body() : fetch(metaUrl).body();
            return new Resolved(finalUrl, body);
        } catch (Exception e) {
            log.warn("Failed to resolve map link {}: {}", url, e.getMessage());
            return new Resolved(null, null);
        }
    }

    private HttpResponse<String> fetch(String url) throws Exception {
        HttpRequest req = HttpRequest.newBuilder(URI.create(url))
                // Crawler UA makes Google return Open Graph metadata for the place.
                .header("User-Agent", "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)")
                .header("Accept-Language", "en-US,en")
                .timeout(Duration.ofSeconds(10))
                .GET().build();
        return http.send(req, HttpResponse.BodyHandlers.ofString());
    }

    /** Forces hl=en&gl=US on the URL so Google serves English place metadata. */
    private String withEnglish(String url) {
        String u = url.replaceAll("([?&])hl=[^&]*", "$1").replaceAll("([?&])gl=[^&]*", "$1")
                .replaceAll("[?&]+$", "").replaceAll("&&+", "&").replace("?&", "?");
        String sep = u.contains("?") ? "&" : "?";
        return u + sep + "hl=en&gl=US";
    }
}
