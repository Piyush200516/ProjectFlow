import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from 'sonner';

import Login from './pages/auth/Login';
import StudentDashboard from './pages/student/StudentDashboard';
import StudentProjects from './pages/student/StudentProjects';
import StudentKanban from './pages/student/StudentKanban';
import StudentTimeline from './pages/student/StudentTimeline';
import StudentScore from './pages/student/StudentScore';
import StudentSettings from './pages/student/StudentSettings';
import MentorDashboard from './pages/mentor/MentorDashboard';
import HodDashboard from './pages/hod/HodDashboard';
import CdcDashboard from './pages/cdc/CdcDashboard';
import Signup from './pages/auth/Signup';
import ForgotPassword from './pages/auth/ForgotPassword';
import DashboardLayout from './layouts/DashboardLayout';

const Unauthorized = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50">
    <div className="text-center p-12 bg-white rounded-3xl shadow-xl border border-slate-200">
      <h1 className="text-4xl font-black text-rose-600 mb-4">403</h1>
      <p className="text-xl font-bold text-slate-800 mb-6">Unauthorized Access</p>
      <p className="text-slate-500 mb-8">You do not have permission to view this portal.</p>
      <Navigate to="/login" replace />
    </div>
  </div>
);

// Improved Protected Route Component
const ProtectedRoute = ({ allowedRoles }) => {
  const { user, loading } = useAuth();
  
  if (loading) return null; // Or a loading spinner

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          
          {/* Protected Portal Routes */}
          <Route path="/student" element={<ProtectedRoute allowedRoles={['student']} />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<StudentDashboard />} />
            <Route path="projects" element={<StudentProjects />} />
            <Route path="kanban" element={<StudentKanban />} />
            <Route path="timeline" element={<StudentTimeline />} />
            <Route path="student-score" element={<StudentScore />} />
            <Route path="settings" element={<StudentSettings />} />
          </Route>

          <Route path="/mentor" element={<ProtectedRoute allowedRoles={['mentor']} />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<MentorDashboard />} />
          </Route>

          <Route path="/hod" element={<ProtectedRoute allowedRoles={['hod']} />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<HodDashboard />} />
          </Route>

          <Route path="/cdc" element={<ProtectedRoute allowedRoles={['cdc']} />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<CdcDashboard />} />
          </Route>

          {/* Default Redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
      <Toaster position="top-right" richColors />
    </AuthProvider>
  );
}

export default App;
