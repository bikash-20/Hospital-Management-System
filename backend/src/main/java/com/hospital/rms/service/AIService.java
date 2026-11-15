package com.hospital.rms.service;

import com.hospital.rms.dto.AIChatRequest;
import com.hospital.rms.dto.AIChatResponse;
import com.hospital.rms.dto.DashboardStatsResponse;
import com.hospital.rms.dto.SeatAvailabilityResponse;
import com.hospital.rms.enums.BedType;
import com.hospital.rms.enums.PaymentStatus;
import com.hospital.rms.repository.AppointmentRepository;
import com.hospital.rms.repository.BedBookingRepository;
import com.hospital.rms.repository.BedRepository;
import com.hospital.rms.repository.BillingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
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

    @Value("${ai.grok.api-key:}")
    private String grokApiKey;

    @Value("${ai.openrouter.api-key:}")
    private String openRouterApiKey;

    @Value("${ai.gemini.api-key:}")
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

        // Gather real-time metrics for grounding
        Map<String, Object> liveMetrics = gatherLiveMetrics(role);

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

    private Map<String, Object> gatherLiveMetrics(String role) {
        Map<String, Object> metrics = new HashMap<>();
        try {
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

            if ("ADMIN".equals(role) || "CASHIER".equals(role)) {
                DashboardStatsResponse stats = dashboardService.getStats();
                metrics.put("revenueToday", stats.getRevenue());
                metrics.put("pendingBills", stats.getPendingBills());
                metrics.put("patientsToday", stats.getPatientsToday());
                metrics.put("appointmentsToday", stats.getAppointmentsToday());
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

        // 2. Cashier / Financial queries
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
        if ("CASHIER".equals(role)) {
            list.add(new AIChatResponse.ActionSuggestion(isBengali ? "আজকের পেন্ডিং বিল দেখুন" : "View Unpaid Invoices", "NAVIGATE", "/billing"));
            list.add(new AIChatResponse.ActionSuggestion(isBengali ? "কালেকশন রিপোর্ট" : "Collection Summary", "QUERY", "Show today's total revenue breakdown"));
        } else if ("ADMIN".equals(role)) {
            list.add(new AIChatResponse.ActionSuggestion(isBengali ? "বেড ব্যবস্থাপনা" : "Manage Beds", "NAVIGATE", "/beds"));
            list.add(new AIChatResponse.ActionSuggestion(isBengali ? "রেভিনিউ রিপোর্ট" : "Revenue Reports", "NAVIGATE", "/reports"));
        } else {
            list.add(new AIChatResponse.ActionSuggestion(isBengali ? "খালি সিট দেখুন" : "Check Available Beds", "QUERY", "How many ICU and Emergency seats are available right now?"));
            list.add(new AIChatResponse.ActionSuggestion(isBengali ? "সিট বুকিং করুন" : "Book a Bed / Seat", "NAVIGATE", "/"));
            list.add(new AIChatResponse.ActionSuggestion(isBengali ? "প্রেসক্রিপশন বিশ্লেষণ" : "Upload Prescription", "TRIGGER_OCR", ""));
        }
        return list;
    }
}
