package com.clinicify.dto;

public class BedAllocationRequest {
    private Long admissionId;
    private Long bedId;
    private String notes;

    public BedAllocationRequest() {}

    public Long getAdmissionId() { return admissionId; }
    public void setAdmissionId(Long admissionId) { this.admissionId = admissionId; }

    public Long getBedId() { return bedId; }
    public void setBedId(Long bedId) { this.bedId = bedId; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}

