package com.smartcampus.controller;

import com.smartcampus.model.Notification;
import com.smartcampus.model.User;
import com.smartcampus.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    /** GET /api/notifications – Get all notifications for current user */
    @GetMapping
    public ResponseEntity<List<Notification>> getAll(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(notificationService.getUserNotifications(user.getId()));
    }

    /** PATCH /api/notifications/{id}/read – Mark notification as read */
    @PatchMapping("/{id}/read")
    public ResponseEntity<Notification> markRead(@PathVariable String id,
                                                  @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(notificationService.markRead(id, user.getId()));
    }

    /** PATCH /api/notifications/read-all – Mark all notifications as read */
    @PatchMapping("/read-all")
    public ResponseEntity<Map<String, String>> markAllRead(@AuthenticationPrincipal User user) {
        notificationService.markAllRead(user.getId());
        return ResponseEntity.ok(Map.of("message", "All notifications marked as read"));
    }

    /** DELETE /api/notifications/{id} – Delete a single notification */
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> delete(@PathVariable String id,
                                                       @AuthenticationPrincipal User user) {
        notificationService.delete(id, user.getId());
        return ResponseEntity.ok(Map.of("message", "Notification deleted"));
    }

    /** DELETE /api/notifications – Delete all notifications for current user */
    @DeleteMapping
    public ResponseEntity<Map<String, String>> deleteAll(@AuthenticationPrincipal User user) {
        notificationService.deleteAll(user.getId());
        return ResponseEntity.ok(Map.of("message", "All notifications deleted"));
    }
}
