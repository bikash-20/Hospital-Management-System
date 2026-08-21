package com.hospital.rms.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.UUID;

@Component
public class JwtTokenProvider {

    /**
     * Public, well-known default. Using it in any non-dev profile is rejected
     * by {@link #rejectInsecureDefaultInProd()}. Change JWT_SECRET in any
     * deployed environment.
     */
    private static final String DEFAULT_DEV_SECRET =
        "Y2hhbmdldGhpc3RvYW5nZXJzZWNyZXRrZXlmb3Jqd3R0b2tlbjEyMzQ1Njc4";

    /**
     * HS256 needs ≥ 256 bits (32 bytes). The default above is exactly 48 bytes
     * after base64 decoding, so this check is the actual gatekeeper.
     */
    private static final int MIN_SECRET_BYTES = 32;

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.access-expiration-ms:900000}")  // default 15 min
    private long jwtAccessExpirationMs;

    @Value("${jwt.refresh-expiration-ms:1209600000}")  // default 14 days
    private long jwtRefreshExpirationMs;

    @PostConstruct
    void rejectInsecureDefault() {
        if (jwtSecret == null || jwtSecret.isBlank()) {
            throw new IllegalStateException(
                "JWT_SECRET environment variable must be set. "
                + "Generate one with: openssl rand -base64 48");
        }
        byte[] decoded;
        try {
            decoded = Decoders.BASE64.decode(jwtSecret.replaceAll("\\s", ""));
        } catch (IllegalArgumentException e) {
            throw new IllegalStateException("JWT_SECRET is not valid base64", e);
        }
        if (decoded.length < MIN_SECRET_BYTES) {
            throw new IllegalStateException(
                "JWT_SECRET is too short (" + decoded.length + " bytes). "
                + "HS256 requires at least " + MIN_SECRET_BYTES + " bytes. "
                + "Generate one with: openssl rand -base64 48");
        }
        if (DEFAULT_DEV_SECRET.equals(jwtSecret)) {
            // Default secret only allowed when the active profile is exactly "dev"
            // or unset (local dev with H2).
            String activeProfile = System.getProperty("spring.profiles.active", "");
            boolean isDevProfile = activeProfile.isBlank()
                || java.util.Arrays.asList(activeProfile.split(",")).contains("dev");
            if (!isDevProfile) {
                throw new IllegalStateException(
                    "JWT_SECRET is set to the public default value. "
                    + "This is forbidden outside the 'dev' profile. "
                    + "Set a strong random JWT_SECRET before deploying.");
            }
            System.err.println(
                "[WARNING] Using the default development JWT secret. "
                + "This is OK for local development only.");
        }
    }

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(Decoders.BASE64.decode(jwtSecret.replaceAll("\\s", "")));
    }

    public String generateAccessToken(Authentication authentication) {
        return generateAccessToken(((UserDetails) authentication.getPrincipal()).getUsername(),
            authentication.getAuthorities().iterator().next().getAuthority());
    }

    public String generateAccessToken(String username, String rawRole) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtAccessExpirationMs);
        String role = rawRole.startsWith("ROLE_") ? rawRole.substring(5) : rawRole;

        return Jwts.builder()
                .id(UUID.randomUUID().toString())  // jti — enables future revocation
                .subject(username)
                .claim("role", role)
                .claim("type", "access")
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(getSigningKey())
                .compact();
    }

    public String generateRefreshToken(String username) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtRefreshExpirationMs);

        return Jwts.builder()
                .id(UUID.randomUUID().toString())
                .subject(username)
                .claim("type", "refresh")
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(getSigningKey())
                .compact();
    }

    public String getUsernameFromToken(String token) {
        return parseClaims(token).getPayload().getSubject();
    }

    public String getRoleFromToken(String token) {
        return parseClaims(token).getPayload().get("role", String.class);
    }

    public String getTokenType(String token) {
        return parseClaims(token).getPayload().get("type", String.class);
    }

    public String getJti(String token) {
        return parseClaims(token).getPayload().getId();
    }

    public long getAccessExpirationMs() {
        return jwtAccessExpirationMs;
    }

    public long getRefreshExpirationMs() {
        return jwtRefreshExpirationMs;
    }

    public boolean validateToken(String token) {
        try {
            parseClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    private Jws<Claims> parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token);
    }
}