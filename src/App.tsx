import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useStore } from '@/store';
import { ToastProvider } from '@/components/Toast';
import { Layout } from '@/components/Layout';
import { Login } from '@/pages/Login';
import { Dashboard } from '@/pages/Dashboard';
import { Members } from '@/pages/Members';
import { MemberDetail } from '@/pages/MemberDetail';
import { MemberForm } from '@/pages/MemberForm';
import { Cashier } from '@/pages/Cashier';
import { Recharge } from '@/pages/Recharge';
import { Marketing } from '@/pages/Marketing';
import { Employees } from '@/pages/Employees';
import { Commission } from '@/pages/Commission';
import { Settings } from '@/pages/Settings';

const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const currentUser = useStore(s => s.currentUser);
  const loc = useLocation();
  if (!currentUser) return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  return <>{children}</>;
};

const RequireAdmin: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const currentUser = useStore(s => s.currentUser);
  if (!currentUser) return <Navigate to="/login" replace />;
  if (currentUser.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

const Init: React.FC = () => {
  const init = useStore(s => s.initData);
  const refresh = useStore(s => s.refreshMemberRisk);
  useEffect(() => {
    const t1 = setTimeout(() => init(), 50);
    const t2 = setInterval(() => refresh(), 60 * 60 * 1000);
    return () => { clearTimeout(t1); clearInterval(t2); };
  }, [init, refresh]);
  return null;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ToastProvider>
        <Init />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={
            <RequireAuth><Layout /></RequireAuth>
          }>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="cashier" element={<Cashier />} />
            <Route path="recharge" element={<Recharge />} />
            <Route path="members" element={<Members />} />
            <Route path="members/new" element={<MemberForm />} />
            <Route path="members/:id" element={<MemberDetail />} />
            <Route path="members/:id/edit" element={<MemberForm />} />
            <Route path="marketing" element={<Marketing />} />
            <Route path="employees" element={<RequireAdmin><Employees /></RequireAdmin>} />
            <Route path="commission" element={<RequireAdmin><Commission /></RequireAdmin>} />
            <Route path="settings" element={<RequireAdmin><Settings /></RequireAdmin>} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </ToastProvider>
    </BrowserRouter>
  );
};
