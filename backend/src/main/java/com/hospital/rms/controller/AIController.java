package com.hospital.rms.controller;

import com.hospital.rms.dto.AIChatRequest;
import com.hospital.rms.dto.AIChatResponse;
import com.hospital.rms.service.AIService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AIController {

    private final AIService aiService;

    @PostMapping("/chat")
    public ResponseEntity<AIChatResponse> chat(@RequestBody AIChatRequest request) {
        return ResponseEntity.ok(aiService.processChat(request));
    }
}
