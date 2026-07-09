package com.example.demo.auth;

import com.example.demo.model.User;
import com.example.demo.repository.UserRepository;
import com.example.demo.security.JwtUtil;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;

    public AuthController(UserRepository userRepository, PasswordEncoder passwordEncoder,
                          JwtUtil jwtUtil, AuthenticationManager authenticationManager) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.authenticationManager = authenticationManager;
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
    public ResponseEntity<?> updateMe(@AuthenticationPrincipal UserDetails userDetails,
                                      @RequestBody Map<String, String> body) {
        User user = userRepository.findByUsername(userDetails.getUsername()).orElseThrow();
        if (body.containsKey("baseCurrency")) user.setBaseCurrency(body.get("baseCurrency"));
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
