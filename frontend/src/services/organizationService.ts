import { apiClient, type ApiResponse } from '../api/client';
import { type Organization } from '../types';

export async function getOrganizations(): Promise<ApiResponse<Organization[]>> {
  return apiClient<ApiResponse<Organization[]>>('/org');
}

export async function createOrganization(name: string): Promise<ApiResponse<Organization>> {
  return apiClient<ApiResponse<Organization>>('/org', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export async function updateOrganization(id: string, name: string): Promise<ApiResponse<Organization>> {
  return apiClient<ApiResponse<Organization>>(`/org/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ name }),
  });
}

export async function deleteOrganization(id: string): Promise<ApiResponse<Organization>> {
  return apiClient<ApiResponse<Organization>>(`/org/${id}`, {
    method: 'DELETE',
  });
}
