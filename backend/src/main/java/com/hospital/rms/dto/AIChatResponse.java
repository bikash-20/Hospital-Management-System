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
public class AIChatResponse {
    private String reply;
    private String modelUsed; // grok-2, openrouter/llama-3.3, gemini-2.5-flash, ollama/local
    private boolean isOffline;
    private boolean hashMatch;
    private List<ActionSuggestion> suggestions;
    private Map<String, Object> liveMetrics;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ActionSuggestion {
        private String label;
        private String action;
        private String targetUrl;
    }
}
