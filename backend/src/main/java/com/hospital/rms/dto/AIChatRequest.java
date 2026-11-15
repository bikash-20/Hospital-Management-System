package com.hospital.rms.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AIChatRequest {
    private String message;
    private String role; // ADMIN, CASHIER, DOCTOR, RECEPTIONIST, PATIENT, GUEST
    private String language; // en, bn
    private String username;
    private String doctorId;
    private String doctorName;
    private String currentRoute;
    private String prescriptionText;
    private List<ChatMessage> history;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ChatMessage {
        private String role; // user, assistant, system
        private String content;
    }
}
