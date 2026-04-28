package com.smartcampus.service;

import com.smartcampus.exception.BadRequestException;
import com.smartcampus.exception.ResourceNotFoundException;
import com.smartcampus.model.Facility;
import com.smartcampus.model.Notification;
import com.smartcampus.model.User;
import com.smartcampus.repository.FacilityRepository;
import com.smartcampus.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FacilityService {

    private final FacilityRepository facilityRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public List<Facility> getAll(String type, String status, String search) {
        if (search != null && !search.isBlank()) {
            return facilityRepository.findByNameContainingIgnoreCaseOrLocationContainingIgnoreCase(search, search);
        }
        if (type != null && status != null) {
            return facilityRepository.findByTypeAndStatus(
                    Facility.FacilityType.valueOf(type),
                    Facility.FacilityStatus.valueOf(status));
        }
        if (type != null) {
            return facilityRepository.findByType(Facility.FacilityType.valueOf(type));
        }
        if (status != null) {
            return facilityRepository.findByStatus(Facility.FacilityStatus.valueOf(status));
        }
        return facilityRepository.findAll();
    }

    public Facility getById(String id) {
        return facilityRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Facility not found: " + id));
    }

    public Facility create(Facility facility) {
        Facility saved = facilityRepository.save(facility);
        // Notify all users about the new facility
        List<User> allUsers = userRepository.findAllByOrderByCreatedAtDesc();
        for (User u : allUsers) {
            notificationService.send(u.getId(),
                    "New facility added: \"" + saved.getName() + "\" is now available for booking.",
                    Notification.NotificationType.SYSTEM, saved.getId());
        }
        return saved;
    }

    public Facility update(String id, Facility updated) {
        Facility existing = getById(id);
        existing.setName(updated.getName());
        existing.setType(updated.getType());
        existing.setCapacity(updated.getCapacity());
        existing.setLocation(updated.getLocation());
        existing.setAvailabilityWindows(updated.getAvailabilityWindows());
        existing.setDescription(updated.getDescription());
        existing.setStatus(updated.getStatus());
        existing.setUpdatedAt(LocalDateTime.now());
        return facilityRepository.save(existing);
    }

    public void delete(String id) {
        if (!facilityRepository.existsById(id)) {
            throw new ResourceNotFoundException("Facility not found: " + id);
        }
        facilityRepository.deleteById(id);
    }

    public Facility updateStatus(String id, String status) {
        Facility facility = getById(id);
        facility.setStatus(Facility.FacilityStatus.valueOf(status));
        facility.setUpdatedAt(LocalDateTime.now());
        return facilityRepository.save(facility);
    }
}
