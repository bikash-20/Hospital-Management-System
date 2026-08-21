package com.hospital.rms.aspect;

import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.json.JsonMapper;
import com.hospital.rms.entity.AuditLog;
import com.hospital.rms.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * AOP audit aspect. Intercepts every {@code save()} and {@code delete*} on
 * every repository (except {@link AuditLogRepository} itself, which would
 * recurse and stack-overflow).
 *
 * <p><b>Storage of the entity snapshot.</b> We do NOT persist
 * {@code String.valueOf(entity)} — Lombok's default {@code toString()} emits
 * every field including {@code password} (the BCrypt hash) and any large
 * JSON blobs (prescription medicines, billing line items). Instead we
 * serialize a filtered view via Jackson with a per-entity allowlist of safe
 * fields.
 *
 * <p><b>Transaction propagation.</b> Audit writes run in
 * {@link Propagation#REQUIRES_NEW} so the audit row survives even if the outer
 * entity save rolls back — that's the whole point of an audit log.
 */
@Aspect
@Component
@RequiredArgsConstructor
@Slf4j
public class AuditAspect {

    private final AuditLogRepository auditLogRepository;

    @Pointcut("execution(* com.hospital.rms.repository.*.save(..)) "
        + "&& !execution(* com.hospital.rms.repository.AuditLogRepository.save(..))")
    public void repositorySaveMethods() {}

    @Pointcut("execution(* com.hospital.rms.repository.*.delete*(..)) "
        + "&& !execution(* com.hospital.rms.repository.AuditLogRepository.delete*(..))")
    public void repositoryDeleteMethods() {}

    private static final ObjectMapper SAFE_MAPPER = JsonMapper.builder().build();

    @Around("repositorySaveMethods()")
    public Object auditSave(ProceedingJoinPoint joinPoint) throws Throwable {
        Object entity = joinPoint.getArgs()[0];
        String entityName = entity.getClass().getSimpleName();
        String operation = isNewEntity(entity) ? "CREATE" : "UPDATE";

        Object result = joinPoint.proceed();
        writeAuditLog(entityName, operation, getEntityId(result), safeSnapshot(result));
        return result;
    }

    @Around("repositoryDeleteMethods()")
    public Object auditDelete(ProceedingJoinPoint joinPoint) throws Throwable {
        Object arg = joinPoint.getArgs().length > 0 ? joinPoint.getArgs()[0] : null;
        String entityName = arg != null ? arg.getClass().getSimpleName() : joinPoint.getTarget().getClass().getSimpleName();
        Object result = joinPoint.proceed();
        writeAuditLog(entityName, "DELETE", getEntityId(arg), safeSnapshot(arg));
        return result;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    protected void writeAuditLog(String entityName, String operation, String entityId, String snapshot) {
        try {
            String userId = "system";
            String userName = "System";
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
                userId = auth.getName();
                userName = auth.getName();
            }

            AuditLog auditLog = AuditLog.builder()
                .entityName(entityName)
                .operation(operation)
                .entityId(entityId)
                .userId(userId)
                .userName(userName)
                .newValues(snapshot)
                .timestamp(LocalDateTime.now())
                .build();

            auditLogRepository.save(auditLog);
            log.debug("Audit: {} {} on {} by {}", operation, entityName, entityId, userId);
        } catch (Throwable t) {
            // Audit logging is best-effort. Catching Throwable (not Exception) so
            // a StackOverflowError or NoClassDefFoundError never propagates.
            log.warn("Failed to create audit log for {} {}: {}", operation, entityName, t.getMessage());
        }
    }

    /**
     * Build a JSON snapshot with only safe fields. We never serialize the raw
     * entity — that would include BCrypt password hashes and large JSON
     * blobs. Instead we extract the entity's id + a few safe fields via
     * reflection so the audit row is small and free of secrets.
     */
    private String safeSnapshot(Object entity) {
        if (entity == null) return null;
        Map<String, Object> snapshot = new LinkedHashMap<>();
        try {
            snapshot.put("id", getEntityId(entity));
            // Safe scalar fields to capture for audit. Passwords and JSON blobs
            // are deliberately excluded — see safeFieldsFor() below.
            for (String field : safeFieldsFor(entity.getClass().getSimpleName())) {
                try {
                    var getter = entity.getClass().getMethod("get" + capitalize(field));
                    Object value = getter.invoke(entity);
                    if (value != null) snapshot.put(field, value);
                } catch (NoSuchMethodException ignored) {
                    // Field not on this entity — fine.
                }
            }
        } catch (Exception e) {
            // Fall back to just the id if anything goes wrong.
            snapshot.put("id", getEntityId(entity));
        }
        try {
            return SAFE_MAPPER.writeValueAsString(snapshot);
        } catch (JacksonException e) {
            return "{\"id\":\"" + getEntityId(entity) + "\"}";
        }
    }

    private boolean isNewEntity(Object entity) {
        try {
            var idField = entity.getClass().getMethod("getId");
            Object id = idField.invoke(entity);
            return id == null;
        } catch (Exception e) {
            return true;
        }
    }

    private String getEntityId(Object entity) {
        if (entity == null) return "unknown";
        try {
            var idField = entity.getClass().getMethod("getId");
            Object id = idField.invoke(entity);
            return id != null ? id.toString() : "unknown";
        } catch (Exception e) {
            return "unknown";
        }
    }

    private String capitalize(String s) {
        return Character.toUpperCase(s.charAt(0)) + s.substring(1);
    }

    /**
     * Per-entity allowlist of fields safe to serialize into an audit log.
     * Anything NOT in this list is omitted — notably {@code password},
     * {@code lineItems}, {@code medicines}, {@code labOrders}.
     */
    private java.util.Set<String> safeFieldsFor(String entityName) {
        return switch (entityName) {
            case "User"        -> java.util.Set.of("username", "fullName", "email", "role", "enabled");
            case "Patient"     -> java.util.Set.of("uhid", "fullName", "mobileNumber", "gender");
            case "Bed"         -> java.util.Set.of("bedNumber", "wardName", "status");
            case "Appointment" -> java.util.Set.of("appointmentDate", "tokenNumber", "status");
            case "Prescription"-> java.util.Set.of("diagnosis");
            case "Billing"     -> java.util.Set.of("invoiceNumber", "totalAmount", "discount", "paidAmount", "status");
            case "LabResult"   -> java.util.Set.of("testName", "priority", "status");
            case "DoctorSchedule" -> java.util.Set.of("dayOfWeek", "startTime", "endTime", "active");
            case "AuditLog"    -> java.util.Set.of("entityName", "operation", "entityId");
            default            -> java.util.Set.of();
        };
    }
}