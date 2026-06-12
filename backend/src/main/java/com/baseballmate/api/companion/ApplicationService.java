package com.baseballmate.api.companion;

import com.baseballmate.api.auth.AuthService;
import com.baseballmate.api.auth.UserRepository;
import java.time.LocalDate;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ApplicationService {

    private final ApplicationRepository appRepo;
    private final CompanionRepository postRepo;
    private final AuthService authService;
    private final UserRepository userRepository;

    public ApplicationService(ApplicationRepository appRepo, CompanionRepository postRepo,
                               AuthService authService, UserRepository userRepository) {
        this.appRepo = appRepo;
        this.postRepo = postRepo;
        this.authService = authService;
        this.userRepository = userRepository;
    }

    @Transactional
    public ApplicationResponse apply(Long postId, String applicantId, String message) {
        CompanionPost post = postRepo.findById(postId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "공고를 찾을 수 없습니다."));

        if (post.isClosed() || post.getGameDate().isBefore(java.time.LocalDate.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "마감된 공고입니다.");
        }
        if (post.getAuthorId().equals(applicantId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "본인의 공고에는 신청할 수 없습니다.");
        }
        if (appRepo.existsByPostIdAndApplicantId(postId, applicantId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "이미 신청한 공고입니다.");
        }
        if (!authService.isProfileComplete(applicantId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "신청 전 마이페이지에서 이름, 나이, 선호 구단을 입력해 주세요.");
        }

        AuthService.ProfileInfo profile = authService.getProfile(applicantId);
        Application app = new Application(
            postId, applicantId, profile.name(),
            message, post.getTitle(), post.getStadium(), post.getGameDate()
        );
        return ApplicationResponse.from(appRepo.save(app), profile.kakaoId());
    }

    @Transactional
    public void cancel(Long postId, String applicantId) {
        Application app = appRepo.findByPostIdAndApplicantId(postId, applicantId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "신청 내역이 없습니다."));
        if (app.getStatus() == Application.Status.ACCEPTED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "수락된 신청은 취소할 수 없습니다.");
        }
        appRepo.delete(app);
    }

    @Transactional(readOnly = true)
    public List<ApplicationResponse> getApplicationsForPost(Long postId, String requesterId) {
        CompanionPost post = postRepo.findById(postId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "공고를 찾을 수 없습니다."));
        if (!post.getAuthorId().equals(requesterId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "권한이 없습니다.");
        }
        var kakaoMap = userRepository.findAllById(
            appRepo.findByPostId(postId).stream().map(Application::getApplicantId).toList()
        ).stream().collect(java.util.stream.Collectors.toMap(
            com.baseballmate.api.auth.User::getId,
            u -> u.getKakaoId() != null ? u.getKakaoId() : ""
        ));
        return appRepo.findByPostId(postId).stream()
            .map(a -> ApplicationResponse.from(a, kakaoMap.getOrDefault(a.getApplicantId(), "")))
            .toList();
    }

    @Transactional
    public ApplicationResponse accept(Long appId, String requesterId) {
        Application app = findOwnedApplication(appId, requesterId);
        app.accept();
        Application saved = appRepo.save(app);
        String kakaoId = userRepository.findById(saved.getApplicantId()).map(u -> u.getKakaoId() != null ? u.getKakaoId() : "").orElse("");
        return ApplicationResponse.from(saved, kakaoId);
    }

    @Transactional
    public ApplicationResponse reject(Long appId, String requesterId) {
        Application app = findOwnedApplication(appId, requesterId);
        app.reject();
        return ApplicationResponse.from(appRepo.save(app), "");
    }

    @Transactional(readOnly = true)
    public List<MyApplicationResponse> getMyApplications(String applicantId) {
        return appRepo.findByApplicantId(applicantId).stream()
            .map(MyApplicationResponse::from)
            .toList();
    }

    private Application findOwnedApplication(Long appId, String requesterId) {
        Application app = appRepo.findById(appId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "신청을 찾을 수 없습니다."));
        CompanionPost post = postRepo.findById(app.getPostId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "공고를 찾을 수 없습니다."));
        if (!post.getAuthorId().equals(requesterId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "권한이 없습니다.");
        }
        return app;
    }

    /** 공고 작성자가 보는 신청 응답 */
    public record ApplicationResponse(
        long id,
        String applicantName,
        String message,
        String status,
        String applicantKakaoId   // ACCEPTED일 때만 의미 있음
    ) {
        static ApplicationResponse from(Application a, String kakaoId) {
            // 수락된 경우에만 카카오 아이디 노출
            String visibleKakao = a.getStatus() == Application.Status.ACCEPTED ? kakaoId : null;
            return new ApplicationResponse(
                a.getId(), a.getApplicantName(), a.getMessage(), a.getStatus().name(), visibleKakao
            );
        }
    }

    /** 신청자가 보는 내 신청 내역 */
    public record MyApplicationResponse(
        long id,
        long postId,
        String postTitle,
        String postStadium,
        LocalDate postGameDate,
        String status
    ) {
        static MyApplicationResponse from(Application a) {
            return new MyApplicationResponse(
                a.getId(), a.getPostId(), a.getPostTitle(),
                a.getPostStadium(), a.getPostGameDate(), a.getStatus().name()
            );
        }
    }
}
