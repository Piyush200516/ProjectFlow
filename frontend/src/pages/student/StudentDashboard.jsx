import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  PageHeader, 
  StatCard, 
  SectionCard, 
  StatusBadge, 
  ProgressCard 
} from '../../components/common/PremiumComponents';
import { ActivityTimeline } from '../../components/common/DataDisplay';
import { 
  Briefcase, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Plus,
  ArrowUpRight,
  FileCode,
  Layout,
  TestTube,
  RefreshCw,
  Calendar,
  Users,
  UserCheck,
  MessageSquare
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import api from '../../lib/api';
import { toast } from 'sonner';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [activeForms, setActiveForms] = useState([]);
  const [myProject, setMyProject] = useState(null);
  const [studentProfile, setStudentProfile] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [refreshingRegistration, setRefreshingRegistration] = useState(false);
  const [lastRegistrationRefresh, setLastRegistrationRefresh] = useState(null);
  const toastedNotificationIds = useRef(new Set());

  const fetchMyProject = useCallback(async () => {
    const [projectRes, profileRes] = await Promise.all([
      api.get('/student/my-project'),
      api.get('/student/profile')
    ]);
    const data = projectRes.data;
    const profile = profileRes.data?.student || null;
    setStudentProfile(profile);
    setMyProject(data?.project || null);
  }, []);

  const fetchFormsAndNotifications = useCallback(async () => {
    setRefreshingRegistration(true);
    try {
      const [formsRes, notificationsRes, myProjectRes, profileRes] = await Promise.all([
        api.get('/student/registration-forms/active'),
        api.get('/student/notifications', { params: { limit: 10 } }),
        api.get('/student/my-project'),
        api.get('/student/profile')
      ]);
      const forms = formsRes.data?.forms || [];
      const latestNotifications = notificationsRes.data?.notifications || [];
      console.log('Loaded active forms:', forms);
      console.log('Notifications loaded:', latestNotifications.length);
      setActiveForms(forms);
      setNotifications(latestNotifications);
      latestNotifications
        .filter((notification) => !notification.is_read && (notification.type === 'mentor_assignment' || notification.reference_type === 'mentor_assignment'))
        .forEach((notification) => {
          if (!toastedNotificationIds.current.has(notification.id)) {
            toastedNotificationIds.current.add(notification.id);
            toast.success(notification.title || 'Mentor Assigned', {
              description: notification.message,
            });
          }
        });
      setMyProject(myProjectRes.data?.project || null);
      setStudentProfile(profileRes.data?.student || null);
      setLastRegistrationRefresh(new Date());
    } catch (error) {
      console.error('Failed to load registration updates:', error);
    } finally {
      setRefreshingRegistration(false);
    }
  }, []);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [projectRes] = await Promise.all([
          api.get('/projects'),
          fetchMyProject()
        ]);
        const projectData = projectRes.data;
        setProjects(projectData);
        if (projectData.length > 0) {
          const { data: taskData } = await api.get(`/tasks/project/${projectData[0].id}`);
          setTasks(taskData);
        }
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      }
    };

    fetchDashboard();
    fetchFormsAndNotifications();
    
    const handleProfileUpdate = () => {
      console.log('Profile updated event received. Refreshing dashboard details...');
      fetchMyProject();
      fetchFormsAndNotifications();
    };

    const interval = window.setInterval(fetchFormsAndNotifications, 30000);
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') fetchFormsAndNotifications();
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('profile-updated', handleProfileUpdate);
    
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('profile-updated', handleProfileUpdate);
    };
  }, [fetchFormsAndNotifications, fetchMyProject]);

  const activeProject = projects[0];
  const completedTasks = useMemo(() => tasks.filter((task) => task.status === 'Completed').length, [tasks]);
  const upcomingDeadlines = useMemo(() => tasks.filter((task) => {
    if (!task.due_date || task.status === 'Completed') return false;
    const now = new Date();
    const deadline = new Date(task.due_date);
    const diffDays = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 7;
  }).length, [tasks]);

  const chartData = useMemo(() => [
    { name: 'Mon', tasks: 4 },
    { name: 'Tue', tasks: 7 },
    { name: 'Wed', tasks: 5 },
    { name: 'Thu', tasks: 12 },
    { name: 'Fri', tasks: 18 },
    { name: 'Sat', tasks: 8 },
    { name: 'Sun', tasks: 4 },
  ], []);

  const activities = useMemo(() => [
    { icon: FileCode, title: 'Code Review Approved', description: 'NLP module pull request merged.', time: '2h ago', type: 'success' },
    { icon: Layout, title: 'UI Mockups Updated', description: 'Rahul uploaded new Figma links.', time: '5h ago', type: 'info' },
    { icon: TestTube, title: 'Testing Milestone', description: 'Requirement analysis is complete.', time: 'Yesterday', type: 'warning' },
  ], []);

  const latestRegistrationNotification = useMemo(() => notifications.find(
    notification => notification.type === 'registration_form' || notification.reference_type === 'registration_form'
  ), [notifications]);

  const assignedMentor = {
    name: studentProfile?.mentor_name || myProject?.mentor?.name || '',
    email: studentProfile?.mentor_email || myProject?.mentor?.email || '',
  };

  const formatDeadline = (value) => {
    if (!value) return 'No deadline';
    return new Date(value).toLocaleDateString(undefined, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader 
        title="Dashboard" 
        description="Monitor your academic project progress and feedback."
        actions={
          <button 
            onClick={() => navigate('/student/project-form')}
            className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-semibold transition-all active:scale-95"
          >
            <Plus size={16} />
            Project Form
          </button>
        }
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Briefcase} label="Active" value={projects.length} color="blue" />
        <StatCard icon={CheckCircle2} label="Completed" value={completedTasks} color="green" />
        <StatCard icon={Clock} label="Deadlines" value={upcomingDeadlines} color="amber" />
        <StatCard icon={AlertCircle} label="Feedback" value="2" trend="down" trendValue="1" color="indigo" />
      </div>

      <SectionCard title="Assigned Academic Details" subtitle="Latest mentor mapping from HOD allocation">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Assigned Mentor</p>
            <p className="mt-1 text-sm font-bold text-slate-800">{assignedMentor.name || 'Not assigned'}</p>
            <p className="mt-1 text-xs font-semibold text-slate-400">{assignedMentor.email || 'Mentor email unavailable'}</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Year / Semester</p>
            <p className="mt-1 text-sm font-bold text-slate-800">{studentProfile?.year || studentProfile?.academic_year || 'N/A'} / Sem {studentProfile?.semester || 'N/A'}</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Section</p>
            <p className="mt-1 text-sm font-bold text-slate-800">{studentProfile?.section || 'N/A'}</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Subsection</p>
            <p className="mt-1 text-sm font-bold text-slate-800">{studentProfile?.subsection || 'N/A'}</p>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title={myProject ? 'My Assigned Project' : 'Project Registration'}
        subtitle={lastRegistrationRefresh ? `Latest forms refreshed at ${lastRegistrationRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Latest HOD registration forms from PostgreSQL'}
        headerActions={
          <button
            onClick={fetchFormsAndNotifications}
            disabled={refreshingRegistration}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            <RefreshCw size={14} className={refreshingRegistration ? 'animate-spin' : ''} />
            Refresh
          </button>
        }
      >
        <div className="space-y-4">
          {myProject ? (
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <StatusBadge status={myProject.status || 'Pending'} variant={myProject.status === 'Approved' ? 'success' : myProject.status === 'Rejected' ? 'error' : 'warning'} />
                  <h3 className="mt-3 text-lg font-black text-slate-900">{myProject.title}</h3>
                  <p className="mt-1 text-sm font-semibold text-slate-500">{myProject.domain} / {myProject.project_type}</p>
                </div>
                <button
                  onClick={() => navigate('/student/project-form')}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 transition-all hover:bg-slate-50"
                >
                  View Registration
                </button>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Team Leader</p>
                  <p className="mt-1 text-sm font-bold text-slate-800">{myProject.team_leader?.full_name || 'Pending'}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Team Members</p>
                  <p className="mt-1 inline-flex items-center gap-1 text-sm font-bold text-slate-800">
                    <Users size={14} /> {myProject.team_members?.length || 1}
                  </p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Submitted Date</p>
                  <p className="mt-1 text-sm font-bold text-slate-800">{formatDeadline(myProject.submitted_at)}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Assigned Mentor</p>
                  <p className="mt-1 inline-flex items-center gap-1 text-sm font-bold text-slate-800">
                    <UserCheck size={14} /> {assignedMentor.name || 'Not assigned'}
                  </p>
                  {assignedMentor.email && (
                    <p className="mt-1 text-xs font-semibold text-slate-400">{assignedMentor.email}</p>
                  )}
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Year / Semester</p>
                  <p className="mt-1 text-sm font-bold text-slate-800">{studentProfile?.year || studentProfile?.academic_year || myProject.form?.academic_year || 'N/A'} / Sem {studentProfile?.semester || myProject.form?.semester || 'N/A'}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Section</p>
                  <p className="mt-1 text-sm font-bold text-slate-800">{studentProfile?.section || myProject.form?.section || 'N/A'}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Subsection</p>
                  <p className="mt-1 text-sm font-bold text-slate-800">{studentProfile?.subsection || myProject.form?.subsection || 'N/A'}</p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
                  <p className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-500">
                    <Users size={14} /> Team
                  </p>
                  <div className="space-y-2">
                    {(myProject.team_members || []).map((member) => (
                      <div key={member.id || member.email} className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-xs">
                        <div>
                          <p className="font-bold text-slate-800">{member.full_name}</p>
                          <p className="font-semibold text-slate-400">{member.email}</p>
                        </div>
                        <span className="rounded bg-slate-100 px-2 py-1 font-black uppercase text-slate-500">
                          {member.is_leader ? 'Leader' : 'Member'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
                  <p className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-500">
                    <Clock size={14} /> Timeline / Milestones
                  </p>
                  {myProject.timeline?.length ? (
                    <div className="space-y-2">
                      {myProject.timeline.slice(0, 4).map((milestone) => (
                        <div key={milestone.id} className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-xs">
                          <p className="font-bold text-slate-800">{milestone.title}</p>
                          <p className="font-semibold text-slate-400">{formatDeadline(milestone.deadline)}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm font-semibold text-slate-400">Timeline will appear after HOD or mentor publishes milestones.</p>
                  )}
                </div>
              </div>

              <div className="mt-5 rounded-lg border border-slate-100 bg-slate-50 p-4">
                <p className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-500">
                  <MessageSquare size={14} /> HOD Remarks
                </p>
                <p className="text-sm font-semibold text-slate-600">{myProject.hod_remarks || 'No remarks yet.'}</p>
              </div>
            </div>
          ) : (
          <>
          {latestRegistrationNotification && (
            <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-900">
              {latestRegistrationNotification.title || 'New Project Registration Campaign Published'}
            </div>
          )}

          {activeForms.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
              No active registration forms available for your academic profile.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeForms.slice(0, 4).map((form) => (
                <div key={form.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <StatusBadge status={form.project_type || 'Project'} variant="info" />
                      <h3 className="mt-3 text-sm font-bold text-slate-900">{form.title}</h3>
                    </div>
                    {form.has_submitted && <StatusBadge status="Registered" variant="success" />}
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="font-bold uppercase text-slate-400">Branch</p>
                      <p className="mt-1 font-semibold text-slate-700">{form.branch}</p>
                    </div>
                    <div>
                      <p className="font-bold uppercase text-slate-400">Batch</p>
                      <p className="mt-1 font-semibold text-slate-700">{form.academic_year} • Sem {form.semester}</p>
                    </div>
                    <div>
                      <p className="font-bold uppercase text-slate-400">Section</p>
                      <p className="mt-1 font-semibold text-slate-700">Sec {form.section}{form.subsection ? ` / Sub ${form.subsection}` : ''}</p>
                    </div>
                    <div>
                      <p className="font-bold uppercase text-slate-400">Deadline</p>
                      <p className="mt-1 inline-flex items-center gap-1 font-semibold text-slate-700">
                        <Calendar size={12} />
                        {formatDeadline(form.deadline)}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate('/student/project-form')}
                    className="mt-5 w-full rounded-lg bg-slate-900 px-4 py-2 text-xs font-bold text-white transition-all hover:bg-slate-800 active:scale-95"
                  >
                    Fill Form
                  </button>
                </div>
              ))}
            </div>
          )}
          </>
          )}
        </div>
      </SectionCard>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Analytics Card */}
        <SectionCard 
          title="Activity" 
          subtitle="Total tasks completed recently"
          className="lg:col-span-2"
          headerActions={
            <div className="flex bg-slate-50 p-1 rounded-lg border border-slate-200/60">
              <button className="px-3 py-1 bg-white text-xs font-semibold rounded shadow-sm border border-slate-100">Tasks</button>
              <button className="px-3 py-1 text-xs font-semibold text-slate-500">Commits</button>
            </div>
          }
        >
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorTasks" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0f172a" stopOpacity={0.05}/>
                    <stop offset="95%" stopColor="#0f172a" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 500}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 500}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontWeight: 600, fontSize: '12px', color: '#0f172a' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="tasks" 
                  stroke="#0f172a" 
                  strokeWidth={2} 
                  fillOpacity={1} 
                  fill="url(#colorTasks)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        {/* Right Sidebar: Activity & Recent Projects */}
        <div className="space-y-6">
          <SectionCard title="Team Updates" subtitle="Recent comments and changes">
            <ActivityTimeline activities={activities} />
          </SectionCard>

          <SectionCard title="Featured Project" subtitle="Main active goal">
            <div className="space-y-5">
              <div>
                <h4 className="text-xs font-semibold text-slate-900 mb-3 uppercase tracking-wider">{activeProject?.title || 'No active project yet'}</h4>
                <ProgressCard label="Completion" value={activeProject?.progress || 0} color="blue" />
              </div>
              <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                <StatusBadge status={activeProject?.status || 'Not Started'} variant="info" />
                <button 
                  onClick={() => navigate(activeProject ? `/student/kanban?projectId=${activeProject.id}` : '/student/projects')}
                  className="text-xs font-semibold text-slate-900 flex items-center gap-1 hover:underline underline-offset-4"
                >
                  View Board <ArrowUpRight size={12} />
                </button>
              </div>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
