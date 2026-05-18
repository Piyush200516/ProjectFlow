import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, Link } from 'react-router-dom';
import { ShieldCheck, ArrowLeft } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from 'sonner';

import Login from './pages/auth/Login';
import StudentDashboard from './pages/student/StudentDashboard';
import StudentProjects from './pages/student/StudentProjects';
import ProjectDetails from './pages/student/ProjectDetails';
import StudentKanban from './pages/student/StudentKanban';
import StudentTimeline from './pages/student/StudentTimeline';
import StudentDocumentation from './pages/student/StudentDocumentation';
import StudentFeedback from './pages/student/StudentFeedback';
import StudentScore from './pages/student/StudentScore';
import StudentSettings from './pages/student/StudentSettings';
import StudentFinalSubmission from './pages/student/StudentFinalSubmission';
import StudentContribution from './pages/student/StudentContribution';
import StudentActivity from './pages/student/StudentActivity';
import StudentDocumentWorkspace from './pages/student/StudentDocumentWorkspace';
import StudentTeamWorkspace from './pages/student/StudentTeamWorkspace';
import StudentCalendar from './pages/student/StudentCalendar';
import ProjectChat from './pages/student/ProjectChat';
import MentorDashboard from './pages/mentor/MentorDashboard';
import MentorProjects from './pages/mentor/MentorProjects';
import MentorReviewRequests from './pages/mentor/MentorReviewRequests';
import MentorStudentProgress from './pages/mentor/MentorStudentProgress';
import MentorSchedule from './pages/mentor/MentorSchedule';
import MentorSettings from './pages/mentor/MentorSettings';
import MentorFinalSubmissions from './pages/mentor/MentorFinalSubmissions';
import MentorContributionReview from './pages/mentor/MentorContributionReview';
import MentorTemplates from './pages/mentor/MentorTemplates';
import MentorDocumentReviews from './pages/mentor/MentorDocumentReviews';
import HodDashboard from './pages/hod/HodDashboard';
import HodProjects from './pages/hod/HodProjects';
import HodStudents from './pages/hod/HodStudents';
import HodApprovals from './pages/hod/HodApprovals';
import HodTemplates from './pages/hod/HodTemplates';
import HodSubmissionTracking from './pages/hod/HodSubmissionTracking';
import Signup from './pages/auth/Signup';
import ForgotPassword from './pages/auth/ForgotPassword';
import DashboardLayout from './layouts/DashboardLayout';

