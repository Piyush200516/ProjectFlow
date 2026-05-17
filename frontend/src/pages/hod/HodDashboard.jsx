import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Users, 
  CheckCircle2, 
  FileDown,
  ShieldCheck,
  Search,
  Award,
  Loader2,
  TrendingUp
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { 
  PageHeader, 
  StatCard, 
  SectionCard, 
  StatusBadge 
} from '../../components/common/PremiumComponents';
import api from '../../lib/api';
import { toast } from 'sonner';
import { cn } from '../../utils/utils';

const HodDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsRes, projectsRes] = await Promise.all([
          api.get('/hod/dashboard'),
          api.get('/hod/projects')
        ]);
        setStats(statsRes.data);
        setProjects(projectsRes.data);
      } catch (error) {
        console.error('Failed to fetch HOD dashboard:', error);
        toast.error('Failed to load department dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const deptStats = [
    { label: 'Dept Projects', value: stats?.totalProjects || '42', icon: Building2, color: 'blue' },
    { label: 'Active Students', value: stats?.activeStudents || '210', icon: Users, color: 'indigo' },
    { label: 'Late Submissions', value: '5', icon: ShieldCheck, color: 'rose' },
    { label: 'Avg Evaluated Score', value: '88%', icon: Award, color: 'amber' },
  ];

  const performanceTrend = [
    { name: 'Jan', approved: 20, pending: 10 },
    { name: 'Feb', approved: 35, pending: 15 },
    { name: 'Mar', approved: 45, pending: 8 },
    { name: 'Apr', approved: 30, pending: 20 },
    { name: 'May', approved: 55, pending: 5 },
  ];

  const projectDistribution = [
    { name: 'AI/ML', value: 45 },
    { name: 'Web Dev', value: 30 },
    { name: 'IoT', value: 15 },
    { name: 'Blockchain', value: 10 },
  ];
  const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b'];

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <PageHeader 
        title="Department Administration" 
        description="Global oversight of academic projects, mentor evaluations, and student outcomes."
        actions={
          <div className="flex items-center gap-3">
             <button className="hidden sm:flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-700 font-black rounded-2xl hover:bg-slate-50 transition-all shadow-sm active:scale-95">
                <Search size={18} />
                Global Search
             </button>
             <button 
               onClick={() => toast.success('Quarterly audit report generated and downloaded.')}
               className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-95"
             >
                <FileDown size={18} />
                Export Quarterly Audit
             </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {deptStats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <SectionCard 
          title="Approval & Intake Trends" 
          subtitle="Monthly breakdown of project lifecycle transitions"
          className="lg:col-span-2"
        >
          <div className="h-[350px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={performanceTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 700}} dy={15} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 700}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="approved" fill="#2563eb" fillOpacity={0.1} stroke="none" />
                <Bar dataKey="approved" fill="#2563eb" radius={[6, 6, 0, 0]} barSize={40} />
                <Line type="monotone" dataKey="pending" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, fill: '#f59e0b', strokeWidth: 2, stroke: '#fff' }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Department Distribution" subtitle="Projects by tech domain">
          <div className="h-[250px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={projectDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {projectDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <SectionCard 
          title="Top Mentors" 
          subtitle="Mentors with highest student ratings"
        >
          <div className="space-y-4">
            {[
              { name: 'Dr. Sharma', projects: 8, rating: 4.9 },
              { name: 'Dr. Verma', projects: 6, rating: 4.8 },
              { name: 'Prof. Gupta', projects: 5, rating: 4.7 },
            ].map((mentor, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                    {mentor.name[0]}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 text-sm">{mentor.name}</div>
                    <div className="text-xs text-slate-500">{mentor.projects} Active Projects</div>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-sm font-bold text-amber-500">
                  <Award size={16} /> {mentor.rating}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard 
          title="Top Performing Teams" 
          subtitle="Highest scored final submissions"
        >
          <div className="space-y-4">
            {[
              { name: 'Team Alpha', project: 'AI Powered Student Tracker', score: 95 },
              { name: 'Team Beta', project: 'Blockchain Voting System', score: 92 },
              { name: 'Team Gamma', project: 'Smart Crop Prediction', score: 88 },
            ].map((team, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-sm">
                    #{idx + 1}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 text-sm">{team.name}</div>
                    <div className="text-xs text-slate-500">{team.project}</div>
                  </div>
                </div>
                <div className="text-lg font-bold text-emerald-600">{team.score}</div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
};

export default HodDashboard;
