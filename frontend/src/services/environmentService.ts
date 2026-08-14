import { apiClient, type ApiResponse } from '../api/client';
import { type Environment, type EnvironmentWithKey } from '../types';

export async function getEnvironments(projectId: string): Promise<ApiResponse<Environment[]>> {
  return apiClient<ApiResponse<Environment[]>>(`/projects/${projectId}/environments`);
}

export async function createEnvironment(
  projectId: string,
  name: string
): Promise<ApiResponse<EnvironmentWithKey>> {
  return apiClient<ApiResponse<EnvironmentWithKey>>(`/projects/${projectId}/environments`, {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export async function updateEnvironment(
  projectId: string,
  environmentId: string,
  name: string
): Promise<ApiResponse<Environment>> {
  return apiClient<ApiResponse<Environment>>(`/projects/${projectId}/environments/${environmentId}`, {
    method: 'PATCH',
    body: JSON.stringify({ name }),
  });
}

export async function deleteEnvironment(
  projectId: string,
  environmentId: string
): Promise<ApiResponse<Environment>> {
  return apiClient<ApiResponse<Environment>>(`/projects/${projectId}/environments/${environmentId}`, {
    method: 'DELETE',
  });
}

export async function rotateApiKey(
  projectId: string,
  environmentId: string
): Promise<ApiResponse<EnvironmentWithKey>> {
  return apiClient<ApiResponse<EnvironmentWithKey>>(
    `/projects/${projectId}/environments/${environmentId}/rotate-key`,
    {
      method: 'POST',
    }
  );
}
