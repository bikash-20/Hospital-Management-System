import type { AISettingsPreferences, AIChatMessage, AIChatResponse } from '@/types';
import api from '@/api/client';

export const DEFAULT_AI_PREFERENCES: AISettingsPreferences = {
  ollamaUrl: 'http://localhost:11434',
  systemPrompt: `You are CareBridge AI, the intelligent operating system and clinical brain of the hospital.

HOSPITAL SERVICES OVERVIEW:
1. ICU (Intensive Care): 24/7 invasive mechanical ventilators, continuous arterial & cardiac monitoring, dedicated 1:1 critical care nursing (৳ 5,000/day).
2. Emergency & Triage: 24/7 rapid trauma resuscitation, acute stabilization, observation beds (৳ 2,500/day).
3. Inpatient Wards: Deluxe AC Private Cabins (৳ 3,500/day) and clean General Wards with scheduled rounds (৳ 800/day).
4. Specialist OPD & Appointments: Online public doctor appointment booking with instant serial queue tokens, chamber management, and digital queue display.
5. Pathology & Diagnostic Lab: Complete blood counts (CBC), random blood sugar (RBS), lipid profiles, renal function, digital ECG, and X-ray reports.
6. Cashless Billing & MFS: Integrated with Bangladeshi mobile financial services (bKash, Nagad, Upay) and cash POS for instant admission deposits and itemized invoices.
7. CareBridge AI Assistant: Clinical verification, prescription OCR reading, real-time bed & doctor availability, and multi-tier online/offline fallback.

DOCTOR & QUEUE AWARENESS:
When a doctor asks about their queue or patient status (e.g. how many patients in wait, done/completed, cancelled, appointed today, recent patients):
- Clearly report the breakdown: Waiting in queue, Done/Completed, Currently in consultation, Cancelled, and Total appointed today.
- Highlight the Next Patient in line with their token number, and mention recent patients.
- Respond in the user's language (Bengali or English) with polite clinical clarity.`,
  sttEndpoint: 'http://localhost:5005/transcribe',
  ttsEndpoint: 'http://localhost:5006/speak',
  elevenLabsVoiceId: '21m00Tcm4TlvDq8ikWAM',
};

const KATEX_MATH_REMINDER = '\n\nA LATEX MATH-FORMATTING REMINDER: When mentioning dosages, vital calculations, or equations, format them using LaTeX math delimiters ($...$ for inline, $$...$$ for display) so they render with KaTeX.';

