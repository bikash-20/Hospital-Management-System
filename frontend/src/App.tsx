import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import PatientRegistration from '@/pages/PatientRegistration';
import Appointments from '@/pages/Appointments';
import DoctorConsultation from '@/pages/DoctorConsultation';
import Prescriptions from '@/pages/Prescriptions';
import QueueDisplay from '@/pages/QueueDisplay';
import BedManagement from '@/pages/BedManagement';
import Billing from '@/pages/Billing';
import Settings from '@/pages/Settings';
import type { ReactNode } from 'react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRoute({ children, roles }: { children: ReactNode; roles?: string[] }) {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && user && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/login" element={<Login />} />
        <Route
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Dashboard />} />
          <Route path="/patients" element={<ProtectedRoute roles={['ADMIN', 'RECEPTIONIST', 'DOCTOR']}><PatientRegistration /></ProtectedRoute>} />
          <Route path="/appointments" element={<ProtectedRoute roles={['ADMIN', 'RECEPTIONIST', 'DOCTOR']}><Appointments /></ProtectedRoute>} />
          <Route path="/consultation" element={<ProtectedRoute roles={['DOCTOR']}><DoctorConsultation /></ProtectedRoute>} />
          <Route path="/prescriptions" element={<ProtectedRoute roles={['DOCTOR', 'RECEPTIONIST']}><Prescriptions /></ProtectedRoute>} />
          <Route path="/queue" element={<ProtectedRoute roles={['ADMIN', 'RECEPTIONIST', 'DOCTOR']}><QueueDisplay /></ProtectedRoute>} />
          <Route path="/beds" element={<ProtectedRoute roles={['ADMIN']}><BedManagement /></ProtectedRoute>} />
          <Route path="/billing" element={<ProtectedRoute roles={['ADMIN', 'CASHIER', 'RECEPTIONIST']}><Billing /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute roles={['ADMIN']}><Settings /></ProtectedRoute>} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <AnimatedRoutes />
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
