package com.smartcampus.repository;

import com.smartcampus.model.Facility;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FacilityRepository extends MongoRepository<Facility, String> {
    List<Facility> findByStatus(Facility.FacilityStatus status);
    List<Facility> findByType(Facility.FacilityType type);
    List<Facility> findByTypeAndStatus(Facility.FacilityType type, Facility.FacilityStatus status);
    List<Facility> findByNameContainingIgnoreCaseOrLocationContainingIgnoreCase(String name, String location);
}
