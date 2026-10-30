# Clinicify — REST API Specification

> Complete REST endpoint reference with roles, parameters, and sample payloads.

Base URL: `http://localhost:8080/api`

---

## 1. Authentication Endpoints

### User Login
* **Endpoint:** `POST /api/auth/login`
* **Access:** Public
* **Request Payload:**
```json
{
  "username": "dr_sharma",
  "password": "Password@123"
}
```
* **Success Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "userId": 2,
  "username": "dr_sharma",
  "fullName": "Dr. Ananya Sharma",
  "role": "DOCTOR"
}
```

---

## 2. Patient Management Endpoints

### Register Patient
* **Endpoint:** `POST /api/patients/register`
* **Access:** `RECEPTIONIST`, `ADMIN`
* **Request Payload:**
```json
{
  "fullName": "Ramesh Kumar",
  "dateOfBirth": "1988-04-12",
  "gender": "MALE",
  "contactNumber": "9876543210",
  "email": "ramesh@example.com",
  "address": "404 Shiv Krupa, Thane West",
  "emergencyContact": "9876500000",
  "bloodGroup": "O_POSITIVE"
}
```

### Search Patients
* **Endpoint:** `GET /api/patients/search?query=Ramesh`
* **Access:** `RECEPTIONIST`, `DOCTOR`, `ADMIN`

---

## 3. OPD Queue & Token Endpoints

### Issue Queue Token
* **Endpoint:** `POST /api/queue/issue`
* **Access:** `RECEPTIONIST`
* **Request Payload:**
```json
{
  "patientId": 1,
  "doctorId": 2,
  "priority": "NORMAL"
}
```

### Get Today's Queue for Doctor
* **Endpoint:** `GET /api/queue/doctor/{doctorId}/today`
* **Access:** `DOCTOR`, `RECEPTIONIST`

### Call Next Token
* **Endpoint:** `POST /api/queue/token/{tokenId}/call`
* **Access:** `DOCTOR`

### Public Queue Display Board
* **Endpoint:** `GET /api/queue/public-board`
* **Access:** Public (no authentication needed for display TV)

---

## 4. Consultation & Digital Prescriptions

### Complete Consultation
* **Endpoint:** `POST /api/consultations/create`
* **Access:** `DOCTOR`
* **Request Payload:**
```json
{
  "visitId": 1,
  "diagnosis": "Acute Bronchitis",
  "clinicalNotes": "Patient presents with persistent cough and mild wheezing.",
  "vitals": {
    "bloodPressure": "120/80",
    "pulse": 78,
    "temperature": "98.6 F",
    "spO2": 99
  }
}
```

### Create Digital Prescription
* **Endpoint:** `POST /api/consultations/{consultationId}/prescribe`
* **Access:** `DOCTOR`
* **Request Payload:**
```json
{
  "instructions": "Take medication after meals. Drink warm water.",
  "items": [
    {
      "medicineId": 1,
      "dosage": "500mg",
      "frequency": "Twice daily (1-0-1)",
      "durationDays": 5
    }
  ]
}
```

---

## 5. Inpatient Bed Management & Admissions

### List Available Beds by Ward
* **Endpoint:** `GET /api/beds/available?wardId=1`
* **Access:** `RECEPTIONIST`, `DOCTOR`, `ADMIN`

### Allocate Bed & Admit Patient
* **Endpoint:** `POST /api/admissions/allocate`
* **Access:** `RECEPTIONIST`, `ADMIN`
* **Request Payload:**
```json
{
  "patientId": 1,
  "bedId": 4,
  "admittingDoctorId": 2,
  "reason": "Post-operative monitoring",
  "admissionDate": "2026-10-30T10:00:00"
}
```

### Discharge Patient & Free Bed
* **Endpoint:** `POST /api/admissions/{admissionId}/discharge`
* **Access:** `DOCTOR`, `RECEPTIONIST`, `ADMIN`

---

## 6. Pharmacy & Inventory

### Get Pending Prescriptions
* **Endpoint:** `GET /api/pharmacy/pending-prescriptions`
* **Access:** `PHARMACIST`

### Dispense Prescription
* **Endpoint:** `POST /api/pharmacy/prescriptions/{id}/dispense`
* **Access:** `PHARMACIST`

### Medicine Inventory Stock List
* **Endpoint:** `GET /api/pharmacy/medicines`
* **Access:** `PHARMACIST`, `ADMIN`

---

## 7. Reports & Analytics

### Daily Operational Summary
* **Endpoint:** `GET /api/reports/daily-summary`
* **Access:** `ADMIN`

### Audit Trail Logs
* **Endpoint:** `GET /api/reports/audit-logs?page=0&size=50`
* **Access:** `ADMIN`
