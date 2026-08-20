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

@Component
public class JwtTokenProvider {

    private static final String DEFAULT_DEV_SECRET =
        "Y2hhbmdldGhpc3RvYW5nZXJzZWNyZXRrZXlmb3Jqd3R0b2tlbjEyMzQ1Njc4";

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.expiration-ms}")
    private long jwtExpirationMs;

    @PostConstruct
    void rejectInsecureDefaultInProd() {
        String activeProfile = System.getProperty("spring.profiles.active", "");
        boolean isProd = java.util.Arrays.asList(activeProfile.split(","))
            .contains("prod");
        boolean usingDefault = DEFAULT_DEV_SECRET.equals(jwtSecret);

        if (usingDefault && isProd) {
            throw new IllegalStateException(
                "JWT secret is still set to the public default. "
                + "Set the JWT_SECRET environment variable before deploying to production."
            );
        }
        if (usingDefault) {
            System.err.println(
                "[WARNING] Using the default development JWT secret. "
                + "Set JWT_SECRET before exposing this instance publicly."
            );
        }
    }

    private SecretKey getSigningKey() {
        byte[] keyBytes = Decoders.BASE64.decode(jwtSecret.replaceAll("\\s", ""));
        return Keys.hmacShaKeyFor(keyBytes);
    }

    public String generateToken(Authentication authentication) {
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpirationMs);

        // Strip Spring's "ROLE_" prefix so the JWT carries the bare role name
        // (e.g. "ADMIN"). JwtAuthenticationFilter re-adds the prefix when
        // building the SecurityContext — keeping the prefix in only one place
        // avoids the historical ROLE_ROLE_ADMIN mismatch that silently 403'd
        // every authenticated POST.
        String rawRole = userDetails.getAuthorities().iterator().next().getAuthority();
        String role = rawRole.startsWith("ROLE_") ? rawRole.substring(5) : rawRole;

        return Jwts.builder()
                .subject(userDetails.getUsername())
                .claim("role", role)
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(getSigningKey())
                .compact();
    }

    public String generateToken(String username, String role) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpirationMs);

        return Jwts.builder()
                .subject(username)
                .claim("role", role)
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(getSigningKey())
                .compact();
    }

    public String getUsernameFromToken(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .getSubject();
    }

    public String getRoleFromToken(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .get("role", String.class);
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parser()
                    .verifyWith(getSigningKey())
                    .build()
                    .parseSignedClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }
}
