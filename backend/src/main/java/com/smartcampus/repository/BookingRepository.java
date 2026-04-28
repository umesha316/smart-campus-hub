package com.smartcampus.repository;

import com.smartcampus.model.Booking;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Repository
public interface BookingRepository extends MongoRepository<Booking, String> {
    List<Booking> findByUserIdOrderByCreatedAtDesc(String userId);
    List<Booking> findAllByOrderByCreatedAtDesc();
    List<Booking> findByStatus(Booking.BookingStatus status);
    List<Booking> findByFacilityIdAndBookingDateAndStatusIn(
        String facilityId, LocalDate date, List<Booking.BookingStatus> statuses);

    @Query("{ 'facilityId': ?0, 'bookingDate': ?1, 'status': { $in: ['PENDING','APPROVED'] }, " +
           "$or: [ { 'startTime': { $lt: ?3 }, 'endTime': { $gt: ?2 } } ] }")
    List<Booking> findConflictingBookings(
        String facilityId, LocalDate date, LocalTime startTime, LocalTime endTime);
}
