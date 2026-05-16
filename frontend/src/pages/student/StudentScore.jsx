import React from 'react';
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
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  AreaChart,
  Area
} from 'recharts';
import { 
  Trophy, 
  Target, 
  Award, 
  TrendingUp,
  Download,
  Zap,
  Star,
  Shield,
  FileText,
  Rocket
} from 'lucide-react';
import { 
  PageHeader, 
  StatCard, 
  SectionCard, 
  ProgressCard 
} from '../../components/common/PremiumComponents';

const StudentScore = () => {
  const performanceData = [
    { subject: 'Innovation', A: 120, fullMark: 150 },
    { subject: 'Development', A: 98, fullMark: 150 },
    { subject: 'Documentation', A: 135, fullMark: 150 },
    { subject: 'Presentation', A: 110, fullMark: 150 },
    { subject: 'Collaboration', A: 85, fullMark: 150 },
  ];

  const taskCompletionData = [
    { name: 'Architecture', value: 400 },
    { name: 'Logic', value: 300 },
    { name: 'Frontend', value: 300 },
    { name: 'DevOps', value: 200 },
  ];

  const COLORS = ['#2563eb', '#8b5cf6', '#10b981', '#f59e0b'];

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <PageHeader 
        title="Performance Analytics" 
        description="Comprehensive evaluation of your project contributions and skills."
        actions={
          <button className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-700 font-black rounded-2xl hover:bg-slate-50 transition-all shadow-sm active:scale-95">
            <Download size={20} />
            Download Transcript
          </button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={Trophy} label="Total Credits" value="840" trend="up" trendValue="150" color="blue" />
        <StatCard icon={Target} label="Consistency" value="94%" trend="up" trendValue="2%" color="green" />
        <StatCard icon={Star} label="Global Rank" value="#12" trend="up" trendValue="4" color="amber" />
        <StatCard icon={Shield} label="Verified Skills" value="18" color="indigo" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Radar Chart for Skills */}
        <SectionCard 
          title="Skill Matrix" 
          subtitle="Multi-dimensional capability analysis"
          className="lg:col-span-1"
        >
          <div className="h-[350px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={performanceData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="subject" tick={{fill: '#64748b', fontSize: 11, fontWeight: 700}} />
                <PolarRadiusAxis angle={30} domain={[0, 150]} axisLine={false} tick={false} />
                <Radar
                  name="Piyush"
                  dataKey="A"
                  stroke="#2563eb"
                  fill="#2563eb"
                  fillOpacity={0.4}
                  strokeWidth={3}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-8 p-6 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl w-full text-center shadow-xl shadow-blue-600/20">
            <p className="text-[10px] text-white/60 font-black uppercase tracking-[0.2em]">Current Academic Tier</p>
            <p className="text-4xl font-black text-white mt-1 tracking-tighter italic flex items-center justify-center gap-3">
              <Award className="text-amber-400" size={32} />
              PREMIER A+
            </p>
          </div>
        </SectionCard>

        {/* Detailed Stats */}
        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <SectionCard title="Category Mastery" subtitle="Distribution of expertise">
               <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={taskCompletionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={90}
                      paddingAngle={8}
                      dataKey="value"
                    >
                      {taskCompletionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                {taskCompletionData.map((entry, index) => (
                  <div key={entry.name} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="w-2 h-2 rounded-full" style={{backgroundColor: COLORS[index]}}></div>
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-wider">{entry.name}</span>
                  </div>
                ))}
              </div>
            </SectionCard>
            
            <SectionCard title="Growth Milestones" subtitle="Project credit accumulation">
              <div className="space-y-6 mt-4">
                <ProgressCard label="Innovation Tier" value={85} color="blue" />
                <ProgressCard label="Technical Depth" value={72} color="emerald" />
                <ProgressCard label="Documentation" value={98} color="amber" />
                <ProgressCard label="Leadership" value={64} color="blue" />
              </div>
              <div className="mt-8 p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm">
                       <Zap size={20} />
                    </div>
                    <div>
                       <p className="text-xs font-black text-slate-800">Next Tier Unlock</p>
                       <p className="text-[10px] font-bold text-slate-400">Earn 60 more credits to reach 'Platinum'</p>
                    </div>
                 </div>
              </div>
            </SectionCard>
          </div>

          <SectionCard title="Recent Accomplishments" subtitle="Badges earned through project contributions">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
               {[
                 { icon: Rocket, label: 'Fast Starter', color: 'blue' },
                 { icon: Shield, label: 'Code Guard', color: 'green' },
                 { icon: FileText, label: 'Scribe', color: 'amber' },
                 { icon: Target, label: 'Sniper', color: 'indigo' },
               ].map((badge, i) => (
                 <div key={i} className="flex flex-col items-center p-4 rounded-2xl bg-white border border-slate-100 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/5 transition-all group">
                    <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform", 
                      badge.color === 'blue' ? "bg-blue-50 text-blue-600" :
                      badge.color === 'green' ? "bg-emerald-50 text-emerald-600" :
                      badge.color === 'amber' ? "bg-amber-50 text-amber-600" : "bg-indigo-50 text-indigo-600"
                    )}>
                       <badge.icon size={24} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">{badge.label}</span>
                 </div>
               ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
};

export default StudentScore;
