package com.baseballmate.api.companion;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "applications",
    uniqueConstraints = @UniqueConstraint(columnNames = {"post_id", "applicant_id"}))
public class Application {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long postId;

    @Column(nullable = false)
    private String applicantId;

    @Column(nullable = false)
    private String applicantName;

    @Column(length = 500)
    private String message;

    // 신청 목록 조회 시 post 재조회 없이 표시할 공고 정보 (비정규화)
    @Column(nullable = false)
    private String postTitle;

    @Column(nullable = false)
    private String postStadium;

    @Column(nullable = false)
    private LocalDate postGameDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status = Status.PENDING;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    protected Application() {}

    public Application(Long postId, String applicantId, String applicantName,
                       String message, String postTitle, String postStadium, LocalDate postGameDate) {
        this.postId = postId;
        this.applicantId = applicantId;
        this.applicantName = applicantName;
        this.message = message;
        this.postTitle = postTitle;
        this.postStadium = postStadium;
        this.postGameDate = postGameDate;
        this.createdAt = LocalDateTime.now();
    }

    public Long getId()              { return id; }
    public Long getPostId()          { return postId; }
    public String getApplicantId()   { return applicantId; }
    public String getApplicantName() { return applicantName; }
    public String getMessage()       { return message; }
    public String getPostTitle()     { return postTitle; }
    public String getPostStadium()   { return postStadium; }
    public LocalDate getPostGameDate() { return postGameDate; }
    public Status getStatus()        { return status; }
    public LocalDateTime getCreatedAt() { return createdAt; }

    public void accept() { this.status = Status.ACCEPTED; }
    public void reject() { this.status = Status.REJECTED; }

    public enum Status { PENDING, ACCEPTED, REJECTED }
}
