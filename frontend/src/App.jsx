import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
const Unauthorized = () => <div className="p-10 text-red-500">Unauthorized Access</div>;

import DashboardLayout from './layouts/DashboardLayout';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth();
  
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/unauthorized" replace />;
  
  return <DashboardLayout>{children}</DashboardLayout>;
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
          
          {/* Student Routes */}
          <Route path="/student/*" element={
            <ProtectedRoute allowedRoles={['student']}>
              <Routes>
                <Route path="dashboard" element={<StudentDashboard />} />
                <Route path="projects" element={<StudentProjects />} />
                <Route path="kanban" element={<StudentKanban />} />
                <Route path="timeline" element={<StudentTimeline />} />
                <Route path="student-score" element={<StudentScore />} />
                <Route path="settings" element={<StudentSettings />} />
                <Route path="*" element={<Navigate to="dashboard" replace />} />
              </Routes>
            </ProtectedRoute>
          } />

          {/* Mentor Routes */}
          <Route path="/mentor/*" element={
            <ProtectedRoute allowedRoles={['mentor']}>
              <Routes>
                <Route path="dashboard" element={<MentorDashboard />} />
                <Route path="*" element={<Navigate to="dashboard" replace />} />
              </Routes>
            </ProtectedRoute>
          } />

          {/* HOD Routes */}
          <Route path="/hod/*" element={
            <ProtectedRoute allowedRoles={['hod']}>
              <Routes>
                <Route path="dashboard" element={<HodDashboard />} />
                <Route path="*" element={<Navigate to="dashboard" replace />} />
              </Routes>
            </ProtectedRoute>
          } />

          {/* CDC Routes */}
          <Route path="/cdc/*" element={
            <ProtectedRoute allowedRoles={['cdc']}>
              <Routes>
                <Route path="dashboard" element={<CdcDashboard />} />
                <Route path="*" element={<Navigate to="dashboard" replace />} />
              </Routes>
            </ProtectedRoute>
          } />

          {/* Default Redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
      <Toaster position="top-right" richColors />
    </AuthProvider>
  );
}

export default App;
