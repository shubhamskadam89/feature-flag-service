import { apiClient, type ApiResponse } from '../api/client';
import { type Feature, type FeatureState } from '../types';

export async function getFeatures(projectId: string): Promise<ApiResponse<Feature[]>> {
  return apiClient<ApiResponse<Feature[]>>(`/projects/${projectId}/features`);
}

export async function createFeature(
  projectId: string,
  key: string,
  name: string,
  description: string
): Promise<ApiResponse<Feature>> {
  return apiClient<ApiResponse<Feature>>(`/projects/${projectId}/features`, {
    method: 'POST',
    body: JSON.stringify({ key, name, description, type: 'BOOLEAN' }),
  });
}

export async function updateFeature(
  projectId: string,
  featureId: string,
  name: string,
  description: string
): Promise<ApiResponse<Feature>> {
  return apiClient<ApiResponse<Feature>>(`/projects/${projectId}/features/${featureId}`, {
    method: 'PATCH',
    body: JSON.stringify({ name, description }),
  });
}

export async function deleteFeature(
  projectId: string,
  featureId: string
): Promise<ApiResponse<Feature>> {
  return apiClient<ApiResponse<Feature>>(`/projects/${projectId}/features/${featureId}`, {
    method: 'DELETE',
  });
}

export async function getFeatureStates(environmentId: string): Promise<ApiResponse<FeatureState[]>> {
  return apiClient<ApiResponse<FeatureState[]>>(`/environments/${environmentId}/features`);
}

export async function toggleFeatureState(
  environmentId: string,
  featureKey: string,
  enabled: boolean
): Promise<ApiResponse<FeatureState>> {
  return apiClient<ApiResponse<FeatureState>>(`/environments/${environmentId}/features/${featureKey}`, {
    method: 'PATCH',
    body: JSON.stringify({ enabled }),
  });
}