const Unauthorized = () => {
  const { user } = useAuth();
  const loginPath = user ? `/auth/${user.role}/login` : '/auth/student/login';

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-6">
      <div className="w-full max-w-[400px] text-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-50 rounded-full text-rose-500 mb-2">
          <ShieldCheck size={32} />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Access Denied</h1>
          <p className="text-sm text-slate-500">You don't have permission to view this workspace.</p>
        </div>
        <div className="pt-4">
          <Link to={loginPath} className="text-sm font-semibold text-slate-900 hover:underline underline-offset-4 flex items-center justify-center gap-2">
            <ArrowLeft size={16} />
            Return to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

// Improved Protected Route Component
const ProtectedRoute = ({ allowedRoles }) => {
  const { user, loading } = useAuth();
  
  if (loading) return null;

  if (!user) {
    const role = allowedRoles && allowedRoles.length > 0 ? allowedRoles[0] : 'student';
    return <Navigate to={`/auth/${role}/login`} replace />;
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

const deployPortal = import.meta.env.VITE_DEPLOY_PORTAL || 'all'; // 'all', 'auth', 'portal', 'admin'
const AUTH_URL = import.meta.env.VITE_AUTH_URL || 'https://projectflow-auth.vercel.app';
const PORTAL_URL = import.meta.env.VITE_PORTAL_URL || 'https://projectflow-portal.vercel.app';
const ADMIN_URL = import.meta.env.VITE_ADMIN_URL || 'https://projectflow-admin.vercel.app';

// Helper component to handle micro-frontend routing gates
const MicroFrontendGate = ({ allowedPortal, children }) => {
  const currentPath = window.location.pathname;

  if (deployPortal !== 'all' && deployPortal !== allowedPortal) {
    console.log(`[Micro-Frontend] Path "${currentPath}" not allowed on "${deployPortal}" portal. Redirecting...`);
    
    if (allowedPortal === 'auth') {
      window.location.href = `${AUTH_URL}${currentPath}`;
      return null;
    }
    if (allowedPortal === 'portal') {
      window.location.href = `${PORTAL_URL}${currentPath}`;
      return null;
    }
    if (allowedPortal === 'admin') {
      window.location.href = `${ADMIN_URL}${currentPath}`;
      return null;
    }
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public / Generic Routes */}
          <Route path="/unauthorized" element={<Unauthorized />} />
          
          {/* Student Auth Routes */}
          <Route path="/auth/student/login" element={
            <MicroFrontendGate allowedPortal="auth">
              <Login role="student" title="Student Sign In" />
            </MicroFrontendGate>
          } />
          <Route path="/auth/student/register" element={
            <MicroFrontendGate allowedPortal="auth">
              <Signup />
            </MicroFrontendGate>
          } />
          <Route path="/auth/student/forgot-password" element={
            <MicroFrontendGate allowedPortal="auth">
              <ForgotPassword />
            </MicroFrontendGate>
          } />

          {/* Mentor Auth Routes */}
          <Route path="/auth/mentor/login" element={
            <MicroFrontendGate allowedPortal="auth">
              <Login role="mentor" title="Mentor Sign In" />
            </MicroFrontendGate>
          } />

          {/* HOD Auth Routes */}
          <Route path="/auth/hod/login" element={
            <MicroFrontendGate allowedPortal="auth">
              <Login role="hod" title="HOD Sign In" />
            </MicroFrontendGate>
          } />

          {/* Legacy Redirects */}
          <Route path="/login" element={<Navigate to="/auth/student/login" replace />} />
          <Route path="/signup" element={<Navigate to="/auth/student/register" replace />} />
          <Route path="/forgot-password" element={<Navigate to="/auth/student/forgot-password" replace />} />
          
          {/* Protected Portal Routes */}
          <Route path="/student" element={
            <MicroFrontendGate allowedPortal="portal">
              <ProtectedRoute allowedRoles={['student']} />
            </MicroFrontendGate>
          }>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<StudentDashboard />} />
            <Route path="projects" element={<StudentProjects />} />
            <Route path="projects/:id" element={<ProjectDetails />} />
            <Route path="kanban" element={<StudentKanban />} />
            <Route path="timeline" element={<StudentTimeline />} />
            <Route path="documentation" element={<StudentDocumentation />} />
            <Route path="mentor-feedback" element={<StudentFeedback />} />
            <Route path="student-score" element={<StudentScore />} />
            <Route path="settings" element={<StudentSettings />} />
            <Route path="final-submission" element={<StudentFinalSubmission />} />
            <Route path="contribution" element={<StudentContribution />} />
            <Route path="activity" element={<StudentActivity />} />
            <Route path="document-workspace" element={<StudentDocumentWorkspace />} />
            <Route path="team-workspace" element={<StudentTeamWorkspace />} />
            <Route path="calendar" element={<StudentCalendar />} />
            <Route path="chat" element={<ProjectChat />} />
          </Route>

          <Route path="/mentor" element={
            <MicroFrontendGate allowedPortal="portal">
              <ProtectedRoute allowedRoles={['mentor']} />
            </MicroFrontendGate>
          }>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<MentorDashboard />} />
            <Route path="projects" element={<MentorProjects />} />
            <Route path="review-requests" element={<MentorReviewRequests />} />
            <Route path="student-progress" element={<MentorStudentProgress />} />
            <Route path="schedule" element={<MentorSchedule />} />
            <Route path="settings" element={<MentorSettings />} />
            <Route path="final-submissions" element={<MentorFinalSubmissions />} />
            <Route path="contribution-review" element={<MentorContributionReview />} />
            <Route path="templates" element={<MentorTemplates />} />
            <Route path="document-reviews" element={<MentorDocumentReviews />} />
          </Route>

          <Route path="/hod" element={
            <MicroFrontendGate allowedPortal="admin">
              <ProtectedRoute allowedRoles={['hod']} />
            </MicroFrontendGate>
          }>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<HodDashboard />} />
            <Route path="projects" element={<HodProjects />} />
            <Route path="students" element={<HodStudents />} />
            <Route path="approvals" element={<HodApprovals />} />
            <Route path="analytics" element={<HodDashboard />} />
            <Route path="templates" element={<HodTemplates />} />
            <Route path="submission-tracking" element={<HodSubmissionTracking />} />
            <Route path="settings" element={<MentorSettings />} /> 
          </Route>

          {/* Default Redirect */}
          <Route path="/" element={<Navigate to="/auth/student/login" replace />} />
          <Route path="*" element={<Navigate to="/auth/student/login" replace />} />
        </Routes>
      </Router>
      <Toaster position="top-right" richColors />
    </AuthProvider>
  );
}

export default App;
