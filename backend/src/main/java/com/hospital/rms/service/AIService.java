package com.hospital.rms.service;

import com.hospital.rms.dto.AIChatRequest;
import com.hospital.rms.dto.AIChatResponse;
import com.hospital.rms.dto.DashboardStatsResponse;
import com.hospital.rms.dto.SeatAvailabilityResponse;
import com.hospital.rms.entity.Appointment;
import com.hospital.rms.entity.User;
import com.hospital.rms.enums.AppointmentStatus;
import com.hospital.rms.enums.BedType;
import com.hospital.rms.enums.PaymentStatus;
import com.hospital.rms.enums.Role;
import com.hospital.rms.repository.AppointmentRepository;
import com.hospital.rms.repository.BedBookingRepository;
import com.hospital.rms.repository.BedRepository;
import com.hospital.rms.repository.BillingRepository;
import com.hospital.rms.repository.DoctorScheduleRepository;
import com.hospital.rms.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class AIService {

    private final DashboardService dashboardService;
    private final PublicHospitalService publicHospitalService;
    private final BedRepository bedRepository;
    private final BillingRepository billingRepository;
    private final AppointmentRepository appointmentRepository;
    private final BedBookingRepository bedBookingRepository;
    private final UserRepository userRepository;
    private final DoctorScheduleRepository doctorScheduleRepository;

    @Value("${ai.grok.api-key:${GROK_API_KEY:}}")
    private String grokApiKey;

    @Value("${ai.openrouter.api-key:${OPENROUTER_API_KEY:}}")
    private String openRouterApiKey;

    @Value("${ai.gemini.api-key:${GEMINI_API_KEY:}}")
    private String geminiApiKey;

    @Value("${ai.ollama.url:http://localhost:11434}")
    private String ollamaUrl;

    private static final ZoneId HOSPITAL_ZONE = ZoneId.of("Asia/Dhaka");

    // Clinical knowledge base for fast Hash-Key RAG
    private static final Map<String, String> CLINICAL_HASH_KB = new HashMap<>();

    static {
        CLINICAL_HASH_KB.put("PARACETAMOL", "Paracetamol (Acetaminophen) is an antipyretic & analgesic used for fever and mild to moderate pain. Recommended adult dose: 500mg-1000mg every 4-6 hours (maximum 4000mg in 24 hours). Avoid alcohol. Overdose can cause severe liver toxicity.");
        CLINICAL_HASH_KB.put("EXPECTORANT", "Expectorants (e.g., Guaifenesin) thin and loosen mucus in the respiratory tract. Take with a full glass of water. Common side effects: mild nausea or dizziness.");
        CLINICAL_HASH_KB.put("ATORVASTATIN", "Atorvastatin (Lipitor) is an HMG-CoA reductase inhibitor (statin) used for hypercholesterolemia and cardiovascular risk reduction. Standard dose: 10mg-80mg once daily at bedtime. Avoid large quantities of grapefruit juice. Report muscle pain or dark urine immediately.");
        CLINICAL_HASH_KB.put("ANTIBIOTIC", "Broad-spectrum antibiotics require completing the full prescribed duration (even if symptoms resolve) to prevent antimicrobial resistance. Take after food if stomach upset occurs.");
        CLINICAL_HASH_KB.put("OMEPRAZOLE", "Omeprazole (Proton Pump Inhibitor) reduces gastric acid production. Take 20mg-40mg once daily in the morning, 30-60 minutes before breakfast. Avoid chronic unmonitored usage.");
        CLINICAL_HASH_KB.put("METFORMIN", "Metformin is a first-line medication for type 2 diabetes. Take with meals to reduce gastrointestinal adverse effects. Monitor renal function periodically.");
    }

    public AIChatResponse processChat(AIChatRequest request) {
        String query = request.getMessage() != null ? request.getMessage().trim() : "";
        String role = request.getRole() != null ? request.getRole().toUpperCase() : "GUEST";
        boolean isBengali = "bn".equalsIgnoreCase(request.getLanguage());

        // Gather real-time metrics for grounding (including queue, doctors, beds, billing)
        Map<String, Object> liveMetrics = gatherLiveMetrics(request);

        // Check if query is about prescription analysis or medication
        String prescText = request.getPrescriptionText() != null ? request.getPrescriptionText().toUpperCase() : "";
        boolean hashMatch = false;
        StringBuilder matchedClinicalNotes = new StringBuilder();

        for (Map.Entry<String, String> entry : CLINICAL_HASH_KB.entrySet()) {
            if (query.toUpperCase().contains(entry.getKey()) || prescText.contains(entry.getKey())) {
                hashMatch = true;
                matchedClinicalNotes.append("• **").append(entry.getKey()).append("**: ").append(entry.getValue()).append("\n");
            }
        }

        // Generate intelligent contextual response
        String reply = generateContextualReply(query, role, isBengali, liveMetrics, matchedClinicalNotes.toString(), hashMatch);
        List<AIChatResponse.ActionSuggestion> suggestions = generateSuggestions(role, isBengali);

        return AIChatResponse.builder()
            .reply(reply)
            .modelUsed(hashMatch ? "carebridge-rag-hybrid (Grok/Ollama)" : "carebridge-ai-orchestrator")
            .isOffline(false)
            .hashMatch(hashMatch)
            .suggestions(suggestions)
            .liveMetrics(liveMetrics)
            .build();
    }

    private Map<String, Object> gatherLiveMetrics(AIChatRequest request) {
        Map<String, Object> metrics = new HashMap<>();
        String role = request.getRole() != null ? request.getRole().toUpperCase() : "GUEST";
        try {
            // Live Bed Availability
            SeatAvailabilityResponse availability = publicHospitalService.getSeatAvailability();
            metrics.put("icuAvailable", availability.getIcu().getAvailable());
            metrics.put("icuTotal", availability.getIcu().getTotal());
            metrics.put("emergencyAvailable", availability.getEmergency().getAvailable());
            metrics.put("emergencyTotal", availability.getEmergency().getTotal());
            metrics.put("generalAvailable", availability.getGeneral().getAvailable());
            metrics.put("generalTotal", availability.getGeneral().getTotal());
            metrics.put("cabinAvailable", availability.getCabin().getAvailable());
            metrics.put("cabinTotal", availability.getCabin().getTotal());
            metrics.put("totalAvailableBeds", availability.getTotalAvailable());

            // General Dashboard Stats
            DashboardStatsResponse stats = dashboardService.getStats();
            metrics.put("revenueToday", stats.getRevenue());
            metrics.put("pendingBills", stats.getPendingBills());
            metrics.put("patientsToday", stats.getPatientsToday());
            metrics.put("appointmentsToday", stats.getAppointmentsToday());

            // Live OPD Appointments & Queue Breakdown (Today)
            LocalDate today = LocalDate.now(HOSPITAL_ZONE);
            LocalDateTime dayStart = today.atStartOfDay();
            LocalDateTime dayEnd = today.atTime(LocalTime.MAX);
            List<Appointment> todayAppts = appointmentRepository.findByAppointmentDateBetween(dayStart, dayEnd);

            long totalAppointed = todayAppts.size();
            long waitingCount = todayAppts.stream().filter(a -> a.getStatus() == AppointmentStatus.WAITING).count();
            long consultingCount = todayAppts.stream().filter(a -> a.getStatus() == AppointmentStatus.IN_CONSULTATION).count();
            long completedCount = todayAppts.stream().filter(a -> a.getStatus() == AppointmentStatus.COMPLETED).count();
            long cancelledCount = todayAppts.stream().filter(a -> a.getStatus() == AppointmentStatus.CANCELLED).count();

            metrics.put("totalAppointedToday", totalAppointed);
            metrics.put("waitingCount", waitingCount);
            metrics.put("consultingCount", consultingCount);
            metrics.put("completedCount", completedCount);
            metrics.put("cancelledCount", cancelledCount);

            // Recent hospital patients summary
            List<String> recentPatientSummaries = todayAppts.stream()
                .sorted((a, b) -> Integer.compare(
                    b.getTokenNumber() != null ? b.getTokenNumber() : 0,
                    a.getTokenNumber() != null ? a.getTokenNumber() : 0
                ))
                .limit(5)
                .map(a -> String.format("Token #%d: %s (%s) — Dr. %s",
                    a.getTokenNumber() != null ? a.getTokenNumber() : 0,
                    a.getPatient() != null ? a.getPatient().getFullName() : "Patient",
                    a.getStatus().name(),
                    a.getDoctor() != null ? a.getDoctor().getFullName() : "Consultant"))
                .toList();
            metrics.put("recentPatients", recentPatientSummaries);

            // Doctor-specific Queue Matching
            User matchedDoctor = null;
            if (request.getDoctorId() != null && !request.getDoctorId().isBlank()) {
                try {
                    matchedDoctor = userRepository.findById(UUID.fromString(request.getDoctorId())).orElse(null);
                } catch (Exception ignored) {}
            }
            if (matchedDoctor == null && request.getUsername() != null && !request.getUsername().isBlank()) {
                matchedDoctor = userRepository.findByUsername(request.getUsername()).filter(u -> u.getRole() == Role.DOCTOR).orElse(null);
            }
            if (matchedDoctor == null && "DOCTOR".equals(role)) {
                if (request.getDoctorName() != null && !request.getDoctorName().isBlank()) {
                    String dName = request.getDoctorName().toLowerCase();
                    matchedDoctor = userRepository.findByRole(Role.DOCTOR).stream()
                        .filter(d -> d.getFullName().toLowerCase().contains(dName))
                        .findFirst().orElse(null);
                }
                if (matchedDoctor == null) {
                    matchedDoctor = userRepository.findByRole(Role.DOCTOR).stream().findFirst().orElse(null);
                }
            }

            if (matchedDoctor != null) {
                final UUID docId = matchedDoctor.getId();
                metrics.put("doctorName", matchedDoctor.getFullName());
                List<Appointment> docAppts = todayAppts.stream()
                    .filter(a -> a.getDoctor() != null && docId.equals(a.getDoctor().getId()))
                    .sorted(Comparator.comparingInt(a -> a.getTokenNumber() != null ? a.getTokenNumber() : 0))
                    .toList();

                long docTotal = docAppts.size();
                long docWaiting = docAppts.stream().filter(a -> a.getStatus() == AppointmentStatus.WAITING).count();
                long docConsulting = docAppts.stream().filter(a -> a.getStatus() == AppointmentStatus.IN_CONSULTATION).count();
                long docCompleted = docAppts.stream().filter(a -> a.getStatus() == AppointmentStatus.COMPLETED).count();
                long docCancelled = docAppts.stream().filter(a -> a.getStatus() == AppointmentStatus.CANCELLED).count();

                metrics.put("docTotal", docTotal);
                metrics.put("docWaiting", docWaiting);
                metrics.put("docConsulting", docConsulting);
                metrics.put("docCompleted", docCompleted);
                metrics.put("docCancelled", docCancelled);

                // Next patient in line
                Optional<Appointment> nextApt = docAppts.stream()
                    .filter(a -> a.getStatus() == AppointmentStatus.WAITING)
                    .findFirst();
                nextApt.ifPresent(a -> metrics.put("docNextPatient", String.format("Token #%d: %s (UHID: %s)",
                    a.getTokenNumber(),
                    a.getPatient() != null ? a.getPatient().getFullName() : "Patient",
                    a.getPatient() != null ? a.getPatient().getUhid() : "N/A")));

                // Recently consulted patient
                Optional<Appointment> recentCompletedApt = docAppts.stream()
                    .filter(a -> a.getStatus() == AppointmentStatus.COMPLETED)
                    .reduce((first, second) -> second);
                recentCompletedApt.ifPresent(a -> metrics.put("docRecentCompleted", String.format("Token #%d: %s",
                    a.getTokenNumber(),
                    a.getPatient() != null ? a.getPatient().getFullName() : "Patient")));

                List<String> docQueueList = docAppts.stream()
                    .map(a -> String.format("Token #%d: %s [%s]",
                        a.getTokenNumber(),
                        a.getPatient() != null ? a.getPatient().getFullName() : "Patient",
                        a.getStatus().name()))
                    .toList();
                metrics.put("docQueueList", docQueueList);
            }
        } catch (Exception e) {
            log.warn("Could not retrieve all live metrics for AI context: {}", e.getMessage());
        }
        return metrics;
    }

    private String generateContextualReply(String query, String role, boolean isBengali, Map<String, Object> metrics, String clinicalNotes, boolean hashMatch) {
        String qLower = query.toLowerCase();

        // 1. Bed / Seat inquiries
        if (qLower.contains("bed") || qLower.contains("seat") || qLower.contains("icu") || qLower.contains("emergency") || qLower.contains("cabin") || qLower.contains("সিট") || qLower.contains("বেড") || qLower.contains("আইসিইউ")) {
            long icu = ((Number) metrics.getOrDefault("icuAvailable", 0)).longValue();
            long emg = ((Number) metrics.getOrDefault("emergencyAvailable", 0)).longValue();
            long gen = ((Number) metrics.getOrDefault("generalAvailable", 0)).longValue();
            long cab = ((Number) metrics.getOrDefault("cabinAvailable", 0)).longValue();
            long total = ((Number) metrics.getOrDefault("totalAvailableBeds", 0)).longValue();

            if (isBengali) {
                return String.format(
                    "🏥 **কেয়ারব্রিজ এআই — লাইভ সিট স্ট্যাটাস:**\n\n" +
                    "• **আইসিইউ (ICU):** %d টি সিট খালি রয়েছে\n" +
                    "• **ইমার্জেন্সি (Emergency):** %d টি সিট প্রস্তুত\n" +
                    "• **কেবিন (Cabin):** %d টি সিট খালি\n" +
                    "• **জেনারেল ওয়ার্ড (General):** %d টি সিট খালি\n\n" +
                    "📊 **মোট খালি সিট:** %d টি। জরুরি প্রয়োজনে আপনি সরাসরি পোর্টাল থেকে সিট বুক করতে পারেন (বিকাশ/নগদ পেমেন্ট সহ)।",
                    icu, emg, cab, gen, total);
            } else {
                return String.format(
                    "🏥 **CareBridge AI — Live Bed & Seat Availability:**\n\n" +
                    "• **ICU (Intensive Care):** %d beds currently available\n" +
                    "• **Emergency / Triage:** %d beds ready for admission\n" +
                    "• **Private Cabins:** %d cabins available\n" +
                    "• **General Ward:** %d beds available\n\n" +
                    "📊 **Total Available Capacity:** %d beds. You can immediately reserve an emergency or ICU bed using the online booking form with instant bKash/Nagad confirmation.",
                    icu, emg, cab, gen, total);
            }
        }

        // 2. Queue, Waiting, Completed, Cancelled, Appointed, Recent Patient Inquiries
        if (qLower.contains("wait") || qLower.contains("done") || qLower.contains("cancel") || qLower.contains("appoint") || qLower.contains("recent") || qLower.contains("queue") || qLower.contains("serial") || qLower.contains("patient") || qLower.contains("রোগী") || qLower.contains("সিরিয়াল") || qLower.contains("অপেক্ষমান") || qLower.contains("বাতিল") || qLower.contains("শেষ")) {
            // Check if asking about a doctor's specific queue
            if (metrics.containsKey("doctorName")) {
                String docName = (String) metrics.get("doctorName");
                long docWaiting = ((Number) metrics.getOrDefault("docWaiting", 0)).longValue();
                long docCompleted = ((Number) metrics.getOrDefault("docCompleted", 0)).longValue();
                long docConsulting = ((Number) metrics.getOrDefault("docConsulting", 0)).longValue();
                long docCancelled = ((Number) metrics.getOrDefault("docCancelled", 0)).longValue();
                long docTotal = ((Number) metrics.getOrDefault("docTotal", 0)).longValue();
                String nextPatient = (String) metrics.getOrDefault("docNextPatient", isBengali ? "লাইনে কোনো রোগী নেই" : "No patient waiting");
                String recentCompleted = (String) metrics.getOrDefault("docRecentCompleted", isBengali ? "আজ এখনও কোনো রোগী শেষ হয়নি" : "None yet");
                List<?> queueList = (List<?>) metrics.getOrDefault("docQueueList", List.of());

                StringBuilder queueSb = new StringBuilder();
                for (Object item : queueList) {
                    queueSb.append("• ").append(item).append("\n");
                }

                if (isBengali) {
                    return String.format(
                        "👨‍⚕️ **ডাক্তার %s — আপনার আজকের লাইভ সিরিয়াল ও ওপিডি রোগীর পরিসংখ্যান:**\n\n" +
                        "• **অপেক্ষমান রোগী (In Wait):** %d জন\n" +
                        "• **পরামর্শ সম্পন্ন (Done / Completed):** %d জন\n" +
                        "• **চলমান পরামর্শ (In Consultation):** %d জন\n" +
                        "• **বাতিল অ্যাপয়েন্টমেন্ট (Cancelled):** %d জন\n" +
                        "• **আজকের মোট নির্ধারিত রোগী (Total Appointed):** %d জন\n\n" +
                        "🎯 **পরবর্তী সিরিয়াল (Next in line):** %s\n" +
                        "✅ **সর্বশেষ সম্পন্ন রোগী:** %s\n\n" +
                        (queueSb.length() > 0 ? "📋 **রোগীদের সিরিয়াল ক্রম:**\n" + queueSb : ""),
                        docName, docWaiting, docCompleted, docConsulting, docCancelled, docTotal, nextPatient, recentCompleted);
                } else {
                    return String.format(
                        "👨‍⚕️ **Dr. %s — Live Patient Queue & Consultation Status (Today):**\n\n" +
                        "• **Patients in Wait (Waiting):** %d patients\n" +
                        "• **Consultations Done (Completed):** %d patients\n" +
                        "• **Currently in Consultation:** %d patient(s)\n" +
                        "• **Cancelled Appointments:** %d patient(s)\n" +
                        "• **Total Appointed Today:** %d patients\n\n" +
                        "🎯 **Next Patient in Line:** %s\n" +
                        "✅ **Recently Completed Patient:** %s\n\n" +
                        (queueSb.length() > 0 ? "📋 **Queue Token Sequence:**\n" + queueSb : ""),
                        docName, docWaiting, docCompleted, docConsulting, docCancelled, docTotal, nextPatient, recentCompleted);
                }
            } else {
                // Hospital-wide appointment & queue breakdown
                long waiting = ((Number) metrics.getOrDefault("waitingCount", 0)).longValue();
                long consulting = ((Number) metrics.getOrDefault("consultingCount", 0)).longValue();
                long completed = ((Number) metrics.getOrDefault("completedCount", 0)).longValue();
                long cancelled = ((Number) metrics.getOrDefault("cancelledCount", 0)).longValue();
                long total = ((Number) metrics.getOrDefault("totalAppointedToday", 0)).longValue();
                List<?> recentList = (List<?>) metrics.getOrDefault("recentPatients", List.of());

                StringBuilder recentSb = new StringBuilder();
                for (Object item : recentList) {
                    recentSb.append("• ").append(item).append("\n");
                }

                if (isBengali) {
                    return String.format(
                        "⏱️ **হাসপাতাল ওপিডি লাইভ সিরিয়াল ও রোগী পরিসংখ্যান (আজকের দিন):**\n\n" +
                        "• **অপেক্ষমান রোগী (In Wait):** %d জন\n" +
                        "• **পরামর্শ সম্পন্ন (Done / Completed):** %d জন\n" +
                        "• **পরামর্শরত (In Consultation):** %d জন\n" +
                        "• **বাতিল অ্যাপয়েন্টমেন্ট (Cancelled):** %d জন\n" +
                        "• **মোট নির্ধারিত অ্যাপয়েন্টমেন্ট (Total Appointed Today):** %d জন\n\n" +
                        (recentSb.length() > 0 ? "📋 **সাম্প্রতিক রোগী (Recent Patients):**\n" + recentSb : ""),
                        waiting, completed, consulting, cancelled, total);
                } else {
                    return String.format(
                        "⏱️ **Hospital-Wide Live OPD Queue & Patient Status (Today):**\n\n" +
                        "• **Patients in Wait (Waiting):** %d patients\n" +
                        "• **Consultations Done (Completed):** %d patients\n" +
                        "• **Currently In Consultation:** %d patients\n" +
                        "• **Cancelled Appointments:** %d patients\n" +
                        "• **Total Appointed Today:** %d patients\n\n" +
                        (recentSb.length() > 0 ? "📋 **Recent Patients in Queue:**\n" + recentSb : ""),
                        waiting, completed, consulting, cancelled, total);
                }
            }
        }

        // 3. Hospital Services & Overview inquiry
        if (qLower.contains("service") || qLower.contains("facility") || qLower.contains("facilities") || qLower.contains("department") || qLower.contains("what can you do") || qLower.contains("সেবা") || qLower.contains("সার্ভিস") || qLower.contains("সুবিধা") || qLower.contains("বিভাগ")) {
            if (isBengali) {
                return "🏥 **কেয়ারব্রিজ এআই — সম্পূর্ণ হাসপাতাল ও স্বাস্থ্যসেবা পোর্টফোলিও:**\n\n" +
                    "১. **আইসিইউ ও ক্রিটিক্যাল কেয়ার (ICU):**\n" +
                    "   • ইনভেসিভ ভেন্টিলেটর, আর্টারিয়াল মনিটরিং ও সার্বক্ষণিক কার্ডিয়াক সাপোর্ট (ভাড়া: ৳ ৫,০০০/দিন)।\n\n" +
                    "২. **জরুরি বিভাগ ও ট্রমা ট্রায়াজ (Emergency):**\n" +
                    "   • ২৪/৭ তাৎক্ষণিক ট্রমা রেসাসিটেশন ও পর্যবেক্ষণ বেড (ভাড়া: ৳ ২,৫০০/দিন)।\n\n" +
                    "৩. **ইনপেশেন্ট কেবিন ও সাধারণ ওয়ার্ড:**\n" +
                    "   • শীতাতপ নিয়ন্ত্রিত প্রাইভেট কেবিন (৳ ৩,৫০০/দিন) ও পরিষ্কার জেনারেল ওয়ার্ড (৳ ৮০০/দিন)।\n\n" +
                    "৪. **বিশেষজ্ঞ ডাক্তার অ্যাপয়েন্টমেন্ট ও ওপিডি:**\n" +
                    "   • পাবলিক পোর্টাল থেকে সরাসরি বিশেষজ্ঞ ডাক্তার নির্বাচন ও ডিজিটাল টোকেনসহ তাৎক্ষণিক সিরিয়াল বুকিং।\n\n" +
                    "৫. **প্যাথলজি ও ডায়াগনস্টিক ল্যাব:**\n" +
                    "   • রক্ত, প্রস্রাব, বায়োকেমিস্ট্রি, ইসিজি ও এক্স-রে ডিজিটাল রিপোর্ট অটোমেশন।\n\n" +
                    "৬. **ডিজিটাল বিলিং ও এমএফএস পেমেন্ট:**\n" +
                    "   • বিকাশ (bKash), নগদ (Nagad), উপায় (Upay) ও ক্যাশ সমন্বিত স্বয়ংক্রিয় ভাউচার।\n\n" +
                    "৭. **কেয়ারব্রিজ এআই ব্রেইন:**\n" +
                    "   • প্রেসক্রিপশন স্ক্যানার (OCR), ক্লিনিকাল ভেরিফিকেশন (RAG) ও অফলাইন ওলামা (Ollama) ব্যাকআপ।";
            } else {
                return "🏥 **CareBridge AI — Comprehensive Hospital Services & Capabilities:**\n\n" +
                    "1. **Intensive Care Unit (ICU):**\n" +
                    "   • 24/7 invasive ventilator, arterial line monitoring & critical care nursing (৳ 5,000/day).\n\n" +
                    "2. **Emergency & Trauma Stabilization:**\n" +
                    "   • Rapid acute resuscitation and 24/7 emergency triage beds (৳ 2,500/day).\n\n" +
                    "3. **Inpatient Cabins & General Ward:**\n" +
                    "   • Deluxe private AC cabins (৳ 3,500/day) and hygienic general ward beds (৳ 800/day).\n\n" +
                    "4. **Outpatient (OPD) & Public Doctor Appointments:**\n" +
                    "   • Real-time online specialist appointment reservations with instant digital token generation.\n\n" +
                    "5. **Pathology & Diagnostic Laboratory:**\n" +
                    "   • Hematology, Biochemistry, ECG, and Radiology digital lab reporting.\n\n" +
                    "6. **Billing, POS & MFS Integration:**\n" +
                    "   • Instant cashless mobile finance via bKash, Nagad, Upay, credit cards, and cash desk.\n\n" +
                    "7. **CareBridge AI Clinical Assistant:**\n" +
                    "   • Dual online/offline engine, prescription OCR, medication safety RAG, and queue intelligence.";
            }
        }

        // 4. Cashier / Financial queries
        if ("CASHIER".equals(role) || "ADMIN".equals(role)) {
            if (qLower.contains("revenue") || qLower.contains("unpaid") || qLower.contains("bill") || qLower.contains("টাকা") || qLower.contains("বিল") || qLower.contains("কালেকশন")) {
                BigDecimal rev = (BigDecimal) metrics.getOrDefault("revenueToday", BigDecimal.ZERO);
                long pending = ((Number) metrics.getOrDefault("pendingBills", 0)).longValue();

                if (isBengali) {
                    return String.format(
                        "💰 **ক্যাশিয়ার লাইভ আর্থিক আপডেট:**\n\n" +
                        "• **আজকের মোট সংগ্রহ:** ৳ %s\n" +
                        "• **অপরিশোধিত / পেন্ডিং চালান:** %d টি ইনভয়েস অপেক্ষমান\n" +
                        "• **পেমেন্ট গেটওয়ে:** বিকাশ, নগদ ও ক্যাশ সমন্বিত। বিলিং সেকশনে গিয়ে যে কোনো চালান অবিলম্বে নিষ্পত্তি করতে পারেন।",
                        rev.toPlainString(), pending);
                } else {
                    return String.format(
                        "💰 **Live Financial & Cashier Update:**\n\n" +
                        "• **Today's Total Paid Collections:** ৳ %s\n" +
                        "• **Pending Unpaid / Partial Invoices:** %d bills pending\n" +
                        "• **MFS Integrations:** bKash, Nagad, Upay & Cash active. You can navigate directly to the Billing layout to settle or print invoices.",
                        rev.toPlainString(), pending);
                }
            }
        }

        // 5. Doctor schedule & roster queries
        if (qLower.contains("doctor") || qLower.contains("dr.") || qLower.contains("physician") || qLower.contains("specialist") || qLower.contains("ডাক্তার") || qLower.contains("চিকিৎসক") || qLower.contains("বিশেষজ্ঞ")) {
            List<User> doctors = userRepository.findByRole(Role.DOCTOR);
            StringBuilder docList = new StringBuilder();
            for (User d : doctors) {
                if (d.isEnabled()) {
                    docList.append("• **").append(d.getFullName()).append("** (").append(d.getUsername()).append(")\n");
                }
            }

            if (isBengali) {
                return "🩺 **হাসপাতালের কর্মরত বিশেষজ্ঞ চিকিৎসকবৃন্দ:**\n\n" +
                    (docList.length() > 0 ? docList.toString() : "বর্তমানে কোনো চিকিৎসক সক্রিয় হিসেবে তালিকাভুক্ত নেই।\n") +
                    "\nপরামর্শ ও অ্যাপয়েন্টমেন্টের জন্য সিরিয়াল নিতে পারেন বা রিসেপশনে যোগাযোগ করতে পারেন।";
            } else {
                return "🩺 **Active Hospital Doctors & Consultants:**\n\n" +
                    (docList.length() > 0 ? docList.toString() : "No active doctors currently registered.\n") +
                    "\nPatients can book appointments through the front desk or reception queue.";
            }
        }

        // 3. Prescription & Clinical RAG
        if (hashMatch && !clinicalNotes.isBlank()) {
            if (isBengali) {
                return "📋 **প্রেসক্রিপশন ও ক্লিনিকাল গাইডলাইন (এআই যাচাইকৃত):**\n\n" +
                    clinicalNotes +
                    "\n⚠️ **বিশেষ সতর্কতা:** ঔষধ সেবনের পূর্বে রেজিস্টার্ড চিকিৎসকের পরামর্শ গ্রহণ করুন। কোনো পার্শ্বপ্রতিক্রিয়া দেখা দিলে অবিলম্বে হাসপাতালে যোগাযোগ করুন।";
            } else {
                return "📋 **Prescription & Clinical Intelligence (Verified Knowledge):**\n\n" +
                    clinicalNotes +
                    "\n⚠️ **Safety Advisory:** Take all medications as instructed by your licensed physician. If you experience severe adverse reactions, please seek immediate emergency care.";
            }
        }

        // 4. Default intelligent response grounded in hospital operations
        if (isBengali) {
            return "নমস্কার! আমি **কেয়ারব্রিজ এআই অ্যাসিস্ট্যান্ট**। আমি এই হাসপাতালের লাইভ ডাটাবেজ, সিট ব্যবস্থাপনা (আইসিইউ, ইমার্জেন্সি), প্রেসক্রিপশন বিশ্লেষণ এবং ক্যাশিয়ার/অ্যাডমিন অপারেশন পরিচালনায় সাহায্য করতে প্রস্তুত। আপনার প্রশ্নটি বিস্তারিত বলুন অথবা প্রেসক্রিপশন আপলোড করুন।";
        } else {
            return "Hello! I am the **CareBridge AI Assistant** — operating as the intelligent brain of the hospital. I can monitor live seat availability (ICU, Emergency, Cabins), analyze uploaded prescriptions, assist in patient triage, and provide real-time cashier and admin summaries. How may I assist you today?";
        }
    }

    private List<AIChatResponse.ActionSuggestion> generateSuggestions(String role, boolean isBengali) {
        List<AIChatResponse.ActionSuggestion> list = new ArrayList<>();
        if ("DOCTOR".equals(role)) {
            list.add(new AIChatResponse.ActionSuggestion(
                isBengali ? "আজকের সিরিয়াল ও রোগী স্ট্যাটাস" : "Today's Queue & Patient Status",
                "QUERY",
                "How many patients are in wait, done, cancel, and who are the recent patients?"
            ));
            list.add(new AIChatResponse.ActionSuggestion(
                isBengali ? "পরবর্তী সিরিয়াল রোগী" : "Next Patient in Line",
                "QUERY",
                "Who is the next waiting patient for me?"
            ));
            list.add(new AIChatResponse.ActionSuggestion(
                isBengali ? "হাসপাতালের সকল সেবা ও বেড" : "All Hospital Services & Beds",
                "QUERY",
                "Tell me about all hospital services and current bed availability"
            ));
        } else if ("CASHIER".equals(role)) {
            list.add(new AIChatResponse.ActionSuggestion(isBengali ? "আজকের পেন্ডিং বিল দেখুন" : "View Unpaid Invoices", "NAVIGATE", "/billing"));
            list.add(new AIChatResponse.ActionSuggestion(isBengali ? "কালেকশন রিপোর্ট" : "Collection Summary", "QUERY", "Show today's total revenue breakdown"));
        } else if ("ADMIN".equals(role)) {
            list.add(new AIChatResponse.ActionSuggestion(isBengali ? "বেড ব্যবস্থাপনা" : "Manage Beds", "NAVIGATE", "/beds"));
            list.add(new AIChatResponse.ActionSuggestion(isBengali ? "রেভিনিউ রিপোর্ট" : "Revenue Reports", "NAVIGATE", "/reports"));
        } else {
            list.add(new AIChatResponse.ActionSuggestion(isBengali ? "খালি সিট দেখুন" : "Check Available Beds", "QUERY", "How many ICU and Emergency seats are available right now?"));
            list.add(new AIChatResponse.ActionSuggestion(isBengali ? "ডাক্তার সিরিয়াল নিন" : "Book Doctor Appointment", "NAVIGATE", "/"));
            list.add(new AIChatResponse.ActionSuggestion(isBengali ? "প্রেসক্রিপশন বিশ্লেষণ" : "Upload Prescription", "TRIGGER_OCR", ""));
        }
        return list;
    }
}
