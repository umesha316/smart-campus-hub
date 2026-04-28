package com.smartcampus.controller;

import com.smartcampus.model.Facility;
import com.smartcampus.service.FacilityService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/facilities")
@RequiredArgsConstructor
public class FacilityController {

    private final FacilityService facilityService;

    /** GET /api/facilities – List all facilities with optional filters */
    @GetMapping
    public ResponseEntity<List<Facility>> getAll(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search) {
        return ResponseEntity.ok(facilityService.getAll(type, status, search));
    }

    /** GET /api/facilities/{id} – Get facility by ID */
    @GetMapping("/{id}")
    public ResponseEntity<Facility> getById(@PathVariable String id) {
        return ResponseEntity.ok(facilityService.getById(id));
    }

    /** POST /api/facilities – Create a new facility (ADMIN only) */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Facility> create(@Valid @RequestBody Facility facility) {
        return ResponseEntity.status(201).body(facilityService.create(facility));
    }

    /** PUT /api/facilities/{id} – Update facility (ADMIN only) */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Facility> update(@PathVariable String id, @Valid @RequestBody Facility facility) {
        return ResponseEntity.ok(facilityService.update(id, facility));
    }

    /** DELETE /api/facilities/{id} – Delete facility (ADMIN only) */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> delete(@PathVariable String id) {
        facilityService.delete(id);
        return ResponseEntity.ok(Map.of("message", "Facility deleted successfully"));
    }

    /** PATCH /api/facilities/{id}/status – Update facility status (ADMIN only) */
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Facility> updateStatus(@PathVariable String id,
                                                  @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(facilityService.updateStatus(id, body.get("status")));
    }
}
