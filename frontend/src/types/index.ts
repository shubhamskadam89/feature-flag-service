export type Role = 'ADMIN' | 'MEMBER';

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Organization {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  role: Role;
}

export interface Project {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  isDeleted: boolean;
  featureCount?: number;
  environmentCount?: number;
}

export interface Environment {
  id: string;
  projectId: string;
  name: string;
  apiKeyPrefix: string;
  createdAt: string;
  updatedAt: string;
}

export interface EnvironmentWithKey extends Environment {
  plaintextApiKey: string;
}

export type FeatureType = 'BOOLEAN';

export interface Feature {
  id: string;
  projectId: string;
  key: string;
  name: string;
  description: string;
  type: FeatureType;
  createdAt: string;
  updatedAt: string;
}

export interface FeatureState {
  id: string;
  featureId: string;
  environmentId: string;
  enabled: boolean;
  updatedBy: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  organizationId: string;
  environmentId: string;
  featureId?: string;
  userId: string;
  userEmail: string;
  userName: string;
  action: string;
  oldValue?: string;
  newValue?: string;
  createdAt: string;
}

export interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  empty: boolean;
}
