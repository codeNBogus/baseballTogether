package com.baseballmate.api.companion;

import com.baseballmate.api.auth.AuthService;
import com.baseballmate.api.auth.UserRepository;
import java.util.Collections;
import com.baseballmate.api.auth.AuthService.UserContext;
import java.time.LocalDate;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@Service
public class CompanionService {

    private final CompanionRepository repo;
    private final ApplicationRepository appRepo;
    private final AuthService authService;
    private final FileStorageService fileStorage;
    private final UserRepository userRepository;
    private final BookmarkRepository bookmarkRepo;

    public CompanionService(CompanionRepository repo, ApplicationRepository appRepo,
                            AuthService authService, FileStorageService fileStorage,
                            UserRepository userRepository, BookmarkRepository bookmarkRepo) {
        this.repo = repo;
        this.appRepo = appRepo;
        this.authService = authService;
        this.fileStorage = fileStorage;
        this.userRepository = userRepository;
        this.bookmarkRepo = bookmarkRepo;
    }

    @Transactional(readOnly = true)
    public List<PostResponse> findAll(String currentUserId) {
        var posts = repo.findAll();
        var authorIds = posts.stream().map(CompanionPost::getAuthorId)
            .collect(java.util.stream.Collectors.toSet());
        var userMap = userRepository.findAllById(authorIds).stream()
            .collect(java.util.stream.Collectors.toMap(
                com.baseballmate.api.auth.User::getId, u -> u));
        var bookmarkedIds = currentUserId != null
            ? bookmarkRepo.findPostIdsByUserId(currentUserId)
            : Collections.<Long>emptySet();
        return posts.stream().map(p -> {
            var u = userMap.get(p.getAuthorId());
            String kakaoId  = u != null && u.getKakaoId()  != null ? u.getKakaoId()  : "";
            String btiType  = u != null && u.getBtiType()  != null ? u.getBtiType()  : "";
            boolean bookmarked = currentUserId != null && bookmarkedIds.contains(p.getId());
            boolean owner      = currentUserId != null && currentUserId.equals(p.getAuthorId());
            return PostResponse.from(p, appRepo.countByPostId(p.getId()), owner, kakaoId, bookmarked, btiType);
        }).toList();
    }

    @Transactional(readOnly = true)
    public List<PostResponse> findByAuthor(String userId) {
        var user = userRepository.findById(userId);
        String kakaoId = user.map(u -> u.getKakaoId() != null ? u.getKakaoId() : "").orElse("");
        String btiType  = user.map(u -> u.getBtiType() != null ? u.getBtiType() : "").orElse("");
        var bookmarkedIds = bookmarkRepo.findPostIdsByUserId(userId);
        return repo.findByAuthorId(userId).stream()
            .map(p -> PostResponse.from(p, appRepo.countByPostId(p.getId()), true, kakaoId,
                    bookmarkedIds.contains(p.getId()), btiType))
            .toList();
    }

