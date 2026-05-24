import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
  Calendar
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

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [activeForms, setActiveForms] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [refreshingRegistration, setRefreshingRegistration] = useState(false);
  const [lastRegistrationRefresh, setLastRegistrationRefresh] = useState(null);

  const fetchFormsAndNotifications = useCallback(async () => {
    setRefreshingRegistration(true);
    try {
      const [formsRes, notificationsRes] = await Promise.all([
        api.get('/student/registration-forms/active'),
        api.get('/student/notifications', { params: { limit: 10 } })
      ]);
      const forms = formsRes.data?.forms || [];
      const latestNotifications = notificationsRes.data?.notifications || [];
      console.log('Loaded active forms:', forms);
      console.log('Notifications loaded:', latestNotifications.length);
      setActiveForms(forms);
      setNotifications(latestNotifications);
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
        const { data: projectData } = await api.get('/projects');
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
    const interval = window.setInterval(fetchFormsAndNotifications, 60000);
    return () => window.clearInterval(interval);
  }, [fetchFormsAndNotifications]);

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
            onClick={() => navigate('/student/projects')}
            className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-semibold transition-all active:scale-95"
          >
            <Plus size={16} />
            New Project
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

      <SectionCard
        title="Project Registration"
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
          {latestRegistrationNotification && (
            <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-900">
              {latestRegistrationNotification.title || 'New Project Registration Form'}
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
