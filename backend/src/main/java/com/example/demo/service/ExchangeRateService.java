package com.example.demo.service;

import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class ExchangeRateService {

    private static final ParameterizedTypeReference<Map<String, Object>> MAP_TYPE = new ParameterizedTypeReference<>() {};
    private final RestClient restClient = RestClient.create();

    private final Map<String, CachedRate> cache = new ConcurrentHashMap<>();
    private static final long CACHE_TTL_MS = 3600_000;

    public BigDecimal getRate(String from, String to) {
        if (from == null || to == null || from.equalsIgnoreCase(to)) {
            return BigDecimal.ONE;
        }

        String key = from.toUpperCase() + "->" + to.toUpperCase();
        CachedRate cached = cache.get(key);
        if (cached != null && System.currentTimeMillis() - cached.timestamp < CACHE_TTL_MS) {
            return cached.rate;
        }

        BigDecimal rate = fetchFromFrankfurter(from.toUpperCase(), to.toUpperCase());
        if (rate == null) {
            rate = fetchFromOpenExchangeRates(from.toUpperCase(), to.toUpperCase());
        }
        if (rate != null) {
            cache.put(key, new CachedRate(rate, System.currentTimeMillis()));
        }
        return rate;
    }

    // frankfurter.app — free, no key, but limited currency list
    @SuppressWarnings("unchecked")
    private BigDecimal fetchFromFrankfurter(String from, String to) {
        try {
            Map<String, Object> body = restClient.get()
                    .uri("https://api.frankfurter.dev/v1/latest?base={from}&symbols={to}", from, to)
                    .retrieve()
                    .body(MAP_TYPE);
            return extractRate(body, to);
        } catch (Exception e) {
            return null;
        }
    }

    // open.er-api.com — free, no key, supports 150+ currencies including UAH, GEL, etc.
    @SuppressWarnings("unchecked")
    private BigDecimal fetchFromOpenExchangeRates(String from, String to) {
        try {
            Map<String, Object> body = restClient.get()
                    .uri("https://open.er-api.com/v6/latest/{from}", from)
                    .retrieve()
                    .body(MAP_TYPE);

            if (body != null && "success".equals(body.get("result"))) {
                Map<String, Object> rates = (Map<String, Object>) body.get("rates");
                if (rates != null && rates.containsKey(to)) {
                    return new BigDecimal(rates.get(to).toString()).setScale(6, RoundingMode.HALF_UP);
                }
            }
        } catch (Exception ignored) {}
        return null;
    }

    @SuppressWarnings("unchecked")
    private BigDecimal extractRate(Map<String, Object> body, String to) {
        if (body != null && body.containsKey("rates")) {
            Map<String, Object> rates = (Map<String, Object>) body.get("rates");
            if (rates.containsKey(to)) {
                return new BigDecimal(rates.get(to).toString()).setScale(6, RoundingMode.HALF_UP);
            }
        }
        return null;
    }

    private record CachedRate(BigDecimal rate, long timestamp) {}
}
