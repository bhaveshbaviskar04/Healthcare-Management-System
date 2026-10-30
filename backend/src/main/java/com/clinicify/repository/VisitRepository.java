package com.clinicify.repository;

import com.clinicify.model.Visit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface VisitRepository extends JpaRepository<Visit, Long> {
    List<Visit> findByPatient_PatientId(Long patientId);
    List<Visit> findByVisitDate(LocalDate visitDate);
}

