package com.clinicify.controller;

import com.clinicify.dto.PrescriptionRequest;
import com.clinicify.model.Prescription;
import com.clinicify.model.User;
import com.clinicify.repository.PrescriptionRepository;
import com.clinicify.service.ConsultationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/clinical")
public class ConsultationController {

    private final ConsultationService consultationService;
    private final PrescriptionRepository prescriptionRepository;

    public ConsultationController(ConsultationService consultationService,
                                  PrescriptionRepository prescriptionRepository) {
        this.consultationService = consultationService;
        this.prescriptionRepository = prescriptionRepository;
    }

    @PostMapping("/prescriptions")
    public ResponseEntity<Prescription> createPrescription(@RequestBody PrescriptionRequest request,
                                                           @AuthenticationPrincipal User doctor) {
        return ResponseEntity.ok(consultationService.createPrescription(request, doctor));
    }

    @GetMapping("/patient/{patientId}/prescriptions")
    public ResponseEntity<List<Prescription>> getPatientPrescriptions(@PathVariable("patientId") Long patientId) {
        return ResponseEntity.ok(prescriptionRepository.findByPatient_PatientIdOrderByCreatedAtDesc(patientId));
    }
}

