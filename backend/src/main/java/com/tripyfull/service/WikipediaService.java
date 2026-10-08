package com.tripyfull.service;

import com.tripyfull.model.Place;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.net.http.HttpClient;
import java.text.Normalizer;
import java.time.Duration;
import java.util.*;

/**
 * Description and photos for a place, from Wikipedia and Wikimedia Commons —
 * free, no key, no quota beyond politeness. It takes the place Google's photos
 * and editorial summaries used to fill.
 *
 * <ol>
 *   <li>Which subject the place is. OpenStreetMap links notable objects to
 *       Wikidata, so a place found through OSM is asked for that link first —
 *       exact, whatever either side calls it (OSM's "Basilica of the Holy Family"
 *       is Wikipedia's "Sagrada Família"). Without one, Wikipedia's articles
 *       within {@value #RADIUS_M} m are matched by name, distance breaking ties.</li>
 *   <li>That article's opening paragraph and its lead image.</li>
 *   <li>More photos from the Commons category Wikidata names for the subject —
 *       a curated set of pictures of exactly that place.</li>
 * </ol>
 *
 * Best-effort like the other enrichers: no article, no match or a service down
 * leaves the place as it was, and nothing the user wrote is ever overwritten.
 */
@Service
public class WikipediaService {

    private static final Logger log = LoggerFactory.getLogger(WikipediaService.class);
    private static final ParameterizedTypeReference<Map<String, Object>> MAP_TYPE = new ParameterizedTypeReference<>() {};

    static final int RADIUS_M = 600;
    private static final int PHOTOS = 3;
    private static final int PHOTO_WIDTH = 1280;
    private static final int PHOTO_URL_LIMIT = 255;      // place_photos element column size
    private static final int DESCRIPTION_SOFT_LIMIT = 600;
    private static final Set<String> STOP = Set.of("the", "and", "of", "de", "la", "le", "del", "di", "des", "van", "von");

    private final RestClient http = buildClient();

