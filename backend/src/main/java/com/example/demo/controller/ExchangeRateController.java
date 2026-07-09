package com.example.demo.controller;

import com.example.demo.service.ExchangeRateService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.Map;

@RestController
public class ExchangeRateController {

    private final ExchangeRateService exchangeRateService;

    public ExchangeRateController(ExchangeRateService exchangeRateService) {
        this.exchangeRateService = exchangeRateService;
    }

    @GetMapping("/api/exchange-rate")
    public Map<String, Object> getRate(@RequestParam String from, @RequestParam String to) {
        BigDecimal rate = exchangeRateService.getRate(from, to);
        if (rate == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Could not fetch rate for " + from + " -> " + to);
        }
        return Map.of("from", from.toUpperCase(), "to", to.toUpperCase(), "rate", rate);
    }
}
