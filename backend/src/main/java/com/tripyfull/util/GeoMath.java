package com.tripyfull.util;

/** Distances on the globe — the one haversine the planner, the router and the importer all use. */
public final class GeoMath {

    /** Earth's mean radius, metres. */
    public static final double EARTH_RADIUS_M = 6_371_000;

    private GeoMath() {}

    /** Great-circle distance in metres. Good enough to tell "round the corner" from "another town". */
    public static double distanceMetres(double lat1, double lon1, double lat2, double lon2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double h = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return EARTH_RADIUS_M * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
    }

    /** The same, for [lat, lon] pairs. */
    public static double distanceMetres(double[] a, double[] b) {
        return distanceMetres(a[0], a[1], b[0], b[1]);
    }
}
