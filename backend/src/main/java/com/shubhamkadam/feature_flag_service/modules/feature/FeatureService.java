package com.shubhamkadam.feature_flag_service.modules.feature;

import java.util.List;
import java.util.UUID;

public interface FeatureService {
    FeatureResponseDto createFeature(UUID projectId, CreateFeatureRequest request);

    List<FeatureResponseDto> getFeatures(UUID projectId);

    FeatureResponseDto getFeatureById(UUID projectId, UUID featureId);

    FeatureResponseDto updateFeature(UUID projectId, UUID featureId, UpdateFeatureRequest request);

    FeatureResponseDto softDeleteFeature(UUID projectId, UUID featureId);
}
