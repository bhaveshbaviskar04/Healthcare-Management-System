# Clinicify — System Architecture & Design

> Technical architecture specification for the Clinicify Smart Hospital Management System.

---

## 1. High-Level Architecture Overview

Clinicify is structured around a modern 3-tier decoupled architecture:
1. **Presentation Layer (React 18 + Vite + Tailwind CSS)**: Single-Page Application (SPA) providing role-tailored dashboards and a fullscreen real-time waiting hall monitor.
2. **Business & API Layer (Spring Boot 3 + Spring Security + JJWT)**: Stateless REST API managing business rules, queue algorithms, transactional integrity, and role-based access control.
3. **Data Layer (MySQL 8.0 / InnoDB)**: Relational database with strict foreign-key constraints, row-level locking for resource allocation, and audit trails.

```mermaid
graph TD
    subgraph Clients ["Presentation Tier (React Vite SPA)"]
        REC["Receptionist Dashboard"]
        DOC["Doctor Consultation Hub"]
        PHARM["Pharmacy & Inventory Portal"]
        PAT["Patient Self-Service Portal"]
        TV["Waiting Hall Public Display (:5173/display)"]
    end

    subgraph Gateway ["Security & API Gateway (Port 8080)"]
        AUTH_FILTER["JwtAuthFilter (Bearer Token Interceptor)"]
        SEC_CFG["Spring Security (RBAC Engine)"]
    end

    subgraph Services ["Application Services Layer"]
        Q_SVC["QueueService & WaitTimePredictionService"]
        BED_SVC["BedManagementService (Row-Level Locking)"]
        CONS_SVC["Consultation & Prescription Service"]
        PHARM_SVC["Pharmacy & Stock Service"]
        AUD_SVC["AuditService (Asynchronous Activity Log)"]
    end

    subgraph Data ["Data Tier (MySQL 8.0)"]
        DB[("clinicify_db (15 Relational Tables)")]
    end

    Clients -->|HTTP REST + Bearer JWT| AUTH_FILTER
    AUTH_FILTER --> SEC_CFG
    SEC_CFG --> Q_SVC & BED_SVC & CONS_SVC & PHARM_SVC & AUD_SVC
    Q_SVC & BED_SVC & CONS_SVC & PHARM_SVC & AUD_SVC --> DB
```

---

## 2. Dynamic OPD Queue Baseline Wait-Time Algorithm

Waiting times in traditional hospitals are unpredictable. Clinicify solves this using a dynamic queue prediction service:

### Formulation
For any patient holding queue token $T_i$ assigned to Doctor $D_j$:

$$\text{Estimated Wait Time} = N_{\text{ahead}} \times \overline{T}_{\text{consultation}}$$

Where:
* $N_{\text{ahead}}$ = Number of patients in status `WAITING` or `IN_PROGRESS` ahead of $T_i$ for Doctor $D_j$.
* $\overline{T}_{\text{consultation}}$ = Rolling baseline consultation duration (configurable, default: 12 minutes).

### Dynamic Status Transitions
```mermaid
stateDiagram-v2
    [*] --> ISSUED: Reception issues token
    ISSUED --> WAITING: Added to doctor queue
    WAITING --> IN_PROGRESS: Doctor clicks 'Call Next'
    IN_PROGRESS --> COMPLETED: Consultation finished & prescription signed
    WAITING --> SKIPPED: Patient absent during call
    SKIPPED --> WAITING: Re-queued with grace period
    COMPLETED --> [*]
```

---

## 3. Concurrency-Safe Bed Allocation State Machine

To prevent double-booking of hospital beds in high-traffic emergency or general wards, Clinicify enforces strict transactional row-level locks:

```sql
-- Explicit row lock during allocation transaction
SELECT * FROM beds WHERE bed_id = :id FOR UPDATE;
```

### Bed Lifecycle State Machine
```mermaid
stateDiagram-v2
    AVAILABLE --> OCCUPIED: Patient admitted (Assign Bed)
    OCCUPIED --> MAINTENANCE: Patient discharged (Sanitization)
    MAINTENANCE --> AVAILABLE: Ward admin marks cleaned
    AVAILABLE --> BLOCKED: Reserved for emergency maintenance
    BLOCKED --> AVAILABLE: Unblocked
```

---

## 4. Security & Stateless JWT Authentication

* **Password Protection**: Passwords hashed with BCrypt (10 rounds).
* **Token Standard**: JSON Web Tokens (JJWT 0.11.5) signed with HMAC-SHA256 (`HS256`).
* **Statelessness**: No session memory on backend; each HTTP request carries `Authorization: Bearer <token>`.
* **RBAC Roles**: `RECEPTIONIST`, `DOCTOR`, `PHARMACIST`, `PATIENT`, `ADMIN`.

---

## 5. Audit Logging Architecture
Every critical state change (prescriptions issued, medicines dispensed, beds allocated, admissions created) records an immutable entry into `audit_logs` tracking:
* `user_id` and `action`
* `entity_name` and `entity_id`
* `timestamp` and `details`
