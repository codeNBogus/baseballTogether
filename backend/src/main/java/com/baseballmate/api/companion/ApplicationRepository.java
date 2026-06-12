package com.baseballmate.api.companion;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ApplicationRepository extends JpaRepository<Application, Long> {
    List<Application> findByPostId(Long postId);
    List<Application> findByApplicantId(String applicantId);
    Optional<Application> findByPostIdAndApplicantId(Long postId, String applicantId);
    int countByPostId(Long postId);
    boolean existsByPostIdAndApplicantId(Long postId, String applicantId);
}
