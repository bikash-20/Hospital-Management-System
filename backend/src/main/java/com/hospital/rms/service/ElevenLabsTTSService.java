package com.hospital.rms.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Map;

@Service
@Slf4j
public class ElevenLabsTTSService {

    @Value("${elevenlabs.api-key:}")
    private String apiKey;

    @Value("${elevenlabs.voice-id:EXAVITQu4vr4xnSDxMaL}")
    private String defaultVoiceId;

    @Value("${elevenlabs.model-id:eleven_multilingual_v2}")
    private String modelId;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    public boolean isConfigured() {
        return apiKey != null && !apiKey.trim().isEmpty();
    }

    public String getDefaultVoiceId() {
        return (defaultVoiceId != null && !defaultVoiceId.trim().isEmpty())
                ? defaultVoiceId
                : "EXAVITQu4vr4xnSDxMaL";
    }

    public Map<String, Object> getVoiceConfig() {
        return Map.of(
                "configured", isConfigured(),
                "voiceId", getDefaultVoiceId(),
                "modelId", modelId
        );
    }

    /**
     * Synthesizes text to speech using ElevenLabs API and returns MP3 audio bytes.
     */
    public byte[] generateSpeech(String text, String requestedVoiceId) {
        if (!isConfigured()) {
            log.warn("ElevenLabs TTS called but ELEVENLABS_API_KEY is not configured.");
            throw new IllegalStateException("ElevenLabs API key is not configured on the server.");
        }

        String voice = (requestedVoiceId != null && !requestedVoiceId.trim().isEmpty())
                ? requestedVoiceId.trim()
                : getDefaultVoiceId();

        String url = "https://api.elevenlabs.io/v1/text-to-speech/" + voice;

        // Escape JSON payload
        String sanitizedText = text.replace("\"", "\\\"").replace("\n", " ").trim();
        String jsonPayload = """
                {
                  "text": "%s",
                  "model_id": "%s",
                  "voice_settings": {
                    "stability": 0.5,
                    "similarity_boost": 0.75
                  }
                }
                """.formatted(sanitizedText, modelId);

        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(20))
                    .header("xi-api-key", apiKey.trim())
                    .header("Content-Type", "application/json")
                    .header("Accept", "audio/mpeg")
                    .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
                    .build();

            HttpResponse<byte[]> response = httpClient.send(request, HttpResponse.BodyHandlers.ofByteArray());

            if (response.statusCode() == 200 && response.body() != null && response.body().length > 0) {
                log.info("ElevenLabs TTS successfully synthesized {} bytes for voice: {}", response.body().length, voice);
                return response.body();
            } else {
                String errorMsg = new String(response.body() != null ? response.body() : new byte[0]);
                log.error("ElevenLabs API failed with status {}: {}", response.statusCode(), errorMsg);
                throw new RuntimeException("ElevenLabs API error: status " + response.statusCode());
            }
        } catch (Exception e) {
            log.error("Failed to generate speech with ElevenLabs: {}", e.getMessage(), e);
            throw new RuntimeException("TTS synthesis failed: " + e.getMessage(), e);
        }
    }
}
