import React from 'react';
import { mockProjects } from '../../data/mockData';
import { 
  PageHeader, 
  StatCard, 
  SectionCard, 
  StatusBadge 
} from '../../components/common/PremiumComponents';
import { 
  Users, 
  CheckCircle, 
  Clock, 
  MessageCircle,
  TrendingUp,
  ExternalLink,
  Calendar,
  AlertCircle,
  Mail,
  ChevronRight,
  ShieldCheck,
  Search,
  Filter
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';

const MentorDashboard = () => {
  const stats = [
    { label: 'Managed Projects', value: '12', icon: Users, color: 'blue', trend: 'up', trendValue: '2' },
    { label: 'Pending Reviews', value: '5', icon: Clock, color: 'amber', trend: 'down', trendValue: '3' },
    { label: 'Completed Stages', value: '28', icon: CheckCircle, color: 'green', trend: 'up', trendValue: '12%' },
    { label: 'Unread Feedback', value: '8', icon: MessageCircle, color: 'indigo' },
  ];

  const submissionData = [
    { name: 'Week 1', submissions: 12 },
    { name: 'Week 2', submissions: 18 },
    { name: 'Week 3', submissions: 15 },
    { name: 'Week 4', submissions: 22 },
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <PageHeader 
        title="Mentor Evaluation Hub" 
        description="Monitor assigned project pipelines and provide critical feedback."
        actions={
          <div className="flex items-center gap-3">
             <button className="hidden sm:flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-700 font-black rounded-2xl hover:bg-slate-50 transition-all shadow-sm active:scale-95">
                <Mail size={18} />
                Broadcast Msg
             </button>
             <button className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-95">
                <Calendar size={18} />
                Sync Schedule
             </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <SectionCard 
          title="Global Submission Velocity" 
          subtitle="Artifacts uploaded by student teams"
          className="lg:col-span-2"
          headerActions={
             <div className="flex gap-2">
                <button className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-slate-600"><Search size={14} /></button>
                <button className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-slate-600"><Filter size={14} /></button>
             </div>
          }
        >
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={submissionData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 700}} dy={15} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 700}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontWeight: 800 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="submissions" 
                  stroke="#2563eb" 
                  strokeWidth={4} 
                  dot={{ r: 6, fill: '#2563eb', strokeWidth: 3, stroke: '#fff' }} 
                  activeDot={{ r: 8, strokeWidth: 0 }} 
                  animationDuration={1500}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <div className="space-y-8">
          <SectionCard title="Priority Review Queue" subtitle="Tasks requiring your immediate attention">
            <div className="space-y-4">
              {[
                { title: 'UI Mockups Approval', team: 'Quantum Team', time: '2h ago', priority: 'High' },
                { title: 'Schema Verification', team: 'Health AI', time: '5h ago', priority: 'Medium' },
                { title: 'Testing Log Review', team: 'Eco Track', time: 'Yesterday', priority: 'Low' },
              ].map((item, i) => (
                <div key={i} className="p-4 rounded-2xl border border-slate-50 hover:border-blue-100 hover:bg-blue-50/30 transition-all group relative cursor-pointer">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                         <span className={cn("w-1.5 h-1.5 rounded-full", 
                           item.priority === 'High' ? "bg-rose-500" :
                           item.priority === 'Medium' ? "bg-amber-500" : "bg-emerald-500"
                         )}></span>
                         <h4 className="text-sm font-black text-slate-800 tracking-tight">{item.title}</h4>
                      </div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.team} • {item.time}</p>
                    </div>
                    <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-600 transition-all group-hover:translate-x-1" />
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-6 py-3 border-2 border-dashed border-slate-200 rounded-2xl text-xs font-black text-slate-400 hover:border-blue-200 hover:text-blue-600 hover:bg-blue-50/50 transition-all">
              View Entire Backlog
            </button>
          </SectionCard>

          <SectionCard title="Mentor Performance" subtitle="Evaluation turnaround time">
             <div className="flex items-end gap-2 mb-4">
                <span className="text-3xl font-black text-slate-900 tracking-tighter">4.2h</span>
                <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full mb-1 uppercase tracking-widest">Top 5%</span>
             </div>
             <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 w-[85%] rounded-full"></div>
             </div>
             <p className="text-[10px] font-bold text-slate-400 mt-3 italic text-center">"Faster feedback correlates to 40% higher student success."</p>
          </SectionCard>
        </div>
      </div>
    </div>
  );
};

export default MentorDashboard;
