package com.shubhamkadam.feature_flag_service.modules.environment.environment;

import java.util.List;
import java.util.UUID;

public interface EnvironmentService {

    EnvironmentWithKeyResponseDto createEnvironment(UUID projectId, EnvironmentRequestDto requestDto);

    List<EnvironmentResponseDto> getEnvironments(UUID projectId);

    EnvironmentResponseDto getEnvironmentById(UUID projectId, UUID environmentId);

    EnvironmentResponseDto updateEnvironment(UUID projectId, UUID environmentId, EnvironmentRequestDto requestDto);

    EnvironmentResponseDto softDeleteEnvironment(UUID projectId, UUID environmentId);

    EnvironmentWithKeyResponseDto rotateApiKey(UUID projectId, UUID environmentId);
}
