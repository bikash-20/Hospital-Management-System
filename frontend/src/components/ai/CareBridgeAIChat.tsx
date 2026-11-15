import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import {
  sendChatMessage,
  getAISettings,
  saveAISettings,
  testOllamaConnection,
} from '@/services/aiOrchestrator';
import { scanPrescriptionImage } from '@/services/prescriptionRAG';
import { speakText, stopSpeaking, VoiceSTTListener } from '@/services/voiceService';
import KatexRenderer from './KatexRenderer';
import type { AIChatMessage, AISettingsPreferences, PrescriptionExtractedData } from '@/types';
import {
  Sparkles,
  Bot,
  Send,
  X,
  Settings,
  Mic,
  MicOff,
  Volume2,
  Upload,
  RefreshCw,
  Maximize2,
  Minimize2,
} from 'lucide-react';

interface CareBridgeAIChatProps {
  onOpenBooking?: () => void;
  isOpenExternal?: boolean;
  onCloseExternal?: () => void;
}

export default function CareBridgeAIChat({ onOpenBooking, isOpenExternal, onCloseExternal }: CareBridgeAIChatProps) {
  const { user } = useAuth();
  const { t, language, isBengali } = useLanguage();

  const [isOpenInternal, setIsOpenInternal] = useState(false);
  const [isFullViewport, setIsFullViewport] = useState(false);

  // Sync external state changes
  useEffect(() => {
    if (isOpenExternal !== undefined) {
      setIsOpenInternal(isOpenExternal);
    }
  }, [isOpenExternal]);

  const isOpen = isOpenInternal;

  const setIsOpen = (open: boolean) => {
    setIsOpenInternal(open);
    if (!open && onCloseExternal) onCloseExternal();
  };

  // Window event listeners for global toggle anywhere in app
  useEffect(() => {
    const handleToggle = () => setIsOpenInternal((prev) => !prev);
    const handleOpen = () => setIsOpenInternal(true);
    const handleClose = () => {
      setIsOpenInternal(false);
      if (onCloseExternal) onCloseExternal();
    };

    window.addEventListener('toggle-carebridge-ai', handleToggle);
    window.addEventListener('open-carebridge-ai', handleOpen);
    window.addEventListener('close-carebridge-ai', handleClose);

    return () => {
      window.removeEventListener('toggle-carebridge-ai', handleToggle);
      window.removeEventListener('open-carebridge-ai', handleOpen);
      window.removeEventListener('close-carebridge-ai', handleClose);
    };
  }, [onCloseExternal]);
  const [messages, setMessages] = useState<AIChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Settings state matching user screenshot
  const [preferences, setPreferences] = useState<AISettingsPreferences>(getAISettings);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [testingConnection, setTestingConnection] = useState(false);

  // Prescription upload state
  const [scannedRx, setScannedRx] = useState<PrescriptionExtractedData | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sttListenerRef = useRef<VoiceSTTListener | null>(null);
  const typewriterIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (typewriterIntervalRef.current) {
        clearInterval(typewriterIntervalRef.current);
      }
    };
  }, []);

  const role = user?.role || 'GUEST';

  // Initialize welcome message when opened
  useEffect(() => {
    if (messages.length === 0) {
      let greeting = t('rolePatientGreeting');
      if (role === 'ADMIN') greeting = t('roleAdminGreeting');
      else if (role === 'CASHIER') greeting = t('roleCashierGreeting');
      else if (role === 'DOCTOR') greeting = t('roleDoctorGreeting');

      setMessages([
        {
          id: 'welcome-1',
          role: 'assistant',
          content: greeting,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          modelUsed: 'CareBridge AI Orchestrator',
        },
      ]);
    }
  }, [role, language]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // STT setup
  useEffect(() => {
    sttListenerRef.current = new VoiceSTTListener(
      (transcript) => {
        setInput(transcript);
        setIsListening(false);
      },
      (err) => {
        console.warn('STT Error:', err);
        setIsListening(false);
      }
    );
    return () => {
      sttListenerRef.current?.stop();
    };
  }, []);

  const handleSend = async (customPrompt?: string) => {
    const promptToSend = customPrompt || input.trim();
    if (!promptToSend && !scannedRx) return;

    const userMsg: AIChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: promptToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const prescText = scannedRx
        ? `Patient: ${scannedRx.patientName}\nMedicines: ${scannedRx.medicines.map((m) => m.name).join(', ')}\nAdvice: ${scannedRx.advice}`
        : undefined;

      const res = await sendChatMessage(promptToSend, role, language, prescText, messages, {
        username: user?.username,
        doctorId: user?.id,
        doctorName: user?.fullName,
      });

      const assistantMsgId = `msg-${Date.now() + 1}`;
      const assistantMsg: AIChatMessage = {
        id: assistantMsgId,
        role: 'assistant',
        content: '',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: res.modelUsed,
        isOffline: res.isOffline,
        hashMatch: res.hashMatch,
        isStreaming: true,
        suggestions: res.suggestions,
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setLoading(false);

      // Smooth typewriter streaming delivery (word-by-word / chunk-by-chunk)
      const fullText = res.reply || '';
      const tokens = fullText.split(/(\s+)/);
      let currentIndex = 0;
      let accumulated = '';

      if (typewriterIntervalRef.current) {
        clearInterval(typewriterIntervalRef.current);
      }

      typewriterIntervalRef.current = setInterval(() => {
        if (currentIndex < tokens.length) {
          accumulated += tokens[currentIndex];
          currentIndex++;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId
                ? { ...m, content: accumulated, isStreaming: currentIndex < tokens.length }
                : m
            )
          );
        } else {
          if (typewriterIntervalRef.current) {
            clearInterval(typewriterIntervalRef.current);
            typewriterIntervalRef.current = null;
          }
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantMsgId ? { ...m, isStreaming: false } : m))
          );
        }
      }, 16);
    } catch (e: unknown) {
      setLoading(false);
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now() + 1}`,
          role: 'assistant',
          content: isBengali
            ? 'সার্ভারে সাময়িক সমস্যা হচ্ছে। অনুগ্রহ করে পুনরায় চেষ্টা করুন।'
            : 'Error communicating with AI engine. Please check connection and try again.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isOffline: true,
        },
      ]);
    }
  };

  const handleToggleVoice = () => {
    if (isListening) {
      sttListenerRef.current?.stop();
      setIsListening(false);
    } else {
      sttListenerRef.current?.start(language);
      setIsListening(true);
    }
  };

  const handleSpeak = (text: string) => {
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      speakText(text, language).finally(() => setIsSpeaking(false));
    }
  };

  const handleRxUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const result = await scanPrescriptionImage(file);
      setScannedRx(result.data);

      const rxNotice: AIChatMessage = {
        id: `rx-${Date.now()}`,
        role: 'assistant',
        content: isBengali
          ? `📋 **প্রেসক্রিপশন সফলভাবে স্ক্যান করা হয়েছে!**\n\n**রোগী:** ${result.data.patientName || 'N/A'}\n**ঔষধসমূহ:**\n${result.data.medicines.map((m) => `• ${m.name} (${m.dosage || ''})`).join('\n')}\n\n💡 **এআই পরামর্শ:** ${result.clinicalAdvice}\n\nআপনার কোনো প্রশ্ন থাকলে নিচে লিখুন!`
          : `📋 **Prescription Scanned & Analyzed!**\n\n**Patient:** ${result.data.patientName || 'N/A'}\n**Medicines Detected:**\n${result.data.medicines.map((m) => `• ${m.name} (${m.dosage || ''} - ${m.frequency || ''})`).join('\n')}\n\n💡 **Clinical Advisory:** ${result.clinicalAdvice}\n\nFeel free to ask questions about these medicines or dosage instructions!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        hashMatch: true,
        modelUsed: 'CareBridge Clinical RAG',
      };

      setMessages((prev) => [...prev, rxNotice]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTestOllama = async () => {
    setTestingConnection(true);
    setTestResult(null);
    const result = await testOllamaConnection(preferences.ollamaUrl);
    setTestResult(result);
    setTestingConnection(false);
  };

  const handleSaveSettings = () => {
    saveAISettings(preferences);
    setShowSettings(false);
  };

  return (
    <>
      {/* Floating Launcher Trigger */}
      <div className="fixed bottom-6 right-6 z-40 print:hidden">
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="group relative flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-primary-600 via-emerald-600 to-teal-600 text-white shadow-xl shadow-primary-600/30 hover:shadow-2xl hover:shadow-primary-600/40 transition-all"
          >
            <div className="relative">
              <Bot className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 border-2 border-primary-600 rounded-full animate-ping" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 border-2 border-primary-600 rounded-full" />
            </div>
            <span className="font-semibold text-sm tracking-wide">
              {isBengali ? 'কেয়ারব্রিজ এআই' : 'CareBridge AI'}
            </span>
          </motion.button>
        )}
      </div>

      {/* Expandable Chat Drawer or Full Viewport Workspace */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            className={
              isFullViewport
                ? 'fixed inset-0 z-50 w-screen h-screen bg-white dark:bg-[#0B1017] flex flex-col overflow-hidden shadow-2xl'
                : 'fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[94vw] sm:w-[460px] h-[660px] max-h-[88vh] bg-white dark:bg-[#151B26] border border-surface-200 dark:border-[#2A3441] rounded-2xl shadow-2xl flex flex-col overflow-hidden'
            }
          >
              {/* Header */}
              <div className="px-4 py-3 sm:px-6 bg-gradient-to-r from-primary-950 via-surface-900 to-[#121824] text-white flex items-center justify-between border-b border-surface-800 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-base tracking-tight">CareBridge AI</span>
                      <span className="text-xs uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30">
                        {role}
                      </span>
                      {isFullViewport && (
                        <span className="hidden sm:inline-block text-xs px-2 py-0.5 rounded bg-primary-500/20 text-primary-300 font-mono">
                          Full Viewport Workspace
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-surface-400 flex items-center gap-1.5 mt-0.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      Grok • OpenRouter • Gemini • Local Ollama
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIsFullViewport(!isFullViewport)}
                    title={isFullViewport ? 'Collapse to drawer mode' : 'Expand to full viewport workspace'}
                    className="p-2 rounded-xl text-surface-400 hover:text-white hover:bg-white/10 transition-colors focus-ring"
                    style={{ minWidth: '40px', minHeight: '40px' }}
                  >
                    {isFullViewport ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSettings(true)}
                    title={t('aiSettingsBtn')}
                    className="p-2 rounded-xl text-surface-400 hover:text-white hover:bg-white/10 transition-colors focus-ring"
                    style={{ minWidth: '40px', minHeight: '40px' }}
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="p-2 rounded-xl text-surface-400 hover:text-white hover:bg-white/10 transition-colors focus-ring"
                    style={{ minWidth: '40px', minHeight: '40px' }}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto bg-surface-50/50 dark:bg-[#0B1017] p-4 sm:p-6">
                <div className={`space-y-4 mx-auto ${isFullViewport ? 'max-w-4xl' : 'w-full'}`}>
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`rounded-2xl px-4 py-3 leading-relaxed shadow-sm ${
                          isFullViewport ? 'max-w-[80%] text-sm sm:text-base' : 'max-w-[88%] text-xs sm:text-sm'
                        } ${
                          msg.role === 'user'
                            ? 'bg-primary-600 text-white rounded-br-xs'
                            : 'bg-white dark:bg-[#161E2C] text-surface-900 dark:text-surface-100 border border-surface-200 dark:border-[#273447] rounded-bl-xs'
                        }`}
                      >
                        <KatexRenderer content={msg.content} isStreaming={msg.isStreaming} />

                        {/* Metadata & Audio Speak */}
                        <div className="flex items-center justify-between gap-3 mt-2 text-xs opacity-75">
                          <span>{msg.timestamp}</span>
                          {msg.role === 'assistant' && (
                            <div className="flex items-center gap-2">
                              {msg.modelUsed && <span className="font-mono text-[11px]">{msg.modelUsed}</span>}
                              <button
                                type="button"
                                onClick={() => handleSpeak(msg.content)}
                                className="hover:opacity-100 p-1 hover:bg-white/10 rounded transition-all"
                                title="Speak response"
                              >
                                <Volume2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Suggestions */}
                      {msg.suggestions && msg.suggestions.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2.5">
                          {msg.suggestions.map((s, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                if (s.action === 'QUERY') handleSend(s.label);
                                else if (s.action === 'TRIGGER_OCR') fileInputRef.current?.click();
                                else if (s.targetUrl && onOpenBooking && s.targetUrl === '/') onOpenBooking();
                              }}
                              className="px-3 py-1.5 rounded-full text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all font-semibold"
                            >
                              {s.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}

                  {loading && (
                    <div className="flex items-center gap-2.5 text-xs sm:text-sm text-surface-500 dark:text-surface-400 p-3 bg-surface-100/50 dark:bg-white/5 rounded-xl w-fit">
                      <RefreshCw className="w-4 h-4 animate-spin text-primary-500" />
                      <span>{isBengali ? 'কেয়ারব্রিজ এআই বিশ্লেষণ করছে...' : 'CareBridge AI is processing your request...'}</span>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Quick Action Chips */}
              <div className="border-t border-surface-200 dark:border-[#222C3A] bg-surface-100/60 dark:bg-[#121824] px-4 py-2 shrink-0">
                <div className={`flex items-center gap-2 overflow-x-auto text-xs mx-auto ${isFullViewport ? 'max-w-4xl' : 'w-full'}`}>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg bg-surface-200/80 dark:bg-[#1D2535] hover:bg-primary-50 dark:hover:bg-primary-950/30 text-surface-700 dark:text-surface-300 flex items-center gap-1.5 shrink-0 transition-all font-medium"
                  >
                    <Upload className="w-3.5 h-3.5 text-primary-500" />
                    {t('uploadRxBtn')}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSend(isBengali ? 'আইসিইউ ও ইমার্জেন্সি সিট কয়টি খালি?' : 'Check ICU & Emergency bed availability')}
                    className="px-3 py-1.5 rounded-lg bg-surface-200/80 dark:bg-[#1D2535] hover:bg-primary-50 dark:hover:bg-primary-950/30 text-surface-700 dark:text-surface-300 shrink-0 transition-all font-medium"
                  >
                    {isBengali ? 'সিট পরিস্থিতি' : 'Live Beds'}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSend(isBengali ? 'হাসপাতালের ডাক্তারদের তালিকা ও শিডিউল দেখাও' : 'List active doctors and their schedules')}
                    className="px-3 py-1.5 rounded-lg bg-surface-200/80 dark:bg-[#1D2535] hover:bg-primary-50 dark:hover:bg-primary-950/30 text-surface-700 dark:text-surface-300 shrink-0 transition-all font-medium"
                  >
                    {isBengali ? 'ডাক্তার তালিকা' : 'Doctor Directory'}
                  </button>

                  {role === 'CASHIER' && (
                    <button
                      type="button"
                      onClick={() => handleSend(isBengali ? 'আজকের মোট কালেকশন ও আনপেইড ইনভয়েস কত?' : 'Show today revenue and unpaid invoices')}
                      className="px-3 py-1.5 rounded-lg bg-surface-200/80 dark:bg-[#1D2535] hover:bg-primary-50 dark:hover:bg-primary-950/30 text-surface-700 dark:text-surface-300 shrink-0 transition-all font-medium"
                    >
                      {isBengali ? 'কালেকশন সামারি' : 'Revenue Summary'}
                    </button>
                  )}
                </div>
              </div>

              {/* Input Bar */}
              <div className="p-3 sm:p-4 bg-white dark:bg-[#151B26] border-t border-surface-200 dark:border-[#2A3441] shrink-0">
                <div className={`flex items-center gap-2 mx-auto ${isFullViewport ? 'max-w-4xl' : 'w-full'}`}>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleRxUpload}
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={handleToggleVoice}
                    className={`p-2.5 rounded-xl transition-all ${
                      isListening
                        ? 'bg-red-500 text-white animate-pulse'
                        : 'text-surface-500 hover:text-surface-900 dark:hover:text-white hover:bg-surface-100 dark:hover:bg-[#1F2737]'
                    }`}
                    style={{ minWidth: '44px', minHeight: '44px' }}
                    title={isListening ? t('voiceStopBtn') : t('voiceMicBtn')}
                  >
                    {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </button>

                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                    placeholder={t('aiPlaceholder')}
                    className="flex-1 px-4 py-2.5 bg-surface-50 dark:bg-[#111820] border border-surface-200 dark:border-[#2A3441] rounded-xl text-sm text-surface-900 dark:text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                    style={{ minHeight: '44px' }}
                  />

                  <button
                    type="button"
                    onClick={() => handleSend()}
                    disabled={!input.trim() && !scannedRx}
                    className="p-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 disabled:opacity-40 text-white transition-all shadow-md shadow-primary-500/20"
                    style={{ minWidth: '44px', minHeight: '44px' }}
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
        )}
      </AnimatePresence>

      {/* AI Preferences Modal Matching Uploaded User Screenshot */}
      <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-[#0F141C] border border-[#232B39] rounded-2xl shadow-2xl overflow-hidden text-surface-200 p-6 space-y-5"
            >
              <div className="flex items-center justify-between border-b border-[#232B39] pb-3">
                <div>
                  <h3 className="text-lg font-semibold text-white tracking-wide">
                    {t('aiPreferencesTitle')}
                  </h3>
                  <p className="text-xs text-surface-400 mt-0.5">
                    {t('aiPreferencesSub')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSettings(false)}
                  className="p-1.5 rounded-lg text-surface-400 hover:text-white hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Ollama URL */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-medium tracking-wider text-surface-400">
                  {t('ollamaServerUrlLabel')}
                </label>
                <input
                  type="text"
                  value={preferences.ollamaUrl}
                  onChange={(e) => setPreferences({ ...preferences, ollamaUrl: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#161D27] border border-[#2C3647] rounded-xl text-sm font-mono text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <div className="text-[11px] text-surface-400">
                  Use <span className="font-mono text-primary-400">http://YOUR-LAN-IP:11434</span> to chat with Ollama running on another device. Start server with <span className="font-mono text-emerald-400">OLLAMA_HOST=0.0.0.0 ollama serve</span>.
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setPreferences({ ...preferences, ollamaUrl: 'http://localhost:11434' })}
                    className="px-3 py-1.5 rounded-lg bg-[#1D2533] hover:bg-[#283344] text-xs font-medium text-white transition-colors"
                  >
                    {t('useLocalhostBtn')}
                  </button>
                  <button
                    type="button"
                    onClick={handleTestOllama}
                    disabled={testingConnection}
                    className="px-3 py-1.5 rounded-lg bg-[#1D2533] hover:bg-[#283344] text-xs font-medium text-white flex items-center gap-1.5 transition-colors"
                  >
                    {testingConnection && <RefreshCw className="w-3 h-3 animate-spin" />}
                    {t('testConnectionBtn')}
                  </button>
                </div>

                {testResult && (
                  <div className={`p-2.5 rounded-lg text-xs mt-2 border ${testResult.success ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                    {testResult.message}
                  </div>
                )}
              </div>

              {/* System Prompt */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-medium tracking-wider text-surface-400">
                  {t('systemPromptLabel')}
                </label>
                <textarea
                  rows={3}
                  value={preferences.systemPrompt}
                  onChange={(e) => setPreferences({ ...preferences, systemPrompt: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#161D27] border border-[#2C3647] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                />
                <div className="text-[10px] text-surface-500 font-mono uppercase tracking-wider">
                  {t('systemPromptHelp')}
                </div>
              </div>

              {/* Voice Endpoints */}
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-mono font-medium tracking-wider text-surface-400">
                    {t('sttEndpointLabel')}
                  </label>
                  <input
                    type="text"
                    value={preferences.sttEndpoint}
                    onChange={(e) => setPreferences({ ...preferences, sttEndpoint: e.target.value })}
                    placeholder="http://localhost:5005/transcribe"
                    className="w-full px-3.5 py-2 bg-[#161D27] border border-[#2C3647] rounded-xl text-xs font-mono text-white focus:outline-none focus:ring-2 focus:ring-primary-500 mt-1"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono font-medium tracking-wider text-surface-400">
                    {t('ttsEndpointLabel')}
                  </label>
                  <input
                    type="text"
                    value={preferences.ttsEndpoint}
                    onChange={(e) => setPreferences({ ...preferences, ttsEndpoint: e.target.value })}
                    placeholder="http://localhost:5006/speak"
                    className="w-full px-3.5 py-2 bg-[#161D27] border border-[#2C3647] rounded-xl text-xs font-mono text-white focus:outline-none focus:ring-2 focus:ring-primary-500 mt-1"
                  />
                </div>

                <div className="text-[11px] text-surface-500">
                  {t('voiceEndpointsHelp')}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#232B39]">
                <button
                  type="button"
                  onClick={() => setShowSettings(false)}
                  className="px-4 py-2 text-sm text-surface-400 hover:text-white"
                >
                  {t('closeBtn')}
                </button>
                <button
                  type="button"
                  onClick={handleSaveSettings}
                  className="px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-medium shadow-md shadow-primary-500/20"
                >
                  {t('saveSettingsBtn')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
