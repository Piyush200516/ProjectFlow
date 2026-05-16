import React, { useState } from 'react';
import { mockProjects } from '../../data/mockData';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  ExternalLink,
  Users,
  Calendar,
  ChevronRight,
  FolderOpen
} from 'lucide-react';
import { toast } from 'sonner';

const ProjectCard = ({ project }) => (
  <div className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 group">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-2.5 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300`}>
        <FolderOpen size={24} />
      </div>
      <div className="flex gap-2">
        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${
          project.status === 'In Development' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'
        }`}>
          {project.status}
        </span>
        <button className="text-slate-400 hover:text-slate-600">
          <MoreVertical size={18} />
        </button>
      </div>
    </div>
    
    <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">{project.title}</h3>
    <p className="text-sm text-slate-500 line-clamp-2 mb-6">{project.description}</p>
    
    <div className="grid grid-cols-2 gap-4 mb-6">
      <div className="flex items-center gap-2 text-slate-600">
        <Users size={16} />
        <span className="text-xs font-medium">{project.members.length} Members</span>
      </div>
      <div className="flex items-center gap-2 text-slate-600">
        <Calendar size={16} />
        <span className="text-xs font-medium">{project.startDate}</span>
      </div>
    </div>

    <div className="space-y-2">
      <div className="flex justify-between text-xs font-bold text-slate-600">
        <span>Progress</span>
        <span>{project.progress}%</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div 
          className="h-full bg-blue-600 rounded-full transition-all duration-1000" 
          style={{ width: `${project.progress}%` }}
        />
      </div>
    </div>

    <button className="w-full mt-6 py-2.5 bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-600 font-bold rounded-xl flex items-center justify-center gap-2 transition-all group/btn">
      View Details
      <ChevronRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
    </button>
  </div>
);

const StudentProjects = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Project Repository</h1>
          <p className="text-slate-500 mt-1">Manage and track all your academic projects.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl flex items-center justify-center gap-2 font-bold shadow-lg shadow-blue-200 transition-all active:scale-95"
        >
          <Plus size={20} />
          Create New Project
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by title, team or mentor..."
            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button className="px-4 py-3 bg-white border border-slate-200 rounded-xl flex items-center gap-2 font-semibold text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
          <Filter size={18} />
          Filter
        </button>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {mockProjects.map(project => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>

      {/* Modal Placeholder (Simplified) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-xl font-bold text-slate-900">Create New Project</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
                <Plus className="rotate-45" size={24} />
              </button>
            </div>
            <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Project Title</label>
                  <input type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all" placeholder="Enter title" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Project Type</label>
                  <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all">
                    <option>Mini Project</option>
                    <option>Major Project</option>
                    <option>Hackathon Project</option>
                    <option>Final Year Project</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Description</label>
                <textarea rows="3" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all" placeholder="Project goals and summary..."></textarea>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Team Name</label>
                  <input type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all" placeholder="e.g. Code Warriors" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Mentor Name</label>
                  <input type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all" placeholder="Dr. XYZ" />
                </div>
              </div>
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-4">
              <button onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-all">Cancel</button>
              <button onClick={() => { setIsModalOpen(false); toast.success('Project created successfully!'); }} className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition-all">Submit Project</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentProjects;
