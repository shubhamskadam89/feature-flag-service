package com.shubhamkadam.feature_flag_service.modules.featurestate;

import java.util.UUID;

public interface FeatureStateService {
    FeatureStateResponse toggleFeatureState(UUID environmentId, String featureKey, FeatureStateRequest request);
}
