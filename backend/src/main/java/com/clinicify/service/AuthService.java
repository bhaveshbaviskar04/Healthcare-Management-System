package com.clinicify.service;

import com.clinicify.dto.AuthRequest;
import com.clinicify.dto.AuthResponse;
import com.clinicify.dto.PatientRegisterRequest;
import com.clinicify.model.Patient;
import com.clinicify.model.User;
import com.clinicify.repository.PatientRepository;
import com.clinicify.repository.UserRepository;
import com.clinicify.security.JwtService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PatientRepository patientRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuditService auditService;

    public AuthService(UserRepository userRepository,
                       PatientRepository patientRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService,
                       AuditService auditService) {
        this.userRepository = userRepository;
        this.patientRepository = patientRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.auditService = auditService;
    }

    public AuthResponse authenticate(AuthRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("Invalid username or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            auditService.log(user.getUserId(), "AUTH_FAILED", "USER", user.getUserId().toString(), "DENIED", "Bad credentials");
            throw new IllegalArgumentException("Invalid username or password");
        }

        String token = jwtService.generateToken(user.getUsername(), user.getRole().name());
        auditService.log(user.getUserId(), "AUTH_SUCCESS", "USER", user.getUserId().toString(), "SUCCESS", "Logged in successfully");

        return new AuthResponse(token, user.getUserId(), user.getUsername(), user.getFullName(), user.getRole().name());
    }

    @Transactional
    public AuthResponse registerPatient(PatientRegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new IllegalArgumentException("Username '" + request.getUsername() + "' is already taken.");
        }
        if (request.getEmail() != null && !request.getEmail().isBlank() && userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email '" + request.getEmail() + "' is already registered.");
        }

        // 1. Create User Account with PATIENT role
        User user = new User();
        user.setUsername(request.getUsername());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setFullName(request.getFullName());
        user.setRole(User.Role.PATIENT);
        user.setEmail(request.getEmail());
        user.setPhone(request.getPhone());
        user.setActiveStatus(true);
        User savedUser = userRepository.save(user);

        // 2. Create linked Patient profile
        Patient patient = new Patient();
        patient.setUser(savedUser);
        patient.setFullName(request.getFullName());
        patient.setPhone(request.getPhone());
        patient.setDateOfBirth(request.getDateOfBirth());
        patient.setGender(request.getGender() != null ? request.getGender() : Patient.Gender.MALE);
        patient.setEmergencyContact(request.getEmergencyContact());
        patient.setBloodGroup(request.getBloodGroup());
        patient.setAddress(request.getAddress());
        Patient savedPatient = patientRepository.save(patient);

        // 3. Record Audit Log
        auditService.log(savedUser.getUserId(), "PATIENT_REGISTERED", "PATIENT", savedPatient.getPatientId().toString(), "SUCCESS", "Patient self-registered: " + request.getFullName());

        // 4. Issue JWT Token for immediate login
        String token = jwtService.generateToken(savedUser.getUsername(), savedUser.getRole().name());
        return new AuthResponse(token, savedUser.getUserId(), savedUser.getUsername(), savedUser.getFullName(), savedUser.getRole().name());
    }
}

