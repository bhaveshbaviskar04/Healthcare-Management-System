package com.clinicify.service;

import com.clinicify.dto.TokenIssueRequest;
import com.clinicify.model.Patient;
import com.clinicify.model.QueueToken;
import com.clinicify.model.Visit;
import com.clinicify.repository.PatientRepository;
import com.clinicify.repository.QueueTokenRepository;
import com.clinicify.repository.VisitRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class QueueService {

    private final QueueTokenRepository tokenRepository;
    private final VisitRepository visitRepository;
    private final PatientRepository patientRepository;
    private final WaitTimePredictionService predictionService;
    private final AuditService auditService;

    public QueueService(QueueTokenRepository tokenRepository,
                        VisitRepository visitRepository,
                        PatientRepository patientRepository,
                        WaitTimePredictionService predictionService,
                        AuditService auditService) {
        this.tokenRepository = tokenRepository;
        this.visitRepository = visitRepository;
        this.patientRepository = patientRepository;
        this.predictionService = predictionService;
        this.auditService = auditService;
    }

    @Transactional
    public QueueToken generateToken(TokenIssueRequest req, Long staffUserId) {
        Patient patient = patientRepository.findById(req.getPatientId())
                .orElseThrow(() -> new IllegalArgumentException("Patient not found"));

        LocalDate today = LocalDate.now();

        // 1. Create Visit Record
        Visit visit = new Visit();
        visit.setPatient(patient);
        visit.setVisitDate(today);
        visit.setDepartment(req.getDepartment() != null ? req.getDepartment() : "General Medicine");
        visit.setVisitStatus(Visit.VisitStatus.IN_QUEUE);
        Visit savedVisit = visitRepository.save(visit);

        // 2. Determine Next Daily Token Number
        Integer maxToken = tokenRepository.findMaxTokenNumber(today);
        int nextTokenNumber = (maxToken == null || maxToken < 100) ? 101 : maxToken + 1;

        // 3. Issue Token
        QueueToken token = new QueueToken();
        token.setVisit(savedVisit);
        token.setTokenNumber(nextTokenNumber);
        token.setQueueDate(today);
        token.setQueueStatus(QueueToken.QueueStatus.WAITING);
        token.setPriorityFlag(Boolean.TRUE.equals(req.getPriority()));
        token.setPriorityReason(req.getPriorityReason());
        QueueToken savedToken = tokenRepository.save(token);

        // 4. Calculate initial estimated waiting time
        int waitTime = predictionService.calculateEstimatedWait(savedToken);
        savedToken.setEstimatedWaitingMinutes(waitTime);
        savedToken = tokenRepository.save(savedToken);

        auditService.log(staffUserId, "TOKEN_GENERATE", "QUEUE_TOKEN", savedToken.getTokenId().toString(), "SUCCESS",
                "Generated Token #" + nextTokenNumber + " for Patient " + patient.getFullName());

        return savedToken;
    }

    public List<QueueToken> getTodayQueue() {
        LocalDate today = LocalDate.now();
        List<QueueToken> tokens = tokenRepository.findByQueueDateOrderByPriorityFlagDescTokenNumberAsc(today);
        for (QueueToken token : tokens) {
            token.setEstimatedWaitingMinutes(predictionService.calculateEstimatedWait(token));
        }
        return tokens;
    }

    @Transactional
    public QueueToken callNextToken(Long doctorUserId) {
        LocalDate today = LocalDate.now();

        // Find the next eligible WAITING token (prioritizing emergency cases, then earliest token number)
        Optional<QueueToken> nextTokenOpt = tokenRepository
                .findFirstByQueueDateAndQueueStatusOrderByPriorityFlagDescTokenNumberAsc(today, QueueToken.QueueStatus.WAITING);

        if (nextTokenOpt.isEmpty()) {
            throw new IllegalStateException("No patients currently waiting in queue.");
        }

        QueueToken token = nextTokenOpt.get();
        token.setQueueStatus(QueueToken.QueueStatus.CALLED);
        token.setCalledAt(LocalDateTime.now());
        token.setConsultationStartedAt(LocalDateTime.now());

        // Update parent visit
        token.getVisit().setVisitStatus(Visit.VisitStatus.IN_CONSULTATION);
        visitRepository.save(token.getVisit());

        QueueToken updated = tokenRepository.save(token);
        auditService.log(doctorUserId, "TOKEN_CALLED", "QUEUE_TOKEN", updated.getTokenId().toString(), "SUCCESS",
                "Called Token #" + updated.getTokenNumber() + " into doctor cabin");

        return updated;
    }

    @Transactional
    public QueueToken setPriority(Long tokenId, String reason, Long staffUserId) {
        QueueToken token = tokenRepository.findById(tokenId)
                .orElseThrow(() -> new IllegalArgumentException("Token not found"));

        token.setPriorityFlag(true);
        token.setPriorityReason(reason);
        QueueToken updated = tokenRepository.save(token);

        auditService.log(staffUserId, "PRIORITY_OVERRIDE", "QUEUE_TOKEN", tokenId.toString(), "SUCCESS",
                "Marked Priority with reason: " + reason);

        return updated;
    }

    @Transactional
    public QueueToken completeToken(Long tokenId, Long doctorUserId) {
        QueueToken token = tokenRepository.findById(tokenId)
                .orElseThrow(() -> new IllegalArgumentException("Token not found"));

        token.setQueueStatus(QueueToken.QueueStatus.COMPLETED);
        token.setCompletedAt(LocalDateTime.now());
        token.getVisit().setVisitStatus(Visit.VisitStatus.COMPLETED);
        visitRepository.save(token.getVisit());

        QueueToken updated = tokenRepository.save(token);
        auditService.log(doctorUserId, "TOKEN_COMPLETED", "QUEUE_TOKEN", tokenId.toString(), "SUCCESS",
                "Completed Consultation for Token #" + updated.getTokenNumber());

        return updated;
    }

    public void applyDoctorDelay(int delayMinutes, String reason, Long staffUserId) {
        predictionService.setDoctorDelay(delayMinutes, reason);
        auditService.log(staffUserId, "DOCTOR_DELAY", "QUEUE", "GLOBAL", "SUCCESS",
                "Applied Doctor Delay: +" + delayMinutes + " mins. Reason: " + reason);
    }

    public void clearDoctorDelay(Long staffUserId) {
        predictionService.clearDoctorDelay();
        auditService.log(staffUserId, "DELAY_CLEARED", "QUEUE", "GLOBAL", "SUCCESS",
                "Doctor delay cleared; Queue back on regular schedule.");
    }

    public java.util.Map<String, Object> getActiveDelay() {
        java.util.Map<String, Object> delayInfo = new java.util.HashMap<>();
        delayInfo.put("delayMinutes", predictionService.getCurrentDoctorDelayMinutes());
        delayInfo.put("reason", predictionService.getDoctorDelayReason());
        delayInfo.put("hasDelay", predictionService.getCurrentDoctorDelayMinutes() > 0);
        return delayInfo;
    }
}

