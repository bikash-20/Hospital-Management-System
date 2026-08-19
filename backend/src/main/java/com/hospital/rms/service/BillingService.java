package com.hospital.rms.service;

import com.hospital.rms.dto.BillingRequest;
import com.hospital.rms.dto.BillingResponse;
import com.hospital.rms.dto.PatientResponse;
import com.hospital.rms.entity.Billing;
import com.hospital.rms.entity.Patient;
import com.hospital.rms.enums.PaymentStatus;
import com.hospital.rms.repository.BillingRepository;
import com.hospital.rms.repository.PatientRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;

@Service
@RequiredArgsConstructor
public class BillingService {

    private final BillingRepository billingRepository;
    private final PatientRepository patientRepository;

    private static final AtomicInteger invoiceCounter = new AtomicInteger(0);

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
            .status(PaymentStatus.UNPAID)
            .lineItems(request.getLineItems())
            .build();

        Billing saved = billingRepository.save(billing);
        return toResponse(saved);
    }

    @Transactional
    public BillingResponse processPayment(UUID billingId, BigDecimal amount) {
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

    private String generateInvoiceNumber() {
        String dateStr = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        int seq = invoiceCounter.incrementAndGet();
        return "INV-" + dateStr + "-" + String.format("%04d", seq);
    }

    private BigDecimal calculateTotal(String lineItemsJson) {
        // Simplified: parse JSON and sum amounts
        // In production, use proper JSON parsing
        return BigDecimal.valueOf(500); // Placeholder
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
