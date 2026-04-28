package com.smartcampus.model;

import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "facilities")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Facility {

    @Id
    private String id;

    private String name;
    private FacilityType type;
    private Integer capacity;
    private String location;
    private String availabilityWindows;
    private String description;

    @Builder.Default
    private FacilityStatus status = FacilityStatus.ACTIVE;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    public enum FacilityType {
        LECTURE_HALL, LAB, MEETING_ROOM, EQUIPMENT
    }

    public enum FacilityStatus {
        ACTIVE, OUT_OF_SERVICE, UNDER_MAINTENANCE
    }
}
