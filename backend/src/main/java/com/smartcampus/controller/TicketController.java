package com.smartcampus.controller;

import com.itextpdf.text.*;
import com.itextpdf.text.pdf.*;
import com.smartcampus.model.Ticket;
import com.smartcampus.model.User;
import com.smartcampus.repository.TicketRepository;
import com.smartcampus.service.TicketService;
import lombok.RequiredArgsConstructor;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVPrinter;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.StringWriter;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tickets")
@RequiredArgsConstructor
public class TicketController {

    private final TicketService ticketService;
    private final TicketRepository ticketRepository;
    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','TECHNICIAN')")
    public ResponseEntity<List<Ticket>> getAll() {
        return ResponseEntity.ok(ticketService.getAll());
    }

    @GetMapping("/my")
    public ResponseEntity<List<Ticket>> getMy(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ticketService.getByUser(user.getId()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Ticket> getById(@PathVariable String id) {
        return ResponseEntity.ok(ticketService.getById(id));
    }

    @PostMapping(consumes = { "multipart/form-data", "application/json" })
    public ResponseEntity<Ticket> create(
            @RequestPart(value = "title") String title,
            @RequestPart(value = "category") String category,
            @RequestPart(value = "description") String description,
            @RequestPart(value = "priority") String priority,
            @RequestPart(value = "location", required = false) String location,
            @RequestPart(value = "contactPhone", required = false) String contactPhone,
            @RequestPart(value = "attachments", required = false) List<MultipartFile> attachments,
            @AuthenticationPrincipal User user) {

        Ticket ticket = Ticket.builder()
                .title(title).category(category).description(description)
                .priority(Ticket.Priority.valueOf(priority))
                .location(location).contactPhone(contactPhone)
                .build();

        return ResponseEntity.status(201).body(ticketService.create(ticket, user, attachments));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','TECHNICIAN')")
    public ResponseEntity<Ticket> update(@PathVariable String id,
                                         @RequestBody Ticket ticket,
                                         @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ticketService.updateStatus(id, ticket.getStatus().name(),
                ticket.getResolutionNotes(), user));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN','TECHNICIAN')")
    public ResponseEntity<Ticket> updateStatus(@PathVariable String id,
                                               @RequestBody Map<String, String> body,
                                               @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ticketService.updateStatus(id, body.get("status"), body.get("notes"), user));
    }

    @PatchMapping("/{id}/assign")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Ticket> assign(@PathVariable String id,
                                         @RequestBody Map<String, String> body,
                                         @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ticketService.assign(id, body.get("technicianId"), user));
    }

    @PostMapping("/{id}/comments")
    public ResponseEntity<Ticket> addComment(@PathVariable String id,
                                             @RequestBody Map<String, String> body,
                                             @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ticketService.addComment(id, body.get("text"), user));
    }

