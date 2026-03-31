import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoadingFallback from './components/Common/LoadingFallback';

// Shell Pages (Static imports for snappier transitions)
import Login from './pages/Login/Login';
import DashboardLayout from './components/Layout/DashboardLayout';

// Target Pages (Lazy-loaded for better runtime performance)
const CellView = React.lazy(() => import('./pages/Member/CellView'));
const CellManagement = React.lazy(() => import('./pages/Leader/CellManagement'));
const NetworkView = React.lazy(() => import('./pages/Discipler/NetworkView'));
const UserManagement = React.lazy(() => import('./pages/Users/UserManagement'));
const UserForm = React.lazy(() => import('./pages/Users/UserForm'));
const UserDetails = React.lazy(() => import('./pages/Users/UserDetails'));
const ReportsList = React.lazy(() => import('./pages/Reports/ReportsList'));
const ReportForm = React.lazy(() => import('./pages/Reports/ReportForm'));
const ReportDetails = React.lazy(() => import('./pages/Reports/ReportDetails'));

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
  
  // If userData is missing from DB, redirect to login to avoid getting stuck
  if (!userData) {
    console.error("Usuário autenticado mas sem dados no Firestore.");
    return <Navigate to="/login" replace />;
  }

  if (userData.role === 'root') return <Navigate to="/users" replace />;
  if (userData.role === 'discipulador') return <Navigate to="/network" replace />;
  if (userData.role === 'lider') return <Navigate to="/manage" replace />;
  return <Navigate to="/my-cell" replace />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
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
              
              <Route path="/manage" element={
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
  );
}

export default App;
