package com.smartcampus.repository;

import com.smartcampus.model.Ticket;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TicketRepository extends MongoRepository<Ticket, String> {
    List<Ticket> findByUserIdOrderByCreatedAtDesc(String userId);
    List<Ticket> findAllByOrderByCreatedAtDesc();
    List<Ticket> findByStatus(Ticket.TicketStatus status);
    List<Ticket> findByPriority(Ticket.Priority priority);
    List<Ticket> findByAssignedToId(String technicianId);
}