    @PutMapping("/{ticketId}/comments/{commentId}")
    public ResponseEntity<Ticket> editComment(@PathVariable String ticketId,
                                              @PathVariable String commentId,
                                              @RequestBody Map<String, String> body,
                                              @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ticketService.editComment(ticketId, commentId, body.get("text"), user));
    }

    @DeleteMapping("/{ticketId}/comments/{commentId}")
    public ResponseEntity<Ticket> deleteComment(@PathVariable String ticketId,
                                                @PathVariable String commentId,
                                                @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ticketService.deleteComment(ticketId, commentId, user));
    }

    @GetMapping("/export/csv")
    @PreAuthorize("hasAnyRole('ADMIN','TECHNICIAN')")
    public ResponseEntity<byte[]> exportCsv() throws IOException {
        List<Ticket> tickets = ticketRepository.findAllByOrderByCreatedAtDesc();

        StringWriter sw = new StringWriter();
        CSVPrinter printer = new CSVPrinter(sw, CSVFormat.DEFAULT.withHeader(
                "ID", "Title", "Category", "Priority", "Status", "Location",
                "Reported By", "Assigned To", "Created At", "Resolved At", "Resolution Notes"
        ));

        for (Ticket t : tickets) {
            printer.printRecord(
                    t.getId(),
                    t.getTitle() != null ? t.getTitle() : "",
                    t.getCategory() != null ? t.getCategory() : "",
                    t.getPriority() != null ? t.getPriority().name() : "",
                    t.getStatus() != null ? t.getStatus().name() : "",
                    t.getLocation() != null ? t.getLocation() : "",
                    t.getCreatedBy() != null ? t.getCreatedBy() : "",
                    t.getAssignedTo() != null ? t.getAssignedTo() : "",
                    t.getCreatedAt() != null ? t.getCreatedAt().format(FMT) : "",
                    t.getResolvedAt() != null ? t.getResolvedAt().format(FMT) : "",
                    t.getResolutionNotes() != null ? t.getResolutionNotes() : ""
            );
        }
        printer.flush();

        byte[] csvBytes = sw.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"incidents_report.csv\"")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(csvBytes);
    }

    @GetMapping("/export/pdf")
    @PreAuthorize("hasAnyRole('ADMIN','TECHNICIAN')")
    public ResponseEntity<byte[]> exportPdf() throws Exception {
        List<Ticket> tickets = ticketRepository.findAllByOrderByCreatedAtDesc();

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        Document doc = new Document(PageSize.A4.rotate(), 20, 20, 40, 30);
        PdfWriter.getInstance(doc, baos);
        doc.open();

        Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18, BaseColor.DARK_GRAY);
        Paragraph title = new Paragraph("SmartCampus Hub \u2013 Incidents Report", titleFont);
        title.setAlignment(Element.ALIGN_CENTER);
        title.setSpacingAfter(6);
        doc.add(title);

        Font subFont = FontFactory.getFont(FontFactory.HELVETICA, 10, BaseColor.GRAY);
        Paragraph sub = new Paragraph("Total Incidents: " + tickets.size() + "   |   Generated: " +
                java.time.LocalDateTime.now().format(FMT), subFont);
        sub.setAlignment(Element.ALIGN_CENTER);
        sub.setSpacingAfter(16);
        doc.add(sub);

        PdfPTable table = new PdfPTable(7);
        table.setWidthPercentage(100);
        table.setWidths(new float[]{5f, 3f, 2.5f, 3f, 3f, 3f, 3f});

        Font hFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, BaseColor.WHITE);
        BaseColor headerColor = new BaseColor(220, 38, 38);
        for (String h : new String[]{"Title", "Category", "Priority", "Status", "Location", "Reported By", "Created At"}) {
            PdfPCell cell = new PdfPCell(new Phrase(h, hFont));
            cell.setBackgroundColor(headerColor);
            cell.setPadding(8);
            cell.setHorizontalAlignment(Element.ALIGN_CENTER);
            table.addCell(cell);
        }

        Font rowFont = FontFactory.getFont(FontFactory.HELVETICA, 8, BaseColor.DARK_GRAY);
        BaseColor alt = new BaseColor(243, 244, 246);
        int i = 0;
        for (Ticket t : tickets) {
            BaseColor bg = (i++ % 2 == 0) ? BaseColor.WHITE : alt;
            String[] vals = {
                    t.getTitle() != null ? t.getTitle() : "-",
                    t.getCategory() != null ? t.getCategory() : "-",
                    t.getPriority() != null ? t.getPriority().name() : "-",
                    t.getStatus() != null ? t.getStatus().name().replace("_", " ") : "-",
                    t.getLocation() != null ? t.getLocation() : "-",
                    t.getCreatedBy() != null ? t.getCreatedBy() : "-",
                    t.getCreatedAt() != null ? t.getCreatedAt().format(FMT) : "-"
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
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"incidents_report.pdf\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(baos.toByteArray());
    }

    /** DELETE /api/tickets/{id} – Admin delete a ticket */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> delete(@PathVariable String id,
                                                       @AuthenticationPrincipal User user) {
        ticketService.delete(id, user);
        return ResponseEntity.ok(Map.of("message", "Ticket deleted"));
    }
}
