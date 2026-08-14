import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';

interface PermissionRouteProps {
  roles: string[];
}

/** 基于角色控制路由访问 */
export default function PermissionRoute({ roles }: PermissionRouteProps) {
  const user = useAuthStore((state) => state.user);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
