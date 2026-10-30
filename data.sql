USE clinicify_db;

-- 1. Insert Demo Users (All default passwords: Password@123)
-- BCrypt: $2a$10$3KIUJAG2xdXOX96wUBDlwOi1TxB6CMMu6ql.FDN0uXSOIhQf1h0PS
INSERT INTO users (user_id, username, password_hash, full_name, role, email, phone) VALUES
(1, 'receptionist1', '$2a$10$3KIUJAG2xdXOX96wUBDlwOi1TxB6CMMu6ql.FDN0uXSOIhQf1h0PS', 'Pooja Sharma', 'RECEPTIONIST', 'reception@clinicify.local', '9876543210'),
(2, 'dr_sharma',     '$2a$10$3KIUJAG2xdXOX96wUBDlwOi1TxB6CMMu6ql.FDN0uXSOIhQf1h0PS', 'Dr. Ramesh Sharma (MD)', 'DOCTOR', 'doctor@clinicify.local', '9876543211'),
(3, 'pharmacist1',   '$2a$10$3KIUJAG2xdXOX96wUBDlwOi1TxB6CMMu6ql.FDN0uXSOIhQf1h0PS', 'Kunal Deshmukh', 'PHARMACIST', 'pharmacy@clinicify.local', '9876543212'),
(4, 'patient_rahul', '$2a$10$3KIUJAG2xdXOX96wUBDlwOi1TxB6CMMu6ql.FDN0uXSOIhQf1h0PS', 'Rahul Patil', 'PATIENT', 'rahul@gmail.com', '9876543213');

-- 2. Insert Sample Patients
INSERT INTO patients (patient_id, user_id, full_name, date_of_birth, gender, phone, emergency_contact, blood_group, address) VALUES
(1, 4, 'Rahul Patil', '1998-05-14', 'MALE', '9876543213', '9822001122', 'B+', 'Thane West, Maharashtra'),
(2, NULL, 'Sunita Verma', '1975-11-20', 'FEMALE', '9811223344', '9833445566', 'O+', 'Mulund, Mumbai'),
(3, NULL, 'Aarav Baviskar', '2015-08-03', 'MALE', '9844556677', '9844556677', 'A+', 'Ghodbunder Road, Thane');

-- 3. Insert Sample Visits & Queue Tokens
INSERT INTO visits (visit_id, patient_id, visit_date, visit_type, department, assigned_doctor_id, visit_status) VALUES
(1, 1, CURRENT_DATE(), 'OPD', 'General Medicine', 2, 'IN_QUEUE'),
(2, 2, CURRENT_DATE(), 'OPD', 'General Medicine', 2, 'IN_QUEUE'),
(3, 3, CURRENT_DATE(), 'OPD', 'General Medicine', 2, 'IN_QUEUE');

INSERT INTO queue_tokens (token_id, visit_id, token_number, queue_date, queue_status, priority_flag, estimated_waiting_minutes) VALUES
(1, 1, 101, CURRENT_DATE(), 'WAITING', FALSE, 0),
(2, 2, 102, CURRENT_DATE(), 'WAITING', TRUE, 0),  -- Priority patient (Elderly / Urgent)
(3, 3, 103, CURRENT_DATE(), 'WAITING', FALSE, 20);

-- 4. Insert Wards
INSERT INTO wards (ward_id, ward_name, ward_type, total_beds, floor_number) VALUES
(1, 'General Medical Ward A', 'GENERAL', 10, 1),
(2, 'Intensive Care Unit (ICU)', 'ICU', 4, 2),
(3, 'Emergency Observation', 'EMERGENCY', 6, 1);

-- 5. Insert Beds
INSERT INTO beds (bed_id, ward_id, bed_label, bed_status, daily_rate) VALUES
(1, 1, 'GEN-A01', 'OCCUPIED', 800.00),
(2, 1, 'GEN-A02', 'AVAILABLE', 800.00),
(3, 1, 'GEN-A03', 'AVAILABLE', 800.00),
(4, 2, 'ICU-01',  'AVAILABLE', 3500.00),
(5, 2, 'ICU-02',  'RESERVED',  3500.00),
(6, 3, 'EMG-01',  'AVAILABLE', 1200.00);

-- 6. Insert Medicines & Inventory Master
INSERT INTO medicines (medicine_id, name, strength_form, stock_quantity, reorder_threshold, batch_number, expiry_date, unit_price) VALUES
(1, 'Paracetamol (Dolo)', '650mg Tablet', 350, 50, 'BT-2025-A1', '2027-12-31', 2.50),
(2, 'Amoxicillin + Clavulanic Acid (Augmentin)', '625mg Tablet', 120, 30, 'AUG-889', '2026-08-15', 22.00),
(3, 'Cetirizine', '10mg Tablet', 200, 40, 'CT-109', '2027-05-10', 3.00),
(4, 'Pantoprazole (Pan-40)', '40mg Tablet', 180, 40, 'PN-741', '2027-03-20', 8.50),
(5, 'Azithromycin (Azee)', '500mg Tablet', 45, 25, 'AZ-500', '2026-10-30', 25.00),
(6, 'Salbutamol Inhaler', '100mcg Spray', 15, 20, 'SLB-22', '2026-06-18', 145.00);

