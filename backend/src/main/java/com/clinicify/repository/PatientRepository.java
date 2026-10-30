package com.clinicify.repository;

import com.clinicify.model.Patient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PatientRepository extends JpaRepository<Patient, Long> {
    List<Patient> findByPhoneContaining(String phone);
    List<Patient> findByFullNameContainingIgnoreCase(String fullName);
    Optional<Patient> findByUser_UserId(Long userId);
}

