package com.tripyfull.controller;

import com.tripyfull.service.FlightLookupService;
import com.tripyfull.service.FlightLookupService.FlightInfo;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.Map;

@RestController
public class FlightController {

    private final FlightLookupService flightLookupService;

    public FlightController(FlightLookupService flightLookupService) {
        this.flightLookupService = flightLookupService;
    }

    @GetMapping("/api/flights/lookup")
    public Map<String, Object> lookup(@RequestParam String number,
                                      @RequestParam(required = false) String date) {
        FlightInfo info = flightLookupService.lookup(number, date);
        if (info == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Flight not found: " + number);
        }
        // HashMap (not Map.of) so null fields are allowed.
        Map<String, Object> out = new HashMap<>();
        out.put("airline", info.airline());
        out.put("flightNumber", info.flightNumber());
        out.put("depIata", info.depIata());
        out.put("depName", info.depName());
        out.put("depCity", info.depCity());
        out.put("depTerminal", info.depTerminal());
        out.put("depTime", info.depTime());
        out.put("arrIata", info.arrIata());
        out.put("arrName", info.arrName());
        out.put("arrCity", info.arrCity());
        out.put("arrTerminal", info.arrTerminal());
        out.put("arrTime", info.arrTime());
        return out;
    }
}
