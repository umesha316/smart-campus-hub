package com.smartcampus.controller;

import com.itextpdf.text.*;
import com.itextpdf.text.pdf.*;
import com.smartcampus.model.Booking;
import com.smartcampus.model.User;
import com.smartcampus.repository.BookingRepository;
import com.smartcampus.service.BookingService;
import lombok.RequiredArgsConstructor;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVPrinter;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.StringWriter;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;
    private final BookingRepository bookingRepository;
    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Booking>> getAll() {
        return ResponseEntity.ok(bookingService.getAll());
    }

    @GetMapping("/my")
    public ResponseEntity<List<Booking>> getMyBookings(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(bookingService.getByUser(user.getId()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Booking> getById(@PathVariable String id) {
        return ResponseEntity.ok(bookingService.getById(id));
    }

    @PostMapping
    public ResponseEntity<Booking> create(@RequestBody Booking booking,
                                          @AuthenticationPrincipal User user) {
        return ResponseEntity.status(201).body(bookingService.create(booking, user));
    }

    @PostMapping("/check-conflicts")
    public ResponseEntity<Map<String, Object>> checkConflicts(@RequestBody Map<String, String> body) {
        boolean conflict = bookingService.hasConflict(
                body.get("facilityId"),
                LocalDate.parse(body.get("bookingDate")),
                LocalTime.parse(body.get("startTime")),
                LocalTime.parse(body.get("endTime"))
        );
        return ResponseEntity.ok(Map.of("hasConflict", conflict));
    }

    @PatchMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Booking> approve(@PathVariable String id,
                                           @RequestBody(required = false) Map<String, String> body,
                                           @AuthenticationPrincipal User user) {
        String reason = body != null ? body.get("reason") : null;
        return ResponseEntity.ok(bookingService.approve(id, reason, user));
    }

    @PatchMapping("/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Booking> reject(@PathVariable String id,
                                          @RequestBody Map<String, String> body,
                                          @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(bookingService.reject(id, body.get("reason"), user));
    }

    @PatchMapping("/{id}/cancel")
    public ResponseEntity<Booking> cancel(@PathVariable String id,
                                          @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(bookingService.cancel(id, user));
    }

    @GetMapping("/export/csv")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<byte[]> exportCsv() throws IOException {
        List<Booking> bookings = bookingRepository.findAllByOrderByCreatedAtDesc();

        StringWriter sw = new StringWriter();
        CSVPrinter printer = new CSVPrinter(sw, CSVFormat.DEFAULT.withHeader(
                "ID", "Facility", "Booked By", "Date", "Start Time", "End Time",
                "Purpose", "Attendees", "Status", "Approved By", "Rejection Reason", "Created At"
        ));

        for (Booking b : bookings) {
            printer.printRecord(
                    b.getId(),
                    b.getFacilityName() != null ? b.getFacilityName() : "",
                    b.getCreatedBy() != null ? b.getCreatedBy() : "",
                    b.getBookingDate() != null ? b.getBookingDate().toString() : "",
                    b.getStartTime() != null ? b.getStartTime().toString() : "",
                    b.getEndTime() != null ? b.getEndTime().toString() : "",
                    b.getPurpose() != null ? b.getPurpose() : "",
                    b.getAttendees() != null ? b.getAttendees() : "",
                    b.getStatus() != null ? b.getStatus().name() : "",
                    b.getApprovedBy() != null ? b.getApprovedBy() : "",
                    b.getRejectionReason() != null ? b.getRejectionReason() : "",
                    b.getCreatedAt() != null ? b.getCreatedAt().format(FMT) : ""
            );
        }
        printer.flush();

        byte[] csvBytes = sw.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"bookings_report.csv\"")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(csvBytes);
    }

    @GetMapping("/export/pdf")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<byte[]> exportPdf() throws Exception {
        List<Booking> bookings = bookingRepository.findAllByOrderByCreatedAtDesc();

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        Document doc = new Document(PageSize.A4.rotate(), 20, 20, 40, 30);
        PdfWriter.getInstance(doc, baos);
        doc.open();

        Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18, BaseColor.DARK_GRAY);
        Paragraph title = new Paragraph("SmartCampus Hub \u2013 Bookings Report", titleFont);
        title.setAlignment(Element.ALIGN_CENTER);
        title.setSpacingAfter(6);
        doc.add(title);

        Font subFont = FontFactory.getFont(FontFactory.HELVETICA, 10, BaseColor.GRAY);
        Paragraph sub = new Paragraph("Total Bookings: " + bookings.size() + "   |   Generated: " +
                java.time.LocalDateTime.now().format(FMT), subFont);
        sub.setAlignment(Element.ALIGN_CENTER);
        sub.setSpacingAfter(16);
        doc.add(sub);

        PdfPTable table = new PdfPTable(7);
        table.setWidthPercentage(100);
        table.setWidths(new float[]{4f, 4f, 3f, 3f, 3f, 4f, 3f});

        Font hFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, BaseColor.WHITE);
        BaseColor headerColor = new BaseColor(37, 99, 235);
        for (String h : new String[]{"Facility", "Booked By", "Date", "Start", "End", "Purpose", "Status"}) {
            PdfPCell cell = new PdfPCell(new Phrase(h, hFont));
            cell.setBackgroundColor(headerColor);
            cell.setPadding(8);
            cell.setHorizontalAlignment(Element.ALIGN_CENTER);
            table.addCell(cell);
        }

        Font rowFont = FontFactory.getFont(FontFactory.HELVETICA, 8, BaseColor.DARK_GRAY);
        BaseColor alt = new BaseColor(243, 244, 246);
        int i = 0;
        for (Booking b : bookings) {
            BaseColor bg = (i++ % 2 == 0) ? BaseColor.WHITE : alt;
            String[] vals = {
                    b.getFacilityName() != null ? b.getFacilityName() : "-",
                    b.getCreatedBy() != null ? b.getCreatedBy() : "-",
                    b.getBookingDate() != null ? b.getBookingDate().toString() : "-",
                    b.getStartTime() != null ? b.getStartTime().toString() : "-",
                    b.getEndTime() != null ? b.getEndTime().toString() : "-",
                    b.getPurpose() != null ? b.getPurpose() : "-",
                    b.getStatus() != null ? b.getStatus().name() : "-"
            };
            for (String v : vals) {
                PdfPCell cell = new PdfPCell(new Phrase(v, rowFont));
                cell.setBackgroundColor(bg);
                cell.setPadding(6);
                table.addCell(cell);
            }
        }

        doc.add(table);
        doc.close();

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"bookings_report.pdf\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(baos.toByteArray());
    }

    /** PUT /api/bookings/{id} – Admin edit a booking */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Booking> update(@PathVariable String id,
                                          @RequestBody Booking updated,
                                          @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(bookingService.update(id, updated, user));
    }

    /** DELETE /api/bookings/{id} – Admin delete a booking */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> delete(@PathVariable String id) {
        bookingService.delete(id);
        return ResponseEntity.ok(Map.of("message", "Booking deleted"));
    }
}
