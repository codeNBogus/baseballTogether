package com.baseballmate.api.web;

import com.baseballmate.api.auth.AuthService;
import com.baseballmate.api.auth.AuthService.ProfileInfo;
import com.baseballmate.api.auth.AuthService.UserContext;
import com.baseballmate.api.common.CurrentUser;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
public class UserProfileController {

    private final AuthService authService;

    public UserProfileController(AuthService authService) {
        this.authService = authService;
    }

    @GetMapping("/me")
    public ProfileInfo getMyProfile(@CurrentUser UserContext user) {
        return authService.getProfile(user.id());
    }

    @PutMapping("/me")
    public ProfileInfo updateMyProfile(@CurrentUser UserContext user,
                                       @Valid @RequestBody UpdateProfileRequest request) {
        if (!authService.isSupportedTeam(request.favoriteTeam())) {
            throw new org.springframework.web.server.ResponseStatusException(
                org.springframework.http.HttpStatus.BAD_REQUEST, "지원하지 않는 구단입니다.");
        }
        return authService.saveProfile(
            user.id(), request.name(), request.age(), request.favoriteTeam(), request.kakaoId());
    }

    @PutMapping("/me/bti")
    public ProfileInfo updateBtiType(@CurrentUser UserContext user,
                                     @RequestBody UpdateBtiRequest request) {
        return authService.saveBtiType(user.id(), request.btiType());
    }

    @GetMapping("/teams")
    public List<String> teams() {
        return authService.getKboTeams();
    }

    public record UpdateBtiRequest(String btiType) {}

    public record UpdateProfileRequest(
        @NotBlank String name,
        @Min(1) @Max(120) int age,
        @NotBlank String favoriteTeam,
        @NotBlank String kakaoId
    ) {}
}
