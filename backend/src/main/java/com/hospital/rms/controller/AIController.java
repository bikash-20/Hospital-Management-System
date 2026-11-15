package com.hospital.rms.controller;

import com.hospital.rms.dto.AIChatRequest;
import com.hospital.rms.dto.AIChatResponse;
import com.hospital.rms.dto.TTSRequest;
import com.hospital.rms.service.AIService;
import com.hospital.rms.service.ElevenLabsTTSService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AIController {

    private final AIService aiService;
    private final ElevenLabsTTSService elevenLabsTTSService;

    @PostMapping("/chat")
    public ResponseEntity<AIChatResponse> chat(@RequestBody AIChatRequest request) {
        return ResponseEntity.ok(aiService.processChat(request));
    }

    @GetMapping("/tts/config")
    public ResponseEntity<Map<String, Object>> getTtsConfig() {
        return ResponseEntity.ok(elevenLabsTTSService.getVoiceConfig());
    }

    @PostMapping(value = "/tts", produces = "audio/mpeg")
    public ResponseEntity<byte[]> textToSpeech(@RequestBody TTSRequest request) {
        try {
            byte[] audio = elevenLabsTTSService.generateSpeech(request.getText(), request.getVoiceId());
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.valueOf("audio/mpeg"));
            headers.setContentLength(audio.length);
            return new ResponseEntity<>(audio, headers, HttpStatus.OK);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(null);
        }
    }
}
