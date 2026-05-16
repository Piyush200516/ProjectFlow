import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from 'sonner';

import Login from './pages/auth/Login';
import StudentDashboard from './pages/student/StudentDashboard';
import StudentProjects from './pages/student/StudentProjects';
import StudentKanban from './pages/student/StudentKanban';
import StudentTimeline from './pages/student/StudentTimeline';
import StudentDocumentation from './pages/student/StudentDocumentation';
import StudentFeedback from './pages/student/StudentFeedback';
import StudentScore from './pages/student/StudentScore';
import StudentSettings from './pages/student/StudentSettings';
import MentorDashboard from './pages/mentor/MentorDashboard';
import MentorProjects from './pages/mentor/MentorProjects';
import MentorReviewRequests from './pages/mentor/MentorReviewRequests';
import MentorStudentProgress from './pages/mentor/MentorStudentProgress';
import MentorSchedule from './pages/mentor/MentorSchedule';
import MentorSettings from './pages/mentor/MentorSettings';
import HodDashboard from './pages/hod/HodDashboard';
import HodProjects from './pages/hod/HodProjects';
import HodStudents from './pages/hod/HodStudents';
import HodApprovals from './pages/hod/HodApprovals';
import CdcDashboard from './pages/cdc/CdcDashboard';
import CdcStartups from './pages/cdc/CdcStartups';
import CdcIndustryCollaboration from './pages/cdc/CdcIndustryCollaboration';
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
              <Route path="documentation" element={<StudentDocumentation />} />
              <Route path="mentor-feedback" element={<StudentFeedback />} />
              <Route path="student-score" element={<StudentScore />} />
              <Route path="settings" element={<StudentSettings />} />
            </Route>

          <Route path="/mentor" element={<ProtectedRoute allowedRoles={['mentor']} />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<MentorDashboard />} />
            <Route path="projects" element={<MentorProjects />} />
            <Route path="review-requests" element={<MentorReviewRequests />} />
            <Route path="student-progress" element={<MentorStudentProgress />} />
            <Route path="schedule" element={<MentorSchedule />} />
            <Route path="settings" element={<MentorSettings />} />
          </Route>

          <Route path="/hod" element={<ProtectedRoute allowedRoles={['hod']} />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<HodDashboard />} />
            <Route path="projects" element={<HodProjects />} />
            <Route path="students" element={<HodStudents />} />
            <Route path="approvals" element={<HodApprovals />} />
            <Route path="analytics" element={<HodDashboard />} />
            <Route path="settings" element={<MentorSettings />} /> 
          </Route>

          <Route path="/cdc" element={<ProtectedRoute allowedRoles={['cdc']} />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<CdcDashboard />} />
            <Route path="startups" element={<CdcStartups />} />
            <Route path="hackathons" element={<CdcDashboard />} />
            <Route path="industry-collaboration" element={<CdcIndustryCollaboration />} />
            <Route path="settings" element={<MentorSettings />} /> 
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
