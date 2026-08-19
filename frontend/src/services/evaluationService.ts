import { apiClient, type ApiResponse } from '../api/client';
import { type EvaluationResult, type BulkEvaluationResponse, type BulkEvaluationRequest } from '../types';

export async function evaluateFeature(
  environmentId: string,
  featureKey: string,
  contextKey?: string,
  apiKey?: string
): Promise<ApiResponse<EvaluationResult>> {
  const query = contextKey ? `?contextKey=${encodeURIComponent(contextKey)}` : '';
  const headers: Record<string, string> = {};
  const activeKey = apiKey || localStorage.getItem(`env_key_${environmentId}`) || localStorage.getItem('activeEnvironmentApiKey');
  if (activeKey) {
    headers['X-Api-Key'] = activeKey;
  }
  return apiClient<ApiResponse<EvaluationResult>>(
    `/evaluate/environments/${environmentId}/features/${featureKey}${query}`,
    { headers }
  );
}

export async function evaluateBulkFeatures(
  environmentId: string,
  request: BulkEvaluationRequest,
  apiKey?: string
): Promise<ApiResponse<BulkEvaluationResponse>> {
  const headers: Record<string, string> = {};
  const activeKey = apiKey || localStorage.getItem(`env_key_${environmentId}`) || localStorage.getItem('activeEnvironmentApiKey');
  if (activeKey) {
    headers['X-Api-Key'] = activeKey;
  }
  return apiClient<ApiResponse<BulkEvaluationResponse>>(
    `/evaluate/environments/${environmentId}/bulk`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify(request),
    }
  );
}
