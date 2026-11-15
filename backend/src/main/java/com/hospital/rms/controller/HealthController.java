package com.hospital.rms.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class HealthController {

    @GetMapping({"/health", "/api/health"})
    public Map<String, String> health() {
        return Map.of("status", "UP", "service", "CareBridge AI Backend");
    }
}