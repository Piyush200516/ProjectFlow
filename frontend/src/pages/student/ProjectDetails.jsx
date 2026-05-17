import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { 
  PageHeader, 
  SectionCard, 
  StatusBadge, 
  ProgressCard 
} from '../../components/common/PremiumComponents';
import { ArrowLeft, Loader2, Calendar, Users, FolderOpen, Target, CheckCircle2, LayoutDashboard } from 'lucide-react';

const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const { data } = await api.get(`/projects/${id}`);
        setProject(data);
      } catch (error) {
        console.error('Error fetching project details:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProject();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="animate-spin text-slate-400" size={32} />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500 font-medium">Project not found.</p>
        <button onClick={() => navigate('/student/projects')} className="mt-4 text-blue-600 hover:underline">
          Go back to projects
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <button 
          onClick={() => navigate('/student/projects')}
          className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors mb-4"
        >
          <ArrowLeft size={16} />
          Back to Projects
        </button>
        <PageHeader 
          title={project.title} 
          description={project.description}
          actions={
            <StatusBadge status={project.type || 'Project'} variant="info" />
          }
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <SectionCard>
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <LayoutDashboard size={20} className="text-slate-400" />
              Project Progress Dashboard
            </h3>
            <p className="text-slate-600 text-sm leading-relaxed mb-6">
              {project.description}
            </p>
            <div className="space-y-5">
              <ProgressCard label="Overall Progress" value={project.progress || 65} color="blue" />
              <ProgressCard label="SDLC Stage: Implementation" value={45} color="indigo" />
              <ProgressCard label="Task Completion" value={75} color="emerald" />
              <ProgressCard label="Documentation" value={30} color="amber" />
            </div>
            
            <div className="mt-8 pt-6 border-t border-slate-100">
              <h4 className="text-sm font-semibold text-slate-900 mb-4">Submission Status</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                    <CheckCircle2 size={16} />
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 font-medium">Final Submission</div>
                    <div className="text-sm font-semibold text-slate-900">Pending</div>
                  </div>
                </div>
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center">
                    <Target size={16} />
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 font-medium">Mentor Approval</div>
                    <div className="text-sm font-semibold text-slate-900">Awaiting</div>
                  </div>
                </div>
              </div>
            </div>
          </SectionCard>
        </div>

        <div className="space-y-6">
          <SectionCard>
            <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Users size={16} className="text-slate-400" />
              Team Members
            </h3>
            <div className="space-y-3">
              {project.members && project.members.map((m, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                    {(m.full_name || m.name || '?')[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{m.full_name || m.name}</p>
                    <p className="text-xs text-slate-500">{m.role || 'Member'}</p>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard>
            <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Calendar size={16} className="text-slate-400" />
              Timeline
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Created At</span>
                <span className="font-medium text-slate-900">
                  {project.created_at ? new Date(project.created_at).toLocaleDateString() : 'Just now'}
                </span>
              </div>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetails;
