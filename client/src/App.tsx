import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from '@/store/AuthContext';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';
import CoordinatorDashboard from '@/pages/coordinator/Dashboard';
import YouthManagement from '@/pages/coordinator/YouthManagement';
import JobManagement from '@/pages/coordinator/JobManagement';
import ClientManagement from '@/pages/coordinator/ClientManagement';
import Reports from '@/pages/coordinator/Reports';
import YouthMyJobs from '@/pages/youth/MyJobs';
import YouthJobDetail from '@/pages/youth/JobDetail';
import YouthProfile from '@/pages/youth/Profile';
import YouthEarnings from '@/pages/youth/Earnings';
import ClientRequestService from '@/pages/client/RequestService';
import ClientMyJobs from '@/pages/client/MyJobs';
import ClientCSRReport from '@/pages/client/CSRReport';
import ClientBrandedPortal from '@/pages/client/BrandedPortal';
import NotificationsPage from '@/pages/common/Notifications';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

/** Redirects authenticated users to their role-based default route */
function RoleRedirect() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) return null;
  if (!isAuthenticated || !user) return <Navigate to="/login" replace />;

  const defaultRoutes: Record<string, string> = {
    COORDINATOR: '/coordinator/dashboard',
    YOUTH: '/youth/jobs',
    CLIENT: '/client/portal',
  };

  return <Navigate to={defaultRoutes[user.role] ?? '/login'} replace />;
}


function AppRoutes() {
  return (
    <Routes>
      {/* Auth routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Protected dashboard routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        {/* Default redirect based on role */}
        <Route index element={<RoleRedirect />} />

        {/* Coordinator routes */}
        <Route
          path="coordinator/dashboard"
          element={
            <ProtectedRoute allowedRoles={['COORDINATOR']}>
              <CoordinatorDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="coordinator/youth"
          element={
            <ProtectedRoute allowedRoles={['COORDINATOR']}>
              <YouthManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="coordinator/jobs"
          element={
            <ProtectedRoute allowedRoles={['COORDINATOR']}>
              <JobManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="coordinator/clients"
          element={
            <ProtectedRoute allowedRoles={['COORDINATOR']}>
              <ClientManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="coordinator/reports"
          element={
            <ProtectedRoute allowedRoles={['COORDINATOR']}>
              <Reports />
            </ProtectedRoute>
          }
        />
        <Route
          path="coordinator/notifications"
          element={
            <ProtectedRoute allowedRoles={['COORDINATOR']}>
              <NotificationsPage />
            </ProtectedRoute>
          }
        />

        {/* Youth routes */}
        <Route
          path="youth/jobs"
          element={
            <ProtectedRoute allowedRoles={['YOUTH']}>
              <YouthMyJobs />
            </ProtectedRoute>
          }
        />
        <Route
          path="youth/jobs/:id"
          element={
            <ProtectedRoute allowedRoles={['YOUTH']}>
              <YouthJobDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="youth/profile"
          element={
            <ProtectedRoute allowedRoles={['YOUTH']}>
              <YouthProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="youth/earnings"
          element={
            <ProtectedRoute allowedRoles={['YOUTH']}>
              <YouthEarnings />
            </ProtectedRoute>
          }
        />
        <Route
          path="youth/notifications"
          element={
            <ProtectedRoute allowedRoles={['YOUTH']}>
              <NotificationsPage />
            </ProtectedRoute>
          }
        />

        {/* Client routes */}
        <Route
          path="client/portal"
          element={
            <ProtectedRoute allowedRoles={['CLIENT']}>
              <ClientBrandedPortal />
            </ProtectedRoute>
          }
        />
        <Route
          path="client/request"
          element={
            <ProtectedRoute allowedRoles={['CLIENT']}>
              <ClientRequestService />
            </ProtectedRoute>
          }
        />
        <Route
          path="client/jobs"
          element={
            <ProtectedRoute allowedRoles={['CLIENT']}>
              <ClientMyJobs />
            </ProtectedRoute>
          }
        />
        <Route
          path="client/csr-report"
          element={
            <ProtectedRoute allowedRoles={['CLIENT']}>
              <ClientCSRReport />
            </ProtectedRoute>
          }
        />
        <Route
          path="client/notifications"
          element={
            <ProtectedRoute allowedRoles={['CLIENT']}>
              <NotificationsPage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                fontFamily: '"DM Sans", system-ui, sans-serif',
                borderRadius: '0.75rem',
                padding: '12px 16px',
                fontSize: '14px',
                boxShadow: '0 4px 12px rgba(28, 25, 23, 0.1)',
              },
              success: {
                iconTheme: { primary: '#15803D', secondary: '#fff' },
              },
              error: {
                iconTheme: { primary: '#DC2626', secondary: '#fff' },
              },
            }}
          />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
