package com.smartcampus.model;

import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;

import java.time.LocalDateTime;

@Document(collection = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    private String id;

    private String name;

    @Indexed(unique = true)
    private String email;

    private String password;

    @Builder.Default
    private Role role = Role.USER;

    private String picture;

    private String phone;

    private String department;

    @Builder.Default
    private String provider = "LOCAL"; // LOCAL or GOOGLE

    @CreatedDate
    private LocalDateTime createdAt;

    public enum Role {
        USER, TECHNICIAN, ADMIN
    }
}
