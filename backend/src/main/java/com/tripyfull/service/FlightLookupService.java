package com.tripyfull.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

@Service
public class FlightLookupService {

    private static final Logger log = LoggerFactory.getLogger(FlightLookupService.class);
    private static final ParameterizedTypeReference<Map<String, Object>> MAP_TYPE = new ParameterizedTypeReference<>() {};
    private static final ParameterizedTypeReference<List<Map<String, Object>>> LIST_MAP_TYPE = new ParameterizedTypeReference<>() {};

    private final RestClient restClient = RestClient.create();

    @Value("${aerodatabox.api-key:}")
    private String aeroDataBoxKey;

    @Value("${aerodatabox.api-host:aerodatabox.p.rapidapi.com}")
    private String aeroDataBoxHost;

    @Value("${aviationstack.api-key:}")
    private String aviationStackKey;

    /** Rich flight details. Fields that a given provider can't supply stay null. */
    public record FlightInfo(
            String airline, String flightNumber,
            String depIata, String depName, String depCity, String depTerminal, String depTime,
            String arrIata, String arrName, String arrCity, String arrTerminal, String arrTime
    ) {}

    public FlightInfo lookup(String flightNumber, String date) {
        if (flightNumber == null || flightNumber.isBlank()) return null;
        String flight = flightNumber.toUpperCase().replaceAll("\\s+", "");

        // AeroDataBox is the richest source (times, terminals, airport details) but needs a key + date.
        if (aeroDataBoxKey != null && !aeroDataBoxKey.isBlank() && date != null && !date.isBlank()) {
            FlightInfo info = lookupAeroDataBox(flight, date);
            if (info != null) return info;
        }

        // Fallbacks: route-only providers (no times/terminals).
        if (aviationStackKey != null && !aviationStackKey.isBlank()) {
            FlightInfo info = lookupAviationStack(flight);
            if (info != null) return info;
        }
        return lookupAirLabs(flight);
    }

    @SuppressWarnings("unchecked")
    private FlightInfo lookupAeroDataBox(String flight, String date) {
        try {
            List<Map<String, Object>> body = restClient.get()
                    .uri("https://{host}/flights/number/{flight}/{date}?withLocation=true",
                            aeroDataBoxHost, flight, date)
                    .header("x-rapidapi-key", aeroDataBoxKey)
                    .header("x-rapidapi-host", aeroDataBoxHost)
                    .retrieve()
                    .body(LIST_MAP_TYPE);

            if (body == null || body.isEmpty()) return null;
            Map<String, Object> f = body.get(0);

            Map<String, Object> airline = (Map<String, Object>) f.get("airline");
            Map<String, Object> dep = (Map<String, Object>) f.get("departure");
            Map<String, Object> arr = (Map<String, Object>) f.get("arrival");
            Map<String, Object> depAirport = dep != null ? (Map<String, Object>) dep.get("airport") : null;
            Map<String, Object> arrAirport = arr != null ? (Map<String, Object>) arr.get("airport") : null;

            return new FlightInfo(
                    airline != null ? str(airline.get("name")) : null,
                    str(f.get("number")),
                    airportField(depAirport, "iata"), airportField(depAirport, "name"),
                    airportField(depAirport, "municipalityName"),
                    dep != null ? str(dep.get("terminal")) : null,
                    scheduledLocal(dep),
                    airportField(arrAirport, "iata"), airportField(arrAirport, "name"),
                    airportField(arrAirport, "municipalityName"),
                    arr != null ? str(arr.get("terminal")) : null,
                    scheduledLocal(arr)
            );
        } catch (Exception e) {
            log.warn("AeroDataBox lookup failed for {} {}: {}", flight, date, e.getMessage());
            return null;
        }
    }

    @SuppressWarnings("unchecked")
    private String scheduledLocal(Map<String, Object> leg) {
        if (leg == null) return null;
        Object st = leg.get("scheduledTime");
        if (!(st instanceof Map)) return null;
        Object local = ((Map<String, Object>) st).get("local");
        if (local == null) return null;
        // "2024-06-16 07:00+02:00" -> ISO local "2024-06-16T07:00"
        String s = local.toString();
        if (s.length() >= 16) {
            return s.substring(0, 16).replace(' ', 'T');
        }
        return null;
    }

    @SuppressWarnings("unchecked")
    private String airportField(Map<String, Object> airport, String key) {
        return airport != null ? str(airport.get(key)) : null;
    }

    @SuppressWarnings("unchecked")
    private FlightInfo lookupAviationStack(String flight) {
        try {
            Map<String, Object> body = restClient.get()
                    .uri("https://api.aviationstack.com/v1/flights?access_key={key}&flight_iata={flight}&limit=1",
                            aviationStackKey, flight)
                    .retrieve()
                    .body(MAP_TYPE);

            if (body == null || !body.containsKey("data")) return null;
            List<Map<String, Object>> data = (List<Map<String, Object>>) body.get("data");
            if (data == null || data.isEmpty()) return null;

            Map<String, Object> f = data.get(0);
            Map<String, Object> dep = (Map<String, Object>) f.get("departure");
            Map<String, Object> arr = (Map<String, Object>) f.get("arrival");
            Map<String, Object> airline = (Map<String, Object>) f.get("airline");

            return new FlightInfo(
                    airline != null ? str(airline.get("name")) : null,
                    flight,
                    dep != null ? str(dep.get("iata")) : null, dep != null ? str(dep.get("airport")) : null, null,
                    dep != null ? str(dep.get("terminal")) : null, null,
                    arr != null ? str(arr.get("iata")) : null, arr != null ? str(arr.get("airport")) : null, null,
                    arr != null ? str(arr.get("terminal")) : null, null
            );
        } catch (Exception e) {
            log.warn("AviationStack lookup failed for {}: {}", flight, e.getMessage());
            return null;
        }
    }

    @SuppressWarnings("unchecked")
    private FlightInfo lookupAirLabs(String flight) {
        try {
            // AirLabs free endpoint (no key needed for basic route lookup)
            Map<String, Object> body = restClient.get()
                    .uri("https://airlabs.co/api/v9/routes?flight_iata={flight}", flight)
                    .retrieve()
                    .body(MAP_TYPE);

            if (body == null || !body.containsKey("response")) return null;
            List<Map<String, Object>> data = (List<Map<String, Object>>) body.get("response");
            if (data == null || data.isEmpty()) return null;

            Map<String, Object> r = data.get(0);
            return new FlightInfo(
                    str(r.get("airline_iata")),
                    flight,
                    str(r.get("dep_iata")), null, str(r.get("dep_city")), null, null,
                    str(r.get("arr_iata")), null, str(r.get("arr_city")), null, null
            );
        } catch (Exception e) {
            log.debug("AirLabs lookup failed for {}: {}", flight, e.getMessage());
            return null;
        }
    }

    private String str(Object o) { return o != null ? o.toString() : null; }
}
