import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login/Login';
import DashboardLayout from './components/Layout/DashboardLayout';
import CellView from './pages/Member/CellView';
import CellManagement from './pages/Leader/CellManagement';
import NetworkView from './pages/Discipler/NetworkView';
import UserManagement from './pages/Users/UserManagement';
import UserForm from './pages/Users/UserForm';
import UserDetails from './pages/Users/UserDetails';
import ReportsList from './pages/Reports/ReportsList';
import ReportForm from './pages/Reports/ReportForm';
import ReportDetails from './pages/Reports/ReportDetails';

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
  const { currentUser, userData } = useAuth();

  if (!currentUser) return <Navigate to="/login" replace />;
  if (!userData) return <div>Carregando usuário...</div>;

  if (userData.role === 'root') return <Navigate to="/users" replace />;
  if (userData.role === 'discipulador') return <Navigate to="/network" replace />;
  if (userData.role === 'lider') return <Navigate to="/manage" replace />;
  return <Navigate to="/my-cell" replace />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
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
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
