package com.baseballmate.api.companion;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.LocalDateTime;

@Entity
@Table(name = "bookmarks",
    uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "post_id"}))
public class Bookmark {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(name = "post_id", nullable = false)
    private Long postId;

    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    protected Bookmark() {}

    public Bookmark(String userId, Long postId) {
        this.userId = userId;
        this.postId = postId;
    }

    public Long getId()     { return id; }
    public String getUserId() { return userId; }
    public Long getPostId() { return postId; }
}
