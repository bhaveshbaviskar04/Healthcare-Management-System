package com.clinicify.controller;

import com.clinicify.dto.TokenIssueRequest;
import com.clinicify.model.QueueToken;
import com.clinicify.model.User;
import com.clinicify.service.QueueService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/queue")
public class QueueController {

    private final QueueService queueService;

    public QueueController(QueueService queueService) {
        this.queueService = queueService;
    }

    @PostMapping("/generate")
    public ResponseEntity<QueueToken> generateToken(@RequestBody TokenIssueRequest request,
                                                    @AuthenticationPrincipal User user) {
        Long userId = user != null ? user.getUserId() : 1L;
        return ResponseEntity.ok(queueService.generateToken(request, userId));
    }

    @GetMapping("/today")
    public ResponseEntity<List<QueueToken>> getTodayQueue() {
        return ResponseEntity.ok(queueService.getTodayQueue());
    }

    @PostMapping("/call-next")
    public ResponseEntity<QueueToken> callNextToken(@AuthenticationPrincipal User user) {
        Long userId = user != null ? user.getUserId() : 2L;
        return ResponseEntity.ok(queueService.callNextToken(userId));
    }

    @PutMapping("/{id}/priority")
    public ResponseEntity<QueueToken> setPriority(@PathVariable("id") Long tokenId,
                                                  @RequestBody Map<String, String> body,
                                                  @AuthenticationPrincipal User user) {
        Long userId = user != null ? user.getUserId() : 1L;
        String reason = body.getOrDefault("reason", "Urgent Clinical Need");
        return ResponseEntity.ok(queueService.setPriority(tokenId, reason, userId));
    }

    @PutMapping("/{id}/complete")
    public ResponseEntity<QueueToken> completeToken(@PathVariable("id") Long tokenId,
                                                    @AuthenticationPrincipal User user) {
        Long userId = user != null ? user.getUserId() : 2L;
        return ResponseEntity.ok(queueService.completeToken(tokenId, userId));
    }

    @PostMapping("/delay")
    public ResponseEntity<Map<String, Object>> setDoctorDelay(@RequestBody Map<String, Object> body,
                                                              @AuthenticationPrincipal User user) {
        Long userId = user != null ? user.getUserId() : 2L;
        int minutes = body.get("delayMinutes") != null ? Integer.parseInt(body.get("delayMinutes").toString()) : 15;
        String reason = body.getOrDefault("reason", "Doctor Consultation Delay").toString();
        queueService.applyDoctorDelay(minutes, reason, userId);
        return ResponseEntity.ok(queueService.getActiveDelay());
    }

    @PostMapping("/delay/clear")
    public ResponseEntity<Map<String, Object>> clearDoctorDelay(@AuthenticationPrincipal User user) {
        Long userId = user != null ? user.getUserId() : 2L;
        queueService.clearDoctorDelay(userId);
        return ResponseEntity.ok(queueService.getActiveDelay());
    }

    @GetMapping("/active-delay")
    public ResponseEntity<Map<String, Object>> getActiveDelay() {
        return ResponseEntity.ok(queueService.getActiveDelay());
    }
}

