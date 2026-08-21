package com.hospital.rms.security;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Authenticates STOMP CONNECT frames using the same JWT the REST API uses.
 * Without this, anyone with network access could subscribe to
 * /topic/queue/{doctorId} and read live patient queue data.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class WebSocketAuthInterceptor implements ChannelInterceptor {

    private final JwtTokenProvider tokenProvider;
    private final TokenBlacklist tokenBlacklist;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null || accessor.getCommand() == null) {
            return message;
        }

        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            String authHeader = accessor.getFirstNativeHeader("Authorization");
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                throw new AccessDeniedException("Missing or malformed Authorization header on STOMP CONNECT");
            }
            String token = authHeader.substring(7);
            if (!tokenProvider.validateToken(token)) {
                throw new AccessDeniedException("Invalid JWT on STOMP CONNECT");
            }
            if (!"access".equals(tokenProvider.getTokenType(token))) {
                throw new AccessDeniedException("Refresh token cannot be used for STOMP CONNECT");
            }
            if (tokenBlacklist.isRevoked(tokenProvider.getJti(token))) {
                throw new AccessDeniedException("Revoked JWT on STOMP CONNECT");
            }

            String username = tokenProvider.getUsernameFromToken(token);
            String role = tokenProvider.getRoleFromToken(token);
            UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(username, null,
                    List.of(new SimpleGrantedAuthority("ROLE_" + role)));
            accessor.setUser(authentication);
            log.debug("STOMP CONNECT authenticated for user={}, role={}", username, role);
        }

        return message;
    }
}