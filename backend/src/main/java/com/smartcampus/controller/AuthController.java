package com.smartcampus.controller;

import com.smartcampus.dto.AuthDTOs;
import com.smartcampus.model.User;
import com.smartcampus.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    /** POST /api/auth/register – Register a new user (with optional profile picture as base64) */
    @PostMapping("/register")
    public ResponseEntity<AuthDTOs.AuthResponse> register(@Valid @RequestBody AuthDTOs.RegisterRequest req) {
        return ResponseEntity.status(201).body(authService.register(req));
    }

    /** POST /api/auth/login – Login with email & password */
    @PostMapping("/login")
    public ResponseEntity<AuthDTOs.AuthResponse> login(@Valid @RequestBody AuthDTOs.LoginRequest req) {
        return ResponseEntity.ok(authService.login(req));
    }

    /** POST /api/auth/google – Login with Google OAuth2 token */
    @PostMapping("/google")
    public ResponseEntity<AuthDTOs.AuthResponse> googleLogin(@Valid @RequestBody AuthDTOs.GoogleLoginRequest req) {
        return ResponseEntity.ok(authService.loginWithGoogle(req.getToken()));
    }

    /** GET /api/auth/me – Get current user profile */
    @GetMapping("/me")
    public ResponseEntity<AuthDTOs.UserDTO> getProfile(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(authService.getProfile(user.getEmail()));
    }

    /** PUT /api/auth/profile – Update current user profile (name, phone, dept, picture, password) */
    @PutMapping("/profile")
    public ResponseEntity<AuthDTOs.UserDTO> updateProfile(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody AuthDTOs.UpdateProfileRequest req) {
        return ResponseEntity.ok(authService.updateProfile(user.getEmail(), req));
    }
}
