package com.smartcampus.model;

import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Document(collection = "bookings")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Booking {

    @Id
    private String id;

    private String facilityId;
    private String facilityName;

    private String userId;
    private String createdBy;

    private LocalDate bookingDate;
    private LocalTime startTime;
    private LocalTime endTime;

    private String purpose;
    private Integer attendees;

    @Builder.Default
    private BookingStatus status = BookingStatus.PENDING;

    private String approvedBy;
    private String rejectionReason;
    private String notes;

    @CreatedDate
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    public enum BookingStatus {
        PENDING, APPROVED, REJECTED, CANCELLED
    }
}
