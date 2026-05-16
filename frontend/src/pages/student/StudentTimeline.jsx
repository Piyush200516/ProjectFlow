import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Flag, 
  CheckCircle2, 
  Clock, 
  ChevronRight,
  Zap,
  Target,
  Loader2
} from 'lucide-react';
import { 
  PageHeader, 
  SectionCard, 
  StatusBadge 
} from '../../components/common/PremiumComponents';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';
import { cn } from '../../utils/utils';

const StudentTimeline = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: projects } = await api.get('/projects');
        if (projects.length > 0) {
          const { data: projectDetails } = await api.get(`/projects/${projects[0].id}`);
          setProject(projectDetails);
          setTasks(projectDetails.tasks || []);
        }
      } catch (error) {
        console.error('Failed to fetch timeline:', error);
        toast.error('Failed to load project timeline');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Map tasks to milestones for visualization
  const milestones = tasks.map(task => ({
    title: task.title,
    date: new Date(task.created_at).toLocaleDateString(),
    status: task.status,
    icon: task.status === 'Completed' ? CheckCircle2 : task.status === 'Review' ? Clock : Zap,
  }));

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <PageHeader 
        title="Project Timeline" 
        description={project ? `Track milestones for ${project.title}` : "Track your project milestones and upcoming critical deadlines."}
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
        <div className="lg:col-span-3">
          <SectionCard title="Active Roadmaps" subtitle={project ? `Sequential progression of ${project.title}` : "Sequential progression"}>
             <div className="relative mt-10 ml-4 lg:ml-10">
                <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-slate-100"></div>

                <div className="space-y-12">
                   {milestones.length > 0 ? milestones.map((m, i) => (
                     <div key={i} className="flex gap-8 relative group">
                        <div className={cn(
                          "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 z-10 transition-all duration-500",
                          m.status === 'Completed' ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" :
                          m.status === 'Review' ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "bg-white border-2 border-slate-100 text-slate-300"
                        )}>
                           <m.icon size={20} />
                        </div>
                        <div className={cn(
                          "flex-1 p-6 rounded-3xl border transition-all duration-300",
                          m.status === 'Review' ? "bg-white border-blue-200 shadow-xl shadow-blue-500/5 ring-1 ring-blue-500/5" : "bg-slate-50/50 border-slate-100"
                        )}>
                           <div className="flex items-center justify-between mb-2">
                              <h4 className="text-lg font-black text-slate-900 tracking-tight">{m.title}</h4>
                              <StatusBadge 
                                status={m.status} 
                                variant={m.status === 'Completed' ? 'success' : m.status === 'Review' ? 'info' : 'default'} 
                              />
                           </div>
                           <p className="text-sm font-bold text-slate-500 flex items-center gap-2">
                              <Calendar size={14} />
                              {m.date}
                           </p>
                        </div>
                     </div>
                   )) : (
                     <div className="text-center py-10 text-slate-500 font-bold">No milestones recorded yet. Create tasks to see them here.</div>
                   )}
                </div>
             </div>
          </SectionCard>
        </div>

        <div className="space-y-8">
           <SectionCard title="Phase Analytics" subtitle="Time distribution">
              <div className="space-y-6 mt-4">
                 <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Tasks</span>
                    <span className="text-xs font-black text-blue-600">{tasks.length}</span>
                 </div>
                 <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Completed</span>
                    <span className="text-xs font-black text-emerald-600">{tasks.filter(t => t.status === 'Completed').length}</span>
                 </div>
              </div>
           </SectionCard>

           <SectionCard title="Project Progress" subtitle="Overall completion">
              <div className="mt-4 p-4 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-700 text-white shadow-xl shadow-blue-500/20">
                 <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Status</p>
                 <h4 className="text-lg font-black mt-2 leading-tight">{project?.status || 'In Progress'}</h4>
                 <div className="mt-4 flex items-center justify-between text-xs font-bold">
                    <span>{project?.progress || 0}% Complete</span>
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
