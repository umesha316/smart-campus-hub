package com.smartcampus.service;

import com.smartcampus.exception.BadRequestException;
import com.smartcampus.exception.ResourceNotFoundException;
import com.smartcampus.exception.UnauthorizedException;
import com.smartcampus.model.Notification;
import com.smartcampus.model.Ticket;
import com.smartcampus.model.User;
import com.smartcampus.repository.TicketRepository;
import com.smartcampus.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TicketService {

    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    private static final String UPLOAD_DIR = "uploads/";

    public List<Ticket> getAll() {
        return ticketRepository.findAllByOrderByCreatedAtDesc();
    }

    public List<Ticket> getByUser(String userId) {
        return ticketRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public Ticket getById(String id) {
        return ticketRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found: " + id));
    }

    public Ticket create(Ticket ticket, User user, List<MultipartFile> attachments) {
        ticket.setUserId(user.getId());
        ticket.setCreatedBy(user.getName());
        ticket.setStatus(Ticket.TicketStatus.OPEN);

        // Handle file attachments (max 3)
        List<String> savedFiles = new ArrayList<>();
        if (attachments != null && !attachments.isEmpty()) {
            List<MultipartFile> validFiles = attachments.stream()
                    .filter(f -> !f.isEmpty())
                    .limit(3)
                    .toList();
            for (MultipartFile file : validFiles) {
                String filename = saveFile(file);
                if (filename != null) savedFiles.add(filename);
            }
        }
        ticket.setAttachments(savedFiles);

        return ticketRepository.save(ticket);
    }

    public Ticket updateStatus(String id, String status, String notes, User user) {
        Ticket ticket = getById(id);
        Ticket.TicketStatus newStatus = Ticket.TicketStatus.valueOf(status);
        ticket.setStatus(newStatus);
        ticket.setUpdatedAt(LocalDateTime.now());

        if (newStatus == Ticket.TicketStatus.RESOLVED && notes != null) {
            ticket.setResolutionNotes(notes);
            ticket.setResolvedAt(LocalDateTime.now());
        }
        if (newStatus == Ticket.TicketStatus.REJECTED && notes != null) {
            ticket.setRejectionReason(notes);
        }

        Ticket saved = ticketRepository.save(ticket);

        notificationService.send(ticket.getUserId(),
                "Your ticket #" + id.substring(0, 6) + " status changed to: " + status,
                Notification.NotificationType.TICKET, id);

        return saved;
    }

    public Ticket assign(String id, String technicianId, User admin) {
        Ticket ticket = getById(id);
        User technician = userRepository.findById(technicianId)
                .orElseThrow(() -> new ResourceNotFoundException("Technician not found"));
        ticket.setAssignedToId(technicianId);
        ticket.setAssignedTo(technician.getName());
        ticket.setStatus(Ticket.TicketStatus.IN_PROGRESS);
        ticket.setUpdatedAt(LocalDateTime.now());

        Ticket saved = ticketRepository.save(ticket);

        notificationService.send(ticket.getUserId(),
                "Your ticket has been assigned to " + technician.getName() + " and is now IN_PROGRESS.",
                Notification.NotificationType.TICKET, id);

        return saved;
    }

    public Ticket addComment(String ticketId, String text, User user) {
        Ticket ticket = getById(ticketId);
        Ticket.Comment comment = Ticket.Comment.builder()
                .id(UUID.randomUUID().toString())
                .userId(user.getId())
                .author(user.getName())
                .text(text)
                .createdAt(LocalDateTime.now())
                .build();
        ticket.getComments().add(comment);
        Ticket saved = ticketRepository.save(ticket);

        // Notify ticket owner if commenter is different
        if (!user.getId().equals(ticket.getUserId())) {
            notificationService.send(ticket.getUserId(),
                    user.getName() + " commented on your ticket: \"" + truncate(text, 60) + "\"",
                    Notification.NotificationType.COMMENT, ticketId);
        }
        return saved;
    }

    public Ticket editComment(String ticketId, String commentId, String text, User user) {
        Ticket ticket = getById(ticketId);
        ticket.getComments().stream()
                .filter(c -> c.getId().equals(commentId))
                .findFirst()
                .ifPresentOrElse(comment -> {
                    if (!comment.getUserId().equals(user.getId()) && user.getRole() != User.Role.ADMIN) {
                        throw new UnauthorizedException("Cannot edit another user's comment");
                    }
                    comment.setText(text);
                    comment.setUpdatedAt(LocalDateTime.now());
                }, () -> { throw new ResourceNotFoundException("Comment not found"); });
        return ticketRepository.save(ticket);
    }

    public Ticket deleteComment(String ticketId, String commentId, User user) {
        Ticket ticket = getById(ticketId);
        boolean removed = ticket.getComments().removeIf(c -> {
            if (!c.getId().equals(commentId)) return false;
            if (!c.getUserId().equals(user.getId()) && user.getRole() != User.Role.ADMIN) {
                throw new UnauthorizedException("Cannot delete another user's comment");
            }
            return true;
        });
        if (!removed) throw new ResourceNotFoundException("Comment not found");
        return ticketRepository.save(ticket);
    }

    private String saveFile(MultipartFile file) {
        try {
            Path dir = Paths.get(UPLOAD_DIR);
            if (!Files.exists(dir)) Files.createDirectories(dir);
            String filename = UUID.randomUUID() + "_" + file.getOriginalFilename();
            Files.copy(file.getInputStream(), dir.resolve(filename), StandardCopyOption.REPLACE_EXISTING);
            return filename;
        } catch (IOException e) {
            return null;
        }
    }

    private String truncate(String text, int max) {
        return text.length() <= max ? text : text.substring(0, max) + "...";
    }

    public void delete(String id, User admin) {
        Ticket ticket = getById(id);
        notificationService.send(ticket.getUserId(),
                "Your incident ticket has been deleted by admin.",
                Notification.NotificationType.TICKET, id);
        ticketRepository.deleteById(id);
    }
}
