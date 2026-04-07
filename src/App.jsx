import React, { Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { GlobalProvider, useGlobal } from './contexts/GlobalContext';
import LoadingFallback from './components/Common/LoadingFallback';
import GlobalLoader from './components/Common/GlobalLoader';
import ProgressBar from './components/Common/ProgressBar';
import ToastContainer from './components/Common/ToastContainer';

// Shell Pages (Static imports for snappier transitions)
import Login from './pages/Login/Login';
import DashboardLayout from './components/Layout/DashboardLayout';

// Target Pages (Lazy-loaded for better runtime performance)
const CellView = React.lazy(() => import('./pages/Member/CellView'));
// ... (outros imports lazy que já existem)
const CellManagement = React.lazy(() => import('./pages/Leader/CellManagement'));
const NetworkView = React.lazy(() => import('./pages/Discipler/NetworkView'));
const UserManagement = React.lazy(() => import('./pages/Users/UserManagement'));
const UserForm = React.lazy(() => import('./pages/Users/UserForm'));
const UserDetails = React.lazy(() => import('./pages/Users/UserDetails'));
const ReportsList = React.lazy(() => import('./pages/Reports/ReportsList'));
const ReportForm = React.lazy(() => import('./pages/Reports/ReportForm'));
const ReportDetails = React.lazy(() => import('./pages/Reports/ReportDetails'));

const NetworkManagement = React.lazy(() => import('./pages/Admin/NetworkManagement'));
const NetworkForm = React.lazy(() => import('./pages/Admin/NetworkForm'));
const CellAdminManagement = React.lazy(() => import('./pages/Admin/CellManagement'));
const CellAdminForm = React.lazy(() => import('./pages/Admin/CellForm'));
const CellAdminDetails = React.lazy(() => import('./pages/Admin/CellDetails'));

// Root Setup (Temporary)
import RootSetup from './components/Admin/RootSetup';

const RouteChangeTracker = () => {
  const { startNavigation, stopNavigation } = useGlobal();
  const location = useLocation();

  useEffect(() => {
    startNavigation();
    const timeout = setTimeout(() => {
      stopNavigation();
    }, 150); // Reduzido: 500ms era perceptível como lentidão artificial
    return () => {
      clearTimeout(timeout);
      stopNavigation();
    };
  }, [location, startNavigation, stopNavigation]);

  return null;
};

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { currentUser, userData } = useAuth();
  
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles && (!userData || !allowedRoles.includes(userData.role))) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const DashboardRouter = () => {
  const { currentUser, userData, loading } = useAuth();

  if (loading) return <LoadingFallback />;
  if (!currentUser) return <Navigate to="/login" replace />;
  
  if (!userData) {
    console.error("Usuário autenticado mas sem dados no Firestore.");
    return <Navigate to="/login" replace />;
  }

  if (userData.role === 'root') return <Navigate to="/admin/networks" replace />;
  if (userData.role === 'discipulador') return <Navigate to="/admin/cells" replace />;
  if (userData.role === 'lider') return <Navigate to="/my-cell/manage" replace />;
  return <Navigate to="/my-cell" replace />;
};

function App() {
  return (
    <GlobalProvider>
      <AuthProvider>
        <RootSetup />
        <BrowserRouter>
          <RouteChangeTracker />
          <ProgressBar />
          <GlobalLoader />
          <ToastContainer />
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              <Route path="/login" element={<Login />} />
              
              <Route element={<DashboardLayout />}>
                <Route path="/" element={<DashboardRouter />} />
                
                <Route path="/my-cell" element={
                  <ProtectedRoute allowedRoles={['membro', 'lider']}>
                    <CellView />
                  </ProtectedRoute>
                } />
                
                {/* Admin: Networks */}
                <Route path="/admin/networks" element={
                  <ProtectedRoute allowedRoles={['root']}>
                    <NetworkManagement />
                  </ProtectedRoute>
                } />
                <Route path="/admin/networks/new" element={
                  <ProtectedRoute allowedRoles={['root']}>
                    <NetworkForm />
                  </ProtectedRoute>
                } />
                <Route path="/admin/networks/:id/edit" element={
                  <ProtectedRoute allowedRoles={['root']}>
                    <NetworkForm />
                  </ProtectedRoute>
                } />

                {/* Admin: Cells */}
                <Route path="/admin/cells" element={
                  <ProtectedRoute allowedRoles={['root', 'discipulador']}>
                    <CellAdminManagement />
                  </ProtectedRoute>
                } />
                <Route path="/admin/cells/new" element={
                  <ProtectedRoute allowedRoles={['root', 'discipulador']}>
                    <CellAdminForm />
                  </ProtectedRoute>
                } />
                <Route path="/admin/cells/:id/edit" element={
                  <ProtectedRoute allowedRoles={['root', 'discipulador']}>
                    <CellAdminForm />
                  </ProtectedRoute>
                } />
                <Route path="/admin/cells/:id" element={
                  <ProtectedRoute allowedRoles={['root', 'discipulador']}>
                    <CellAdminDetails />
                  </ProtectedRoute>
                } />

                <Route path="/my-cell/manage" element={
                  <ProtectedRoute allowedRoles={['lider']}>
                    <CellManagement />
                  </ProtectedRoute>
                } />
                
                <Route path="/network" element={
                  <ProtectedRoute allowedRoles={['discipulador', 'root']}>
                    <NetworkView />
                  </ProtectedRoute>
                } />

                <Route path="/users" element={
                  <ProtectedRoute allowedRoles={['discipulador', 'root', 'lider', 'leader']}>
                    <UserManagement />
                  </ProtectedRoute>
                } />
                
                <Route path="/users/new" element={
                  <ProtectedRoute allowedRoles={['discipulador', 'root', 'lider', 'leader']}>
                    <UserForm />
                  </ProtectedRoute>
                } />
                
                <Route path="/users/:id/edit" element={
                  <ProtectedRoute allowedRoles={['discipulador', 'root', 'lider', 'leader']}>
                    <UserForm />
                  </ProtectedRoute>
                } />
                
                <Route path="/users/:id" element={
                  <ProtectedRoute allowedRoles={['discipulador', 'root', 'lider', 'leader']}>
                    <UserDetails />
                  </ProtectedRoute>
                } />

                <Route path="/reports" element={
                  <ProtectedRoute allowedRoles={['lider', 'leader', 'discipulador', 'root']}>
                    <ReportsList />
                  </ProtectedRoute>
                } />
                <Route path="/reports/new" element={
                  <ProtectedRoute allowedRoles={['lider', 'leader']}>
                    <ReportForm />
                  </ProtectedRoute>
                } />
                <Route path="/reports/:id" element={
                  <ProtectedRoute allowedRoles={['lider', 'leader', 'discipulador', 'root']}>
                    <ReportDetails />
                  </ProtectedRoute>
                } />
              </Route>
              
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </GlobalProvider>
  );
}

export default App;

