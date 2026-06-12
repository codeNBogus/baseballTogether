package com.baseballmate.api.common;

import com.baseballmate.api.auth.AuthException;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    /** 인증/비즈니스 예외 → 400 */
    @ExceptionHandler(AuthException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, String> handleAuthException(AuthException e) {
        return Map.of("message", e.getMessage());
    }

    /** Bean Validation 실패 → 400 + 필드별 오류 메시지 */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, Object> handleValidation(MethodArgumentNotValidException e) {
        Map<String, String> errors = e.getBindingResult().getFieldErrors().stream()
            .collect(Collectors.toMap(FieldError::getField, fe ->
                fe.getDefaultMessage() != null ? fe.getDefaultMessage() : "유효하지 않은 값입니다."));
        return Map.of("message", "입력값을 확인해 주세요.", "errors", errors);
    }
}
