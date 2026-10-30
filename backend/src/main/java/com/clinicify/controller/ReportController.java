package com.clinicify.controller;

import com.clinicify.service.ReportingService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    private final ReportingService reportingService;

    public ReportController(ReportingService reportingService) {
        this.reportingService = reportingService;
    }

    @GetMapping("/daily-summary")
    public ResponseEntity<Map<String, Object>> getDailySummary() {
        return ResponseEntity.ok(reportingService.getDailyOperationalSummary());
    }
}

