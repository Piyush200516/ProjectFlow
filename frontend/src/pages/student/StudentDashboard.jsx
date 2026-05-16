import React from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { mockProjects } from '../../data/mockData';
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
  TrendingUp,
  FileCode,
  Layout,
  TestTube
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

const StudentDashboard = () => {
  const navigate = useNavigate();
  const chartData = [
    { name: 'Mon', tasks: 4 },
    { name: 'Tue', tasks: 7 },
    { name: 'Wed', tasks: 5 },
    { name: 'Thu', tasks: 12 },
    { name: 'Fri', tasks: 18 },
    { name: 'Sat', tasks: 8 },
    { name: 'Sun', tasks: 4 },
  ];

  const activities = [
    { icon: FileCode, title: 'Code Review Approved', description: 'Dr. Smith approved your PR for the NLP module.', time: '2h ago', type: 'success' },
    { icon: Layout, title: 'UI Mockups Updated', description: 'Rahul uploaded new high-fidelity mockups.', time: '5h ago', type: 'info' },
    { icon: TestTube, title: 'Testing Milestone', description: 'Requirement analysis stage is 100% complete.', time: 'Yesterday', type: 'warning' },
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <PageHeader 
        title="Welcome back, Piyush!" 
        description="Here is what's happening with your projects today."
        actions={
          <button 
            onClick={() => navigate('/student/projects')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl flex items-center gap-2 font-black shadow-xl shadow-blue-600/20 transition-all active:scale-95"
          >
            <Plus size={20} />
            Launch Project
          </button>
        }
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={Briefcase} label="Active Projects" value={mockProjects.length} trend="up" trendValue="12%" color="blue" />
        <StatCard icon={CheckCircle2} label="Tasks Completed" value="48" trend="up" trendValue="8" color="green" />
        <StatCard icon={Clock} label="Upcoming Deadlines" value="3" color="amber" />
        <StatCard icon={AlertCircle} label="Mentor Feedback" value="2" trend="down" trendValue="1" color="indigo" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Analytics Card */}
        <SectionCard 
          title="Productivity Over Time" 
          subtitle="Tasks completed in the last 7 days"
          className="lg:col-span-2"
          headerActions={
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button className="px-3 py-1.5 bg-white text-xs font-bold rounded-lg shadow-sm">Tasks</button>
              <button className="px-3 py-1.5 text-xs font-bold text-slate-500">Commits</button>
            </div>
          }
        >
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorTasks" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 600}} dy={15} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 600}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontWeight: 800, color: '#1e293b' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="tasks" 
                  stroke="#2563eb" 
                  strokeWidth={4} 
                  fillOpacity={1} 
                  fill="url(#colorTasks)" 
                  animationDuration={2000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        {/* Right Sidebar: Activity & Recent Projects */}
        <div className="space-y-8">
          <SectionCard title="Recent Activity" subtitle="Updates from your team and mentors">
            <ActivityTimeline activities={activities} />
          </SectionCard>

          <SectionCard title="Project Progress" subtitle="Status of your top project">
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-bold text-slate-900 mb-4">{mockProjects[0].title}</h4>
                <ProgressCard label="Overall Completion" value={mockProjects[0].progress} color="blue" />
              </div>
              <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                <StatusBadge status={mockProjects[0].status} variant="info" />
                <button 
                  onClick={() => navigate('/student/kanban')}
                  className="text-xs font-bold text-blue-600 flex items-center gap-1 hover:underline"
                >
                  View Board <ArrowUpRight size={14} />
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
