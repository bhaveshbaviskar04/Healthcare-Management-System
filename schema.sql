-- ============================================================
-- CLINICIFY DATABASE INITIALIZATION SCRIPT (schema.sql)
-- ============================================================

CREATE DATABASE IF NOT EXISTS clinicify_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE clinicify_db;

-- 1. USERS & ROLES
CREATE TABLE IF NOT EXISTS users (
    user_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role ENUM('RECEPTIONIST', 'DOCTOR', 'NURSE', 'PHARMACIST', 'PATIENT') NOT NULL,
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(20),
    active_status BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_role (role),
    INDEX idx_user_username (username)
) ENGINE=InnoDB;

-- 2. PATIENTS
CREATE TABLE IF NOT EXISTS patients (
    patient_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NULL UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    date_of_birth DATE,
    gender ENUM('MALE', 'FEMALE', 'OTHER') NOT NULL,
    phone VARCHAR(20) NOT NULL,
    emergency_contact VARCHAR(20),
    blood_group VARCHAR(5),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_patient_phone (phone),
    INDEX idx_patient_name (full_name)
) ENGINE=InnoDB;

-- 3. VISITS
CREATE TABLE IF NOT EXISTS visits (
    visit_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    patient_id BIGINT NOT NULL,
    visit_date DATE NOT NULL,
    visit_type ENUM('OPD', 'EMERGENCY', 'FOLLOW_UP') DEFAULT 'OPD',
    department VARCHAR(50) DEFAULT 'General Medicine',
    assigned_doctor_id BIGINT NULL,
    visit_status ENUM('REGISTERED', 'IN_QUEUE', 'IN_CONSULTATION', 'PHARMACY_PENDING', 'ADMITTED', 'COMPLETED', 'CANCELLED') DEFAULT 'REGISTERED',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_doctor_id) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_visit_date (visit_date),
    INDEX idx_visit_status (visit_status)
) ENGINE=InnoDB;

-- 4. QUEUE TOKENS
CREATE TABLE IF NOT EXISTS queue_tokens (
    token_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    visit_id BIGINT NOT NULL UNIQUE,
    token_number INT NOT NULL,
    queue_date DATE NOT NULL,
    queue_status ENUM('WAITING', 'CALLED', 'IN_CONSULTATION', 'COMPLETED', 'CANCELLED', 'NO_SHOW') DEFAULT 'WAITING',
    priority_flag BOOLEAN DEFAULT FALSE,
    priority_reason VARCHAR(255),
    estimated_waiting_minutes INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    called_at TIMESTAMP NULL,
    consultation_started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    FOREIGN KEY (visit_id) REFERENCES visits(visit_id) ON DELETE CASCADE,
    UNIQUE KEY uq_token_daily (token_number, queue_date),
    INDEX idx_queue_active (queue_date, queue_status, priority_flag)
) ENGINE=InnoDB;

