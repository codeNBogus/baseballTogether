package com.baseballmate.api.web;

import com.baseballmate.api.auth.AuthService.UserContext;
import com.baseballmate.api.common.CurrentUser;
import com.baseballmate.api.companion.CompanionService;
import com.baseballmate.api.companion.CompanionService.PostResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/companions")
public class CompanionController {

    private final CompanionService companionService;

    public CompanionController(CompanionService companionService) {
        this.companionService = companionService;
    }

    @GetMapping
    public List<PostResponse> list(@CurrentUser(required = false) UserContext user) {
        return companionService.findAll(user != null ? user.id() : null);
    }

    @GetMapping("/my")
    public List<PostResponse> myPosts(@CurrentUser UserContext user) {
        return companionService.findByAuthor(user.id());
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public PostResponse create(@CurrentUser UserContext user,
                               @Valid @ModelAttribute PostRequest request,
                               @RequestParam(name = "ticketImage", required = false) MultipartFile ticketImage) {
        return companionService.create(
            user, request.title(), request.stadium(), request.gameDate(),
            request.description(), request.totalTickets(), request.wantedCount(), ticketImage,
            request.seatZone(), request.seatBlock(), request.seatRow(), request.seatNumber()
        );
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public PostResponse update(@PathVariable long id,
                               @CurrentUser UserContext user,
                               @Valid @ModelAttribute PostRequest request,
                               @RequestParam(name = "ticketImage", required = false) MultipartFile ticketImage) {
        return companionService.update(
            id, user, request.title(), request.stadium(), request.gameDate(),
            request.description(), request.totalTickets(), request.wantedCount(), ticketImage,
            request.seatZone(), request.seatBlock(), request.seatRow(), request.seatNumber()
        );
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable long id, @CurrentUser UserContext user) {
        companionService.delete(id, user);
    }

    /** 북마크 토글 (찜/찜 해제) */
    @PostMapping("/{id}/bookmark")
    public PostResponse toggleBookmark(@PathVariable long id, @CurrentUser UserContext user) {
        return companionService.toggleBookmark(id, user.id());
    }

    /** 내 찜 목록 */
    @GetMapping("/bookmarked")
    public List<PostResponse> bookmarked(@CurrentUser UserContext user) {
        return companionService.findBookmarked(user.id());
    }

    public record PostRequest(
        @NotBlank String title,
        @NotBlank String stadium,
        @NotNull LocalDate gameDate,
        @NotBlank String description,
        @NotNull @Min(1) @Max(20) Integer totalTickets,
        @NotNull @Min(1) @Max(20) Integer wantedCount,
        // 좌석 위치
        @NotBlank String seatZone,
        String seatBlock,
        String seatRow,
        String seatNumber
    ) {}
}
