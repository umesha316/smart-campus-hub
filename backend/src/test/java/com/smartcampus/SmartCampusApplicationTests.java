package com.smartcampus;

import com.smartcampus.model.Facility;
import com.smartcampus.model.User;
import com.smartcampus.repository.FacilityRepository;
import com.smartcampus.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
class SmartCampusApplicationTests {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FacilityRepository facilityRepository;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
        facilityRepository.deleteAll();
    }

    @Test
    void contextLoads() {
        assertThat(userRepository).isNotNull();
        assertThat(facilityRepository).isNotNull();
    }

    @Test
    void canSaveAndFindUser() {
        User user = User.builder()
                .name("Test User")
                .email("test@sliit.lk")
                .password("hashed")
                .role(User.Role.USER)
                .provider("LOCAL")
                .build();
        userRepository.save(user);
        assertThat(userRepository.findByEmail("test@sliit.lk")).isPresent();
    }

    @Test
    void canSaveAndFindFacility() {
        Facility f = Facility.builder()
                .name("Lab A-101")
                .type(Facility.FacilityType.LAB)
                .capacity(40)
                .location("Block A")
                .status(Facility.FacilityStatus.ACTIVE)
                .build();
        facilityRepository.save(f);
        assertThat(facilityRepository.findByStatus(Facility.FacilityStatus.ACTIVE)).isNotEmpty();
    }

    @Test
    void facilityStatusFilter() {
        facilityRepository.save(Facility.builder().name("Lab Active").type(Facility.FacilityType.LAB)
                .status(Facility.FacilityStatus.ACTIVE).build());
        facilityRepository.save(Facility.builder().name("Room OOS").type(Facility.FacilityType.MEETING_ROOM)
                .status(Facility.FacilityStatus.OUT_OF_SERVICE).build());

        assertThat(facilityRepository.findByStatus(Facility.FacilityStatus.ACTIVE)).hasSize(1);
        assertThat(facilityRepository.findByStatus(Facility.FacilityStatus.OUT_OF_SERVICE)).hasSize(1);
    }
}
