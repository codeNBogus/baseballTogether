package com.baseballmate.api.web;

import com.baseballmate.api.auth.AuthService;
import com.baseballmate.api.auth.AuthService.AuthResult;
import com.baseballmate.api.common.CurrentUserArgumentResolver;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final int COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7일

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse register(@Valid @RequestBody RegisterRequest request,
                                 HttpServletResponse response) {
        AuthResult result = authService.register(request.email(), request.password(), request.nickname());
        setAuthCookie(response, result.token());
        return AuthResponse.from(result);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request,
                              HttpServletResponse response) {
        AuthResult result = authService.login(request.email(), request.password());
        setAuthCookie(response, result.token());
        return AuthResponse.from(result);
    }

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout(HttpServletRequest request, HttpServletResponse response) {
        String token = CurrentUserArgumentResolver.extractToken(request);
        authService.logout(token);
        clearAuthCookie(response);
    }

    // ── cookie helpers ───────────────────────────────────────────────────────

    private void setAuthCookie(HttpServletResponse response, String token) {
        Cookie cookie = new Cookie(CurrentUserArgumentResolver.COOKIE_NAME, token);
        cookie.setHttpOnly(true);
        cookie.setPath("/");
        cookie.setMaxAge(COOKIE_MAX_AGE);
        // 로컬 개발 환경에서는 Secure=false; 운영 시 true로 변경 필요
        cookie.setSecure(false);
        response.addCookie(cookie);
    }

    private void clearAuthCookie(HttpServletResponse response) {
        Cookie cookie = new Cookie(CurrentUserArgumentResolver.COOKIE_NAME, "");
        cookie.setHttpOnly(true);
        cookie.setPath("/");
        cookie.setMaxAge(0);
        response.addCookie(cookie);
    }

    // ── DTOs ─────────────────────────────────────────────────────────────────

    public record RegisterRequest(
        @Email @NotBlank String email,
        @NotBlank @Size(min = 4, max = 50) String password,
        @NotBlank @Size(max = 20) String nickname
    ) {}

    public record LoginRequest(
        @Email @NotBlank String email,
        @NotBlank String password
    ) {}

    public record AuthResponse(String nickname, String email) {
        static AuthResponse from(AuthResult result) {
            return new AuthResponse(result.nickname(), result.email());
        }
    }
}
