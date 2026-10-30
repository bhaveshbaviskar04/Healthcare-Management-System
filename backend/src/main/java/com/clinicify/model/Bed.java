package com.clinicify.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "beds", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"ward_id", "bedLabel"})
})
public class Bed {

    public enum BedStatus {
        AVAILABLE, RESERVED, OCCUPIED, OUT_OF_SERVICE
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long bedId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "ward_id", nullable = false)
    private Ward ward;

    @Column(nullable = false, length = 20)
    private String bedLabel;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private BedStatus bedStatus = BedStatus.AVAILABLE;

    private BigDecimal dailyRate = BigDecimal.ZERO;

    private LocalDateTime lastUpdatedAt = LocalDateTime.now();

    public Bed() {}

    public Long getBedId() { return bedId; }
    public void setBedId(Long bedId) { this.bedId = bedId; }

    public Ward getWard() { return ward; }
    public void setWard(Ward ward) { this.ward = ward; }

    public String getBedLabel() { return bedLabel; }
    public void setBedLabel(String bedLabel) { this.bedLabel = bedLabel; }

    public BedStatus getBedStatus() { return bedStatus; }
    public void setBedStatus(BedStatus bedStatus) { this.bedStatus = bedStatus; }

    public BigDecimal getDailyRate() { return dailyRate; }
    public void setDailyRate(BigDecimal dailyRate) { this.dailyRate = dailyRate; }

    public LocalDateTime getLastUpdatedAt() { return lastUpdatedAt; }
    public void setLastUpdatedAt(LocalDateTime lastUpdatedAt) { this.lastUpdatedAt = lastUpdatedAt; }
}