-- 5. CONSULTATIONS
CREATE TABLE IF NOT EXISTS consultations (
    consultation_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    visit_id BIGINT NOT NULL UNIQUE,
    doctor_id BIGINT NOT NULL,
    symptoms TEXT,
    diagnosis TEXT,
    clinical_notes TEXT,
    recommended_admission BOOLEAN DEFAULT FALSE,
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP NULL,
    FOREIGN KEY (visit_id) REFERENCES visits(visit_id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES users(user_id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- 6. MEDICINES
CREATE TABLE IF NOT EXISTS medicines (
    medicine_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL UNIQUE,
    strength_form VARCHAR(50) NOT NULL,
    stock_quantity INT NOT NULL DEFAULT 0,
    reorder_threshold INT NOT NULL DEFAULT 20,
    batch_number VARCHAR(50),
    expiry_date DATE,
    unit_price DECIMAL(10, 2) DEFAULT 0.00,
    active_status BOOLEAN DEFAULT TRUE,
    INDEX idx_med_stock (stock_quantity, reorder_threshold)
) ENGINE=InnoDB;

-- 7. PRESCRIPTIONS
CREATE TABLE IF NOT EXISTS prescriptions (
    prescription_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    consultation_id BIGINT NOT NULL,
    patient_id BIGINT NOT NULL,
    doctor_id BIGINT NOT NULL,
    prescription_status ENUM('DRAFT', 'ISSUED', 'PENDING_DISPENSING', 'PARTIALLY_DISPENSED', 'DISPENSED', 'CANCELLED') DEFAULT 'ISSUED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (consultation_id) REFERENCES consultations(consultation_id) ON DELETE CASCADE,
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE RESTRICT,
    FOREIGN KEY (doctor_id) REFERENCES users(user_id) ON DELETE RESTRICT,
    INDEX idx_presc_status (prescription_status)
) ENGINE=InnoDB;

-- 8. PRESCRIPTION ITEMS
CREATE TABLE IF NOT EXISTS prescription_items (
    item_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    prescription_id BIGINT NOT NULL,
    medicine_id BIGINT NOT NULL,
    dosage VARCHAR(50) NOT NULL,
    frequency VARCHAR(50) NOT NULL,
    duration VARCHAR(50) NOT NULL,
    quantity_prescribed INT NOT NULL,
    quantity_dispensed INT DEFAULT 0,
    special_instructions VARCHAR(255),
    FOREIGN KEY (prescription_id) REFERENCES prescriptions(prescription_id) ON DELETE CASCADE,
    FOREIGN KEY (medicine_id) REFERENCES medicines(medicine_id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- 9. DISPENSING RECORDS
CREATE TABLE IF NOT EXISTS dispensing_records (
    dispensing_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    prescription_id BIGINT NOT NULL,
    pharmacist_id BIGINT NOT NULL,
    dispensing_status ENUM('PARTIAL', 'COMPLETED') NOT NULL,
    dispensed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    FOREIGN KEY (prescription_id) REFERENCES prescriptions(prescription_id) ON DELETE RESTRICT,
    FOREIGN KEY (pharmacist_id) REFERENCES users(user_id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- 10. WARDS
CREATE TABLE IF NOT EXISTS wards (
    ward_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    ward_name VARCHAR(100) NOT NULL UNIQUE,
    ward_type ENUM('GENERAL', 'ICU', 'EMERGENCY', 'MATERNITY', 'PEDIATRIC', 'SURGICAL') NOT NULL,
    total_beds INT NOT NULL,
    floor_number INT DEFAULT 1
) ENGINE=InnoDB;

-- 11. BEDS
CREATE TABLE IF NOT EXISTS beds (
    bed_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    ward_id BIGINT NOT NULL,
    bed_label VARCHAR(20) NOT NULL,
    bed_status ENUM('AVAILABLE', 'RESERVED', 'OCCUPIED', 'OUT_OF_SERVICE') DEFAULT 'AVAILABLE',
    daily_rate DECIMAL(10,2) DEFAULT 0.00,
    last_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (ward_id) REFERENCES wards(ward_id) ON DELETE CASCADE,
    UNIQUE KEY uq_ward_bed (ward_id, bed_label),
    INDEX idx_bed_avail (bed_status)
) ENGINE=InnoDB;

-- 12. INPATIENT ADMISSIONS
CREATE TABLE IF NOT EXISTS admissions (
    admission_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    patient_id BIGINT NOT NULL,
    admitting_doctor_id BIGINT NOT NULL,
    referring_visit_id BIGINT NULL,
    admission_status ENUM('REQUESTED', 'APPROVED', 'ADMITTED', 'TRANSFERRED', 'DISCHARGED', 'CANCELLED') DEFAULT 'REQUESTED',
    admitted_at TIMESTAMP NULL,
    discharged_at TIMESTAMP NULL,
    administrative_notes TEXT,
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE RESTRICT,
    FOREIGN KEY (admitting_doctor_id) REFERENCES users(user_id) ON DELETE RESTRICT,
    FOREIGN KEY (referring_visit_id) REFERENCES visits(visit_id) ON DELETE SET NULL,
    INDEX idx_admission_status (admission_status)
) ENGINE=InnoDB;

-- 13. BED ASSIGNMENTS
CREATE TABLE IF NOT EXISTS bed_assignments (
    assignment_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    admission_id BIGINT NOT NULL,
    bed_id BIGINT NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    released_at TIMESTAMP NULL,
    assignment_status ENUM('ACTIVE', 'TRANSFERRED', 'DISCHARGED') DEFAULT 'ACTIVE',
    notes VARCHAR(255),
    FOREIGN KEY (admission_id) REFERENCES admissions(admission_id) ON DELETE CASCADE,
    FOREIGN KEY (bed_id) REFERENCES beds(bed_id) ON DELETE RESTRICT,
    INDEX idx_active_bed (bed_id, assignment_status)
) ENGINE=InnoDB;

-- 14. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
    notification_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    delivery_channel ENUM('IN_APP', 'SMS', 'EMAIL') DEFAULT 'IN_APP',
    delivery_status ENUM('CREATED', 'PENDING', 'SENT', 'FAILED', 'READ') DEFAULT 'CREATED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user_notif (user_id, delivery_status)
) ENGINE=InnoDB;

-- 15. AUDIT LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
    audit_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NULL,
    action_type VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(50) NOT NULL,
    outcome ENUM('SUCCESS', 'FAILED', 'DENIED') DEFAULT 'SUCCESS',
    details TEXT,
    ip_address VARCHAR(45),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_audit_time (timestamp),
    INDEX idx_audit_action (action_type)
) ENGINE=InnoDB;

