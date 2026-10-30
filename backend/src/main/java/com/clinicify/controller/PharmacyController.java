package com.clinicify.controller;

import com.clinicify.model.Medicine;
import com.clinicify.model.Prescription;
import com.clinicify.model.User;
import com.clinicify.service.PharmacyService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/pharmacy")
public class PharmacyController {

    private final PharmacyService pharmacyService;

    public PharmacyController(PharmacyService pharmacyService) {
        this.pharmacyService = pharmacyService;
    }

    @GetMapping("/pending")
    public ResponseEntity<List<Prescription>> getPendingPrescriptions() {
        return ResponseEntity.ok(pharmacyService.getPendingPrescriptions());
    }

    @PostMapping("/dispense/{prescriptionId}")
    public ResponseEntity<Prescription> dispensePrescription(@PathVariable("prescriptionId") Long prescriptionId,
                                                             @AuthenticationPrincipal User pharmacist) {
        return ResponseEntity.ok(pharmacyService.dispensePrescription(prescriptionId, pharmacist));
    }

    @GetMapping("/inventory")
    public ResponseEntity<List<Medicine>> getInventory() {
        return ResponseEntity.ok(pharmacyService.getAllMedicines());
    }

    @GetMapping("/alerts")
    public ResponseEntity<List<Medicine>> getLowStockAlerts() {
        return ResponseEntity.ok(pharmacyService.getLowStockAlerts());
    }

    @PostMapping("/medicines")
    public ResponseEntity<Medicine> addMedicine(@RequestBody Medicine medicine,
                                                @AuthenticationPrincipal User user) {
        Long staffId = user != null ? user.getUserId() : 3L;
        return ResponseEntity.ok(pharmacyService.addMedicine(medicine, staffId));
    }

    @PutMapping("/medicines/{id}")
    public ResponseEntity<Medicine> updateMedicine(@PathVariable("id") Long medicineId,
                                                   @RequestBody Medicine medicine,
                                                   @AuthenticationPrincipal User user) {
        Long staffId = user != null ? user.getUserId() : 3L;
        return ResponseEntity.ok(pharmacyService.updateMedicine(medicineId, medicine, staffId));
    }
}

