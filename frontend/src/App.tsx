import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { ToastProvider } from '@/context/ToastContext';
import { LanguageProvider } from '@/context/LanguageContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PublicHome from '@/pages/PublicHome';
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
import AuditLogs from '@/pages/AuditLogs';
import UserManagement from '@/pages/UserManagement';
import DoctorSchedule from '@/pages/DoctorSchedule';
import LabResults from '@/pages/LabResults';
import RevenueReports from '@/pages/RevenueReports';
import PatientVisitHistory from '@/pages/PatientVisitHistory';
import PWAInstallBanner from '@/components/pwa/PWAInstallBanner';
import ServerWakeupBanner from '@/components/common/ServerWakeupBanner';
import ErrorBoundary from '@/components/common/ErrorBoundary';
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
  const { isAuthenticated, user, isBootstrapping } = useAuth();

  if (isBootstrapping) {
    return (
      <div className="min-h-screen bg-[#0D1117] flex flex-col items-center justify-center p-6 text-center text-white">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mb-4">
          <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
        <h3 className="font-bold text-base text-white mb-1">Authenticating with Cloud Server...</h3>
        <p className="text-xs text-surface-400 max-w-sm">
          Please wait ~30s if the free tier instance is spinning up from sleep mode.
        </p>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && user && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function AnimatedRoutes() {
  const location = useLocation();
  const { isAuthenticated, isBootstrapping } = useAuth();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public routes accessible to everyone without login */}
        <Route path="/public" element={<PublicHome />} />
        <Route path="/login" element={<Login />} />
        
        {/* Root Route: public portal for guests, redirects to dashboard for logged in staff once verified */}
        <Route
          path="/"
          element={
            isBootstrapping ? (
              <PublicHome />
            ) : isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <PublicHome />
            )
          }
        />

        <Route
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/patients" element={<ProtectedRoute roles={['ADMIN', 'RECEPTIONIST', 'DOCTOR']}><PatientRegistration /></ProtectedRoute>} />
          <Route path="/appointments" element={<ProtectedRoute roles={['ADMIN', 'RECEPTIONIST', 'DOCTOR']}><Appointments /></ProtectedRoute>} />
          <Route path="/consultation" element={<ProtectedRoute roles={['DOCTOR']}><DoctorConsultation /></ProtectedRoute>} />
          <Route path="/prescriptions" element={<ProtectedRoute roles={['DOCTOR', 'RECEPTIONIST']}><Prescriptions /></ProtectedRoute>} />
          <Route path="/queue" element={<ProtectedRoute roles={['ADMIN', 'RECEPTIONIST', 'DOCTOR']}><QueueDisplay /></ProtectedRoute>} />
          <Route path="/beds" element={<ProtectedRoute roles={['ADMIN']}><BedManagement /></ProtectedRoute>} />
          <Route path="/billing" element={<ProtectedRoute roles={['ADMIN', 'CASHIER', 'RECEPTIONIST']}><Billing /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute roles={['ADMIN']}><Settings /></ProtectedRoute>} />
          <Route path="/audit-logs" element={<ProtectedRoute roles={['ADMIN']}><AuditLogs /></ProtectedRoute>} />
          <Route path="/users" element={<ProtectedRoute roles={['ADMIN']}><UserManagement /></ProtectedRoute>} />
          <Route path="/schedule" element={<ProtectedRoute roles={['DOCTOR']}><DoctorSchedule /></ProtectedRoute>} />
          <Route path="/lab-results" element={<ProtectedRoute roles={['LAB_TECH', 'DOCTOR']}><LabResults /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute roles={['ADMIN', 'CASHIER']}><RevenueReports /></ProtectedRoute>} />
          <Route path="/patient-history" element={<ProtectedRoute roles={['ADMIN', 'DOCTOR', 'RECEPTIONIST']}><PatientVisitHistory /></ProtectedRoute>} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <LanguageProvider>
            <ToastProvider>
              <AuthProvider>
                <BrowserRouter>
                  <ServerWakeupBanner />
                  <PWAInstallBanner />
                  <AnimatedRoutes />
                </BrowserRouter>
              </AuthProvider>
            </ToastProvider>
          </LanguageProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
