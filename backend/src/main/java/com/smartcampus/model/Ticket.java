package com.smartcampus.model;

import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Document(collection = "tickets")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Ticket {

    @Id
    private String id;

    private String title;
    private String category;
    private String description;
    private Priority priority;
    private String location;
    private String contactPhone;

    @Builder.Default
    private TicketStatus status = TicketStatus.OPEN;

    private String userId;
    private String createdBy;

    private String assignedToId;
    private String assignedTo;

    private String resolutionNotes;
    private String rejectionReason;

    @Builder.Default
    private List<String> attachments = new ArrayList<>();

    @Builder.Default
    private List<Comment> comments = new ArrayList<>();

    @CreatedDate
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
    private LocalDateTime resolvedAt;

    public enum Priority { LOW, MEDIUM, HIGH, CRITICAL }

    public enum TicketStatus { OPEN, IN_PROGRESS, RESOLVED, CLOSED, REJECTED }

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class Comment {
        private String id;
        private String userId;
        private String author;
        private String text;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
    }
}
