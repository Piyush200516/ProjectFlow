import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, Link } from 'react-router-dom';
import { ShieldCheck, ArrowLeft } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from 'sonner';

import DashboardLayout from './layouts/DashboardLayout';

const Login = lazy(() => import('./pages/auth/Login'));
const Signup = lazy(() => import('./pages/auth/Signup'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const StudentDashboard = lazy(() => import('./pages/student/StudentDashboard'));
const StudentProjectForm = lazy(() => import('./pages/student/StudentProjectForm'));
const StudentProjects = lazy(() => import('./pages/student/StudentProjects'));
const ProjectDetails = lazy(() => import('./pages/student/ProjectDetails'));
const StudentKanban = lazy(() => import('./pages/student/StudentKanban'));
const StudentTimeline = lazy(() => import('./pages/student/StudentTimeline'));
const StudentDocumentation = lazy(() => import('./pages/student/StudentDocumentation'));
const StudentFeedback = lazy(() => import('./pages/student/StudentFeedback'));
const StudentScore = lazy(() => import('./pages/student/StudentScore'));
const StudentSettings = lazy(() => import('./pages/student/StudentSettings'));
const StudentFinalSubmission = lazy(() => import('./pages/student/StudentFinalSubmission'));
const StudentContribution = lazy(() => import('./pages/student/StudentContribution'));
const StudentActivity = lazy(() => import('./pages/student/StudentActivity'));
const StudentDocumentWorkspace = lazy(() => import('./pages/student/StudentDocumentWorkspace'));
const StudentTeamWorkspace = lazy(() => import('./pages/student/StudentTeamWorkspace'));
const StudentCalendar = lazy(() => import('./pages/student/StudentCalendar'));
const ProjectChat = lazy(() => import('./pages/student/ProjectChat'));
const MentorDashboard = lazy(() => import('./pages/mentor/MentorDashboard'));
const MentorProjects = lazy(() => import('./pages/mentor/MentorProjects'));
const MentorReviewRequests = lazy(() => import('./pages/mentor/MentorReviewRequests'));
const MentorStudentProgress = lazy(() => import('./pages/mentor/MentorStudentProgress'));
const MentorSchedule = lazy(() => import('./pages/mentor/MentorSchedule'));
const MentorSettings = lazy(() => import('./pages/mentor/MentorSettings'));
const MentorFinalSubmissions = lazy(() => import('./pages/mentor/MentorFinalSubmissions'));
const MentorContributionReview = lazy(() => import('./pages/mentor/MentorContributionReview'));
const MentorTemplates = lazy(() => import('./pages/mentor/MentorTemplates'));
const MentorDocumentReviews = lazy(() => import('./pages/mentor/MentorDocumentReviews'));
const HodDashboard = lazy(() => import('./pages/hod/HodDashboard'));
const HodProjects = lazy(() => import('./pages/hod/HodProjects'));
const HodStudents = lazy(() => import('./pages/hod/HodStudents'));
const HodApprovals = lazy(() => import('./pages/hod/HodApprovals'));
const HodMentorAllocations = lazy(() => import('./pages/hod/HodMentorAllocations'));
const HodTemplates = lazy(() => import('./pages/hod/HodTemplates'));
const HodSubmissionTracking = lazy(() => import('./pages/hod/HodSubmissionTracking'));

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
        <Suspense fallback={null}>
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
            <Route path="project-form" element={<StudentProjectForm />} />
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
            <Route path="mentor-allocations" element={<HodMentorAllocations />} />
            <Route path="analytics" element={<HodDashboard />} />
            <Route path="templates" element={<HodTemplates />} />
            <Route path="submission-tracking" element={<HodSubmissionTracking />} />
            <Route path="settings" element={<MentorSettings />} /> 
          </Route>

          {/* Default Redirect */}
          <Route path="/" element={<Navigate to="/auth/student/login" replace />} />
          <Route path="*" element={<Navigate to="/auth/student/login" replace />} />
          </Routes>
        </Suspense>
      </Router>
      <Toaster position="top-right" richColors />
    </AuthProvider>
  );
}

export default App;
