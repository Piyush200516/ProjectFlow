import React from 'react';
import { 
  Building2, 
  Users, 
  CheckCircle2, 
  BarChart2,
  FileDown,
  ArrowUpRight,
  ShieldCheck,
  MoreVertical,
  Search,
  Filter,
  Zap,
  TrendingUp,
  Award
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
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
import { toast } from 'sonner';
import { cn } from '../../utils/utils';

const HodDashboard = () => {
  const deptStats = [
    { label: 'Dept Projects', value: '142', icon: Building2, color: 'blue', trend: 'up', trendValue: '12%' },
    { label: 'Active Students', value: '450', icon: Users, color: 'indigo', trend: 'up', trendValue: '24' },
    { label: 'Approved Today', value: '18', icon: ShieldCheck, color: 'green', trend: 'up', trendValue: '5' },
    { label: 'Completion Rate', value: '85%', icon: Award, color: 'amber', trend: 'up', trendValue: '3%' },
  ];

  const distributionData = [
    { name: 'Mini Projects', value: 45 },
    { name: 'Major Projects', value: 65 },
    { name: 'Final Year', value: 32 },
  ];

  const performanceTrend = [
    { name: 'Jan', approved: 20, pending: 10 },
    { name: 'Feb', approved: 35, pending: 15 },
    { name: 'Mar', approved: 45, pending: 8 },
    { name: 'Apr', approved: 30, pending: 20 },
    { name: 'May', approved: 55, pending: 5 },
  ];

  const COLORS = ['#2563eb', '#8b5cf6', '#10b981'];

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
          <div className="mt-6 flex justify-center gap-8">
             <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-blue-600"></div>
                <span className="text-[10px] font-black uppercase text-slate-500">Approved Projects</span>
             </div>
             <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-amber-500"></div>
                <span className="text-[10px] font-black uppercase text-slate-500">Pending Requests</span>
             </div>
          </div>
        </SectionCard>

        <SectionCard 
          title="Resource Distribution" 
          subtitle="Project types within the department"
        >
          <div className="h-[300px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={distributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={75}
                  outerRadius={100}
                  paddingAngle={10}
                  dataKey="value"
                >
                  {distributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-4 mt-6">
            {distributionData.map((item, index) => (
              <div key={item.name} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100 group hover:border-blue-200 transition-all cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: COLORS[index]}}></div>
                  <span className="text-xs font-black text-slate-700 tracking-tight">{item.name}</span>
                </div>
                <div className="flex items-center gap-2">
                   <span className="text-sm font-black text-slate-900">{item.value}</span>
                   <TrendingUp size={12} className="text-emerald-500" />
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <SectionCard 
        title="Departmental Audit Log" 
        subtitle="Real-time tracking of project approvals and mentor allocations"
        headerActions={<button className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:underline">Full Log History</button>}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-100">
                <th className="pb-4 font-black">Entity Name</th>
                <th className="pb-4 font-black">Lead / Mentor</th>
                <th className="pb-4 font-black">Priority</th>
                <th className="pb-4 font-black">Stage</th>
                <th className="pb-4 font-black text-right">Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {[
                { name: 'Autonomous Drone Swarm', lead: 'Piyush Mishra', priority: 'Critical', stage: 'Architecture', status: 'Approved' },
                { name: 'Agri-Tech IoT v2', lead: 'Dr. Alice', priority: 'High', stage: 'Testing', status: 'Pending' },
                { name: 'Smart Grid Analyzer', lead: 'Team Alpha', priority: 'Medium', stage: 'Development', status: 'Approved' },
                { name: 'NLP Bio-Scanner', lead: 'Rahul Verma', priority: 'Low', stage: 'Requirements', status: 'Declined' },
              ].map((item, i) => (
                <tr key={i} className="group hover:bg-slate-50/50 transition-colors cursor-pointer">
                  <td className="py-5">
                     <div className="flex flex-col">
                        <span className="font-black text-slate-800 text-sm tracking-tight">{item.name}</span>
                        <span className="text-[10px] font-bold text-slate-400">ID: PF-2026-{100+i}</span>
                     </div>
                  </td>
                  <td className="py-5">
                     <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center text-[10px] font-black text-blue-700">{item.lead[0]}</div>
                        <span className="text-xs font-bold text-slate-600">{item.lead}</span>
                     </div>
                  </td>
                  <td className="py-5">
                    <StatusBadge 
                      status={item.priority} 
                      variant={item.priority === 'Critical' ? 'error' : item.priority === 'High' ? 'warning' : 'info'} 
                    />
                  </td>
                  <td className="py-5 text-xs font-bold text-slate-500">{item.stage}</td>
                  <td className="py-5 text-right">
                    <button className={cn(
                      "px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm",
                      item.status === 'Approved' ? "bg-emerald-500 text-white" : 
                      item.status === 'Pending' ? "bg-slate-100 text-slate-600 border border-slate-200" : "bg-rose-50 text-rose-600 border border-rose-100"
                    )}>
                      {item.status}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
};

export default HodDashboard;
