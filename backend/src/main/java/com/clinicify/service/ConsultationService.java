package com.clinicify.service;

import com.clinicify.dto.PrescriptionRequest;
import com.clinicify.model.*;
import com.clinicify.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class ConsultationService {

    private final ConsultationRepository consultationRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final PrescriptionItemRepository prescriptionItemRepository;
    private final MedicineRepository medicineRepository;
    private final VisitRepository visitRepository;
    private final AdmissionRepository admissionRepository;
    private final AuditService auditService;

    public ConsultationService(ConsultationRepository consultationRepository,
                               PrescriptionRepository prescriptionRepository,
                               PrescriptionItemRepository prescriptionItemRepository,
                               MedicineRepository medicineRepository,
                               VisitRepository visitRepository,
                               AdmissionRepository admissionRepository,
                               AuditService auditService) {
        this.consultationRepository = consultationRepository;
        this.prescriptionRepository = prescriptionRepository;
        this.prescriptionItemRepository = prescriptionItemRepository;
        this.medicineRepository = medicineRepository;
        this.visitRepository = visitRepository;
        this.admissionRepository = admissionRepository;
        this.auditService = auditService;
    }

    @Transactional
    public Prescription createPrescription(PrescriptionRequest req, User doctor) {
        Visit visit = visitRepository.findById(req.getVisitId())
                .orElseThrow(() -> new IllegalArgumentException("Visit not found"));

        if (consultationRepository.findByVisit_VisitId(req.getVisitId()).isPresent()) {
            throw new IllegalStateException("Consultation has already been recorded for Visit #" + req.getVisitId() + ". Please register a follow-up visit for new consultations.");
        }

        // 1. Create and Save Consultation
        Consultation consultation = new Consultation();
        consultation.setVisit(visit);
        consultation.setDoctor(doctor);
        consultation.setSymptoms(req.getSymptoms());
        consultation.setDiagnosis(req.getDiagnosis());
        consultation.setClinicalNotes(req.getClinicalNotes());
        consultation.setRecommendedAdmission(Boolean.TRUE.equals(req.getRecommendAdmission()));
        consultation.setEndTime(LocalDateTime.now());
        Consultation savedConsultation = consultationRepository.save(consultation);

        // 2. Create Prescription
        Prescription prescription = new Prescription();
        prescription.setConsultation(savedConsultation);
        prescription.setPatient(visit.getPatient());
        prescription.setDoctor(doctor);
        prescription.setPrescriptionStatus(Prescription.PrescriptionStatus.PENDING_DISPENSING);
        Prescription savedPrescription = prescriptionRepository.save(prescription);

        // 3. Save Prescription Items
        if (req.getItems() != null && !req.getItems().isEmpty()) {
            for (PrescriptionRequest.ItemDto itemDto : req.getItems()) {
                Medicine med = medicineRepository.findByNameIgnoreCase(itemDto.getMedicineName())
                        .orElseGet(() -> {
                            Medicine newMed = new Medicine();
                            newMed.setName(itemDto.getMedicineName());
                            newMed.setStrengthForm("Tablet/Standard");
                            newMed.setStockQuantity(100); // Default stock for prototype convenience
                            return medicineRepository.save(newMed);
                        });

                PrescriptionItem item = new PrescriptionItem();
                item.setPrescription(savedPrescription);
                item.setMedicine(med);
                item.setDosage(itemDto.getDosage() != null ? itemDto.getDosage() : "1 Tablet");
                item.setFrequency(itemDto.getFrequency() != null ? itemDto.getFrequency() : "1-0-1");
                item.setDuration(itemDto.getDuration() != null ? itemDto.getDuration() : "5 Days");
                item.setQuantityPrescribed(itemDto.getQuantity() != null ? itemDto.getQuantity() : 10);
                item.setSpecialInstructions(itemDto.getInstructions());
                prescriptionItemRepository.save(item);
                savedPrescription.getItems().add(item);
            }
        }

        // 4. Handle Admission Recommendation if requested
        if (Boolean.TRUE.equals(req.getRecommendAdmission())) {
            Admission admission = new Admission();
            admission.setPatient(visit.getPatient());
            admission.setAdmittingDoctor(doctor);
            admission.setReferringVisit(visit);
            admission.setAdmissionStatus(Admission.AdmissionStatus.REQUESTED);
            admission.setAdministrativeNotes("Recommended during OPD Consultation for diagnosis: " + req.getDiagnosis());
            admissionRepository.save(admission);
        }

        visit.setVisitStatus(Visit.VisitStatus.PHARMACY_PENDING);
        visitRepository.save(visit);

        auditService.log(doctor.getUserId(), "PRESCRIPTION_ISSUED", "PRESCRIPTION",
                savedPrescription.getPrescriptionId().toString(), "SUCCESS",
                "Issued Rx with " + savedPrescription.getItems().size() + " items for Patient " + visit.getPatient().getFullName());

        return savedPrescription;
    }
}

