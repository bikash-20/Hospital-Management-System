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

    @Pointcut("execution(* com.hospital.rms.repository.*.save(..))")
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
        } catch (Exception e) {
            log.warn("Failed to create audit log for {} {}: {}", operation, entityName, e.getMessage());
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
