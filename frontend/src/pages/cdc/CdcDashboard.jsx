import React from 'react';
import { 
  Rocket, 
  Lightbulb, 
  Handshake, 
  Globe,
  TrendingUp,
  FileText,
  ShieldCheck,
  Zap,
  Target,
  Users,
  Plus,
  ArrowUpRight,
  Search,
  Filter
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
  StatusBadge,
  Modal 
} from '../../components/common/PremiumComponents';
import { toast } from 'sonner';

const CdcDashboard = () => {
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const startupData = [
    { month: 'Jan', count: 4, funding: 20 },
    { month: 'Feb', count: 7, funding: 45 },
    { month: 'Mar', count: 6, funding: 30 },
    { month: 'Apr', count: 12, funding: 80 },
    { month: 'May', count: 18, funding: 120 },
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
        <StatCard icon={Rocket} label="Active Startups" value="24" trend="up" trendValue="4" color="blue" />
        <StatCard icon={ShieldCheck} label="IPR/Patents" value="8" trend="up" trendValue="2" color="green" />
        <StatCard icon={Handshake} label="Industry Partners" value="15" color="indigo" />
        <StatCard icon={Zap} label="Innovation Value" value="$2.4M" trend="up" trendValue="15%" color="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <SectionCard 
          title="Startup Incubation Growth" 
          subtitle="Number of incubated teams and total funding ($k)"
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
                <Area type="monotone" dataKey="count" stroke="#8b5cf6" strokeWidth={4} fillOpacity={1} fill="url(#colorInc)" animationDuration={2000} />
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

      <SectionCard 
        title="Featured Innovation Spotlights" 
        subtitle="Top performing research projects with commercial potential"
        headerActions={<button className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:underline">View Showcase</button>}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
           {[
             { name: 'Quantum Shield v2', field: 'Cyber Security', rating: '9.8', team: 'Vault Team' },
             { name: 'Agri-Sense IoT', field: 'IoT & Agri', rating: '9.5', team: 'Green Hub' },
             { name: 'Bio-Logix AI', field: 'HealthTech', rating: '9.2', team: 'Med Cell' },
           ].map((item, i) => (
             <div key={i} className="group cursor-pointer">
                <div className="relative aspect-video rounded-3xl overflow-hidden mb-4 bg-slate-900 shadow-xl shadow-slate-200/50">
                   <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent group-hover:scale-110 transition-transform duration-700"></div>
                   <div className="absolute top-4 left-4">
                      <span className="px-2 py-1 bg-white/20 backdrop-blur-md text-white text-[10px] font-black rounded-lg uppercase tracking-widest">Featured</span>
                   </div>
                   <div className="absolute bottom-4 left-4 right-4 text-white">
                      <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest mb-1">{item.field}</p>
                      <h4 className="text-lg font-black tracking-tight">{item.name}</h4>
                   </div>
                </div>
                <div className="flex items-center justify-between px-1">
                   <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center text-[8px] font-black text-slate-600">{item.team[0]}</div>
                      <span className="text-xs font-bold text-slate-500">{item.team}</span>
                   </div>
                   <div className="flex items-center gap-1">
                      <TrendingUp size={14} className="text-emerald-500" />
                      <span className="text-sm font-black text-slate-800">{item.rating}</span>
                   </div>
                </div>
             </div>
           ))}
        </div>
      </SectionCard>
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