    @Transactional
    public PostResponse create(UserContext user, String title, String stadium, LocalDate gameDate,
                               String description, int totalTickets, int wantedCount,
                               MultipartFile ticketImage,
                               String seatZone, String seatBlock, String seatRow, String seatNumber) {
        if (!authService.isProfileComplete(user.id())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "공고 등록 전 마이페이지에서 이름, 나이, 선호 구단을 입력해 주세요.");
        }
        if (wantedCount > totalTickets) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "구하는 인원수는 총 티켓 수를 초과할 수 없습니다.");
        }
        if (ticketImage == null || ticketImage.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "티켓 이미지는 필수입니다.");
        }
        AuthService.ProfileInfo profile = authService.getProfile(user.id());
        String imageUrl = fileStorage.store(ticketImage);
        CompanionPost post = new CompanionPost(
            user.id(), title, stadium, gameDate, description,
            profile.name(), profile.favoriteTeam(), totalTickets, wantedCount, imageUrl,
            blankToNull(seatZone), blankToNull(seatBlock), blankToNull(seatRow), blankToNull(seatNumber)
        );
        var authorUser = userRepository.findById(user.id());
        String kakaoId     = authorUser.map(u -> u.getKakaoId() != null ? u.getKakaoId() : "").orElse("");
        String authorBtiType = authorUser.map(u -> u.getBtiType() != null ? u.getBtiType() : "").orElse("");
        return PostResponse.from(repo.save(post), 0, true, kakaoId, false, authorBtiType);
    }

    @Transactional
    public PostResponse update(Long id, UserContext user, String title, String stadium,
                               LocalDate gameDate, String description, int totalTickets,
                               int wantedCount, MultipartFile ticketImage,
                               String seatZone, String seatBlock, String seatRow, String seatNumber) {
        CompanionPost post = findOwnedPost(id, user.id());
        if (wantedCount > totalTickets) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "구하는 인원수는 총 티켓 수를 초과할 수 없습니다.");
        }
        post.update(title, stadium, gameDate, description, totalTickets, wantedCount,
            fileStorage.store(ticketImage),
            blankToNull(seatZone), blankToNull(seatBlock), blankToNull(seatRow), blankToNull(seatNumber));
        var authorUser = userRepository.findById(user.id());
        String kakaoId     = authorUser.map(u -> u.getKakaoId() != null ? u.getKakaoId() : "").orElse("");
        String authorBtiType = authorUser.map(u -> u.getBtiType() != null ? u.getBtiType() : "").orElse("");
        return PostResponse.from(repo.save(post), appRepo.countByPostId(id), true, kakaoId, false, authorBtiType);
    }

    @Transactional
    public void delete(Long id, UserContext user) {
        CompanionPost post = findOwnedPost(id, user.id());
        appRepo.deleteAll(appRepo.findByPostId(id));
        repo.delete(post);
    }

    @Transactional
    public PostResponse toggleClose(Long id, UserContext user) {
        CompanionPost post = findOwnedPost(id, user.id());
        post.toggleClosed();
        var authorUser = userRepository.findById(user.id());
        String kakaoId     = authorUser.map(u -> u.getKakaoId() != null ? u.getKakaoId() : "").orElse("");
        String authorBtiType = authorUser.map(u -> u.getBtiType() != null ? u.getBtiType() : "").orElse("");
        return PostResponse.from(repo.save(post), appRepo.countByPostId(id), true, kakaoId, false, authorBtiType);
    }

    @Transactional
    public PostResponse toggleBookmark(Long postId, String userId) {
        if (!repo.existsById(postId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "공고를 찾을 수 없습니다.");
        }
        if (bookmarkRepo.existsByUserIdAndPostId(userId, postId)) {
            bookmarkRepo.deleteByUserIdAndPostId(userId, postId);
        } else {
            bookmarkRepo.save(new Bookmark(userId, postId));
        }
        CompanionPost p = repo.findById(postId).get();
        var authorUser = userRepository.findById(p.getAuthorId());
        String kakaoId     = authorUser.map(u -> u.getKakaoId() != null ? u.getKakaoId() : "").orElse("");
        String authorBtiType = authorUser.map(u -> u.getBtiType() != null ? u.getBtiType() : "").orElse("");
        boolean bookmarked = bookmarkRepo.existsByUserIdAndPostId(userId, postId);
        boolean owner      = userId.equals(p.getAuthorId());
        return PostResponse.from(p, appRepo.countByPostId(postId), owner, kakaoId, bookmarked, authorBtiType);
    }

    @Transactional(readOnly = true)
    public List<PostResponse> findBookmarked(String userId) {
        var bookmarkedIds = bookmarkRepo.findPostIdsByUserId(userId);
        if (bookmarkedIds.isEmpty()) return List.of();
        return repo.findAllById(bookmarkedIds).stream().map(p -> {
            var authorUser = userRepository.findById(p.getAuthorId());
            String kId     = authorUser.map(u -> u.getKakaoId() != null ? u.getKakaoId() : "").orElse("");
            String btiType = authorUser.map(u -> u.getBtiType() != null ? u.getBtiType() : "").orElse("");
            return PostResponse.from(p, appRepo.countByPostId(p.getId()),
                userId.equals(p.getAuthorId()), kId, true, btiType);
        }).toList();
    }

    private CompanionPost findOwnedPost(Long id, String userId) {
        CompanionPost post = repo.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "공고를 찾을 수 없습니다."));
        if (!post.getAuthorId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "본인의 공고만 수정/삭제할 수 있습니다.");
        }
        return post;
    }

    private static String blankToNull(String s) {
        return (s == null || s.isBlank()) ? null : s.trim();
    }

    public record PostResponse(
        long id,
        String title,
        String stadium,
        LocalDate gameDate,
        String description,
        String authorName,
        String authorPreferredTeam,
        int totalTickets,
        int wantedCount,
        String ticketImageUrl,
        boolean closed,
        int applicantCount,
        boolean owner,
        boolean bookmarked,
        String authorKakaoId,
        String seatZone,
        String seatBlock,
        String seatRow,
        String seatNumber,
        String authorBtiType
    ) {
        static PostResponse from(CompanionPost p, int applicantCount, boolean owner,
                                  String authorKakaoId, boolean bookmarked, String authorBtiType) {
            return new PostResponse(
                p.getId(), p.getTitle(), p.getStadium(), p.getGameDate(),
                p.getDescription(), p.getAuthorName(), p.getAuthorPreferredTeam(),
                p.getTotalTickets(), p.getWantedCount(), p.getTicketImageUrl(),
                p.isClosed() || p.getGameDate().isBefore(java.time.LocalDate.now()),
                applicantCount, owner, bookmarked, authorKakaoId,
                p.getSeatZone(), p.getSeatBlock(), p.getSeatRow(), p.getSeatNumber(), authorBtiType
            );
        }
    }
}
