package com.tripyfull.util;

import com.tripyfull.model.PlaceType;

/**
 * A place's type from the words a data source used for it — an OSM class:type,
 * a Google type list, a share page's "Buddhist temple". The one place that rule
 * lives; the importer and the geocoder both ask here.
 */
public final class PlaceTypes {

    private PlaceTypes() {}

    public static PlaceType infer(String category) {
        if (category == null || category.isBlank()) return PlaceType.OTHER;
        String c = category.toLowerCase();
        if (c.contains("beach")) return PlaceType.BEACH;
        if (c.contains("museum")) return PlaceType.MUSEUM;
        if (c.contains("viewpoint")) return PlaceType.VIEWPOINT;
        if (c.contains("aeroway") || c.contains("airport")) return PlaceType.AIRPORT;
        // "port" as a word only: "sports_complex", "transport" and "airport" all contain it.
        if (c.contains("ferry") || c.contains("harbour") || c.contains("harbor") || c.contains("seaport")
                || c.contains("marina") || c.matches(".*\\bport\\b.*")) return PlaceType.PORT;
        if (c.contains("restaurant") || c.contains("cafe") || c.contains("bar") || c.contains("food")
                || c.contains("catering") || c.contains("pub")) return PlaceType.RESTAURANT;
        if (c.contains("shop") || c.contains("mall") || c.contains("store") || c.contains("retail")
                || c.contains("supermarket") || c.contains("commercial")) return PlaceType.SHOP;
        if (c.contains("park") || c.contains("garden") || c.contains("playground")) return PlaceType.PARK;
        if (c.contains("natural") || c.contains("forest") || c.contains("water") || c.contains("peak")
                || c.contains("nature") || c.contains("wood")) return PlaceType.NATURE;
        if (c.contains("tourism") || c.contains("attraction") || c.contains("monument") || c.contains("historic")
                || c.contains("artwork") || c.contains("sights") || c.contains("castle") || c.contains("temple")
                || c.contains("place_of_worship") || c.contains("church") || c.contains("mosque")
                || c.contains("landmark")) return PlaceType.SIGHTSEEING;
        if (c.contains("suburb") || c.contains("neighbourhood") || c.contains("quarter") || c.contains("city")
                || c.contains("town") || c.contains("village") || c.contains("hamlet") || c.contains("locality")) return PlaceType.NEIGHBORHOOD;
        return PlaceType.OTHER;
    }
}
