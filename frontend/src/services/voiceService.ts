import { getAISettings } from './aiOrchestrator';

// Speech-to-Text Recognition interface
interface SpeechRecognitionEvent {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
    };
  };
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: unknown) => void;
  onend: () => void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

let currentAudio: HTMLAudioElement | null = null;

/**
 * Strips markdown symbols, KaTeX delimiters, and HTML tags so TTS sounds completely natural.
 */
function cleanTextForSpeech(raw: string): string {
  return raw
    .replace(/\$\$[\s\S]*?\$\$/g, ' equation ')
    .replace(/\$([^\$]+)\$/g, '$1')
    .replace(/[*#_`~>-]/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Text-to-Speech (TTS) Engine:
 * 1. ElevenLabs via Backend Proxy (/api/ai/tts) using Render ELEVENLABS_API_KEY and voice ID EXAVITQu4vr4xnSDxMaL
 * 2. Direct ElevenLabs Client API (if key stored in preferences)
 * 3. Local Piper / TTS Offline Service
 * 4. Native Browser Web Speech Synthesis fallback
 */
export async function speakText(text: string, language = 'en'): Promise<void> {
  stopSpeaking();
  const clean = cleanTextForSpeech(text);
  if (!clean) return;

  const prefs = getAISettings();
  const voiceId = prefs.elevenLabsVoiceId || 'EXAVITQu4vr4xnSDxMaL';

  // 1. Tier 1: CareBridge Backend ElevenLabs TTS (Render cloud with voice EXAVITQu4vr4xnSDxMaL)
  try {
    const res = await fetch('/api/ai/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: clean, voiceId, language }),
    });

    if (res.ok && res.headers.get('content-type')?.includes('audio')) {
      const audioBlob = await res.blob();
      if (audioBlob.size > 200) {
        const audioUrl = URL.createObjectURL(audioBlob);
        currentAudio = new Audio(audioUrl);
        await new Promise<void>((resolve, reject) => {
          if (!currentAudio) return resolve();
          currentAudio.onended = () => resolve();
          currentAudio.onerror = (e) => reject(e);
          currentAudio.play().catch(reject);
        });
        return;
      }
    }
  } catch (err) {
    console.warn('Backend ElevenLabs proxy unavailable, checking client fallbacks:', err);
  }

  // 2. Tier 2: Direct Client ElevenLabs call (if elevenLabsApiKey is provided)
  if (prefs.elevenLabsApiKey && prefs.elevenLabsApiKey.trim().length > 5) {
    try {
      const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'xi-api-key': prefs.elevenLabsApiKey.trim(),
          'Content-Type': 'application/json',
          'Accept': 'audio/mpeg',
        },
        body: JSON.stringify({
          text: clean,
          model_id: 'eleven_multilingual_v2',
          voice_settings: { stability: 0.5, similarity_boost: 0.75 },
        }),
      });

      if (res.ok) {
        const audioBlob = await res.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        currentAudio = new Audio(audioUrl);
        await new Promise<void>((resolve, reject) => {
          if (!currentAudio) return resolve();
          currentAudio.onended = () => resolve();
          currentAudio.onerror = (e) => reject(e);
          currentAudio.play().catch(reject);
        });
        return;
      }
    } catch (e) {
      console.warn('Direct ElevenLabs client TTS failed, falling back:', e);
    }
  }

  // 3. Tier 3: Local Piper TTS endpoint (for offline mode)
  if (prefs.ttsEndpoint && !prefs.ttsEndpoint.includes('localhost:5006')) {
    try {
      const res = await fetch(prefs.ttsEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: clean, language }),
      });
      if (res.ok) {
        const audioBlob = await res.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        currentAudio = new Audio(audioUrl);
        await new Promise<void>((resolve, reject) => {
          if (!currentAudio) return resolve();
          currentAudio.onended = () => resolve();
          currentAudio.onerror = (e) => reject(e);
          currentAudio.play().catch(reject);
        });
        return;
      }
    } catch {
      // Piper offline
    }
  }

  // 4. Tier 4: Native Browser SpeechSynthesis fallback
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    return new Promise<void>((resolve) => {
      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.lang = language === 'bn' ? 'bn-BD' : 'en-US';
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();
      window.speechSynthesis.speak(utterance);
    });
  }
}

export function stopSpeaking(): void {
  if (currentAudio) {
    try {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    } catch {
      // Audio already paused
    }
    currentAudio = null;
  }
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

/**
 * Speech-to-Text (STT) Recorder
 */
export class VoiceSTTListener {
  private recognition: SpeechRecognitionInstance | null = null;
  private isListening = false;
  private onTranscript: (text: string) => void;
  private onError?: (err: unknown) => void;

  constructor(onTranscript: (text: string) => void, onError?: (err: unknown) => void) {
    this.onTranscript = onTranscript;
    this.onError = onError;
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRec) {
      this.recognition = new SpeechRec();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
    }
  }

  start(language = 'en') {
    if (!this.recognition) {
      console.warn('Web Speech API is not supported in this browser.');
      return;
    }
    if (this.isListening) return;

    this.recognition.lang = language === 'bn' ? 'bn-BD' : 'en-US';

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      const last = event.results[event.results.length - 1];
      if (last && last[0]) {
        this.onTranscript(last[0].transcript);
      }
    };

    this.recognition.onerror = (event: unknown) => {
      console.error('Speech recognition error:', event);
      this.isListening = false;
      if (this.onError) this.onError(event);
    };

    this.recognition.onend = () => {
      this.isListening = false;
    };

    try {
      this.recognition.start();
      this.isListening = true;
    } catch (e) {
      console.error('Failed to start speech recognition:', e);
      this.isListening = false;
    }
  }

  stop() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }
}
