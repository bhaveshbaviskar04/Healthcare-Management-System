package com.clinicify.service;

import com.clinicify.model.QueueToken;
import com.clinicify.repository.QueueTokenRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class WaitTimePredictionService {

    @Value("${clinicify.queue.average-consultation-minutes:12}")
    private int avgConsultationMinutes;

    private int currentDoctorDelayMinutes = 0;
    private String doctorDelayReason = "";

    private final QueueTokenRepository tokenRepository;

    public WaitTimePredictionService(QueueTokenRepository tokenRepository) {
        this.tokenRepository = tokenRepository;
    }

    public int getCurrentDoctorDelayMinutes() {
        return currentDoctorDelayMinutes;
    }

    public String getDoctorDelayReason() {
        return doctorDelayReason;
    }

    public void setDoctorDelay(int delayMinutes, String reason) {
        this.currentDoctorDelayMinutes = Math.max(0, delayMinutes);
        this.doctorDelayReason = reason != null ? reason : "Doctor Delayed";
    }

    public void clearDoctorDelay() {
        this.currentDoctorDelayMinutes = 0;
        this.doctorDelayReason = "";
    }

    /**
     * Predictive waiting time formula from Section 9 & FR-06 of Clinicify Specification:
     * Estimated wait = remaining active consultation time + (patients ahead * avg duration) + doctor delay
     */
    public int calculateEstimatedWait(QueueToken targetToken) {
        if (targetToken.getQueueStatus() != QueueToken.QueueStatus.WAITING) {
            return 0;
        }

        LocalDate today = targetToken.getQueueDate();

        // 1. Calculate remaining time for the patient currently in consultation
        int remainingActiveMinutes = 0;
        Optional<QueueToken> activeTokenOpt = tokenRepository.findByQueueDateAndQueueStatus(today, QueueToken.QueueStatus.IN_CONSULTATION);
        if (activeTokenOpt.isPresent()) {
            QueueToken activeToken = activeTokenOpt.get();
            if (activeToken.getConsultationStartedAt() != null) {
                long minutesElapsed = Duration.between(activeToken.getConsultationStartedAt(), LocalDateTime.now()).toMinutes();
                remainingActiveMinutes = Math.max(0, avgConsultationMinutes - (int) minutesElapsed);
            } else {
                remainingActiveMinutes = avgConsultationMinutes;
            }
        }

        // 2. Count eligible patients ahead in priority-aware FIFO sequence
        List<QueueToken> waitingQueue = tokenRepository.findActiveWaitingQueue(today, QueueToken.QueueStatus.WAITING);
        int patientsAhead = 0;
        for (QueueToken token : waitingQueue) {
            if (token.getTokenId().equals(targetToken.getTokenId())) {
                break;
            }
            patientsAhead++;
        }

        return remainingActiveMinutes + (patientsAhead * avgConsultationMinutes) + currentDoctorDelayMinutes;
    }
}
