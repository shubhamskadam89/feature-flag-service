package com.shubhamkadam.feature_flag_service.modules.audit;

import com.shubhamkadam.feature_flag_service.common.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("/api/v1/environments")
@RequiredArgsConstructor
public class AuditLogController {

    private final AuditLogService auditLogService;

    @GetMapping("/{environmentId}/audit-log")
    public ResponseEntity<ApiResponse<Page<AuditLogResponseDto>>> getEnvironmentAuditLogs(
        @PathVariable UUID environmentId,
        @PageableDefault(size = 20) Pageable pageable,
        HttpServletRequest httpRequest
    ) {
        log.info("Fetching audit logs for environment: {}", environmentId);

        Page<AuditLogResponseDto> auditLogs = auditLogService.getEnvironmentAuditLogs(environmentId, pageable);

        return ResponseEntity.ok(
            ApiResponse.success(
                HttpStatus.OK.value(),
                "Audit logs retrieved successfully",
                auditLogs,
                httpRequest.getRequestURI()
            )
        );
    }
}