export function getAISettings(): AISettingsPreferences {
  try {
    const saved = localStorage.getItem('cb_ai_preferences');
    if (saved) {
      return { ...DEFAULT_AI_PREFERENCES, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.warn('Could not read AI preferences from localStorage:', e);
  }
  return DEFAULT_AI_PREFERENCES;
}

export function saveAISettings(prefs: AISettingsPreferences) {
  localStorage.setItem('cb_ai_preferences', JSON.stringify(prefs));
}

export async function testOllamaConnection(url: string): Promise<{ success: boolean; message: string }> {
  const cleanUrl = url.replace(/\/+$/, '');
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`${cleanUrl}/api/tags`, {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (res.ok) {
      const data = await res.json();
      const modelCount = data?.models?.length || 0;
      return { success: true, message: `Connected! Ollama running with ${modelCount} models loaded.` };
    }
    return { success: false, message: `Ollama returned status ${res.status}.` };
  } catch (err: unknown) {
    return {
      success: false,
      message: `Failed to connect to ${cleanUrl}. Ensure 'OLLAMA_HOST=0.0.0.0 ollama serve' is running.`,
    };
  }
}

/**
 * Multi-Tier Cascading AI Engine:
 * Tier 1: Grok API (xAI)
 * Tier 2: OpenRouter Free Models
 * Tier 3: Google Gemini API
 * Tier 4: Local Ollama (Offline fallback)
 * Final: Backend Spring Boot AI Gateway
 */
export async function sendChatMessage(
  prompt: string,
  role: string,
  language: string,
  prescriptionText?: string,
  history?: AIChatMessage[],
  userContext?: { username?: string; doctorId?: string; doctorName?: string },
): Promise<AIChatResponse> {
  const prefs = getAISettings();
  const isOnline = navigator.onLine;
  const effectiveSystemPrompt = (prefs.systemPrompt || DEFAULT_AI_PREFERENCES.systemPrompt) + KATEX_MATH_REMINDER;

  // 1. Try Grok (if API key is present and online)
  if (isOnline && prefs.grokApiKey) {
    try {
      const res = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${prefs.grokApiKey}`,
        },
        body: JSON.stringify({
          model: 'grok-2',
          messages: [
            { role: 'system', content: effectiveSystemPrompt },
            ...(history || []).map((h) => ({ role: h.role, content: h.content })),
            { role: 'user', content: prompt },
          ],
          temperature: 0.3,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        const reply = json.choices?.[0]?.message?.content;
        if (reply) {
          return {
            reply,
            modelUsed: 'xAI Grok-2',
            isOffline: false,
            hashMatch: false,
          };
        }
      }
    } catch (e) {
      console.warn('Grok failed, cascading to OpenRouter:', e);
    }
  }

  // 2. Try OpenRouter Free (if configured and online)
  if (isOnline && prefs.openRouterApiKey) {
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${prefs.openRouterApiKey}`,
        },
        body: JSON.stringify({
          model: 'meta-llama/llama-3.3-70b-instruct:free',
          messages: [
            { role: 'system', content: effectiveSystemPrompt },
            ...(history || []).map((h) => ({ role: h.role, content: h.content })),
            { role: 'user', content: prompt },
          ],
        }),
      });
      if (res.ok) {
        const json = await res.json();
        const reply = json.choices?.[0]?.message?.content;
        if (reply) {
          return {
            reply,
            modelUsed: 'OpenRouter Llama-3.3-Free',
            isOffline: false,
            hashMatch: false,
          };
        }
      }
    } catch (e) {
      console.warn('OpenRouter failed, cascading to Gemini:', e);
    }
  }

  // 3. Try Local Ollama (especially if offline or preferred)
  try {
    const cleanUrl = prefs.ollamaUrl.replace(/\/+$/, '');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(`${cleanUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3',
        prompt: `${effectiveSystemPrompt}\nUser: ${prompt}\nAssistant:`,
        stream: false,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (res.ok) {
      const json = await res.json();
      if (json.response) {
        return {
          reply: json.response,
          modelUsed: 'Ollama (Local Offline)',
          isOffline: true,
          hashMatch: false,
        };
      }
    }
  } catch (e) {
    // Ollama not reachable or timed out
  }

  // 4. Default / Fallback: Send to Spring Boot Backend AI Gateway
  try {
    const response = await api.post<AIChatResponse>('/ai/chat', {
      message: prompt,
      role,
      language,
      username: userContext?.username,
      doctorId: userContext?.doctorId,
      doctorName: userContext?.doctorName,
      prescriptionText,
      history: (history || []).map((h) => ({ role: h.role, content: h.content })),
    });
    return response.data;
  } catch (backendError) {
    console.error('All AI endpoints failed:', backendError);
    return {
      reply: language === 'bn'
        ? 'দুঃখিত, কোনো এআই মডেলের সাথে সংযোগ স্থাপন করা যায়নি। অনুগ্রহ করে লোকাল ওলামা (Ollama) চালু রাখুন অথবা ইন্টারনেট সংযোগ পরীক্ষা করুন।'
        : 'CareBridge AI is currently unable to reach cloud or local Ollama servers. Please verify Ollama is running at ' + prefs.ollamaUrl + ' or try again.',
      modelUsed: 'Offline Fallback',
      isOffline: true,
      hashMatch: false,
    };
  }
}
