package com.clinicify.config;

import com.clinicify.model.*;
import com.clinicify.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PatientRepository patientRepository;
    private final WardRepository wardRepository;
    private final BedRepository bedRepository;
    private final MedicineRepository medicineRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository,
                           PatientRepository patientRepository,
                           WardRepository wardRepository,
                           BedRepository bedRepository,
                           MedicineRepository medicineRepository,
                           PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.patientRepository = patientRepository;
        this.wardRepository = wardRepository;
        this.bedRepository = bedRepository;
        this.medicineRepository = medicineRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (userRepository.count() > 0) {
            return; // Already initialized
        }

        String defaultPass = passwordEncoder.encode("Password@123");

        // 1. Seed Users
        User receptionist = new User("receptionist1", defaultPass, "Pooja Sharma", User.Role.RECEPTIONIST, "reception@clinicify.local", "9876543210");
        User doctor = new User("dr_sharma", defaultPass, "Dr. Ramesh Sharma (MD)", User.Role.DOCTOR, "doctor@clinicify.local", "9876543211");
        User pharmacist = new User("pharmacist1", defaultPass, "Kunal Deshmukh", User.Role.PHARMACIST, "pharmacy@clinicify.local", "9876543212");
        User patientUser = new User("patient_rahul", defaultPass, "Rahul Patil", User.Role.PATIENT, "rahul@gmail.com", "9876543213");

        userRepository.save(receptionist);
        userRepository.save(doctor);
        userRepository.save(pharmacist);
        userRepository.save(patientUser);

        // 2. Seed Patients
        Patient p1 = new Patient();
        p1.setUser(patientUser);
        p1.setFullName("Rahul Patil");
        p1.setDateOfBirth(LocalDate.of(1998, 5, 14));
        p1.setGender(Patient.Gender.MALE);
        p1.setPhone("9876543213");
        p1.setEmergencyContact("9822001122");
        p1.setBloodGroup("B+");
        p1.setAddress("Thane West, Maharashtra");
        patientRepository.save(p1);

        Patient p2 = new Patient();
        p2.setFullName("Sunita Verma");
        p2.setDateOfBirth(LocalDate.of(1975, 11, 20));
        p2.setGender(Patient.Gender.FEMALE);
        p2.setPhone("9811223344");
        p2.setEmergencyContact("9833445566");
        p2.setBloodGroup("O+");
        p2.setAddress("Mulund, Mumbai");
        patientRepository.save(p2);

        Patient p3 = new Patient();
        p3.setFullName("Aarav Baviskar");
        p3.setDateOfBirth(LocalDate.of(2015, 8, 3));
        p3.setGender(Patient.Gender.MALE);
        p3.setPhone("9844556677");
        p3.setEmergencyContact("9844556677");
        p3.setBloodGroup("A+");
        p3.setAddress("Ghodbunder Road, Thane");
        patientRepository.save(p3);

        // 3. Seed Wards & Beds
        Ward generalWard = new Ward();
        generalWard.setWardName("General Medical Ward A");
        generalWard.setWardType(Ward.WardType.GENERAL);
        generalWard.setTotalBeds(10);
        generalWard.setFloorNumber(1);
        wardRepository.save(generalWard);

        Ward icuWard = new Ward();
        icuWard.setWardName("Intensive Care Unit (ICU)");
        icuWard.setWardType(Ward.WardType.ICU);
        icuWard.setTotalBeds(4);
        icuWard.setFloorNumber(2);
        wardRepository.save(icuWard);

        createBed(generalWard, "GEN-A01", Bed.BedStatus.AVAILABLE, new BigDecimal("800.00"));
        createBed(generalWard, "GEN-A02", Bed.BedStatus.AVAILABLE, new BigDecimal("800.00"));
        createBed(generalWard, "GEN-A03", Bed.BedStatus.AVAILABLE, new BigDecimal("800.00"));
        createBed(icuWard, "ICU-01", Bed.BedStatus.AVAILABLE, new BigDecimal("3500.00"));
        createBed(icuWard, "ICU-02", Bed.BedStatus.RESERVED, new BigDecimal("3500.00"));

        // 4. Seed Medicines
        createMedicine("Paracetamol (Dolo)", "650mg Tablet", 350, 50, "BT-2025-A1", LocalDate.of(2027, 12, 31), new BigDecimal("2.50"));
        createMedicine("Amoxicillin + Clavulanic Acid (Augmentin)", "625mg Tablet", 120, 30, "AUG-889", LocalDate.of(2026, 8, 15), new BigDecimal("22.00"));
        createMedicine("Cetirizine", "10mg Tablet", 200, 40, "CT-109", LocalDate.of(2027, 5, 10), new BigDecimal("3.00"));
        createMedicine("Pantoprazole (Pan-40)", "40mg Tablet", 180, 40, "PN-741", LocalDate.of(2027, 3, 20), new BigDecimal("8.50"));
        createMedicine("Salbutamol Inhaler", "100mcg Spray", 15, 20, "SLB-22", LocalDate.of(2026, 6, 18), new BigDecimal("145.00"));
    }

    private void createBed(Ward ward, String label, Bed.BedStatus status, BigDecimal rate) {
        Bed bed = new Bed();
        bed.setWard(ward);
        bed.setBedLabel(label);
        bed.setBedStatus(status);
        bed.setDailyRate(rate);
        bedRepository.save(bed);
    }

    private void createMedicine(String name, String form, int stock, int threshold, String batch, LocalDate expiry, BigDecimal price) {
        Medicine med = new Medicine();
        med.setName(name);
        med.setStrengthForm(form);
        med.setStockQuantity(stock);
        med.setReorderThreshold(threshold);
        med.setBatchNumber(batch);
        med.setExpiryDate(expiry);
        med.setUnitPrice(price);
        medicineRepository.save(med);
    }
}

