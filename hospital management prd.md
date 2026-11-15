# Product Requirement Document (PRD)

**Project Name:** CareBridge AI (Intelligent Hospital Operating System)  
**Target Environment:** Clinics & Regional Hospitals with Dual Online/Offline AI Capabilities  
**Deployment Model:** Dual Online (Render, Vercel, Supabase) & Local Offline (Ollama, Whisper, Piper)

---

## 1. Executive Summary & Objective

CareBridge AI is a personal AI-based hospital operating system that unifies hospital operations while providing free, accessible AI health services to the public. 

Patients and visitors can explore the entire hospital system without logging in, monitor real-time seat availability across **ICU**, **Emergency**, **General Ward**, and **Private Cabins**, and reserve beds with instant confirmation and digital receipts backed by local mobile financial services (bKash, Nagad, Upay).

General users can upload prescriptions for instant OCR and clinical RAG analysis (extracting medications, dosages, precautions, and dietary guidance) for free. When severe medical issues arise, users can seamlessly transition to hospital admission. Hospital staff (Admin, Cashier, Doctor, Receptionist, Lab Technician) operate through dedicated workspaces, all accelerated by role-tailored AI assistants.

---

## 2. Target Audience & Roles

* **Public / Guest / Patient:** Non-authenticated live seat monitoring, online bed reservation, prescription OCR upload, free AI health assistance, token tracking.
* **Receptionist:** Admission triage, bed dispatch, OPD appointment booking, patient registration.
* **Doctor:** Electronic Health Record (EHR) entry, prescription writing, lab ordering, clinical AI copilot.
* **Lab Technician:** Diagnostic processing, result entry, lab test updates.
* **Cashier:** Invoice settlement, bKash/Nagad reconciliation, discount approvals, AI financial summaries.
* **Admin:** Operational audit logs, revenue analytics, real-time bed & ICU capacity management.

---

## 3. Core System Capabilities

### 3.1 Dual Online & Offline AI Architecture
- **Online Cascading Mode:** Grok $\rightarrow$ OpenRouter (Free tier) $\rightarrow$ Google Gemini $\rightarrow$ Local Ollama.
- **Offline Self-Contained Mode:** Operates with local Ollama (`http://localhost:11434`), Whisper (`http://localhost:5005/transcribe`), Piper (`http://localhost:5006/speak`), and client-side Hash-Key clinical RAG.
- **Voice AI:** Speech-to-Text (STT) and Text-to-Speech (TTS) with ElevenLabs and browser synthesis fallbacks.

### 3.2 Live Seat & Bed Tracking
- Live availability counters for **ICU**, **Emergency**, **General Ward**, and **Cabins**.
- Immediate automated bed assignment if inventory exists.
- Printable & downloadable **Digital Admission Receipt** with QR validation.

### 3.3 Local Mobile Financial Services (MFS)
- Integrated demo payment gateways for **bKash (বিকাশ)**, **Nagad (নগদ)**, and **Upay (উপায়)**.
- Automated TrxID generation and invoice linkage.

### 3.4 Bilingual Support (i18n)
- Seamless English and Bengali (**বাংলা**) toggle across the public portal, booking flows, receipts, and AI assistant.
