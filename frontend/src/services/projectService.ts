import { apiClient, type ApiResponse } from '../api/client';
import { type Project } from '../types';

interface ProjectResponseDto {
  projectName: string;
  projectId: string;
  organizationName: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
  createdByName: string;
  createdById: string;
}

function mapProjectDto(dto: ProjectResponseDto): Project {
  return {
    id: dto.projectId,
    name: dto.projectName,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
    createdBy: dto.createdByName,
    isDeleted: false,
  };
}

export async function getProjects(): Promise<ApiResponse<Project[]>> {
  const res = await apiClient<ApiResponse<ProjectResponseDto[]>>('/projects');
  return {
    ...res,
    data: (res.data || []).map(mapProjectDto),
  };
}

export async function createProject(projectName: string): Promise<ApiResponse<Project>> {
  const res = await apiClient<ApiResponse<ProjectResponseDto>>('/projects', {
    method: 'POST',
    body: JSON.stringify({ projectName }),
  });
  return {
    ...res,
    data: mapProjectDto(res.data),
  };
}

export async function updateProject(id: string, projectName: string): Promise<ApiResponse<Project>> {
  const res = await apiClient<ApiResponse<ProjectResponseDto>>(`/projects/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ projectName }),
  });
  return {
    ...res,
    data: mapProjectDto(res.data),
  };
}

export async function deleteProject(id: string): Promise<ApiResponse<Project>> {
  const res = await apiClient<ApiResponse<ProjectResponseDto>>(`/projects/${id}`, {
    method: 'DELETE',
  });
  return {
    ...res,
    data: mapProjectDto(res.data),
  };
}

export async function getProjectByIdWithinOrganization(id: string): Promise<ApiResponse<Project>> {
  const res = await apiClient<ApiResponse<ProjectResponseDto>>(`/projects/${id}`);
  return {
    ...res,
    data: mapProjectDto(res.data),
  };
}
