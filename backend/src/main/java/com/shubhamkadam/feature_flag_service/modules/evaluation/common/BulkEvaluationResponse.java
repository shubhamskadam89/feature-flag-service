package com.shubhamkadam.feature_flag_service.modules.evaluation.common;

import java.util.List;

public record BulkEvaluationResponse(List<EvaluationResult> results) {}
