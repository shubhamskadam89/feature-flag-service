package com.shubhamkadam.feature_flag_service.modules.environment;

import org.springframework.stereotype.Component;

@Component
public class EnvironmentMapper {

    public EnvironmentResponseDto toDto(Environment environment) {
        if (environment == null) {
            return null;
        }
        return new EnvironmentResponseDto(
            environment.getId(),
            environment.getProject().getId(),
            environment.getName(),
            environment.getApiKeyPrefix(),
            environment.getCreatedAt(),
            environment.getUpdatedAt()
        );
    }

    public EnvironmentWithKeyResponseDto toWithKeyDto(Environment environment, String plaintextApiKey) {
        if (environment == null) {
            return null;
        }
        return new EnvironmentWithKeyResponseDto(
            environment.getId(),
            environment.getProject().getId(),
            environment.getName(),
            environment.getApiKeyPrefix(),
            plaintextApiKey,
            environment.getCreatedAt(),
            environment.getUpdatedAt()
        );
    }
}
