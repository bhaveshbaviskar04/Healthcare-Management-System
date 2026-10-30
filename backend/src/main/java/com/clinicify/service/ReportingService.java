package com.clinicify.service;

import com.clinicify.model.Bed;
import com.clinicify.model.Prescription;
import com.clinicify.model.QueueToken;
import com.clinicify.repository.*;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class ReportingService {

    private final VisitRepository visitRepository;
    private final QueueTokenRepository tokenRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final BedRepository bedRepository;
    private final MedicineRepository medicineRepository;
    private final AuditLogRepository auditLogRepository;
    private final WaitTimePredictionService predictionService;

    public ReportingService(VisitRepository visitRepository,
                            QueueTokenRepository tokenRepository,
                            PrescriptionRepository prescriptionRepository,
                            BedRepository bedRepository,
                            MedicineRepository medicineRepository,
                            AuditLogRepository auditLogRepository,
                            WaitTimePredictionService predictionService) {
        this.visitRepository = visitRepository;
        this.tokenRepository = tokenRepository;
        this.prescriptionRepository = prescriptionRepository;
        this.bedRepository = bedRepository;
        this.medicineRepository = medicineRepository;
        this.auditLogRepository = auditLogRepository;
        this.predictionService = predictionService;
    }

    public Map<String, Object> getDailyOperationalSummary() {
        LocalDate today = LocalDate.now();
        Map<String, Object> summary = new HashMap<>();

        // 1. Visit & Queue throughput metrics
        List<QueueToken> todayTokens = tokenRepository.findByQueueDateOrderByPriorityFlagDescTokenNumberAsc(today);
        long waitingCount = todayTokens.stream().filter(t -> t.getQueueStatus() == QueueToken.QueueStatus.WAITING).count();
        long inConsultationCount = todayTokens.stream().filter(t -> t.getQueueStatus() == QueueToken.QueueStatus.IN_CONSULTATION || t.getQueueStatus() == QueueToken.QueueStatus.CALLED).count();
        long completedCount = todayTokens.stream().filter(t -> t.getQueueStatus() == QueueToken.QueueStatus.COMPLETED).count();

        double avgWait = todayTokens.stream()
                .filter(t -> t.getQueueStatus() == QueueToken.QueueStatus.WAITING)
                .mapToInt(predictionService::calculateEstimatedWait)
                .average()
                .orElse(0.0);

        summary.put("todayTotalTokens", todayTokens.size());
        summary.put("waitingCount", waitingCount);
        summary.put("inConsultationCount", inConsultationCount);
        summary.put("completedCount", completedCount);
        summary.put("averageWaitTimeMinutes", Math.round(avgWait * 10.0) / 10.0);

        // 2. Inpatient Bed metrics
        List<Bed> allBeds = bedRepository.findAll();
        long occupiedBeds = allBeds.stream().filter(b -> b.getBedStatus() == Bed.BedStatus.OCCUPIED).count();
        long availableBeds = allBeds.stream().filter(b -> b.getBedStatus() == Bed.BedStatus.AVAILABLE).count();
        long reservedBeds = allBeds.stream().filter(b -> b.getBedStatus() == Bed.BedStatus.RESERVED).count();
        double occupancyRate = allBeds.isEmpty() ? 0.0 : ((double) occupiedBeds / allBeds.size()) * 100.0;

        summary.put("totalBeds", allBeds.size());
        summary.put("occupiedBeds", occupiedBeds);
        summary.put("availableBeds", availableBeds);
        summary.put("reservedBeds", reservedBeds);
        summary.put("bedOccupancyRate", Math.round(occupancyRate * 10.0) / 10.0);

        // 3. Pharmacy & Inventory metrics
        long lowStockCount = medicineRepository.findLowStockMedicines().size();
        long dispensedRxCount = prescriptionRepository.findByPrescriptionStatus(Prescription.PrescriptionStatus.DISPENSED).size();
        long pendingRxCount = prescriptionRepository.findByPrescriptionStatus(Prescription.PrescriptionStatus.PENDING_DISPENSING).size();

        summary.put("lowStockCount", lowStockCount);
        summary.put("dispensedRxCount", dispensedRxCount);
        summary.put("pendingRxCount", pendingRxCount);

        // 4. Delay & Audit info
        summary.put("doctorDelayMinutes", predictionService.getCurrentDoctorDelayMinutes());
        summary.put("doctorDelayReason", predictionService.getDoctorDelayReason());
        summary.put("recentAuditLogs", auditLogRepository.findTop50ByOrderByTimestampDesc().stream().limit(12).toList());

        return summary;
    }
}

