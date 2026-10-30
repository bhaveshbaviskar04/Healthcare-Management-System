package com.clinicify.dto;

import com.clinicify.model.Bed;
import java.math.BigDecimal;

public class BedEditRequest {
    private Long wardId;
    private String bedLabel;
    private Bed.BedStatus bedStatus;
    private BigDecimal dailyRate;

    public BedEditRequest() {}

    public Long getWardId() { return wardId; }
    public void setWardId(Long wardId) { this.wardId = wardId; }

    public String getBedLabel() { return bedLabel; }
    public void setBedLabel(String bedLabel) { this.bedLabel = bedLabel; }

    public Bed.BedStatus getBedStatus() { return bedStatus; }
    public void setBedStatus(Bed.BedStatus bedStatus) { this.bedStatus = bedStatus; }

    public BigDecimal getDailyRate() { return dailyRate; }
    public void setDailyRate(BigDecimal dailyRate) { this.dailyRate = dailyRate; }
}

