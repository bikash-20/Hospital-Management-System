package com.hospital.rms.aspect;

import com.hospital.rms.entity.AuditLog;
import com.hospital.rms.repository.AuditLogRepository;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Aspect
@Component
@RequiredArgsConstructor
@Slf4j
public class AuditAspect {

    private final AuditLogRepository auditLogRepository;

    /**
     * Match save() on every repository except AuditLogRepository itself.
     * Without this exclusion the aspect recurses into itself when persisting
     * an AuditLog entry — each save() re-enters @Around, calls save() again,
     * and stacks overflow. The try/catch below catches Exception, but not
     * StackOverflowError (a Throwable, not an Exception), so the recursive
     * call blew past our guard and Spring returned 403 to the client.
     */
    @Pointcut("execution(* com.hospital.rms.repository.*.save(..)) "
        + "&& !execution(* com.hospital.rms.repository.AuditLogRepository.save(..))")
    public void repositorySaveMethods() {}

    @Around("repositorySaveMethods()")
    public Object auditSave(ProceedingJoinPoint joinPoint) throws Throwable {
        Object entity = joinPoint.getArgs()[0];
        String entityName = entity.getClass().getSimpleName();
        String operation = isNewEntity(entity) ? "CREATE" : "UPDATE";

        Object result = joinPoint.proceed();

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
                .entityId(getEntityId(result))
                .userId(userId)
                .userName(userName)
                .newValues(String.valueOf(result))
                .timestamp(LocalDateTime.now())
                .build();

            auditLogRepository.save(auditLog);
            log.debug("Audit: {} {} on {} by {}", operation, entityName, auditLog.getEntityId(), userId);
        } catch (Throwable t) {
            // Catching Throwable (not Exception) so a StackOverflowError or
            // NoClassDefFoundError from this aspect never propagates as a
            // failed request. Audit logging is best-effort.
            log.warn("Failed to create audit log for {} {}: {}", operation, entityName, t.getMessage());
        }

        return result;
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
        try {
            var idField = entity.getClass().getMethod("getId");
            Object id = idField.invoke(entity);
            return id != null ? id.toString() : "unknown";
        } catch (Exception e) {
            return "unknown";
        }
    }
}
