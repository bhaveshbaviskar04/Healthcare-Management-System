package com.clinicify.dto;

import com.clinicify.model.Admission;

public class AdmissionEditRequest {
    private Admission.AdmissionStatus admissionStatus;
    private String administrativeNotes;

    public AdmissionEditRequest() {}

    public Admission.AdmissionStatus getAdmissionStatus() { return admissionStatus; }
    public void setAdmissionStatus(Admission.AdmissionStatus admissionStatus) { this.admissionStatus = admissionStatus; }

    public String getAdministrativeNotes() { return administrativeNotes; }
    public void setAdministrativeNotes(String administrativeNotes) { this.administrativeNotes = administrativeNotes; }
}

