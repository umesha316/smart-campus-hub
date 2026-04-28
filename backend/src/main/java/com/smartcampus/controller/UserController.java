package com.smartcampus.controller;

import com.itextpdf.text.*;
import com.itextpdf.text.pdf.*;
import com.smartcampus.exception.ResourceNotFoundException;
import com.smartcampus.model.User;
import com.smartcampus.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVPrinter;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.PrintWriter;
import java.io.StringWriter;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class UserController {

    private final UserRepository userRepository;
    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    /** GET /api/users – Get all users (ADMIN only) */
    @GetMapping
    public ResponseEntity<List<User>> getAll() {
        return ResponseEntity.ok(userRepository.findAllByOrderByCreatedAtDesc());
    }

    /** GET /api/users/{id} – Get user by ID (ADMIN only) */
    @GetMapping("/{id}")
    public ResponseEntity<User> getById(@PathVariable String id) {
        return ResponseEntity.ok(userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found")));
    }

    /** PATCH /api/users/{id}/role – Update user role (ADMIN only) */
    @PatchMapping("/{id}/role")
    public ResponseEntity<User> updateRole(@PathVariable String id,
                                           @RequestBody Map<String, String> body) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        user.setRole(User.Role.valueOf(body.get("role")));
        return ResponseEntity.ok(userRepository.save(user));
    }

    /** DELETE /api/users/{id} – Delete user (ADMIN only) */
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteUser(@PathVariable String id) {
        if (!userRepository.existsById(id)) throw new ResourceNotFoundException("User not found");
        userRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "User deleted"));
    }

    /** POST /api/users – Admin create a new user */
    @PostMapping
    public ResponseEntity<User> createUser(@RequestBody Map<String, String> body) {
        if (userRepository.existsByEmail(body.get("email"))) {
            throw new com.smartcampus.exception.BadRequestException("Email already registered");
        }
        User user = User.builder()
                .name(body.get("name"))
                .email(body.get("email"))
                .password(new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder()
                        .encode(body.getOrDefault("password", java.util.UUID.randomUUID().toString())))
                .role(User.Role.valueOf(body.getOrDefault("role", "USER")))
                .provider("LOCAL")
                .phone(body.get("phone"))
                .department(body.get("department"))
                .build();
        return ResponseEntity.ok(userRepository.save(user));
    }

    // ─── REPORT EXPORT ENDPOINTS ────────────────────────────────────────────

    /** GET /api/users/export/csv – Download all users as CSV */
    @GetMapping("/export/csv")
    public ResponseEntity<byte[]> exportCsv() throws IOException {
        List<User> users = userRepository.findAllByOrderByCreatedAtDesc();

        StringWriter sw = new StringWriter();
        CSVPrinter printer = new CSVPrinter(sw, CSVFormat.DEFAULT.withHeader(
                "ID", "Name", "Email", "Role", "Provider", "Phone", "Department", "Joined"
        ));

        for (User u : users) {
            printer.printRecord(
                    u.getId(),
                    u.getName(),
                    u.getEmail(),
                    u.getRole().name(),
                    u.getProvider(),
                    u.getPhone() != null ? u.getPhone() : "",
                    u.getDepartment() != null ? u.getDepartment() : "",
                    u.getCreatedAt() != null ? u.getCreatedAt().format(FMT) : ""
            );
        }
        printer.flush();

        byte[] csvBytes = sw.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"users_report.csv\"")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(csvBytes);
    }

    /** GET /api/users/export/pdf – Download all users as PDF */
    @GetMapping("/export/pdf")
    public ResponseEntity<byte[]> exportPdf() throws Exception {
        List<User> users = userRepository.findAllByOrderByCreatedAtDesc();

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        Document doc = new Document(PageSize.A4.rotate(), 20, 20, 40, 30);
        PdfWriter.getInstance(doc, baos);
        doc.open();

        // Title
        Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18, BaseColor.DARK_GRAY);
        Paragraph title = new Paragraph("SmartCampus Hub – User Report", titleFont);
        title.setAlignment(Element.ALIGN_CENTER);
        title.setSpacingAfter(6);
        doc.add(title);

        Font subFont = FontFactory.getFont(FontFactory.HELVETICA, 10, BaseColor.GRAY);
        Paragraph sub = new Paragraph("Total Users: " + users.size() + "   |   Generated: " +
                java.time.LocalDateTime.now().format(FMT), subFont);
        sub.setAlignment(Element.ALIGN_CENTER);
        sub.setSpacingAfter(16);
        doc.add(sub);

        // Table
        PdfPTable table = new PdfPTable(7);
        table.setWidthPercentage(100);
        table.setWidths(new float[]{3f, 4f, 5f, 2.5f, 2.5f, 3f, 3f});

        // Header cells
        Font hFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, BaseColor.WHITE);
        BaseColor headerColor = new BaseColor(37, 99, 235); // blue-600
        for (String h : new String[]{"Name", "Email", "Role", "Provider", "Phone", "Department", "Joined"}) {
            PdfPCell cell = new PdfPCell(new Phrase(h, hFont));
            cell.setBackgroundColor(headerColor);
            cell.setPadding(7);
            cell.setHorizontalAlignment(Element.ALIGN_CENTER);
            cell.setBorderColor(BaseColor.WHITE);
            table.addCell(cell);
        }

        // Data rows
        Font rowFont = FontFactory.getFont(FontFactory.HELVETICA, 8, BaseColor.DARK_GRAY);
        boolean alt = false;
        BaseColor altColor = new BaseColor(239, 246, 255);
        for (User u : users) {
            BaseColor rowBg = alt ? altColor : BaseColor.WHITE;
            String[] values = {
                    u.getName(),
                    u.getEmail(),
                    u.getRole().name(),
                    u.getProvider(),
                    u.getPhone() != null ? u.getPhone() : "—",
                    u.getDepartment() != null ? u.getDepartment() : "—",
                    u.getCreatedAt() != null ? u.getCreatedAt().format(FMT) : "—"
            };
            for (String v : values) {
                PdfPCell cell = new PdfPCell(new Phrase(v, rowFont));
                cell.setBackgroundColor(rowBg);
                cell.setPadding(6);
                cell.setBorderColor(new BaseColor(220, 220, 220));
            table.addCell(cell);
            }
            alt = !alt;
        }

        doc.add(table);
        doc.close();

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"users_report.pdf\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(baos.toByteArray());
    }
}
