package com.hospital.rms.service;

import com.hospital.rms.dto.LoginRequest;
import com.hospital.rms.dto.RefreshRequest;
import com.hospital.rms.dto.TokenResponse;
import com.hospital.rms.entity.User;
import com.hospital.rms.repository.UserRepository;
import com.hospital.rms.security.JwtTokenProvider;
import com.hospital.rms.security.TokenBlacklist;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final UserRepository userRepository;
    private final TokenBlacklist tokenBlacklist;

    @Transactional(readOnly = true)
    public TokenResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword()));

        User user = userRepository.findByUsername(request.getUsername())
            .orElseThrow(() -> new IllegalArgumentException("User not found: " + request.getUsername()));

        return buildTokenResponse(user, authentication);
    }

    /**
     * Exchange a valid refresh token for a fresh access+refresh pair.
     * The old refresh token is immediately revoked (rotation prevents replay).
     */
    @Transactional(readOnly = true)
    public TokenResponse refresh(RefreshRequest request) {
        String refreshToken = request.getRefreshToken();
        if (!tokenProvider.validateToken(refreshToken)) {
            throw new IllegalArgumentException("Invalid refresh token");
        }
        if (!"refresh".equals(tokenProvider.getTokenType(refreshToken))) {
            throw new IllegalArgumentException("Token is not a refresh token");
        }
        String jti = tokenProvider.getJti(refreshToken);
        if (tokenBlacklist.isRevoked(jti)) {
            throw new IllegalArgumentException("Refresh token has been revoked");
        }

        String username = tokenProvider.getUsernameFromToken(refreshToken);
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new IllegalArgumentException("User not found: " + username));
        if (!user.isEnabled()) {
            throw new IllegalArgumentException("User account is disabled");
        }

        // Rotate: revoke the consumed refresh token before minting a new one.
        tokenBlacklist.revoke(jti);

        Authentication authentication = new UsernamePasswordAuthenticationToken(
            username, null,
            java.util.List.of(new org.springframework.security.core.authority.SimpleGrantedAuthority(
                "ROLE_" + user.getRole().name())));

        return buildTokenResponse(user, authentication);
    }

    public void logout(String accessJti, String refreshJti) {
        if (accessJti != null) tokenBlacklist.revoke(accessJti);
        if (refreshJti != null) tokenBlacklist.revoke(refreshJti);
    }

    @Transactional(readOnly = true)
    public User loadUser(String username) {
        return userRepository.findByUsername(username)
            .orElseThrow(() -> new IllegalArgumentException("User not found: " + username));
    }

    private TokenResponse buildTokenResponse(User user, Authentication authentication) {
        String access = tokenProvider.generateAccessToken(authentication);
        String refresh = tokenProvider.generateRefreshToken(user.getUsername());

        return TokenResponse.builder()
            .accessToken(access)
            .refreshToken(refresh)
            .tokenType("Bearer")
            .accessExpiresInMs(tokenProvider.getAccessExpirationMs())
            .refreshExpiresInMs(tokenProvider.getRefreshExpirationMs())
            .username(user.getUsername())
            .fullName(user.getFullName())
            .role(user.getRole())
            .email(user.getEmail())
            .build();
    }
}