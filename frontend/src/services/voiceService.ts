import { getAISettings } from './aiOrchestrator';

// Speech-to-Text Recognition interface
interface SpeechRecognitionEvent {
  resultIndex: number;
  results: {
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

/**
 * Text-to-Speech (TTS)
 */
export async function speakText(text: string, language = 'en'): Promise<void> {
  const prefs = getAISettings();

  // 1. Try local Piper voice endpoint if configured
  if (prefs.ttsEndpoint) {
    try {
      const res = await fetch(prefs.ttsEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, language }),
      });
      if (res.ok) {
        const audioBlob = await res.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        await audio.play();
        return;
      }
    } catch {
      // Fallback to browser synthesis
    }
  }

  // 2. Native Web Speech Synthesis fallback
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel(); // Stop any currently playing audio
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === 'bn' ? 'bn-BD' : 'en-US';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  }
}

export function stopSpeaking(): void {
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
      if (this.onError) this.onError(new Error('Speech recognition not supported in this browser.'));
      return;
    }
    if (this.isListening) return;

    this.recognition.lang = language === 'bn' ? 'bn-BD' : 'en-US';

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      this.onTranscript(transcript);
    };

    this.recognition.onerror = (event: unknown) => {
      if (this.onError) this.onError(event);
      this.isListening = false;
    };

    this.recognition.onend = () => {
      this.isListening = false;
    };

    try {
      this.recognition.start();
      this.isListening = true;
    } catch (e) {
      if (this.onError) this.onError(e);
    }
  }

  stop() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  get active(): boolean {
    return this.isListening;
  }
}
