import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { 
  PageHeader, 
  SectionCard, 
  StatusBadge 
} from '../../components/common/PremiumComponents';
import { 
  Search, 
  Filter, 
  ChevronRight, 
  Users, 
  Clock, 
  ExternalLink,
  Loader2
} from 'lucide-react';
import api from '../../lib/api';

const MentorProjects = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const { data } = await api.get('/mentor/teams');
        setProjects(data?.teams || data?.projects || data?.data || []);
      } catch (error) {
        console.error('Failed to fetch mentor projects:', error);
        toast.error('Failed to load assigned projects');
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  const filteredProjects = projects.filter(p => 
    (p.title || p.project_title || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader 
        title="Assigned Projects" 
        description="Global view of all projects currently under your supervision."
      />

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search projects..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
          />
        </div>
        <div className="flex items-center gap-2">
           <button className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
              <Filter size={18} />
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.length > 0 ? filteredProjects.map((project) => (
          <SectionCard 
            key={project.id}
            title={project.title || project.project_title}
            subtitle={project.type}
            headerActions={
              <button 
                onClick={() => navigate(`/mentor/projects/${project.id}`)}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-900 transition-all"
              >
                <ExternalLink size={16} />
              </button>
            }
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                 <StatusBadge status={project.status} variant={project.status === 'Completed' ? 'success' : 'info'} />
                 <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{project.progress || project.progress_percent || 0}%</span>
              </div>

              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                 <div 
                   className="h-full bg-slate-900 rounded-full transition-all duration-1000" 
                   style={{ width: `${project.progress || project.progress_percent || 0}%` }}
                 ></div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                 <div className="flex -space-x-2">
                    {(project.team_members?.length ? project.team_members.slice(0, 3) : [1, 2, 3]).map((member, i) => (
                      <div key={i} className="w-7 h-7 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400">
                        {member?.full_name?.[0] || i + 1}
                      </div>
                    ))}
                 </div>
                 <div className="flex items-center gap-3 text-slate-400">
                    <div className="flex items-center gap-1">
                       <Users size={14} />
                       <span className="text-[10px] font-bold">{project.team_members?.length || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                       <Clock size={14} />
                       <span className="text-[10px] font-bold">2d left</span>
                    </div>
                 </div>
              </div>
            </div>
          </SectionCard>
        )) : (
          <div className="col-span-full text-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
             <p className="text-slate-400 font-bold">No projects found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MentorProjects;
