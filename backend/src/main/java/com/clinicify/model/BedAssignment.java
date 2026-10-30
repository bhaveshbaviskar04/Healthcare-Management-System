package com.clinicify.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "bed_assignments")
public class BedAssignment {

    public enum Status {
        ACTIVE, TRANSFERRED, DISCHARGED
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long assignmentId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "admission_id", nullable = false)
    private Admission admission;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "bed_id", nullable = false)
    private Bed bed;

    @Column(nullable = false)
    private LocalDateTime assignedAt = LocalDateTime.now();

    private LocalDateTime releasedAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Status assignmentStatus = Status.ACTIVE;

    private String notes;

    public BedAssignment() {}

    public Long getAssignmentId() { return assignmentId; }
    public void setAssignmentId(Long assignmentId) { this.assignmentId = assignmentId; }

    public Admission getAdmission() { return admission; }
    public void setAdmission(Admission admission) { this.admission = admission; }

    public Bed getBed() { return bed; }
    public void setBed(Bed bed) { this.bed = bed; }

    public LocalDateTime getAssignedAt() { return assignedAt; }
    public void setAssignedAt(LocalDateTime assignedAt) { this.assignedAt = assignedAt; }

    public LocalDateTime getReleasedAt() { return releasedAt; }
    public void setReleasedAt(LocalDateTime releasedAt) { this.releasedAt = releasedAt; }

    public Status getAssignmentStatus() { return assignmentStatus; }
    public void setAssignmentStatus(Status assignmentStatus) { this.assignmentStatus = assignmentStatus; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}

