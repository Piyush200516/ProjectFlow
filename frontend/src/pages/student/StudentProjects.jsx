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

const ProjectCard = ({ project, onNavigate }) => (
  <SectionCard className="group relative">
    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
      <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all">
        <MoreVertical size={18} />
      </button>
    </div>

    <div className="flex items-center gap-4 mb-6">
      <div className="w-14 h-14 bg-gradient-to-tr from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform duration-500">
        <FolderOpen size={28} />
      </div>
      <div>
        <StatusBadge status={project.type} variant="indigo" />
        <h3 className="text-xl font-black text-slate-900 mt-1 tracking-tight group-hover:text-blue-600 transition-colors">{project.title}</h3>
      </div>
    </div>
    
    <p className="text-slate-500 text-sm leading-relaxed line-clamp-2 mb-8 font-medium">
      {project.description}
    </p>
    
    <div className="flex items-center justify-between py-4 border-y border-slate-50 mb-8">
      <div className="flex -space-x-3">
        {project.members.map((m, i) => (
          <div key={i} className="w-9 h-9 rounded-full border-4 border-white bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-600 shadow-sm">
            {m.name[0]}
          </div>
        ))}
        <div className="w-9 h-9 rounded-full border-4 border-white bg-blue-50 flex items-center justify-center text-[10px] font-black text-blue-600 shadow-sm">
          +{project.members.length}
        </div>
      </div>
      <div className="flex flex-col items-end">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Start Date</span>
        <span className="text-sm font-bold text-slate-700">{project.startDate}</span>
      </div>
    </div>

    <ProgressCard label="Completion Progress" value={project.progress} color="blue" />

    <div className="grid grid-cols-2 gap-4 mt-8">
      <button 
        onClick={() => onNavigate('/student/kanban')}
        className="py-3 bg-slate-50 hover:bg-slate-100 text-slate-700 font-black rounded-xl text-xs transition-all active:scale-[0.98]"
      >
        View Kanban
      </button>
      <button 
        onClick={() => toast.info('Detailed view coming soon!')}
        className="py-3 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl text-xs shadow-lg shadow-blue-600/10 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
      >
        Details <ArrowUpRight size={14} />
      </button>
    </div>
  </SectionCard>
);

const StudentProjects = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const navigate = useNavigate();

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <PageHeader 
        title="Project Repository" 
        description="All your academic project lifecycles in one place."
        actions={
          <>
            <div className="hidden sm:flex bg-white border border-slate-200 p-1 rounded-xl shadow-sm mr-2">
              <button 
                onClick={() => setViewMode('grid')}
                className={cn("p-2 rounded-lg transition-all", viewMode === 'grid' ? "bg-slate-100 text-blue-600" : "text-slate-400")}
              >
                <LayoutGrid size={18} />
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={cn("p-2 rounded-lg transition-all", viewMode === 'list' ? "bg-slate-100 text-blue-600" : "text-slate-400")}
              >
                <ListIcon size={18} />
              </button>
            </div>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl flex items-center justify-center gap-2 font-black shadow-xl shadow-blue-600/20 transition-all active:scale-95"
            >
              <Plus size={20} />
              Create Project
            </button>
          </>
        }
      />

      <SearchFilterBar placeholder="Search by title, technology, or team members..." />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {mockProjects.map(project => (
          <ProjectCard key={project.id} project={project} onNavigate={navigate} />
        ))}
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title="Launch New Project"
        footer={
          <>
            <button onClick={() => setIsModalOpen(false)} className="px-8 py-3 font-bold text-slate-600 hover:bg-slate-200 rounded-2xl transition-all active:scale-95">Discard</button>
            <button onClick={() => { setIsModalOpen(false); toast.success('Project pipeline initialized successfully!'); }} className="px-10 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl shadow-xl shadow-blue-600/20 transition-all active:scale-95">Initialize Project</button>
          </>
        }
      >
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Project Title</label>
              <input type="text" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all font-medium" placeholder="e.g. AI Content Generator" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Category</label>
              <select className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all font-medium">
                <option>Mini Project</option>
                <option>Major Project</option>
                <option>Hackathon Project</option>
                <option>Final Year Project</option>
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Detailed Description</label>
            <textarea rows="4" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all font-medium" placeholder="What problems are you solving?"></textarea>
          </div>
        </div>
      </Modal>
  );
};

export default StudentProjects;
