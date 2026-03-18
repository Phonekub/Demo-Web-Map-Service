import React from 'react';

export interface RequirePermissionProps {
  permission: string | string[];
  children: React.ReactNode;
}

export const RequirePermission = ({ children }: RequirePermissionProps) => {
  // Demo mode: always grant permission
  return children;
};
