package com.clinicify.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "admissions")
public class Admission {

    public enum AdmissionStatus {
        REQUESTED, APPROVED, ADMITTED, TRANSFERRED, DISCHARGED, CANCELLED
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long admissionId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "admitting_doctor_id", nullable = false)
    private User admittingDoctor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "referring_visit_id")
    private Visit referringVisit;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AdmissionStatus admissionStatus = AdmissionStatus.REQUESTED;

    private LocalDateTime admittedAt;
    private LocalDateTime dischargedAt;

    @Column(columnDefinition = "TEXT")
    private String administrativeNotes;

    public Admission() {}

    public Long getAdmissionId() { return admissionId; }
    public void setAdmissionId(Long admissionId) { this.admissionId = admissionId; }

    public Patient getPatient() { return patient; }
    public void setPatient(Patient patient) { this.patient = patient; }

    public User getAdmittingDoctor() { return admittingDoctor; }
    public void setAdmittingDoctor(User admittingDoctor) { this.admittingDoctor = admittingDoctor; }

    public Visit getReferringVisit() { return referringVisit; }
    public void setReferringVisit(Visit referringVisit) { this.referringVisit = referringVisit; }

    public AdmissionStatus getAdmissionStatus() { return admissionStatus; }
    public void setAdmissionStatus(AdmissionStatus admissionStatus) { this.admissionStatus = admissionStatus; }

    public LocalDateTime getAdmittedAt() { return admittedAt; }
    public void setAdmittedAt(LocalDateTime admittedAt) { this.admittedAt = admittedAt; }

    public LocalDateTime getDischargedAt() { return dischargedAt; }
    public void setDischargedAt(LocalDateTime dischargedAt) { this.dischargedAt = dischargedAt; }

    public String getAdministrativeNotes() { return administrativeNotes; }
    public void setAdministrativeNotes(String administrativeNotes) { this.administrativeNotes = administrativeNotes; }
}

