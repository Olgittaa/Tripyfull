package com.tripyfull.service;

import com.tripyfull.model.*;
import com.tripyfull.repository.*;
import com.tripyfull.security.OwnershipGuard;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.*;

@Service
@Transactional
public class ImportService {

    private final BookingRepository bookingRepository;
    private final OwnershipGuard guard;

    public ImportService(BookingRepository bookingRepository, OwnershipGuard guard) {
        this.bookingRepository = bookingRepository;
        this.guard = guard;
    }

    public int importBookingsCsv(UUID tripId, MultipartFile file, String username) {
        Trip trip = guard.requireTrip(tripId, username);

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {
            String headerLine = reader.readLine();
            if (headerLine == null) return 0;

            String[] headers = parseCsvLine(headerLine);
            Map<String, Integer> headerMap = new HashMap<>();
            for (int i = 0; i < headers.length; i++) {
                headerMap.put(headers[i].trim().toLowerCase(), i);
            }

            int count = 0;
            String line;
            while ((line = reader.readLine()) != null) {
                if (line.isBlank()) continue;
                String[] values = parseCsvLine(line);

                Booking booking = new Booking();
                booking.setTrip(trip);
                booking.setName(getField(values, headerMap, "expense name", "name", "activity name"));

                if (booking.getName() == null || booking.getName().isBlank()) continue;

                String category = getField(values, headerMap, "category", "type");
                if (category != null) {
                    try { booking.setCategory(BookingCategory.valueOf(category.toUpperCase())); }
                    catch (IllegalArgumentException ignored) {}
                }

                String price = getField(values, headerMap, "full price", "price", "cost", "cost estimate");
                if (price != null) {
                    try { booking.setFullPrice(new BigDecimal(price.replaceAll("[^\\d.]", ""))); }
                    catch (NumberFormatException ignored) {}
                }

                booking.setNotes(getField(values, headerMap, "notes", "note"));
                bookingRepository.save(booking);
                count++;
            }
            return count;
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Failed to parse CSV: " + e.getMessage());
        }
    }

    private String getField(String[] values, Map<String, Integer> headers, String... keys) {
        for (String key : keys) {
            Integer idx = headers.get(key);
            if (idx != null && idx < values.length && !values[idx].isBlank()) {
                return values[idx].trim();
            }
        }
        return null;
    }

    private String[] parseCsvLine(String line) {
        List<String> fields = new ArrayList<>();
        boolean inQuotes = false;
        StringBuilder sb = new StringBuilder();
        for (char c : line.toCharArray()) {
            if (c == '"') { inQuotes = !inQuotes; }
            else if (c == ',' && !inQuotes) { fields.add(sb.toString()); sb.setLength(0); }
            else { sb.append(c); }
        }
        fields.add(sb.toString());
        return fields.toArray(new String[0]);
    }
}
