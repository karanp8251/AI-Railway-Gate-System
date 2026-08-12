import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { SocketProvider } from './context/SocketContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import DashboardLayout from './components/layout/DashboardLayout';
import { ROLES } from './config/constants';

import Home from './pages/Home';
import Register from './pages/auth/Register';
import LoginPanel from './pages/auth/LoginPanel';
import UserDashboard from './pages/user/UserDashboard';
import NearbyCrossings from './pages/user/NearbyCrossings';
import Complaints from './pages/user/Complaints';
import WorkerDashboard from './pages/worker/WorkerDashboard';
import LiveMonitoring from './pages/worker/LiveMonitoring';
import AuthorityDashboard from './pages/authority/AuthorityDashboard';
import UserManagement from './pages/authority/UserManagement';
import Analytics from './pages/shared/Analytics';
import AlertsPage from './pages/shared/AlertsPage';
import LogsPage from './pages/shared/LogsPage';
import SettingsPage from './pages/shared/SettingsPage';

function Unauthorized() {
  return (
    <div className="min-h-screen grid-bg flex items-center justify-center">
      <div className="glass-card p-8 text-center">
        <h1 className="font-display text-2xl text-red-400">Access Denied</h1>
        <p className="text-slate-400 mt-2">You do not have permission to view this page.</p>
        <a href="/" className="text-cyan-400 mt-4 inline-block">Go Home</a>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login/user" element={<LoginPanel role={ROLES.USER} titleKey="login.user" accent="cyan" />} />
            <Route path="/login/worker" element={<LoginPanel role={ROLES.WORKER} titleKey="login.worker" accent="purple" />} />
            <Route path="/login/authority" element={<LoginPanel role={ROLES.AUTHORITY} titleKey="login.authority" accent="green" />} />
            <Route path="/unauthorized" element={<Unauthorized />} />

            <Route
              element={
                <ProtectedRoute>
                  <SocketProvider>
                    <DashboardLayout />
                  </SocketProvider>
                </ProtectedRoute>
              }
            >
              <Route path="/user/dashboard" element={<ProtectedRoute allowedRoles={[ROLES.USER]}><UserDashboard /></ProtectedRoute>} />
              <Route path="/user/crossings" element={<ProtectedRoute allowedRoles={[ROLES.USER]}><NearbyCrossings /></ProtectedRoute>} />
              <Route path="/user/complaints" element={<ProtectedRoute allowedRoles={[ROLES.USER]}><Complaints /></ProtectedRoute>} />

              <Route path="/worker/dashboard" element={<ProtectedRoute allowedRoles={[ROLES.WORKER]}><WorkerDashboard /></ProtectedRoute>} />
              <Route path="/worker/monitoring" element={<ProtectedRoute allowedRoles={[ROLES.WORKER, ROLES.AUTHORITY]}><LiveMonitoring /></ProtectedRoute>} />
              <Route path="/worker/logs" element={<ProtectedRoute allowedRoles={[ROLES.WORKER]}><LogsPage /></ProtectedRoute>} />

              <Route path="/authority/dashboard" element={<ProtectedRoute allowedRoles={[ROLES.AUTHORITY]}><AuthorityDashboard /></ProtectedRoute>} />
              <Route path="/authority/users" element={<ProtectedRoute allowedRoles={[ROLES.AUTHORITY]}><UserManagement /></ProtectedRoute>} />
              <Route path="/authority/settings" element={<ProtectedRoute allowedRoles={[ROLES.AUTHORITY]}><SettingsPage authority /></ProtectedRoute>} />

              <Route path="/analytics" element={<Analytics />} />
              <Route path="/alerts" element={<AlertsPage />} />
              <Route path="/logs" element={<ProtectedRoute allowedRoles={[ROLES.AUTHORITY]}><LogsPage /></ProtectedRoute>} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
