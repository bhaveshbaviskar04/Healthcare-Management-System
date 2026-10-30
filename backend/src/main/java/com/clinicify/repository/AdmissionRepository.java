package com.clinicify.repository;

import com.clinicify.model.Admission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AdmissionRepository extends JpaRepository<Admission, Long> {
    List<Admission> findByAdmissionStatus(Admission.AdmissionStatus status);
    List<Admission> findByPatient_PatientId(Long patientId);
}

