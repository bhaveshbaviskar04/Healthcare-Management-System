package com.clinicify.service;

import com.clinicify.model.AuditLog;
import com.clinicify.repository.AuditLogRepository;
import org.springframework.stereotype.Service;

@Service
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    public AuditService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    public void log(Long userId, String actionType, String entityType, String entityId, String outcome, String details) {
        try {
            AuditLog log = new AuditLog(userId, actionType, entityType, entityId, outcome, details);
            auditLogRepository.save(log);
        } catch (Exception ignored) {
            // Audit logging should never interrupt core transactional flows
        }
    }
}

