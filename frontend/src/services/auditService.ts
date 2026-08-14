import { apiClient, type ApiResponse } from '../api/client';
import { type AuditLog, type PageResponse } from '../types';

export async function getEnvironmentAuditLogs(
  environmentId: string,
  page = 0,
  size = 20
): Promise<ApiResponse<PageResponse<AuditLog>>> {
  return apiClient<ApiResponse<PageResponse<AuditLog>>>(
    `/environments/${environmentId}/audit-log?page=${page}&size=${size}&sort=createdAt,desc`
  );
}
