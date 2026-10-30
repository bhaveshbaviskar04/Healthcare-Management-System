package com.clinicify.repository;

import com.clinicify.model.BedAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BedAssignmentRepository extends JpaRepository<BedAssignment, Long> {
    Optional<BedAssignment> findByAdmission_AdmissionIdAndAssignmentStatus(Long admissionId, BedAssignment.Status status);
    List<BedAssignment> findByAssignmentStatus(BedAssignment.Status status);
}

