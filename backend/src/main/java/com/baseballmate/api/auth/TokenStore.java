package com.baseballmate.api.auth;

import java.time.Duration;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * DB 기반 토큰 저장소.
 * 서버 재시작 후에도 토큰이 유지된다.
 */
@Component
public class TokenStore {

    private static final Duration TOKEN_TTL = Duration.ofDays(7);

    private final AuthTokenRepository repo;

    public TokenStore(AuthTokenRepository repo) {
        this.repo = repo;
    }

    /** 새 토큰 발급. 해당 유저의 기존 토큰을 모두 제거한다 (단일 세션). */
    @Transactional
    public String issue(String userId) {
        repo.deleteByUserId(userId);
        String token = UUID.randomUUID() + "." + UUID.randomUUID();
        repo.save(new AuthToken(token, userId, Instant.now().plus(TOKEN_TTL)));
        return token;
    }

    /** 유효한 토큰이면 userId 반환, 아니면 empty. */
    @Transactional
    public Optional<String> validate(String token) {
        if (token == null) return Optional.empty();
        return repo.findById(token)
            .map(t -> {
                if (Instant.now().isAfter(t.getExpiresAt())) {
                    repo.delete(t);  // 만료 토큰 즉시 정리
                    return null;
                }
                return t.getUserId();
            })
            .filter(id -> id != null);
    }

    /** 토큰 즉시 무효화 (로그아웃). */
    @Transactional
    public void revoke(String token) {
        if (token != null) repo.deleteById(token);
    }
}
