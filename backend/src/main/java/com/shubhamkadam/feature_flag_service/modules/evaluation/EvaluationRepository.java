package com.shubhamkadam.feature_flag_service.modules.evaluation;

import com.shubhamkadam.feature_flag_service.modules.feature.Feature;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

@org.springframework.stereotype.Repository
public interface EvaluationRepository extends Repository<Feature, UUID> {
    @Query(
        "SELECT new com.shubhamkadam.feature_flag_service.modules.evaluation.FeatureEvaluationData(" +
        " f.id, f.key, f.type, fs.enabled, fs.value, fs.rolloutPercentage) " +
        "FROM Feature f " +
        "JOIN Environment e ON f.project.id = e.project.id " +
        "LEFT JOIN FeatureState fs ON fs.feature.id = f.id AND fs.environment.id = e.id " +
        "WHERE e.id = :environmentId AND f.deletedAt IS NULL"
    )
    List<FeatureEvaluationData> findAllEvaluationDataByEnvironmentId(@Param("environmentId") UUID environmentId);
}
