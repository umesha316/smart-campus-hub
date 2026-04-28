package com.smartcampus.model;

import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "notifications")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Notification {

    @Id
    private String id;

    private String userId;
    private String message;
    private NotificationType type;

    @Builder.Default
    private boolean read = false;

    private String referenceId;   // bookingId or ticketId

    @CreatedDate
    private LocalDateTime createdAt;

    public enum NotificationType {
        BOOKING, TICKET, COMMENT, SYSTEM
    }
}
