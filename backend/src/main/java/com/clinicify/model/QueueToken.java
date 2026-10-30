package com.clinicify.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "queue_tokens", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"tokenNumber", "queueDate"})
})
public class QueueToken {

    public enum QueueStatus {
        WAITING, CALLED, IN_CONSULTATION, COMPLETED, CANCELLED, NO_SHOW
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long tokenId;

    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "visit_id", nullable = false, unique = true)
    private Visit visit;

    @Column(nullable = false)
    private Integer tokenNumber;

    @Column(nullable = false)
    private LocalDate queueDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private QueueStatus queueStatus = QueueStatus.WAITING;

    @Column(nullable = false)
    private Boolean priorityFlag = false;

    private String priorityReason;

    private Integer estimatedWaitingMinutes = 0;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    private LocalDateTime calledAt;
    private LocalDateTime consultationStartedAt;
    private LocalDateTime completedAt;

    public QueueToken() {}

    public Long getTokenId() { return tokenId; }
    public void setTokenId(Long tokenId) { this.tokenId = tokenId; }

    public Visit getVisit() { return visit; }
    public void setVisit(Visit visit) { this.visit = visit; }

    public Integer getTokenNumber() { return tokenNumber; }
    public void setTokenNumber(Integer tokenNumber) { this.tokenNumber = tokenNumber; }

    public LocalDate getQueueDate() { return queueDate; }
    public void setQueueDate(LocalDate queueDate) { this.queueDate = queueDate; }

    public QueueStatus getQueueStatus() { return queueStatus; }
    public void setQueueStatus(QueueStatus queueStatus) { this.queueStatus = queueStatus; }

    public Boolean getPriorityFlag() { return priorityFlag; }
    public void setPriorityFlag(Boolean priorityFlag) { this.priorityFlag = priorityFlag; }

    public String getPriorityReason() { return priorityReason; }
    public void setPriorityReason(String priorityReason) { this.priorityReason = priorityReason; }

    public Integer getEstimatedWaitingMinutes() { return estimatedWaitingMinutes; }
    public void setEstimatedWaitingMinutes(Integer estimatedWaitingMinutes) { this.estimatedWaitingMinutes = estimatedWaitingMinutes; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getCalledAt() { return calledAt; }
    public void setCalledAt(LocalDateTime calledAt) { this.calledAt = calledAt; }

    public LocalDateTime getConsultationStartedAt() { return consultationStartedAt; }
    public void setConsultationStartedAt(LocalDateTime consultationStartedAt) { this.consultationStartedAt = consultationStartedAt; }

    public LocalDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }
}

