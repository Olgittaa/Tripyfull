package com.tripyfull.auth;

import com.tripyfull.model.User;
import com.tripyfull.repository.BookingRepository;
import com.tripyfull.repository.UserRepository;
import com.tripyfull.security.JwtUtil;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;
    private final BookingRepository bookingRepository;

    public AuthController(UserRepository userRepository, PasswordEncoder passwordEncoder,
                          JwtUtil jwtUtil, AuthenticationManager authenticationManager,
                          BookingRepository bookingRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.authenticationManager = authenticationManager;
        this.bookingRepository = bookingRepository;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        if (userRepository.existsByUsername(request.username())) {
            return ResponseEntity.badRequest().body("Username already taken");
        }
        User user = new User();
        user.setUsername(request.username());
        user.setPassword(passwordEncoder.encode(request.password()));
        userRepository.save(user);

        String token = jwtUtil.generateToken(user.getUsername());
        return ResponseEntity.ok(toResponse(user, token));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.username(), request.password())
            );
        } catch (BadCredentialsException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid username or password");
        }
        User user = userRepository.findByUsername(request.username()).orElseThrow();
        String token = jwtUtil.generateToken(request.username());
        return ResponseEntity.ok(toResponse(user, token));
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(@AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByUsername(userDetails.getUsername()).orElseThrow();
        return ResponseEntity.ok(toResponse(user, null));
    }

    @PatchMapping("/me")
    @Transactional
    public ResponseEntity<?> updateMe(@AuthenticationPrincipal UserDetails userDetails,
                                      @RequestBody Map<String, String> body) {
        User user = userRepository.findByUsername(userDetails.getUsername()).orElseThrow();
        if (body.containsKey("baseCurrency")) {
            String next = body.get("baseCurrency");
            String prev = user.getBaseCurrency();
            boolean changed = next == null ? prev != null : !next.equalsIgnoreCase(prev);
            // Stored booking rates convert to the OLD base and go stale on change —
            // drop them so auto-fill / live budget rates re-resolve against the new one.
            if (changed) bookingRepository.clearExchangeRatesForOwner(user.getId());
            user.setBaseCurrency(next);
        }
        if (body.containsKey("language")) user.setLanguage(body.get("language"));
        if (body.containsKey("region")) user.setRegion(body.get("region"));
        if (body.containsKey("dateFormat")) user.setDateFormat(body.get("dateFormat"));
        if (body.containsKey("timeFormat")) user.setTimeFormat(body.get("timeFormat"));
        userRepository.save(user);
        return ResponseEntity.ok(toResponse(user, null));
    }

    private AuthResponse toResponse(User user, String token) {
        return new AuthResponse(
                token, user.getUsername(), user.getBaseCurrency(),
                user.getLanguage(), user.getRegion(),
                user.getDateFormat(), user.getTimeFormat()
        );
    }
}
