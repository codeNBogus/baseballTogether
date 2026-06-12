package com.baseballmate.api.auth;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
public class User {

    @Id
    private String id;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String nickname;

    @Column(nullable = false)
    private String passwordHash;

    private String name;
    private Integer age;
    private String favoriteTeam;
    private String kakaoId;      // 카카오톡 아이디 (선택)
    private String btiType;       // 응BTI 유형 (선택)

    private LocalDateTime createdAt;

    protected User() {}

    public User(String id, String email, String nickname, String passwordHash, LocalDateTime createdAt) {
        this.id = id;
        this.email = email;
        this.nickname = nickname;
        this.passwordHash = passwordHash;
        this.createdAt = createdAt;
    }

    public String getId()            { return id; }
    public String getEmail()         { return email; }
    public String getNickname()      { return nickname; }
    public String getPasswordHash()  { return passwordHash; }
    public String getName()          { return name; }
    public Integer getAge()          { return age; }
    public String getFavoriteTeam()  { return favoriteTeam; }
    public String getKakaoId()       { return kakaoId; }
    public String getBtiType()        { return btiType; }
    public LocalDateTime getCreatedAt() { return createdAt; }

    public boolean isProfileComplete() {
        return name != null && age != null && favoriteTeam != null;
    }

    public void updateProfile(String name, int age, String favoriteTeam, String kakaoId) {
        this.name = name;
        this.age = age;
        this.favoriteTeam = favoriteTeam;
        this.kakaoId = (kakaoId != null && kakaoId.isBlank()) ? null : kakaoId;
    }

    public void updateBtiType(String btiType) {
        this.btiType = (btiType != null && btiType.isBlank()) ? null : btiType;
    }
}
