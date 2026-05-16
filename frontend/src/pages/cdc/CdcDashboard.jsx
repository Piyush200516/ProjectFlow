import React from 'react';
import { 
  Rocket, 
  Lightbulb, 
  Handshake, 
  Globe,
  TrendingUp,
  FileText,
  ShieldCheck,
  Zap
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
  Area
} from 'recharts';

const CdcDashboard = () => {
  const startupData = [
    { month: 'Jan', count: 4 },
    { month: 'Feb', count: 7 },
    { month: 'Mar', count: 6 },
    { month: 'Apr', count: 12 },
    { month: 'May', count: 18 },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">CDC & Innovation Portal</h1>
          <p className="text-slate-500 mt-1">Driving startup culture and industry collaborations.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-5 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-all">
            Innovation Fund
          </button>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all">
            <Rocket size={20} />
            Start New Hackathon
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Active Startups', value: '24', icon: Rocket, color: 'blue' },
          { label: 'IPR/Patents', value: '8', icon: ShieldCheck, color: 'green' },
          { label: 'Industry Partners', value: '15', icon: Handshake, color: 'indigo' },
          { label: 'Innovation Value', value: '$2.4M', icon: Zap, color: 'amber' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group">
            <div className={`absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity text-${stat.color}-600`}>
              <stat.icon size={100} />
            </div>
            <div className={`w-12 h-12 bg-${stat.color}-50 text-${stat.color}-600 rounded-xl flex items-center justify-center mb-4`}>
              <stat.icon size={24} />
            </div>
            <h3 className="text-slate-500 text-sm font-medium">{stat.label}</h3>
            <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Startup Incubation Growth</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={startupData}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip 
                   contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="count" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Featured Innovation</h3>
          <div className="relative rounded-xl overflow-hidden bg-slate-900 aspect-video mb-4 group cursor-pointer">
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
            <div className="absolute bottom-4 left-4 right-4">
              <span className="px-2 py-0.5 bg-blue-600 text-white text-[10px] font-bold rounded uppercase">Top Tier</span>
              <h4 className="text-white font-bold mt-1 group-hover:text-blue-400 transition-colors">Quantum Security Protocol v2</h4>
              <p className="text-slate-300 text-xs mt-1">Innovation Lab #04</p>
            </div>
          </div>
          <div className="space-y-3">
             {[1, 2].map(i => (
               <div key={i} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer border border-transparent hover:border-slate-100">
                  <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500">
                    <Lightbulb size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">Bio-Metric Attendance AI</p>
                    <p className="text-xs text-slate-500">Industry Collab: TechCorp</p>
                  </div>
               </div>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CdcDashboard;
