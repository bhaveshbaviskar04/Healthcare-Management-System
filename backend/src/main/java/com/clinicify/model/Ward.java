package com.clinicify.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "wards")
public class Ward {

    public enum WardType {
        GENERAL, ICU, EMERGENCY, MATERNITY, PEDIATRIC, SURGICAL
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long wardId;

    @Column(nullable = false, unique = true, length = 100)
    private String wardName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private WardType wardType;

    @Column(nullable = false)
    private Integer totalBeds;

    private Integer floorNumber = 1;

    public Ward() {}

    public Long getWardId() { return wardId; }
    public void setWardId(Long wardId) { this.wardId = wardId; }

    public String getWardName() { return wardName; }
    public void setWardName(String wardName) { this.wardName = wardName; }

    public WardType getWardType() { return wardType; }
    public void setWardType(WardType wardType) { this.wardType = wardType; }

    public Integer getTotalBeds() { return totalBeds; }
    public void setTotalBeds(Integer totalBeds) { this.totalBeds = totalBeds; }

    public Integer getFloorNumber() { return floorNumber; }
    public void setFloorNumber(Integer floorNumber) { this.floorNumber = floorNumber; }
}