    private static RestClient buildClient() {
        // Explicit timeouts: this runs while a place is being saved.
        JdkClientHttpRequestFactory factory = new JdkClientHttpRequestFactory(
                HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(4)).build());
        factory.setReadTimeout(Duration.ofSeconds(8));
        return RestClient.builder()
                .requestFactory(factory)
                // Wikimedia asks every client to say who it is and how to reach it.
                .defaultHeader("User-Agent", "Tripyfull/1.0 (travel planner; https://tripyfull.pages.dev)")
                .build();
    }

    /** An article near the place, as the geosearch reports it. */
    record Candidate(String title, double distanceM) {}

    public void enrich(Place place) {
        if (place == null || place.getLatitude() == null || place.getLongitude() == null) return;
        boolean needsDescription = place.getDescription() == null || place.getDescription().isBlank();
        boolean needsPhotos = place.getPhotos() == null || place.getPhotos().isEmpty();
        if (!needsDescription && !needsPhotos) return;
        try {
            // 1. The subject: OSM's own link first, a nearby article by name second.
            String qid = osmWikidata(place.getOsmId());
            Map<String, Object> entity = qid != null ? entity(qid) : null;
            String title = entity != null ? enwikiTitle(entity) : null;
            if (title == null && qid == null) title = bestTitle(place.getName(), nearby(place));
            Map<String, Object> page = title != null ? page(title) : null;
            if (entity == null && page != null && page.get("pageprops") instanceof Map<?, ?> props
                    && str(props.get("wikibase_item")) != null) {
                entity = entity(str(props.get("wikibase_item")));
            }
            if (page == null && entity == null) return;

            // 2. Its words and its pictures, where the place has none yet.
            if (needsDescription && page != null) {
                String text = firstParagraph(str(page.get("extract")));
                if (text != null) place.setDescription(text + " (Wikipedia)");
            }
            if (needsPhotos) {
                List<String> photos = new ArrayList<>();
                if (page != null && page.get("thumbnail") instanceof Map<?, ?> thumb) addPhoto(photos, str(thumb.get("source")));
                String category = entity != null ? commonsCategory(entity) : null;
                if (category != null && photos.size() < PHOTOS) {
                    for (String url : commonsPhotos(category)) {
                        if (photos.size() >= PHOTOS) break;
                        addPhoto(photos, url);
                    }
                }
                if (!photos.isEmpty()) place.setPhotos(photos);
            }
        } catch (Exception e) {
            log.debug("Wikipedia enrichment skipped for '{}': {}", place.getName(), e.getMessage());
        }
    }

    /* ---- matching: pure, so it can be tested ---- */

    /**
     * The article meant by the place's name. Each candidate is scored by how much
     * of the two names' words they share; a candidate sharing none is not the
     * place at all, however near. Ties go to the nearer article.
     */
    static String bestTitle(String name, List<Candidate> candidates) {
        Set<String> wanted = words(name);
        if (wanted.isEmpty() || candidates == null) return null;
        String best = null;
        double bestScore = 0;
        double bestDistance = Double.MAX_VALUE;
        for (Candidate c : candidates) {
            Set<String> have = words(c.title());
            if (have.isEmpty()) continue;
            Set<String> shared = new HashSet<>(have);
            shared.retainAll(wanted);
            if (shared.isEmpty()) continue;
            Set<String> all = new HashSet<>(have);
            all.addAll(wanted);
            double score = (double) shared.size() / all.size();
            if (score > bestScore || (score == bestScore && c.distanceM() < bestDistance)) {
                best = c.title();
                bestScore = score;
                bestDistance = c.distanceM();
            }
        }
        return best;
    }

    /** Lower-case words of four letters or more, accents folded ("Família" is "familia"). */
    static Set<String> words(String s) {
        if (s == null) return Set.of();
        String folded = Normalizer.normalize(s, Normalizer.Form.NFKD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT);
        Set<String> out = new HashSet<>();
        for (String w : folded.split("[^a-z0-9]+")) {
            if (w.length() >= 4 && !STOP.contains(w)) out.add(w);
        }
        return out;
    }

    /**
     * The opening of an article's introduction: whole sentences, up to about
     * {@value #DESCRIPTION_SOFT_LIMIT} characters — a card and a book page want a
     * paragraph, not the article.
     */
    static String firstParagraph(String extract) {
        if (extract == null || extract.isBlank()) return null;
        String para = extract.strip().split("\\n")[0].strip();
        if (para.length() <= DESCRIPTION_SOFT_LIMIT) return para;
        int cut = para.lastIndexOf(". ", DESCRIPTION_SOFT_LIMIT);
        return cut > 80 ? para.substring(0, cut + 1) : para.substring(0, DESCRIPTION_SOFT_LIMIT - 1) + "…";
    }

    /* ---- the services ---- */

    @SuppressWarnings("unchecked")
    private List<Candidate> nearby(Place place) {
        Map<String, Object> body = http.get()
                .uri("https://en.wikipedia.org/w/api.php?action=query&list=geosearch&gscoord={lat}|{lon}"
                        + "&gsradius={r}&gslimit=20&format=json",
                        place.getLatitude(), place.getLongitude(), RADIUS_M)
                .retrieve().body(MAP_TYPE);
        if (body == null || !(body.get("query") instanceof Map<?, ?> q) || !(q.get("geosearch") instanceof List<?> hits)) {
            return List.of();
        }
        List<Candidate> out = new ArrayList<>();
        for (Object o : hits) {
            if (o instanceof Map<?, ?> h && h.get("title") != null) {
                double d = h.get("dist") instanceof Number n ? n.doubleValue() : RADIUS_M;
                out.add(new Candidate(h.get("title").toString(), d));
            }
        }
        return out;
    }

    /** One call for the article's intro text, its lead image at a usable size, and its Wikidata id. */
    @SuppressWarnings("unchecked")
    private Map<String, Object> page(String title) {
        Map<String, Object> body = http.get()
                .uri("https://en.wikipedia.org/w/api.php?action=query&titles={t}&prop=extracts|pageimages|pageprops"
                        + "&exintro=1&explaintext=1&piprop=thumbnail&pithumbsize={w}&ppprop=wikibase_item"
                        + "&redirects=1&format=json&formatversion=2",
                        title, PHOTO_WIDTH)
                .retrieve().body(MAP_TYPE);
        if (body == null || !(body.get("query") instanceof Map<?, ?> q) || !(q.get("pages") instanceof List<?> pages)
                || pages.isEmpty() || !(pages.get(0) instanceof Map<?, ?> p)) {
            return null;
        }
        return (Map<String, Object>) p;
    }

    /** The Wikidata item OpenStreetMap links the object to ("N123", "W45", "R9194723" keys), via Nominatim. */
    @SuppressWarnings("unchecked")
    private String osmWikidata(String osmId) {
        if (osmId == null || !osmId.matches("[NWR]\\d+")) return null;
        List<Map<String, Object>> found = http.get()
                .uri("https://nominatim.openstreetmap.org/lookup?osm_ids={id}&extratags=1&format=json", osmId)
                .retrieve().body(new ParameterizedTypeReference<List<Map<String, Object>>>() {});
        if (found == null || found.isEmpty() || !(found.get(0).get("extratags") instanceof Map<?, ?> tags)) return null;
        String q = str(tags.get("wikidata"));
        return q != null && q.matches("Q\\d+") ? q : null;
    }

    /** A Wikidata item with just what is needed: its English article and its claims. */
    @SuppressWarnings("unchecked")
    private Map<String, Object> entity(String qid) {
        Map<String, Object> body = http.get()
                .uri("https://www.wikidata.org/w/api.php?action=wbgetentities&ids={q}&props=sitelinks|claims"
                        + "&sitefilter=enwiki&format=json", qid)
                .retrieve().body(MAP_TYPE);
        if (body == null || !(body.get("entities") instanceof Map<?, ?> all) || !(all.get(qid) instanceof Map<?, ?> e)) {
            return null;
        }
        return (Map<String, Object>) e;
    }

    private static String enwikiTitle(Map<String, Object> entity) {
        return entity.get("sitelinks") instanceof Map<?, ?> links && links.get("enwiki") instanceof Map<?, ?> en
                ? str(en.get("title")) : null;
    }

    /** The Commons category of pictures of the subject (P373). */
    private static String commonsCategory(Map<String, Object> entity) {
        if (entity.get("claims") instanceof Map<?, ?> c && c.get("P373") instanceof List<?> l
                && !l.isEmpty() && l.get(0) instanceof Map<?, ?> claim
                && claim.get("mainsnak") instanceof Map<?, ?> snak
                && snak.get("datavalue") instanceof Map<?, ?> dv) {
            return str(dv.get("value"));
        }
        return null;
    }

    /** Photos in the subject's Commons category, JPEGs only, at a usable width. */
    @SuppressWarnings("unchecked")
    private List<String> commonsPhotos(String category) {
        Map<String, Object> body = http.get()
                .uri("https://commons.wikimedia.org/w/api.php?action=query&generator=categorymembers"
                        + "&gcmtitle={c}&gcmtype=file&gcmlimit=12&prop=imageinfo&iiprop=url|mime"
                        + "&iiurlwidth={w}&format=json&formatversion=2",
                        "Category:" + category, PHOTO_WIDTH)
                .retrieve().body(MAP_TYPE);
        if (body == null || !(body.get("query") instanceof Map<?, ?> q) || !(q.get("pages") instanceof List<?> pages)) {
            return List.of();
        }
        List<String> out = new ArrayList<>();
        for (Object o : pages) {
            if (o instanceof Map<?, ?> p && p.get("imageinfo") instanceof List<?> infos && !infos.isEmpty()
                    && infos.get(0) instanceof Map<?, ?> info && "image/jpeg".equals(info.get("mime"))) {
                String url = str(info.get("thumburl"));
                if (url != null) out.add(url);
            }
        }
        return out;
    }

    /** Adds a photo unless it is too long to store or the same file is already there. */
    private static void addPhoto(List<String> photos, String url) {
        if (url == null) return;
        // The APIs append tracking parameters; the image is the same without them.
        int q = url.indexOf('?');
        if (q > 0) url = url.substring(0, q);
        if (url.length() > PHOTO_URL_LIMIT) return;
        String file = fileName(url);
        if (photos.stream().anyMatch(p -> fileName(p).equals(file))) return;
        photos.add(url);
    }

    /** The Commons file a thumbnail URL is cut from: ".../thumb/a/a1/Name.jpg/1280px-Name.jpg" is Name.jpg. */
    static String fileName(String url) {
        String[] parts = url.split("/");
        for (int i = 0; i < parts.length - 3; i++) {
            if (parts[i].equals("thumb")) return parts[i + 3];
        }
        return parts[parts.length - 1];
    }

    private static String str(Object o) {
        return o == null || o.toString().isBlank() ? null : o.toString();
    }
}
