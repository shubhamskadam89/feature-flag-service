package com.shubhamkadam.feature_flag_service.common;

import lombok.*;
import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Getter
public class ApiResponse<T> {

    @Builder.Default
    private Instant timestamp = Instant.now();
    private int status;
    private String message;
    private T data;
    private String path;

    public static <T> ApiResponse<T> success(int status, String message, T data, String path) {
        return ApiResponse.<T>builder()
                .timestamp(Instant.now())
                .status(status)
                .message(message)
                .data(data)
                .path(path)
                .build();
    }
}