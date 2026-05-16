import React, { useState } from 'react';
import { 
  Briefcase, 
  Users, 
  Calendar, 
  ExternalLink, 
  Search, 
  Filter,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { 
  PageHeader, 
  SectionCard,
  StatusBadge 
} from '../../components/common/PremiumComponents';
import { toast } from 'sonner';
import { cn } from '../../utils/utils';

const MentorProjects = () => {
  const [projects] = useState([
    { id: 1, title: 'Autonomous Drone Swarm', lead: 'Piyush Mishra', type: 'Major Project', progress: 75, status: 'Active' },
    { id: 2, title: 'Agri-Tech IoT v2', lead: 'Ananya Sharma', type: 'Mini Project', progress: 40, status: 'Behind Schedule' },
    { id: 3, title: 'Health AI Assistant', lead: 'Saurabh Singh', type: 'Final Year', progress: 95, status: 'Review Phase' },
  ]);

  const handleView = (id) => {
    toast.info('Opening project details... (Dummy)');
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <PageHeader 
        title="Assigned Projects" 
        description="Oversee and guide your assigned student project teams."
      />

      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input type="text" placeholder="Filter by project or student name..." className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500" />
        </div>
        <div className="flex gap-2">
           <button className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl">Major</button>
           <button className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl">Mini</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {projects.map((proj) => (
          <div key={proj.id} className="group bg-white border border-slate-200 rounded-3xl p-6 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/5 transition-all">
            <div className="flex items-start justify-between mb-6">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                <Briefcase size={24} />
              </div>
              <StatusBadge 
                status={proj.status} 
                variant={proj.status === 'Active' ? 'info' : proj.status === 'Review Phase' ? 'success' : 'warning'} 
              />
            </div>

            <h4 className="text-lg font-black text-slate-900 tracking-tight mb-2 truncate group-hover:text-blue-600 transition-colors">
              {proj.title}
            </h4>
            
            <div className="flex items-center gap-2 mb-6">
              <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[8px] font-black text-slate-500">
                {proj.lead[0]}
              </div>
              <span className="text-xs font-bold text-slate-500">{proj.lead}</span>
              <span className="text-slate-300">•</span>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{proj.type}</span>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                <span>Velocity</span>
                <span>{proj.progress}%</span>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className={cn(
                    "h-full transition-all duration-1000",
                    proj.status === 'Behind Schedule' ? "bg-amber-500" : "bg-blue-600"
                  )} 
                  style={{ width: `${proj.progress}%` }}
                ></div>
              </div>
            </div>

            <button 
              onClick={() => handleView(proj.id)}
              className="w-full mt-8 py-3 bg-slate-50 text-slate-600 text-xs font-black uppercase tracking-widest rounded-xl hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center gap-2"
            >
              <ExternalLink size={14} />
              Manage Project
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MentorProjects;
