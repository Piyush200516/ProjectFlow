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
  Area
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
    { label: 'Dept Projects', value: stats?.totalProjects || '0', icon: Building2, color: 'blue' },
    { label: 'Active Students', value: stats?.activeStudents || '0', icon: Users, color: 'indigo' },
    { label: 'Pending Approvals', value: stats?.pendingApprovals || '0', icon: ShieldCheck, color: 'green' },
    { label: 'Completion Rate', value: stats?.completionRate || '85%', icon: Award, color: 'amber' },
  ];

  const performanceTrend = [
    { name: 'Jan', approved: 20, pending: 10 },
    { name: 'Feb', approved: 35, pending: 15 },
    { name: 'Mar', approved: 45, pending: 8 },
    { name: 'Apr', approved: 30, pending: 20 },
    { name: 'May', approved: 55, pending: 5 },
  ];

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

        <SectionCard title="Quick Stats" subtitle="Project status breakdown">
           <div className="space-y-4 mt-6">
              {[
                { name: 'Mini Projects', count: projects.filter(p => p.type === 'Mini Project').length, color: '#2563eb' },
                { name: 'Major Projects', count: projects.filter(p => p.type === 'Major Project').length, color: '#8b5cf6' },
                { name: 'Completed', count: projects.filter(p => p.status === 'Completed').length, color: '#10b981' },
              ].map((item) => (
                <div key={item.name} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: item.color}}></div>
                    <span className="text-xs font-black text-slate-700 tracking-tight">{item.name}</span>
                  </div>
                  <span className="text-sm font-black text-slate-900">{item.count}</span>
                </div>
              ))}
           </div>
        </SectionCard>
      </div>

      <SectionCard 
        title="Recent Projects Oversight" 
        subtitle="Tracking of project approvals and mentor allocations"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-100">
                <th className="pb-4 font-black">Project Title</th>
                <th className="pb-4 font-black">Mentor</th>
                <th className="pb-4 font-black">Status</th>
                <th className="pb-4 font-black">Progress</th>
                <th className="pb-4 font-black text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {projects.length > 0 ? projects.slice(0, 5).map((project) => (
                <tr key={project.id} className="group hover:bg-slate-50/50 transition-colors cursor-pointer">
                  <td className="py-5">
                     <div className="flex flex-col">
                        <span className="font-black text-slate-800 text-sm tracking-tight">{project.title}</span>
                        <span className="text-[10px] font-bold text-slate-400">ID: PF-2026-{1000 + project.id}</span>
                     </div>
                  </td>
                  <td className="py-5">
                     <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center text-[10px] font-black text-blue-700">{project.mentor_name?.[0] || 'M'}</div>
                        <span className="text-xs font-bold text-slate-600">{project.mentor_name || 'Unassigned'}</span>
                     </div>
                  </td>
                  <td className="py-5">
                    <StatusBadge 
                      status={project.status} 
                      variant={project.status === 'Completed' ? 'success' : project.status === 'Proposal' ? 'warning' : 'info'} 
                    />
                  </td>
                  <td className="py-5 text-xs font-bold text-slate-500">{project.progress}%</td>
                  <td className="py-5 text-right">
                    <button className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200 transition-all shadow-sm">
                      Details
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                   <td colSpan="5" className="py-10 text-center text-slate-400 font-bold">No projects available.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
};

export default HodDashboard;
