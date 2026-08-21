package com.hospital.rms.security;

import org.springframework.stereotype.Component;

import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory JWT revocation list. Tokens are added on logout and checked on every
 * authenticated request via the JWT filter.
 * <p>
 * For a production multi-instance deployment this should be backed by Redis
 * (single-instance deployment uses this map, which is correct).
 */
@Component
public class TokenBlacklist {

    /** Set of revoked JTIs (JWT IDs). */
    private final Set<String> revoked = ConcurrentHashMap.newKeySet();

    public void revoke(String jti) {
        if (jti != null) revoked.add(jti);
    }

    public boolean isRevoked(String jti) {
        return jti != null && revoked.contains(jti);
    }

    public int size() {
        return revoked.size();
    }
}
