package com.example.demo.auth;

public record AuthResponse(
        String token,
        String username,
        String baseCurrency,
        String language,
        String region,
        String dateFormat,
        String timeFormat
) {}
