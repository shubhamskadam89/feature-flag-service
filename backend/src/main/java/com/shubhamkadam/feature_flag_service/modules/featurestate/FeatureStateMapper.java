package com.shubhamkadam.feature_flag_service.modules.featurestate;

import org.springframework.stereotype.Component;

@Component
public class FeatureStateMapper {

    public FeatureStateResponse toResponse(FeatureState featureState) {
        return new FeatureStateResponse(
            featureState.getId(),
            featureState.getFeature().getId(),
            featureState.getEnvironment().getId(),
            featureState.getEnabled(),
            featureState.getUpdatedBy() != null ? featureState.getUpdatedBy().getId() : null,
            featureState.getUpdatedAt()
        );
    }
}
