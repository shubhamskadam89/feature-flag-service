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
