package com.clinicify.service;

import com.clinicify.model.*;
import com.clinicify.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class PharmacyService {

    private final PrescriptionRepository prescriptionRepository;
    private final MedicineRepository medicineRepository;
    private final AuditService auditService;

    public PharmacyService(PrescriptionRepository prescriptionRepository,
                           MedicineRepository medicineRepository,
                           AuditService auditService) {
        this.prescriptionRepository = prescriptionRepository;
        this.medicineRepository = medicineRepository;
        this.auditService = auditService;
    }

    public List<Prescription> getPendingPrescriptions() {
        return prescriptionRepository.findByPrescriptionStatus(Prescription.PrescriptionStatus.PENDING_DISPENSING);
    }

    public List<Medicine> getAllMedicines() {
        return medicineRepository.findAll();
    }

    public List<Medicine> getLowStockAlerts() {
        return medicineRepository.findLowStockMedicines();
    }

    @Transactional
    public Prescription dispensePrescription(Long prescriptionId, User pharmacist) {
        Prescription rx = prescriptionRepository.findById(prescriptionId)
                .orElseThrow(() -> new IllegalArgumentException("Prescription not found"));

        if (rx.getPrescriptionStatus() == Prescription.PrescriptionStatus.DISPENSED) {
            throw new IllegalStateException("Prescription is already fully dispensed.");
        }

        // Deduct inventory quantities
        for (PrescriptionItem item : rx.getItems()) {
            Medicine med = item.getMedicine();
            int qtyToDispense = item.getQuantityPrescribed();

            if (med.getStockQuantity() < qtyToDispense) {
                // Partial dispensing logic
                item.setQuantityDispensed(med.getStockQuantity());
                med.setStockQuantity(0);
            } else {
                med.setStockQuantity(med.getStockQuantity() - qtyToDispense);
                item.setQuantityDispensed(qtyToDispense);
            }
            medicineRepository.save(med);
        }

        rx.setPrescriptionStatus(Prescription.PrescriptionStatus.DISPENSED);
        Prescription savedRx = prescriptionRepository.save(rx);

        auditService.log(pharmacist.getUserId(), "PRESCRIPTION_DISPENSED", "PRESCRIPTION",
                prescriptionId.toString(), "SUCCESS", "Dispensed Rx for Patient " + rx.getPatient().getFullName());

        return savedRx;
    }

    @Transactional
    public Medicine addMedicine(Medicine medicine, Long staffUserId) {
        if (medicine.getName() == null || medicine.getName().isBlank()) {
            throw new IllegalArgumentException("Medicine name is required.");
        }
        if (medicineRepository.findByNameIgnoreCase(medicine.getName().trim()).isPresent()) {
            throw new IllegalArgumentException("Medicine with name '" + medicine.getName() + "' already exists.");
        }
        if (medicine.getStockQuantity() == null || medicine.getStockQuantity() < 0) {
            medicine.setStockQuantity(0);
        }
        if (medicine.getReorderThreshold() == null || medicine.getReorderThreshold() < 0) {
            medicine.setReorderThreshold(20);
        }
        Medicine saved = medicineRepository.save(medicine);
        auditService.log(staffUserId, "MEDICINE_ADDED", "MEDICINE", saved.getMedicineId().toString(), "SUCCESS",
                "Added medicine " + saved.getName() + " with stock " + saved.getStockQuantity());
        return saved;
    }

    @Transactional
    public Medicine updateMedicine(Long medicineId, Medicine updated, Long staffUserId) {
        Medicine existing = medicineRepository.findById(medicineId)
                .orElseThrow(() -> new IllegalArgumentException("Medicine not found with ID " + medicineId));

        if (updated.getName() != null && !updated.getName().isBlank()) {
            existing.setName(updated.getName().trim());
        }
        if (updated.getStrengthForm() != null) {
            existing.setStrengthForm(updated.getStrengthForm());
        }
        if (updated.getStockQuantity() != null) {
            if (updated.getStockQuantity() < 0) {
                throw new IllegalArgumentException("Stock quantity cannot be negative.");
            }
            existing.setStockQuantity(updated.getStockQuantity());
        }
        if (updated.getReorderThreshold() != null) {
            existing.setReorderThreshold(updated.getReorderThreshold());
        }
        if (updated.getBatchNumber() != null) {
            existing.setBatchNumber(updated.getBatchNumber());
        }
        if (updated.getExpiryDate() != null) {
            existing.setExpiryDate(updated.getExpiryDate());
        }
        if (updated.getUnitPrice() != null) {
            existing.setUnitPrice(updated.getUnitPrice());
        }

        Medicine saved = medicineRepository.save(existing);
        auditService.log(staffUserId, "MEDICINE_UPDATED", "MEDICINE", saved.getMedicineId().toString(), "SUCCESS",
                "Updated medicine " + saved.getName() + " (Stock: " + saved.getStockQuantity() + ")");
        return saved;
    }
}

