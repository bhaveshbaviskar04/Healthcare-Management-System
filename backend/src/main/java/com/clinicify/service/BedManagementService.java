package com.clinicify.service;

import com.clinicify.dto.AdmissionEditRequest;
import com.clinicify.dto.BedEditRequest;
import com.clinicify.model.*;
import com.clinicify.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class BedManagementService {

    private final WardRepository wardRepository;
    private final BedRepository bedRepository;
    private final AdmissionRepository admissionRepository;
    private final BedAssignmentRepository assignmentRepository;
    private final AuditService auditService;

    public BedManagementService(WardRepository wardRepository,
                                BedRepository bedRepository,
                                AdmissionRepository admissionRepository,
                                BedAssignmentRepository assignmentRepository,
                                AuditService auditService) {
        this.wardRepository = wardRepository;
        this.bedRepository = bedRepository;
        this.admissionRepository = admissionRepository;
        this.assignmentRepository = assignmentRepository;
        this.auditService = auditService;
    }

    public List<Ward> getAllWards() {
        return wardRepository.findAll();
    }

    public List<Bed> getAllBeds() {
        return bedRepository.findAll();
    }

    public List<Admission> getPendingAdmissions() {
        return admissionRepository.findByAdmissionStatus(Admission.AdmissionStatus.REQUESTED);
    }

    @Transactional
    public BedAssignment allocateBed(Long admissionId, Long bedId, Long staffUserId) {
        Bed bed = bedRepository.findByIdWithLock(bedId)
                .orElseThrow(() -> new IllegalArgumentException("Bed not found"));

        if (bed.getBedStatus() != Bed.BedStatus.AVAILABLE) {
            throw new IllegalStateException("Bed " + bed.getBedLabel() + " is currently " + bed.getBedStatus());
        }

        Admission admission = admissionRepository.findById(admissionId)
                .orElseThrow(() -> new IllegalArgumentException("Admission request not found"));

        bed.setBedStatus(Bed.BedStatus.OCCUPIED);
        bed.setLastUpdatedAt(LocalDateTime.now());
        bedRepository.save(bed);

        BedAssignment assignment = new BedAssignment();
        assignment.setAdmission(admission);
        assignment.setBed(bed);
        assignment.setAssignedAt(LocalDateTime.now());
        assignment.setAssignmentStatus(BedAssignment.Status.ACTIVE);
        BedAssignment savedAssignment = assignmentRepository.save(assignment);

        admission.setAdmissionStatus(Admission.AdmissionStatus.ADMITTED);
        admission.setAdmittedAt(LocalDateTime.now());
        admissionRepository.save(admission);

        auditService.log(staffUserId, "BED_ALLOCATE", "BED", bedId.toString(), "SUCCESS",
                "Allocated bed " + bed.getBedLabel() + " to Patient " + admission.getPatient().getFullName());

        return savedAssignment;
    }

    @Transactional
    public BedAssignment transferBed(Long admissionId, Long newBedId, Long staffUserId) {
        Admission admission = admissionRepository.findById(admissionId)
                .orElseThrow(() -> new IllegalArgumentException("Admission not found"));

        Optional<BedAssignment> currentAssignmentOpt = assignmentRepository
                .findByAdmission_AdmissionIdAndAssignmentStatus(admissionId, BedAssignment.Status.ACTIVE);

        if (currentAssignmentOpt.isPresent()) {
            BedAssignment current = currentAssignmentOpt.get();
            current.setAssignmentStatus(BedAssignment.Status.TRANSFERRED);
            current.setReleasedAt(LocalDateTime.now());
            assignmentRepository.save(current);

            Bed oldBed = current.getBed();
            oldBed.setBedStatus(Bed.BedStatus.AVAILABLE);
            oldBed.setLastUpdatedAt(LocalDateTime.now());
            bedRepository.save(oldBed);
        }

        // Allocate the new bed
        return allocateBed(admissionId, newBedId, staffUserId);
    }

    @Transactional
    public Admission dischargePatient(Long admissionId, Long staffUserId) {
        Admission admission = admissionRepository.findById(admissionId)
                .orElseThrow(() -> new IllegalArgumentException("Admission not found"));

        Optional<BedAssignment> currentAssignmentOpt = assignmentRepository
                .findByAdmission_AdmissionIdAndAssignmentStatus(admissionId, BedAssignment.Status.ACTIVE);

        if (currentAssignmentOpt.isPresent()) {
            BedAssignment current = currentAssignmentOpt.get();
            current.setAssignmentStatus(BedAssignment.Status.DISCHARGED);
            current.setReleasedAt(LocalDateTime.now());
            assignmentRepository.save(current);

            Bed bed = current.getBed();
            bed.setBedStatus(Bed.BedStatus.AVAILABLE);
            bed.setLastUpdatedAt(LocalDateTime.now());
            bedRepository.save(bed);
        }

        admission.setAdmissionStatus(Admission.AdmissionStatus.DISCHARGED);
        admission.setDischargedAt(LocalDateTime.now());
        Admission updated = admissionRepository.save(admission);

        auditService.log(staffUserId, "PATIENT_DISCHARGED", "ADMISSION", admissionId.toString(), "SUCCESS",
                "Discharged patient " + admission.getPatient().getFullName());

        return updated;
    }

    public List<Admission> getAllAdmissions() {
        return admissionRepository.findAll();
    }

    public List<BedAssignment> getActiveAssignments() {
        return assignmentRepository.findByAssignmentStatus(BedAssignment.Status.ACTIVE);
    }

    @Transactional
    public Bed createBed(BedEditRequest request, Long staffUserId) {
        if (request.getWardId() == null) {
            throw new IllegalArgumentException("Ward ID is required");
        }
        if (request.getBedLabel() == null || request.getBedLabel().trim().isEmpty()) {
            throw new IllegalArgumentException("Bed label is required");
        }

        Ward ward = wardRepository.findById(request.getWardId())
                .orElseThrow(() -> new IllegalArgumentException("Ward not found with ID: " + request.getWardId()));

        Bed bed = new Bed();
        bed.setWard(ward);
        bed.setBedLabel(request.getBedLabel().trim().toUpperCase());
        bed.setBedStatus(request.getBedStatus() != null ? request.getBedStatus() : Bed.BedStatus.AVAILABLE);
        bed.setDailyRate(request.getDailyRate() != null ? request.getDailyRate() : BigDecimal.ZERO);
        bed.setLastUpdatedAt(LocalDateTime.now());

        Bed savedBed = bedRepository.save(bed);
        auditService.log(staffUserId, "BED_CREATED", "BED", savedBed.getBedId().toString(), "SUCCESS",
                "Created bed " + savedBed.getBedLabel() + " in ward " + ward.getWardName());
        return savedBed;
    }

    @Transactional
    public Bed updateBed(Long bedId, BedEditRequest request, Long staffUserId) {
        Bed bed = bedRepository.findByIdWithLock(bedId)
                .orElseThrow(() -> new IllegalArgumentException("Bed not found with ID: " + bedId));

        if (request.getWardId() != null && (bed.getWard() == null || !bed.getWard().getWardId().equals(request.getWardId()))) {
            Ward ward = wardRepository.findById(request.getWardId())
                    .orElseThrow(() -> new IllegalArgumentException("Ward not found with ID: " + request.getWardId()));
            bed.setWard(ward);
        }

        if (request.getBedLabel() != null && !request.getBedLabel().trim().isEmpty()) {
            bed.setBedLabel(request.getBedLabel().trim().toUpperCase());
        }

        if (request.getBedStatus() != null) {
            if (request.getBedStatus() == Bed.BedStatus.AVAILABLE && bed.getBedStatus() == Bed.BedStatus.OCCUPIED) {
                assignmentRepository.findByAssignmentStatus(BedAssignment.Status.ACTIVE).stream()
                        .filter(a -> a.getBed().getBedId().equals(bedId))
                        .findFirst()
                        .ifPresent(a -> {
                            a.setAssignmentStatus(BedAssignment.Status.DISCHARGED);
                            a.setReleasedAt(LocalDateTime.now());
                            assignmentRepository.save(a);
                            Admission adm = a.getAdmission();
                            if (adm != null && adm.getAdmissionStatus() == Admission.AdmissionStatus.ADMITTED) {
                                adm.setAdmissionStatus(Admission.AdmissionStatus.DISCHARGED);
                                adm.setDischargedAt(LocalDateTime.now());
                                admissionRepository.save(adm);
                            }
                        });
            }
            bed.setBedStatus(request.getBedStatus());
        }

        if (request.getDailyRate() != null) {
            bed.setDailyRate(request.getDailyRate());
        }

        bed.setLastUpdatedAt(LocalDateTime.now());
        Bed savedBed = bedRepository.save(bed);
        auditService.log(staffUserId, "BED_UPDATED", "BED", savedBed.getBedId().toString(), "SUCCESS",
                "Updated bed " + savedBed.getBedLabel() + " status: " + savedBed.getBedStatus());
        return savedBed;
    }

    @Transactional
    public Admission updateAdmission(Long admissionId, AdmissionEditRequest request, Long staffUserId) {
        Admission admission = admissionRepository.findById(admissionId)
                .orElseThrow(() -> new IllegalArgumentException("Admission not found with ID: " + admissionId));

        if (request.getAdministrativeNotes() != null) {
            admission.setAdministrativeNotes(request.getAdministrativeNotes());
        }

        if (request.getAdmissionStatus() != null) {
            Admission.AdmissionStatus oldStatus = admission.getAdmissionStatus();
            Admission.AdmissionStatus newStatus = request.getAdmissionStatus();
            admission.setAdmissionStatus(newStatus);

            if ((newStatus == Admission.AdmissionStatus.DISCHARGED || newStatus == Admission.AdmissionStatus.CANCELLED)
                    && oldStatus == Admission.AdmissionStatus.ADMITTED) {
                admission.setDischargedAt(LocalDateTime.now());
                Optional<BedAssignment> currentAssignmentOpt = assignmentRepository
                        .findByAdmission_AdmissionIdAndAssignmentStatus(admissionId, BedAssignment.Status.ACTIVE);
                if (currentAssignmentOpt.isPresent()) {
                    BedAssignment current = currentAssignmentOpt.get();
                    current.setAssignmentStatus(BedAssignment.Status.DISCHARGED);
                    current.setReleasedAt(LocalDateTime.now());
                    assignmentRepository.save(current);

                    Bed bed = current.getBed();
                    bed.setBedStatus(Bed.BedStatus.AVAILABLE);
                    bed.setLastUpdatedAt(LocalDateTime.now());
                    bedRepository.save(bed);
                }
            } else if (newStatus == Admission.AdmissionStatus.ADMITTED && admission.getAdmittedAt() == null) {
                admission.setAdmittedAt(LocalDateTime.now());
            }
        }

        Admission updated = admissionRepository.save(admission);
        auditService.log(staffUserId, "ADMISSION_UPDATED", "ADMISSION", admissionId.toString(), "SUCCESS",
                "Updated admission for patient " + admission.getPatient().getFullName() + " to " + admission.getAdmissionStatus());
        return updated;
    }
}

