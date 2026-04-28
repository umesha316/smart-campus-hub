package com.smartcampus.config;

import com.smartcampus.model.User;
import com.smartcampus.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * DataSeeder - Application startup-la admin user create pannum.
 * Already exists-na skip pannum (idempotent).
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    // ============================================================
    //  ADMIN CREDENTIALS — change before production!
    // ============================================================
    private static final String ADMIN_EMAIL    = "admin@sliit.lk";
    private static final String ADMIN_PASSWORD = "Admin@2026";
    private static final String ADMIN_NAME     = "System Administrator";
    // ============================================================

    @Override
    public void run(String... args) {
        seedAdmin();
    }

    private void seedAdmin() {
        if (userRepository.existsByEmail(ADMIN_EMAIL)) {
            log.info("✅ Admin user already exists — skipping seed.");
            return;
        }

        User admin = User.builder()
                .name(ADMIN_NAME)
                .email(ADMIN_EMAIL)
                .password(passwordEncoder.encode(ADMIN_PASSWORD))
                .role(User.Role.ADMIN)
                .provider("LOCAL")
                .build();

        userRepository.save(admin);
        log.info("🌱 Admin user seeded successfully.");
        log.info("   Email   : {}", ADMIN_EMAIL);
        log.info("   Password: {}", ADMIN_PASSWORD);
        log.info("   Role    : ADMIN");
    }
}
