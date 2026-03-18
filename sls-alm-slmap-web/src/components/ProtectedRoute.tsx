import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
};

export default function ProtectedRoute({ children }: Props) {
  if (import.meta.env.DEV) {
    return <>{children}</>;
  }
  return <Navigate to="/login" replace />;
}
