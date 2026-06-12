package com.baseballmate.api.auth;

import org.springframework.data.jpa.repository.JpaRepository;

public interface AuthTokenRepository extends JpaRepository<AuthToken, String> {
    /** 같은 유저의 기존 토큰을 모두 삭제 (단일 세션 유지) */
    void deleteByUserId(String userId);
}
