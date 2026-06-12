package com.baseballmate.api.companion;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CompanionRepository extends JpaRepository<CompanionPost, Long> {
    List<CompanionPost> findByAuthorId(String authorId);
}
