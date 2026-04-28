package com.smartcampus.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

public class AuthDTOs {

    @Data
    public static class LoginRequest {
        @NotBlank @Email
        private String email;
        @NotBlank @Size(min = 6)
        private String password;
    }

    @Data
    public static class RegisterRequest {
        @NotBlank @Size(min = 2, max = 60)
        private String name;
        @NotBlank @Email
        private String email;
        @NotBlank @Size(min = 6)
        private String password;
        // Optional: USER (default) or TECHNICIAN
        private String role;
        private String phone;
        private String department;
        // Base64 encoded profile image (optional)
        private String pictureBase64;
    }

    @Data
    public static class GoogleLoginRequest {
        @NotBlank
        private String token;
    }

    @Data
    public static class AuthResponse {
        private String token;
        private UserDTO user;

        public AuthResponse(String token, UserDTO user) {
            this.token = token;
            this.user = user;
        }
    }

    @Data
    public static class UserDTO {
        private String id;
        private String name;
        private String email;
        private String role;
        private String picture;
        private String provider;
        private String phone;
        private String department;
    }

    @Data
    public static class UpdateProfileRequest {
        @Size(min = 2, max = 60)
        private String name;
        private String phone;
        private String department;
        // Base64 encoded profile image (optional, null = no change)
        private String pictureBase64;
        // Password change (optional)
        private String currentPassword;
        @Size(min = 6)
        private String newPassword;
    }
}
