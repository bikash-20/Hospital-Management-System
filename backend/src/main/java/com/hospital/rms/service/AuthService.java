package com.hospital.rms.service;

import com.hospital.rms.dto.LoginRequest;
import com.hospital.rms.dto.LoginResponse;
import com.hospital.rms.entity.User;
import com.hospital.rms.repository.UserRepository;
import com.hospital.rms.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final UserRepository userRepository;

    public LoginResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
        );

        String token = tokenProvider.generateToken(authentication);
        User user = userRepository.findByUsername(request.getUsername()).orElseThrow();

        return LoginResponse.builder()
            .accessToken(token)
            .tokenType("Bearer")
            .username(user.getUsername())
            .fullName(user.getFullName())
            .role(user.getRole())
            .email(user.getEmail())
            .build();
    }
}
