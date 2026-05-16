import React from 'react';
import { 
  Calendar, 
  Flag, 
  CheckCircle2, 
  Clock, 
  ChevronRight,
  MoreVertical,
  Zap,
  Target
} from 'lucide-react';
import { 
  PageHeader, 
  SectionCard, 
  StatusBadge 
} from '../../components/common/PremiumComponents';
import { toast } from 'sonner';
import { cn } from '../../utils/utils';

const StudentTimeline = () => {
  const milestones = [
    { title: 'Requirement Specification', date: 'Oct 15, 2025', status: 'Completed', icon: CheckCircle2, color: 'emerald' },
    { title: 'UI/UX High-Fidelity Design', date: 'Nov 05, 2025', status: 'In Progress', icon: Clock, color: 'blue' },
    { title: 'Core Backend Development', date: 'Dec 20, 2025', status: 'Pending', icon: Zap, color: 'amber' },
    { title: 'Integration Testing', date: 'Jan 15, 2026', status: 'Pending', icon: Target, color: 'slate' },
    { title: 'Final Review & Handover', date: 'Feb 10, 2026', status: 'Pending', icon: Flag, color: 'slate' },
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <PageHeader 
        title="Project Timeline" 
        description="Track your project milestones and upcoming critical deadlines."
        actions={
          <button 
            onClick={() => toast.info('Calendar view coming soon!')}
            className="bg-white border border-slate-200 text-slate-700 px-6 py-3 rounded-2xl flex items-center gap-2 font-black shadow-sm hover:bg-slate-50 transition-all active:scale-95"
          >
            <Calendar size={20} />
            View Calendar
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
        {/* Timeline Visualization */}
        <div className="lg:col-span-3">
          <SectionCard title="Active Roadmaps" subtitle="Sequential progression of 'ProjectFlow v2.0'">
             <div className="relative mt-10 ml-4 lg:ml-10">
                {/* Vertical Line */}
                <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-slate-100"></div>

                <div className="space-y-12">
                   {milestones.map((m, i) => (
                     <div key={i} className="flex gap-8 relative group">
                        <div className={cn(
                          "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 z-10 transition-all duration-500",
                          m.status === 'Completed' ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" :
                          m.status === 'In Progress' ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "bg-white border-2 border-slate-100 text-slate-300"
                        )}>
                           <m.icon size={20} />
                        </div>
                        <div className={cn(
                          "flex-1 p-6 rounded-3xl border transition-all duration-300",
                          m.status === 'In Progress' ? "bg-white border-blue-200 shadow-xl shadow-blue-500/5 ring-1 ring-blue-500/5" : "bg-slate-50/50 border-slate-100"
                        )}>
                           <div className="flex items-center justify-between mb-2">
                              <h4 className="text-lg font-black text-slate-900 tracking-tight">{m.title}</h4>
                              <StatusBadge 
                                status={m.status} 
                                variant={m.status === 'Completed' ? 'success' : m.status === 'In Progress' ? 'info' : 'default'} 
                              />
                           </div>
                           <p className="text-sm font-bold text-slate-500 flex items-center gap-2">
                              <Calendar size={14} />
                              {m.date}
                           </p>
                           {m.status === 'In Progress' && (
                             <div className="mt-6 flex items-center gap-3">
                                <div className="h-1.5 flex-1 bg-slate-100 rounded-full overflow-hidden">
                                   <div className="h-full bg-blue-600 w-3/4 rounded-full"></div>
                                </div>
                                <span className="text-[10px] font-black text-blue-600">75%</span>
                             </div>
                           )}
                        </div>
                     </div>
                   ))}
                </div>
             </div>
          </SectionCard>
        </div>

        {/* Side Stats */}
        <div className="space-y-8">
           <SectionCard title="Phase Analytics" subtitle="Time distribution">
              <div className="space-y-6 mt-4">
                 <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Efficiency</span>
                    <span className="text-xs font-black text-emerald-600">+12%</span>
                 </div>
                 <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Avg. Delay</span>
                    <span className="text-xs font-black text-rose-600">0.5 Days</span>
                 </div>
              </div>
           </SectionCard>

           <SectionCard title="Upcoming Target" subtitle="Next major milestone">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-700 text-white shadow-xl shadow-blue-500/20">
                 <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Due in 5 Days</p>
                 <h4 className="text-lg font-black mt-2 leading-tight">Architecture Review</h4>
                 <div className="mt-4 flex items-center justify-between text-xs font-bold">
                    <span>Team Ready</span>
                    <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                       <ChevronRight size={18} />
                    </div>
                 </div>
              </div>
           </SectionCard>
        </div>
      </div>
    </div>
  );
};

export default StudentTimeline;
