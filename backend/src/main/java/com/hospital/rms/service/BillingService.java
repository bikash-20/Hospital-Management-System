package com.hospital.rms.service;

import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;
import com.hospital.rms.dto.BillingRequest;
import com.hospital.rms.dto.BillingResponse;
import com.hospital.rms.dto.PatientResponse;
import com.hospital.rms.entity.Billing;
import com.hospital.rms.entity.Patient;
import com.hospital.rms.enums.PaymentStatus;
import com.hospital.rms.repository.BillingRepository;
import com.hospital.rms.repository.PatientRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class BillingService {

    /** Key for the invoice-number sequence in `sequence_counters`. Date-suffixed to
     *  keep each day's series independent; collisions across days are therefore
     *  impossible by construction. */
    private static final String INVOICE_SEQ_KEY_PREFIX = "invoice:";

    private final BillingRepository billingRepository;
    private final PatientRepository patientRepository;
    private final SequenceService sequenceService;
    private final ObjectMapper objectMapper;

    @Transactional
    public BillingResponse createInvoice(BillingRequest request) {
        Patient patient = patientRepository.findById(request.getPatientId())
            .orElseThrow(() -> new IllegalArgumentException("Patient not found"));

        String invoiceNumber = generateInvoiceNumber();

        BigDecimal total = calculateTotal(request.getLineItems());
        BigDecimal discount = request.getDiscount() != null ? request.getDiscount() : BigDecimal.ZERO;
        BigDecimal finalAmount = total.subtract(discount).max(BigDecimal.ZERO);

        Billing billing = Billing.builder()
            .patient(patient)
            .invoiceNumber(invoiceNumber)
            .totalAmount(total)
            .discount(discount)
            .paidAmount(BigDecimal.ZERO)
            .status(finalAmount.signum() == 0 ? PaymentStatus.PAID : PaymentStatus.UNPAID)
            .lineItems(request.getLineItems())
            .build();

        Billing saved = billingRepository.save(billing);
        return toResponse(saved);
    }

    @Transactional
    public BillingResponse processPayment(UUID billingId, BigDecimal amount) {
        if (amount == null || amount.signum() <= 0) {
            throw new IllegalArgumentException("Payment amount must be positive");
        }
        Billing billing = billingRepository.findById(billingId)
            .orElseThrow(() -> new IllegalArgumentException("Billing not found: " + billingId));

        BigDecimal newPaid = billing.getPaidAmount().add(amount);
        billing.setPaidAmount(newPaid);

        BigDecimal dueAmount = billing.getTotalAmount().subtract(billing.getDiscount());
        if (newPaid.compareTo(dueAmount) >= 0) {
            billing.setStatus(PaymentStatus.PAID);
        } else if (newPaid.compareTo(BigDecimal.ZERO) > 0) {
            billing.setStatus(PaymentStatus.PARTIAL);
        }

        Billing saved = billingRepository.save(billing);
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<BillingResponse> getByPatient(UUID patientId) {
        return billingRepository.findByPatientIdOrderByCreatedDateDesc(patientId).stream()
            .map(this::toResponse)
            .toList();
    }

    @Transactional(readOnly = true)
    public List<BillingResponse> getUnpaid(int page, int size) {
        return billingRepository.findByStatus(PaymentStatus.UNPAID, pageRequest(page, size)).stream()
            .map(this::toResponse)
            .toList();
    }

    @Transactional(readOnly = true)
    public List<BillingResponse> getAll(int page, int size) {
        return billingRepository.findAll(pageRequest(page, size)).stream()
            .map(this::toResponse)
            .toList();
    }

    private PageRequest pageRequest(int page, int size) {
        return PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100),
            Sort.by(Sort.Direction.DESC, "createdDate"));
    }

    /**
     * Allocate a daily invoice number from the database-backed sequence counter.
     * Survives restarts and is safe across multiple JVM instances (the
     * pessimistic DB lock in {@link SequenceService} provides serialization).
     */
    private String generateInvoiceNumber() {
        String dateStr = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        long seq = sequenceService.next(INVOICE_SEQ_KEY_PREFIX + dateStr, 0L);
        return "INV-" + dateStr + "-" + String.format("%04d", seq);
    }

    /**
     * Compute the total from the line-items JSON.
     * <p>Accepts the existing wire format:
     * <pre>[{"description":"...","quantity":1,"unitPrice":800,"total":800}, ...]</pre>
     * Sums the {@code total} field. If the JSON is malformed or the array is empty,
     * returns {@link BigDecimal#ZERO} and lets the caller decide (we still persist
     * a zero-total invoice as PAID so the audit trail is intact).
     */
    private BigDecimal calculateTotal(String lineItemsJson) {
        if (lineItemsJson == null || lineItemsJson.isBlank()) {
            return BigDecimal.ZERO;
        }
        try {
            List<Map<String, Object>> items = objectMapper.readValue(
                lineItemsJson, new TypeReference<List<Map<String, Object>>>() {});
            BigDecimal sum = BigDecimal.ZERO;
            for (Map<String, Object> item : items) {
                Object total = item.get("total");
                if (total == null) continue;
                BigDecimal line;
                if (total instanceof Number n) {
                    line = BigDecimal.valueOf(n.doubleValue());
                } else {
                    line = new BigDecimal(total.toString());
                }
                sum = sum.add(line);
            }
            return sum;
        } catch (Exception e) {
            log.warn("Failed to parse lineItems JSON: {}", e.getMessage());
            throw new IllegalArgumentException("Malformed lineItems JSON: " + e.getMessage());
        }
    }

    private BillingResponse toResponse(Billing b) {
        PatientResponse patientResponse = PatientResponse.builder()
            .id(b.getPatient().getId())
            .uhid(b.getPatient().getUhid())
            .fullName(b.getPatient().getFullName())
            .mobileNumber(b.getPatient().getMobileNumber())
            .dob(b.getPatient().getDob())
            .gender(b.getPatient().getGender())
            .build();

        return BillingResponse.builder()
            .id(b.getId())
            .patient(patientResponse)
            .invoiceNumber(b.getInvoiceNumber())
            .totalAmount(b.getTotalAmount())
            .discount(b.getDiscount())
            .paidAmount(b.getPaidAmount())
            .status(b.getStatus())
            .lineItems(b.getLineItems())
            .createdDate(b.getCreatedDate())
            .build();
    }
}
