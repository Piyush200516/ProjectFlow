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
    { icon: FileCode, title: 'Code Review Approved', description: 'NLP module pull request merged.', time: '2h ago', type: 'success' },
    { icon: Layout, title: 'UI Mockups Updated', description: 'Rahul uploaded new Figma links.', time: '5h ago', type: 'info' },
    { icon: TestTube, title: 'Testing Milestone', description: 'Requirement analysis is complete.', time: 'Yesterday', type: 'warning' },
  ];

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
        <StatCard icon={Briefcase} label="Active" value={mockProjects.length} trend="up" trendValue="12%" color="blue" />
        <StatCard icon={CheckCircle2} label="Completed" value="48" trend="up" trendValue="8" color="green" />
        <StatCard icon={Clock} label="Deadlines" value="3" color="amber" />
        <StatCard icon={AlertCircle} label="Feedback" value="2" trend="down" trendValue="1" color="indigo" />
      </div>

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
                <h4 className="text-xs font-semibold text-slate-900 mb-3 uppercase tracking-wider">{mockProjects[0].title}</h4>
                <ProgressCard label="Completion" value={mockProjects[0].progress} color="blue" />
              </div>
              <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                <StatusBadge status={mockProjects[0].status} variant="info" />
                <button 
                  onClick={() => navigate('/student/kanban')}
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
