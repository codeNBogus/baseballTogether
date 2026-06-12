package com.baseballmate.api.web;

import com.baseballmate.api.auth.AuthService.UserContext;
import com.baseballmate.api.common.CurrentUser;
import com.baseballmate.api.companion.ApplicationService;
import com.baseballmate.api.companion.ApplicationService.ApplicationResponse;
import com.baseballmate.api.companion.ApplicationService.MyApplicationResponse;
import com.baseballmate.api.companion.CompanionService;
import com.baseballmate.api.companion.CompanionService.PostResponse;
import jakarta.validation.constraints.Size;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ApplicationController {

    private final ApplicationService applicationService;
    private final CompanionService companionService;

    public ApplicationController(ApplicationService applicationService,
                                  CompanionService companionService) {
        this.applicationService = applicationService;
        this.companionService = companionService;
    }

    /** 공고 신청 */
    @PostMapping("/api/companions/{postId}/apply")
    @ResponseStatus(HttpStatus.CREATED)
    public ApplicationResponse apply(@PathVariable Long postId,
                                     @CurrentUser UserContext user,
                                     @RequestBody(required = false) ApplyRequest request) {
        String message = request != null ? request.message() : "";
        return applicationService.apply(postId, user.id(), message == null ? "" : message);
    }

    /** 내 신청 취소 */
    @DeleteMapping("/api/companions/{postId}/apply")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void cancel(@PathVariable Long postId, @CurrentUser UserContext user) {
        applicationService.cancel(postId, user.id());
    }

    /** 공고의 신청자 목록 (작성자 전용) */
    @GetMapping("/api/companions/{postId}/applications")
    public List<ApplicationResponse> listApplications(@PathVariable Long postId,
                                                      @CurrentUser UserContext user) {
        return applicationService.getApplicationsForPost(postId, user.id());
    }

    /** 내 신청 목록 */
    @GetMapping("/api/applications/my")
    public List<MyApplicationResponse> myApplications(@CurrentUser UserContext user) {
        return applicationService.getMyApplications(user.id());
    }

    /** 신청 수락 (공고 작성자) */
    @PutMapping("/api/applications/{appId}/accept")
    public ApplicationResponse accept(@PathVariable Long appId, @CurrentUser UserContext user) {
        return applicationService.accept(appId, user.id());
    }

    /** 신청 거절 (공고 작성자) */
    @PutMapping("/api/applications/{appId}/reject")
    public ApplicationResponse reject(@PathVariable Long appId, @CurrentUser UserContext user) {
        return applicationService.reject(appId, user.id());
    }

    /** 공고 모집 마감/재개 토글 */
    @PostMapping("/api/companions/{postId}/close")
    public PostResponse toggleClose(@PathVariable Long postId, @CurrentUser UserContext user) {
        return companionService.toggleClose(postId, user);
    }

    public record ApplyRequest(@Size(max = 300) String message) {}
}
