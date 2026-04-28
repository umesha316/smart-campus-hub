package com.smartcampus.service;

import com.smartcampus.exception.BadRequestException;
import com.smartcampus.exception.ResourceNotFoundException;
import com.smartcampus.exception.UnauthorizedException;
import com.smartcampus.model.Booking;
import com.smartcampus.model.Facility;
import com.smartcampus.model.Notification;
import com.smartcampus.model.User;
import com.smartcampus.repository.BookingRepository;
import com.smartcampus.repository.FacilityRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final FacilityRepository facilityRepository;
    private final NotificationService notificationService;

    public List<Booking> getAll() {
        return bookingRepository.findAllByOrderByCreatedAtDesc();
    }

    public List<Booking> getByUser(String userId) {
        return bookingRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public Booking getById(String id) {
        return bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found: " + id));
    }

    public Booking create(Booking booking, User user) {
        // Validate facility exists and is active
        Facility facility = facilityRepository.findById(booking.getFacilityId())
                .orElseThrow(() -> new ResourceNotFoundException("Facility not found"));

        if (facility.getStatus() != Facility.FacilityStatus.ACTIVE) {
            throw new BadRequestException("Facility is not available for booking");
        }

        // Check for conflicts
        if (hasConflict(booking.getFacilityId(), booking.getBookingDate(),
                booking.getStartTime(), booking.getEndTime())) {
            throw new BadRequestException("Time slot conflict: this facility is already booked");
        }

        booking.setUserId(user.getId());
        booking.setCreatedBy(user.getName());
        booking.setFacilityName(facility.getName());
        booking.setStatus(Booking.BookingStatus.PENDING);

        Booking saved = bookingRepository.save(booking);

        // Notify admins (simplified — notify the user themselves for now)
        notificationService.send(user.getId(),
                "Your booking for " + facility.getName() + " has been submitted.",
                Notification.NotificationType.BOOKING, saved.getId());

        return saved;
    }

    public Booking approve(String id, String reason, User admin) {
        Booking booking = getById(id);
        if (booking.getStatus() != Booking.BookingStatus.PENDING) {
            throw new BadRequestException("Only PENDING bookings can be approved");
        }
        booking.setStatus(Booking.BookingStatus.APPROVED);
        booking.setApprovedBy(admin.getName());
        booking.setNotes(reason);
        booking.setUpdatedAt(LocalDateTime.now());
        Booking saved = bookingRepository.save(booking);

        notificationService.send(booking.getUserId(),
                "Your booking for " + booking.getFacilityName() + " on " + booking.getBookingDate() + " has been APPROVED.",
                Notification.NotificationType.BOOKING, id);

        return saved;
    }

    public Booking reject(String id, String reason, User admin) {
        Booking booking = getById(id);
        if (booking.getStatus() != Booking.BookingStatus.PENDING) {
            throw new BadRequestException("Only PENDING bookings can be rejected");
        }
        booking.setStatus(Booking.BookingStatus.REJECTED);
        booking.setRejectionReason(reason);
        booking.setUpdatedAt(LocalDateTime.now());
        Booking saved = bookingRepository.save(booking);

        notificationService.send(booking.getUserId(),
                "Your booking for " + booking.getFacilityName() + " was REJECTED. Reason: " + reason,
                Notification.NotificationType.BOOKING, id);

        return saved;
    }

    public Booking cancel(String id, User user) {
        Booking booking = getById(id);
        if (!booking.getUserId().equals(user.getId()) && user.getRole() != User.Role.ADMIN) {
            throw new UnauthorizedException("You can only cancel your own bookings");
        }
        if (booking.getStatus() != Booking.BookingStatus.APPROVED &&
                booking.getStatus() != Booking.BookingStatus.PENDING) {
            throw new BadRequestException("Cannot cancel a " + booking.getStatus() + " booking");
        }
        booking.setStatus(Booking.BookingStatus.CANCELLED);
        booking.setUpdatedAt(LocalDateTime.now());
        return bookingRepository.save(booking);
    }

    public Booking update(String id, Booking updated, User admin) {
        Booking booking = getById(id);
        if (updated.getFacilityId() != null) booking.setFacilityId(updated.getFacilityId());
        if (updated.getBookingDate() != null) booking.setBookingDate(updated.getBookingDate());
        if (updated.getStartTime() != null) booking.setStartTime(updated.getStartTime());
        if (updated.getEndTime() != null) booking.setEndTime(updated.getEndTime());
        if (updated.getPurpose() != null) booking.setPurpose(updated.getPurpose());
        if (updated.getAttendees() != null) booking.setAttendees(updated.getAttendees());
        booking.setUpdatedAt(LocalDateTime.now());
        Booking saved = bookingRepository.save(booking);
        notificationService.send(booking.getUserId(),
                "Your booking for " + booking.getFacilityName() + " has been updated by admin.",
                Notification.NotificationType.BOOKING, id);
        return saved;
    }

    public void delete(String id) {
        Booking booking = getById(id);
        notificationService.send(booking.getUserId(),
                "Your booking for " + booking.getFacilityName() + " on " + booking.getBookingDate() + " has been deleted by admin.",
                Notification.NotificationType.BOOKING, id);
        bookingRepository.deleteById(id);
    }

    public boolean hasConflict(String facilityId, LocalDate date, LocalTime start, LocalTime end) {
        List<Booking> conflicts = bookingRepository.findConflictingBookings(facilityId, date, start, end);
        return !conflicts.isEmpty();
    }
}
