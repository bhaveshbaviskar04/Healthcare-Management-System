package com.clinicify.controller;

import com.clinicify.dto.AdmissionEditRequest;
import com.clinicify.dto.BedAllocationRequest;
import com.clinicify.dto.BedEditRequest;
import com.clinicify.model.*;
import com.clinicify.service.BedManagementService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/inpatient")
public class BedManagementController {

    private final BedManagementService bedManagementService;

    public BedManagementController(BedManagementService bedManagementService) {
        this.bedManagementService = bedManagementService;
    }

    @GetMapping("/wards")
    public ResponseEntity<List<Ward>> getWards() {
        return ResponseEntity.ok(bedManagementService.getAllWards());
    }

    @GetMapping("/beds")
    public ResponseEntity<List<Bed>> getBeds() {
        return ResponseEntity.ok(bedManagementService.getAllBeds());
    }

    @GetMapping("/active-assignments")
    public ResponseEntity<List<BedAssignment>> getActiveAssignments() {
        return ResponseEntity.ok(bedManagementService.getActiveAssignments());
    }

    @GetMapping("/pending-admissions")
    public ResponseEntity<List<Admission>> getPendingAdmissions() {
        return ResponseEntity.ok(bedManagementService.getPendingAdmissions());
    }

    @GetMapping("/admissions")
    public ResponseEntity<List<Admission>> getAllAdmissions() {
        return ResponseEntity.ok(bedManagementService.getAllAdmissions());
    }

    @PostMapping("/beds")
    public ResponseEntity<?> createBed(@RequestBody BedEditRequest request,
                                       @AuthenticationPrincipal User user) {
        if (user == null || user.getRole() != User.Role.RECEPTIONIST) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Access denied: Only receptionists can create beds.");
        }
        return ResponseEntity.ok(bedManagementService.createBed(request, user.getUserId()));
    }

    @PutMapping("/beds/{bedId}")
    public ResponseEntity<?> updateBed(@PathVariable("bedId") Long bedId,
                                       @RequestBody BedEditRequest request,
                                       @AuthenticationPrincipal User user) {
        if (user == null || user.getRole() != User.Role.RECEPTIONIST) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Access denied: Only receptionists can edit beds.");
        }
        return ResponseEntity.ok(bedManagementService.updateBed(bedId, request, user.getUserId()));
    }

    @PutMapping("/admissions/{admissionId}")
    public ResponseEntity<?> updateAdmission(@PathVariable("admissionId") Long admissionId,
                                             @RequestBody AdmissionEditRequest request,
                                             @AuthenticationPrincipal User user) {
        if (user == null || user.getRole() != User.Role.RECEPTIONIST) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Access denied: Only receptionists can edit inpatient records.");
        }
        return ResponseEntity.ok(bedManagementService.updateAdmission(admissionId, request, user.getUserId()));
    }

    @PostMapping("/allocate")
    public ResponseEntity<BedAssignment> allocateBed(@RequestBody BedAllocationRequest request,
                                                     @AuthenticationPrincipal User user) {
        Long staffId = user != null ? user.getUserId() : 1L;
        return ResponseEntity.ok(bedManagementService.allocateBed(request.getAdmissionId(), request.getBedId(), staffId));
    }

    @PostMapping("/transfer")
    public ResponseEntity<BedAssignment> transferBed(@RequestBody BedAllocationRequest request,
                                                     @AuthenticationPrincipal User user) {
        Long staffId = user != null ? user.getUserId() : 1L;
        return ResponseEntity.ok(bedManagementService.transferBed(request.getAdmissionId(), request.getBedId(), staffId));
    }

    @PostMapping("/discharge/{admissionId}")
    public ResponseEntity<Admission> dischargePatient(@PathVariable("admissionId") Long admissionId,
                                                      @AuthenticationPrincipal User user) {
        Long staffId = user != null ? user.getUserId() : 1L;
        return ResponseEntity.ok(bedManagementService.dischargePatient(admissionId, staffId));
    }
}
