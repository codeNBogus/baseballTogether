package com.baseballmate.api.auth;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private static final List<String> KBO_TEAM_LIST = List.of(
        "LG 트윈스", "두산 베어스", "SSG 랜더스", "키움 히어로즈", "KIA 타이거즈",
        "삼성 라이온즈", "롯데 자이언츠", "한화 이글스", "NC 다이노스", "KT 위즈"
    );

    private final UserRepository userRepository;
    private final TokenStore tokenStore;
    private final PasswordEncoder passwordEncoder;

    public AuthService(UserRepository userRepository, TokenStore tokenStore, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.tokenStore = tokenStore;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public AuthResult register(String email, String password, String nickname) {
        String normalizedEmail = normalizeEmail(email);
        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new AuthException("이미 가입된 이메일입니다.");
        }
        validatePassword(password);

        User user = new User(
            UUID.randomUUID().toString(),
            normalizedEmail,
            nickname.trim(),
            passwordEncoder.encode(password),
            LocalDateTime.now()
        );
        userRepository.save(user);

        String token = tokenStore.issue(user.getId());
        return new AuthResult(token, user.getNickname(), user.getEmail());
    }

    @Transactional
    public AuthResult login(String email, String password) {
        String normalizedEmail = normalizeEmail(email);
        User user = userRepository.findByEmail(normalizedEmail)
            .orElseThrow(() -> new AuthException("이메일 또는 비밀번호가 올바르지 않습니다."));

        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new AuthException("이메일 또는 비밀번호가 올바르지 않습니다.");
        }

        String token = tokenStore.issue(user.getId());
        return new AuthResult(token, user.getNickname(), user.getEmail());
    }

    @Transactional
    public ProfileInfo saveBtiType(String userId, String btiType) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new AuthException("사용자를 찾을 수 없습니다."));
        user.updateBtiType(btiType);
        userRepository.save(user);
        return new ProfileInfo(user.getNickname(), user.getEmail(), user.getName(), user.getAge(),
            user.getFavoriteTeam(), user.isProfileComplete(), user.getKakaoId(), user.getBtiType());
    }

    public void logout(String token) {
        tokenStore.revoke(token);
    }

    public Optional<UserContext> findUserByToken(String token) {
        return tokenStore.validate(token)
            .flatMap(userRepository::findById)
            .map(u -> new UserContext(u.getId(), u.getNickname(), u.getEmail()));
    }

    @Transactional(readOnly = true)
    public ProfileInfo getProfile(String userId) {
        return userRepository.findById(userId)
            .filter(User::isProfileComplete)
            .map(u -> new ProfileInfo(u.getNickname(), u.getEmail(), u.getName(), u.getAge(), u.getFavoriteTeam(), true, u.getKakaoId(), u.getBtiType()))
            .orElseGet(() -> userRepository.findById(userId)
                .map(u -> new ProfileInfo(u.getNickname(), u.getEmail(), null, null, null, false, u.getKakaoId(), u.getBtiType()))
                .orElseThrow(() -> new AuthException("사용자를 찾을 수 없습니다.")));
    }

    @Transactional
    public ProfileInfo saveProfile(String userId, String name, int age, String favoriteTeam, String kakaoId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new AuthException("사용자를 찾을 수 없습니다."));
        user.updateProfile(name.trim(), age, favoriteTeam.trim(), kakaoId != null ? kakaoId.trim() : null);
        userRepository.save(user);
        return new ProfileInfo(user.getNickname(), user.getEmail(), user.getName(), user.getAge(), user.getFavoriteTeam(), true, user.getKakaoId(), user.getBtiType());
    }

    @Transactional(readOnly = true)
    public boolean isProfileComplete(String userId) {
        return userRepository.findById(userId)
            .map(User::isProfileComplete)
            .orElse(false);
    }

    public boolean isSupportedTeam(String team) {
        return team != null && KBO_TEAM_LIST.contains(team.trim());
    }

    public List<String> getKboTeams() {
        return KBO_TEAM_LIST;
    }

    // ── private helpers ──────────────────────────────────────────────────────

    private String normalizeEmail(String email) {
        if (email == null || email.isBlank()) {
            throw new AuthException("이메일은 필수입니다.");
        }
        return email.trim().toLowerCase();
    }

    private void validatePassword(String password) {
        if (password == null || password.isBlank()) {
            throw new AuthException("비밀번호는 필수입니다.");
        }
    }

    // ── DTOs ─────────────────────────────────────────────────────────────────

    public record AuthResult(String token, String nickname, String email) {}

    public record UserContext(String id, String nickname, String email) {}

    public record ProfileInfo(
        String nickname,
        String email,
        String name,
        Integer age,
        String favoriteTeam,
        boolean profileCompleted,
        String kakaoId,
        String btiType
    ) {}
}
