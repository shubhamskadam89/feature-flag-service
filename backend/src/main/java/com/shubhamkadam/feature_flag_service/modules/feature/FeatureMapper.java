package com.shubhamkadam.feature_flag_service.modules.feature;

import org.springframework.stereotype.Component;

@Component
public class FeatureMapper {

    public FeatureResponseDto toDto(Feature feature) {
        return new FeatureResponseDto(
            feature.getId(),
            feature.getProject().getId(),
            feature.getKey(),
            feature.getName(),
            feature.getDescription(),
            feature.getType(),
            feature.getCreatedAt(),
            feature.getUpdatedAt()
        );
    }
}
