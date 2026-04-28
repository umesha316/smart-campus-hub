package com.smartcampus.service;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.smartcampus.dto.AuthDTOs;
import com.smartcampus.exception.BadRequestException;
import com.smartcampus.exception.ResourceNotFoundException;
import com.smartcampus.model.Notification;
import com.smartcampus.model.User;
import com.smartcampus.repository.UserRepository;
import com.smartcampus.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final NotificationService notificationService;



    public AuthDTOs.AuthResponse register(AuthDTOs.RegisterRequest req) {
        if (userRepository.existsByEmail(req.getEmail())) {
            throw new BadRequestException("Email already registered");
        }

        // Allow USER or TECHNICIAN self-registration; ADMIN must be set manually
        User.Role role = User.Role.USER;
        if ("TECHNICIAN".equalsIgnoreCase(req.getRole())) {
            role = User.Role.TECHNICIAN;
        }

        // Handle profile picture (base64 stored directly; in production use file storage)
        String picture = null;
        if (req.getPictureBase64() != null && !req.getPictureBase64().isBlank()) {
            picture = req.getPictureBase64();
        }

        User user = User.builder()
                .name(req.getName())
                .email(req.getEmail())
                .password(passwordEncoder.encode(req.getPassword()))
                .role(role)
                .provider("LOCAL")
                .picture(picture)
                .phone(req.getPhone())
                .department(req.getDepartment())
                .build();
        user = userRepository.save(user);
        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name());
        return new AuthDTOs.AuthResponse(token, toDTO(user));
    }

    public AuthDTOs.AuthResponse login(AuthDTOs.LoginRequest req) {
        User user = userRepository.findByEmail(req.getEmail())
                .orElseThrow(() -> new BadRequestException("Invalid credentials"));
        if (!passwordEncoder.matches(req.getPassword(), user.getPassword())) {
            throw new BadRequestException("Invalid credentials");
        }
        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name());
        return new AuthDTOs.AuthResponse(token, toDTO(user));
    }

    public AuthDTOs.AuthResponse loginWithGoogle(String accessToken) {
        try {
            // Call Google userinfo endpoint with the access token
            URL url = new URL("https://www.googleapis.com/oauth2/v3/userinfo");
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestProperty("Authorization", "Bearer " + accessToken);
            conn.setRequestMethod("GET");

            if (conn.getResponseCode() != 200) {
                throw new BadRequestException("Invalid Google access token");
            }

            BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getInputStream()));
            StringBuilder sb = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) sb.append(line);
            reader.close();

            JsonObject payload = new Gson().fromJson(sb.toString(), JsonObject.class);
            String email   = payload.has("email")   ? payload.get("email").getAsString()   : null;
            String name    = payload.has("name")    ? payload.get("name").getAsString()    : email;
            String picture = payload.has("picture") ? payload.get("picture").getAsString() : null;

            if (email == null) throw new BadRequestException("Could not retrieve email from Google");

            User user = userRepository.findByEmail(email).orElseGet(() ->
                    userRepository.save(User.builder()
                            .email(email).name(name).picture(picture)
                            .role(User.Role.USER).provider("GOOGLE")
                            .password(passwordEncoder.encode(java.util.UUID.randomUUID().toString()))
                            .build())
            );

            String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name());
            return new AuthDTOs.AuthResponse(token, toDTO(user));
        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            throw new BadRequestException("Google login failed: " + e.getMessage());
        }
    }

    public AuthDTOs.UserDTO getProfile(String email) {
        return toDTO(userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found")));
    }

    public AuthDTOs.UserDTO updateProfile(String email, AuthDTOs.UpdateProfileRequest req) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Update name
        if (req.getName() != null && !req.getName().isBlank()) {
            user.setName(req.getName());
        }

        // Update phone & department
        if (req.getPhone() != null) user.setPhone(req.getPhone());
        if (req.getDepartment() != null) user.setDepartment(req.getDepartment());

        // Update profile picture
        if (req.getPictureBase64() != null && !req.getPictureBase64().isBlank()) {
            user.setPicture(req.getPictureBase64());
        }

        // Password change - requires currentPassword
        boolean passwordChanged = false;
        if (req.getNewPassword() != null && !req.getNewPassword().isBlank()) {
            if (req.getCurrentPassword() == null || req.getCurrentPassword().isBlank()) {
                throw new BadRequestException("Current password is required to set a new password");
            }
            // GOOGLE users may not have a real password
            if ("GOOGLE".equals(user.getProvider())) {
                throw new BadRequestException("Google-linked accounts cannot change password here");
            }
            if (!passwordEncoder.matches(req.getCurrentPassword(), user.getPassword())) {
                throw new BadRequestException("Current password is incorrect");
            }
            user.setPassword(passwordEncoder.encode(req.getNewPassword()));
            passwordChanged = true;
        }

        user = userRepository.save(user);

        // Send notification for profile update
        notificationService.send(user.getId(),
                "Your profile has been updated successfully.",
                Notification.NotificationType.SYSTEM, null);

        // Send additional notification for password change
        if (passwordChanged) {
            notificationService.send(user.getId(),
                    "Your password has been changed successfully. If you did not make this change, please contact support.",
                    Notification.NotificationType.SYSTEM, null);
        }

        return toDTO(user);
    }

    private AuthDTOs.UserDTO toDTO(User user) {
        AuthDTOs.UserDTO dto = new AuthDTOs.UserDTO();
        dto.setId(user.getId());
        dto.setName(user.getName());
        dto.setEmail(user.getEmail());
        dto.setRole(user.getRole().name());
        dto.setPicture(user.getPicture());
        dto.setProvider(user.getProvider());
        dto.setPhone(user.getPhone());
        dto.setDepartment(user.getDepartment());
        return dto;
    }
}
