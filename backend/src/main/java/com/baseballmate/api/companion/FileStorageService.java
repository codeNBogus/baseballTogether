package com.baseballmate.api.companion;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Locale;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@Service
public class FileStorageService {

    private static final Path UPLOAD_DIR = Paths.get("uploads");
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(".jpg", ".jpeg", ".png", ".gif", ".webp", ".avif", ".heic");

    /**
     * 이미지 파일을 저장하고 접근 URL을 반환한다.
     * null 또는 빈 파일이면 null 반환.
     */
    public String store(MultipartFile file) {
        if (file == null || file.isEmpty()) return null;

        String extension = getExtension(file.getOriginalFilename());
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "허용되지 않는 파일 형식입니다. (jpg, jpeg, png, gif, webp, avif, heic 허용)");
        }

        try {
            Files.createDirectories(UPLOAD_DIR);
            String fileName = UUID.randomUUID() + extension;
            Path target = UPLOAD_DIR.resolve(fileName).normalize();
            // 경로 탈출 방지
            if (!target.startsWith(UPLOAD_DIR)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "잘못된 파일 경로입니다.");
            }
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
            return "/uploads/" + fileName;
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "이미지 저장에 실패했습니다.");
        }
    }

    private String getExtension(String originalName) {
        if (originalName == null || originalName.isBlank()) return "";
        int dot = originalName.lastIndexOf('.');
        if (dot < 0) return "";
        return originalName.substring(dot).toLowerCase(Locale.ROOT);
    }
}
