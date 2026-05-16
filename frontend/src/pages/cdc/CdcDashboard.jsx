import React, { useState, useEffect } from 'react';
import { 
  Rocket, 
  ShieldCheck, 
  Handshake, 
  Zap,
  Loader2,
  TrendingUp,
  Plus,
  Search
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  PageHeader, 
  StatCard, 
  SectionCard, 
  Modal 
} from '../../components/common/PremiumComponents';
import api from '../../lib/api';
import { toast } from 'sonner';

const CdcDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get('/cdc/dashboard');
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch CDC stats:', error);
        toast.error('Failed to load innovation dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const startupData = [
    { month: 'Jan', count: 4 },
    { month: 'Feb', count: 7 },
    { month: 'Mar', count: 6 },
    { month: 'Apr', count: 12 },
    { month: 'May', count: 18 },
  ];

  const distributionData = [
    { name: 'FinTech', value: 40 },
    { name: 'EduTech', value: 30 },
    { name: 'HealthTech', value: 30 },
  ];

  const COLORS = ['#2563eb', '#8b5cf6', '#10b981'];

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <PageHeader 
        title="Innovation & Incubation Hub" 
        description="Fostering the next generation of academic startups and industry collaborations."
        actions={
          <div className="flex gap-3">
            <button className="hidden sm:flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-700 font-black rounded-2xl hover:bg-slate-50 transition-all shadow-sm active:scale-95">
              Innovation Fund
            </button>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-95"
            >
              <Rocket size={20} />
              Launch Hackathon
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={Rocket} label="Active Startups" value={stats?.activeStartups || '0'} color="blue" />
        <StatCard icon={ShieldCheck} label="IPR/Patents" value={stats?.patents || '0'} color="green" />
        <StatCard icon={Handshake} label="Industry Partners" value={stats?.industryPartners || '0'} color="indigo" />
        <StatCard icon={Zap} label="Innovation Value" value={stats?.innovationValue || '$0'} color="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <SectionCard 
          title="Startup Incubation Growth" 
          subtitle="Number of incubated teams across semesters"
          className="lg:col-span-2"
        >
          <div className="h-[350px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={startupData}>
                <defs>
                  <linearGradient id="colorInc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 700}} dy={15} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 700}} />
                <Tooltip 
                   contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="count" stroke="#8b5cf6" strokeWidth={4} fillOpacity={1} fill="url(#colorInc)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard 
          title="Industry Focus" 
          subtitle="Startup categorization"
        >
          <div className="h-[250px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={distributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={90}
                  paddingAngle={10}
                  dataKey="value"
                >
                  {distributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-3 mt-6">
             {distributionData.map((item, index) => (
               <div key={item.name} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: COLORS[index]}}></div>
                    <span className="text-xs font-black text-slate-700 uppercase tracking-tight">{item.name}</span>
                  </div>
                  <span className="text-sm font-black text-slate-900">{item.value}%</span>
               </div>
             ))}
          </div>
        </SectionCard>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title="Launch New Hackathon"
        footer={
          <>
            <button onClick={() => setIsModalOpen(false)} className="px-8 py-3 font-bold text-slate-600 hover:bg-slate-200 rounded-2xl transition-all active:scale-95">Cancel</button>
            <button onClick={() => { setIsModalOpen(false); toast.success('Hackathon live! Inviting all project teams...'); }} className="px-10 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl shadow-xl shadow-blue-600/20 transition-all active:scale-95">Start Event</button>
          </>
        }
      >
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Hackathon Title</label>
            <input type="text" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all font-medium" placeholder="e.g. Smart India 2026" />
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Event Date</label>
              <input type="date" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all font-medium" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Prize Pool</label>
              <input type="text" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all font-medium" placeholder="$50,000" />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CdcDashboard;
