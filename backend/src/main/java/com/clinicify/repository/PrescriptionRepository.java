package com.clinicify.repository;

import com.clinicify.model.Prescription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PrescriptionRepository extends JpaRepository<Prescription, Long> {
    List<Prescription> findByPrescriptionStatus(Prescription.PrescriptionStatus status);
    List<Prescription> findByPatient_PatientIdOrderByCreatedAtDesc(Long patientId);
}

