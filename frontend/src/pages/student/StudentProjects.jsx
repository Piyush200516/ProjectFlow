import React, { useState } from 'react';
import { mockProjects } from '../../data/mockData';
import { 
  PageHeader, 
  SectionCard, 
  StatusBadge, 
  ProgressCard 
} from '../../components/common/PremiumComponents';
import { SearchFilterBar } from '../../components/common/DataDisplay';
import { 
  Plus, 
  Users, 
  Calendar, 
  ChevronRight, 
  FolderOpen,
  ArrowUpRight,
  MoreVertical,
  LayoutGrid,
  List as ListIcon,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Modal } from '../../components/common/PremiumComponents';
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
        <StatusBadge status={project.type} variant="info" />
        <h3 className="text-sm font-semibold text-slate-900 mt-1 group-hover:text-slate-900 transition-colors">{project.title}</h3>
      </div>
    </div>
    
    <p className="text-slate-500 text-xs leading-relaxed line-clamp-2 mb-6 font-medium">
      {project.description}
    </p>
    
    <div className="flex items-center justify-between py-3.5 border-y border-slate-100 mb-6">
      <div className="flex -space-x-2">
        {project.members.map((m, i) => (
          <div key={i} className="w-7 h-7 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[9px] font-bold text-slate-600 shadow-sm">
            {m.name[0]}
          </div>
        ))}
        <div className="w-7 h-7 rounded-full border-2 border-white bg-slate-50 flex items-center justify-center text-[9px] font-bold text-slate-400 shadow-sm">
          +{project.members.length}
        </div>
      </div>
      <div className="flex flex-col items-end">
        <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Created</span>
        <span className="text-xs font-semibold text-slate-700">{project.startDate}</span>
      </div>
    </div>

    <ProgressCard label="Progress" value={project.progress} color="blue" />

    <div className="grid grid-cols-2 gap-3 mt-6">
      <button 
        onClick={() => onNavigate('/student/kanban')}
        className="py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-900 font-semibold rounded-lg text-xs transition-all active:scale-[0.98]"
      >
        Kanban
      </button>
      <button 
        onClick={() => toast.info('Detailed view coming soon!')}
        className="py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg text-xs shadow-sm transition-all active:scale-[0.98] flex items-center justify-center gap-1.5"
      >
        Details <ArrowUpRight size={12} />
      </button>
    </div>
  </SectionCard>
);

const StudentProjects = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const navigate = useNavigate();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <PageHeader 
        title="Projects" 
        description="Access and manage all your active academic work."
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
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-semibold transition-all active:scale-95"
            >
              <Plus size={16} />
              New Project
            </button>
          </div>
        }
      />

      <SearchFilterBar placeholder="Filter projects..." />

      <div className={cn(
        "grid gap-6",
        viewMode === 'grid' ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
      )}>
        {mockProjects.map(project => (
          <ProjectCard key={project.id} project={project} onNavigate={navigate} />
        ))}
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title="New Project"
        footer={
          <>
            <button onClick={() => setIsModalOpen(false)} className="px-5 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 rounded-lg transition-all">Cancel</button>
            <button onClick={() => { setIsModalOpen(false); toast.success('Project initialized!'); }} className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg shadow-sm transition-all active:scale-95">Create</button>
          </>
        }
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-900 ml-1">Title</label>
              <input type="text" className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all text-sm" placeholder="Project name" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-900 ml-1">Category</label>
              <select className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all text-sm appearance-none">
                <option>Mini Project</option>
                <option>Major Project</option>
                <option>Hackathon</option>
                <option>Final Year</option>
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-900 ml-1">Description</label>
            <textarea rows="4" className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all text-sm" placeholder="Short summary..."></textarea>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default StudentProjects;
