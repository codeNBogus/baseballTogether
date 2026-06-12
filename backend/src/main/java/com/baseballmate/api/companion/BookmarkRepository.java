package com.baseballmate.api.companion;

import java.util.List;
import java.util.Set;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface BookmarkRepository extends JpaRepository<Bookmark, Long> {
    boolean existsByUserIdAndPostId(String userId, Long postId);
    void deleteByUserIdAndPostId(String userId, Long postId);
    List<Bookmark> findByUserId(String userId);

    @Query("SELECT b.postId FROM Bookmark b WHERE b.userId = :userId")
    Set<Long> findPostIdsByUserId(String userId);
}
