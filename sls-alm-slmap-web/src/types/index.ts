// Common TypeScript type definitions
export interface User {
  id: number;
  employeeId: number;
  fullName: string;
  permissions?: string[];
  roleId?: number;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

// Route configuration type
export interface RouteConfig {
  path: string;
  element: React.ComponentType;
  title: string;
  description: string;
  permission: string[];
  layout?: 'blank' | 'default';
}

// Export user types
export * from './user.type';
