package com.hospital.rms.controller;

import com.hospital.rms.dto.LoginRequest;
import com.hospital.rms.dto.RefreshRequest;
import com.hospital.rms.dto.TokenResponse;
import com.hospital.rms.security.JwtTokenProvider;
import com.hospital.rms.service.AuthService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Authentication endpoints. On success the server sets two httpOnly cookies:
 *   - {@code oh_access}  — short-lived access JWT (15 min)
 *   - {@code oh_refresh} — long-lived refresh JWT (14 days, rotated on each refresh)
 *
 * Cookies are not readable from JavaScript (XSS-safe). The frontend just
 * configures axios with {@code withCredentials: true} and the browser sends
 * them automatically.
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private static final String ACCESS_COOKIE = "oh_access";
    private static final String REFRESH_COOKIE = "oh_refresh";

    private final AuthService authService;
    private final JwtTokenProvider tokenProvider;

    @Value("${app.cookie.secure:true}")
    private boolean cookieSecure;

    @Value("${app.cookie.same-site:Lax}")
    private String cookieSameSite;

    @PostMapping("/login")
    public ResponseEntity<TokenResponse> login(@Valid @RequestBody LoginRequest request) {
        TokenResponse tokens = authService.login(request);
        return ResponseEntity.ok()
            .headers(buildAuthCookies(tokens))
            .body(tokens);
    }

    /**
     * Return the currently authenticated user. Used by the SPA on bootstrap
     * to rehydrate the user identity without ever exposing the JWT.
     */
    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> me() {
        org.springframework.security.core.Authentication auth =
            org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        com.hospital.rms.entity.User user = authService.loadUser(username);
        return ResponseEntity.ok(Map.of(
            "username", user.getUsername(),
            "fullName", user.getFullName(),
            "role", user.getRole().name(),
            "email", user.getEmail()
        ));
    }

    @PostMapping("/refresh")
    public ResponseEntity<TokenResponse> refresh(@RequestBody(required = false) RefreshRequest request,
                                                 HttpServletRequest httpRequest,
                                                 HttpServletResponse httpResponse) {
        // The refresh token can come from either the body or the httpOnly cookie.
        String refreshToken = request != null ? request.getRefreshToken() : null;
        if (refreshToken == null) {
            Cookie c = readCookie(httpRequest, REFRESH_COOKIE);
            if (c != null) refreshToken = c.getValue();
        }
        if (refreshToken == null) {
            throw new IllegalArgumentException("Refresh token required (cookie or body)");
        }
        TokenResponse tokens = authService.refresh(new RefreshRequest(refreshToken));
        return ResponseEntity.ok()
            .headers(buildAuthCookies(tokens))
            .body(tokens);
    }

    @PostMapping("/logout")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, String>> logout(
            HttpServletRequest request,
            HttpServletResponse httpResponse,
            @RequestBody(required = false) RefreshRequest body) {
        String header = request.getHeader("Authorization");
        String accessJti = null;
        if (header != null && header.startsWith("Bearer ")) {
            accessJti = tokenProvider.getJti(header.substring(7));
        }
        // Fall back to cookie-based access token
        if (accessJti == null) {
            Cookie c = readCookie(request, ACCESS_COOKIE);
            if (c != null) accessJti = tokenProvider.getJti(c.getValue());
        }
        String refreshJti = null;
        if (body != null && body.getRefreshToken() != null) {
            refreshJti = tokenProvider.getJti(body.getRefreshToken());
        }
        if (refreshJti == null) {
            Cookie c = readCookie(request, REFRESH_COOKIE);
            if (c != null) refreshJti = tokenProvider.getJti(c.getValue());
        }
        authService.logout(accessJti, refreshJti);

        // Clear cookies
        httpResponse.addHeader(HttpHeaders.SET_COOKIE, expireCookie(ACCESS_COOKIE).toString());
        httpResponse.addHeader(HttpHeaders.SET_COOKIE, expireCookie(REFRESH_COOKIE).toString());

        return ResponseEntity.ok(Map.of("status", "logged out"));
    }

    private HttpHeaders buildAuthCookies(TokenResponse tokens) {
        HttpHeaders headers = new HttpHeaders();
        long accessMaxAgeSec = tokens.getAccessExpiresInMs() / 1000;
        long refreshMaxAgeSec = tokens.getRefreshExpiresInMs() / 1000;
        headers.add(HttpHeaders.SET_COOKIE, buildCookie(ACCESS_COOKIE,
            tokens.getAccessToken(), accessMaxAgeSec).toString());
        headers.add(HttpHeaders.SET_COOKIE, buildCookie(REFRESH_COOKIE,
            tokens.getRefreshToken(), refreshMaxAgeSec).toString());
        return headers;
    }

    private ResponseCookie buildCookie(String name, String value, long maxAgeSeconds) {
        return ResponseCookie.from(name, value)
            .httpOnly(true)
            .secure(cookieSecure)
            .sameSite(cookieSameSite)
            .path("/")
            .maxAge(maxAgeSeconds)
            .build();
    }

    private ResponseCookie expireCookie(String name) {
        return ResponseCookie.from(name, "")
            .httpOnly(true)
            .secure(cookieSecure)
            .sameSite(cookieSameSite)
            .path("/")
            .maxAge(0)
            .build();
    }

    private Cookie readCookie(HttpServletRequest request, String name) {
        if (request.getCookies() == null) return null;
        for (Cookie c : request.getCookies()) {
            if (name.equals(c.getName())) return c;
        }
        return null;
    }
}