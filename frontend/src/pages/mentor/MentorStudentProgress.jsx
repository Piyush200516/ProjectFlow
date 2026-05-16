import React from 'react';
import { 
  Users, 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Search,
  Filter,
  Download,
  MoreVertical,
  User,
  Star
} from 'lucide-react';
import { 
  PageHeader, 
  SectionCard,
  StatusBadge 
} from '../../components/common/PremiumComponents';
import { toast } from 'sonner';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip,
  Cell
} from 'recharts';

const MentorStudentProgress = () => {
  const data = [
    { name: 'Piyush', score: 85 },
    { name: 'Ananya', score: 62 },
    { name: 'Saurabh', score: 92 },
    { name: 'Rahul', score: 45 },
    { name: 'Drishya', score: 78 },
  ];

  const COLORS = ['#2563eb', '#8b5cf6', '#10b981', '#f59e0b', '#3b82f6'];

  const handleExport = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      ["Name,Score", ...data.map(r => `${r.name},${r.score}`)].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "student_progress_report.csv");
    document.body.appendChild(link);
    link.click();
    toast.success('Report exported as CSV');
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <PageHeader 
        title="Student Growth Hub" 
        description="Monitor individual student performance and academic milestones."
        actions={
          <button 
            onClick={handleExport}
            className="bg-white border border-slate-200 text-slate-700 px-6 py-3 rounded-2xl flex items-center gap-2 font-black shadow-sm hover:bg-slate-50 transition-all active:scale-95"
          >
            <Download size={18} />
            Export Report
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2">
          <SectionCard title="Performance Distribution" subtitle="Aggregate scores across your assigned teams">
            <div className="h-[350px] w-full mt-4">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data}>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 700}} dy={15} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 700}} />
                    <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}} />
                    <Bar dataKey="score" radius={[8, 8, 0, 0]} barSize={40}>
                      {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
               </ResponsiveContainer>
            </div>
          </SectionCard>
        </div>

        <div className="space-y-8">
           <SectionCard title="Performance Leaders" subtitle="Top performing students this month">
              <div className="space-y-4">
                 {data.sort((a, b) => b.score - a.score).slice(0, 3).map((student, i) => (
                   <div key={student.name} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 group hover:border-blue-200 transition-all">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 font-black shadow-sm group-hover:scale-110 transition-transform">
                            {student.name[0]}
                         </div>
                         <div>
                            <p className="text-sm font-black text-slate-800">{student.name}</p>
                            <p className="text-[10px] font-bold text-slate-400">Score: {student.score}</p>
                         </div>
                      </div>
                      <div className="flex items-center gap-1 text-amber-500">
                         <Star size={14} className="fill-current" />
                         <span className="text-xs font-black">Top {i+1}</span>
                      </div>
                   </div>
                 ))}
              </div>
           </SectionCard>
        </div>
      </div>
    </div>
  );
};

export default MentorStudentProgress;
