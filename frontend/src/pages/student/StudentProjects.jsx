import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import { 
  PageHeader, 
  SectionCard, 
  StatusBadge, 
  ProgressCard 
} from '../../components/common/PremiumComponents';
import { SearchFilterBar } from '../../components/common/DataDisplay';
import { 
  FolderOpen,
  ArrowUpRight,
  MoreVertical,
  LayoutGrid,
  List as ListIcon,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../utils/utils';

const ProjectCard = ({ project, onNavigate }) => (
  <SectionCard className="group relative">
    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
      <button className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-md transition-all">
        <MoreVertical size={14} />
      </button>
    </div>

    <div className="flex items-center gap-3.5 mb-5">
      <div className="w-11 h-11 bg-slate-900 rounded-lg flex items-center justify-center text-white transition-transform duration-300">
        <FolderOpen size={20} />
      </div>
      <div>
        <StatusBadge status={project.type || 'Project'} variant="info" />
        <h3 className="text-sm font-semibold text-slate-900 mt-1 group-hover:text-slate-900 transition-colors">{project.title}</h3>
      </div>
    </div>
    
    <p className="text-slate-500 text-xs leading-relaxed line-clamp-2 mb-6 font-medium">
      {project.description}
    </p>
    
    <div className="flex items-center justify-between py-3.5 border-y border-slate-100 mb-6">
      <div className="flex -space-x-2">
        {project.members && project.members.map((m, i) => (
          <div key={i} className="w-7 h-7 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[9px] font-bold text-slate-600 shadow-sm" title={m.full_name || m.name}>
            {(m.full_name || m.name || '?')[0].toUpperCase()}
          </div>
        ))}
      </div>
      <div className="flex flex-col items-end">
        <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Created</span>
        <span className="text-xs font-semibold text-slate-700">
          {project.created_at ? new Date(project.created_at).toLocaleDateString() : 'Just now'}
        </span>
      </div>
    </div>

    <ProgressCard label="Progress" value={project.progress || 0} color="blue" />

    <div className="grid grid-cols-2 gap-3 mt-6">
      <button 
        onClick={() => onNavigate(project.project_id ? `/student/kanban?projectId=${project.project_id}` : '/student/dashboard')}
        className="py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-900 font-semibold rounded-lg text-xs transition-all active:scale-[0.98]"
      >
        Kanban
      </button>
      <button 
        onClick={() => onNavigate(project.project_id ? `/student/projects/${project.project_id}` : '/student/dashboard')}
        className="py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg text-xs shadow-sm transition-all active:scale-[0.98] flex items-center justify-center gap-1.5"
      >
        Details <ArrowUpRight size={12} />
      </button>
    </div>
  </SectionCard>
);

const StudentProjects = () => {
  const [viewMode, setViewMode] = useState('grid');
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const navigate = useNavigate();

  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get('/student/my-project');
      const assignedProject = data?.project
        ? [{
            id: data.project.project_id || data.project.id,
            project_id: data.project.project_id,
            title: data.project.title,
            type: data.project.project_type,
            description: data.project.abstract || data.project.problem_statement,
            progress: data.project.progress_percent || 0,
            created_at: data.project.submitted_at,
            members: data.project.team_members || [],
            status: data.project.status,
          }]
        : [];
      setProjects(assignedProject);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('Failed to load assigned project.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <PageHeader 
        title="My Assigned Project" 
        description="Access the project registered through the HOD campaign workflow."
        actions={
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex bg-slate-50 border border-slate-200 p-0.5 rounded-lg">
              <button 
                onClick={() => setViewMode('grid')}
                className={cn("p-1.5 rounded-md transition-all", viewMode === 'grid' ? "bg-white text-slate-900 shadow-sm" : "text-slate-400")}
              >
                <LayoutGrid size={16} />
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={cn("p-1.5 rounded-md transition-all", viewMode === 'list' ? "bg-white text-slate-900 shadow-sm" : "text-slate-400")}
              >
                <ListIcon size={16} />
              </button>
            </div>
          </div>
        }
      />

      <SearchFilterBar placeholder="Filter projects..." />

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="animate-spin text-slate-400" size={32} />
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-slate-500 font-medium">No assigned project yet. Submit a matching HOD Project Registration Campaign to begin.</p>
        </div>
      ) : (
        <div className={cn(
          "grid gap-6",
          viewMode === 'grid' ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
        )}>
          {projects.map(project => (
            <ProjectCard key={project.id} project={project} onNavigate={navigate} />
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentProjects;
