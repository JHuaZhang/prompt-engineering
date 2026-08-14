import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AuthRoute from './AuthRoute';
import PermissionRoute from './PermissionRoute';
import MainLayout from '@/components/Layout/MainLayout';
import Login from '@/pages/Login';
import Setup from '@/pages/Setup';
import ResetPassword from '@/pages/ResetPassword';
import Dashboard from '@/pages/Dashboard';
import UserManagement from '@/pages/UserManagement';

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/setup" element={<Setup />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Authenticated routes */}
        <Route element={<AuthRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />

            {/* Admin-only routes */}
            <Route element={<PermissionRoute roles={['root', 'admin']} />}>
              <Route path="/users" element={<UserManagement />} />
            </Route>
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
