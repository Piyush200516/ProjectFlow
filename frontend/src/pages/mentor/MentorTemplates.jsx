import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  UploadCloud, 
  Send, 
  Search, 
  MoreVertical, 
  Clock, 
  CheckCircle2, 
  FileSpreadsheet, 
  Presentation,
  Loader2,
  Calendar
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../../lib/api';
import { Modal, SectionCard } from '../../components/common/PremiumComponents';

const defaultMilestoneNames = [
  'Synopsis',
  'SRS',
  'PPT',
  'Poster',
  'Project Report',
  'GitHub Final Submission'
];

const MentorTemplates = () => {
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState([]);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [projects, setProjects] = useState([]);
  const [timelineForm, setTimelineForm] = useState({
    project_id: '',
    start_date: new Date().toISOString().slice(0, 10),
    interval_days: 15,
  });
  const [creatingTimeline, setCreatingTimeline] = useState(false);

  // Form states
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    document_type: 'Synopsis',
    file_path: '/files/templates/synopsis_format.docx'
  });
  const [uploading, setUploading] = useState(false);

  const [assignForm, setAssignForm] = useState({
    project_type: 'Mini Project',
    deadline_date: ''
  });
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const [res, projectsRes] = await Promise.all([
        api.get('/workflow/projects/deadlines'),
        api.get('/projects')
      ]);
      setTemplates(res.data);
      setProjects(projectsRes.data);
      if (projectsRes.data.length > 0) {
        setTimelineForm(prev => ({ ...prev, project_id: prev.project_id || String(projectsRes.data[0].id) }));
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error);
      toast.error('Failed to load active templates and deadlines');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAssign = (template) => {
    setSelectedTemplate(template);
    setAssignForm({
      project_type: template.project_type || 'Mini Project',
      deadline_date: template.deadline_date ? new Date(template.deadline_date).toISOString().slice(0, 16) : ''
    });
    setIsAssignModalOpen(true);
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!assignForm.deadline_date) {
      toast.error('Please specify a valid deadline date and time');
      return;
    }

    setAssigning(true);
    try {
      await api.post('/workflow/mentor/deadlines', {
        template_id: selectedTemplate.template_id || selectedTemplate.id,
        project_type: assignForm.project_type,
        deadline_date: assignForm.deadline_date
      });
      toast.success(`Academic deadline for ${selectedTemplate?.template_title || selectedTemplate?.title} set successfully!`);
      setIsAssignModalOpen(false);
      fetchTemplates();
    } catch (error) {
      console.error('Failed to assign deadline:', error);
      toast.error('Failed to set deliverable deadline');
    } finally {
      setAssigning(false);
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadForm.title) {
      toast.error('Please enter a Template Title');
      return;
    }

    setUploading(true);
    try {
      await api.post('/workflow/mentor/document-templates', {
        title: uploadForm.title,
        description: uploadForm.description,
        document_type: uploadForm.document_type,
        file_path: `/files/templates/${uploadForm.document_type.toLowerCase().replace(' ', '_')}_format.docx`
      });

      toast.success('Academic deliverable template registered successfully!');
      setIsUploadModalOpen(false);
      setUploadForm({
        title: '',
        description: '',
        document_type: 'Synopsis',
        file_path: '/files/templates/synopsis_format.docx'
      });
      fetchTemplates();
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Failed to register template format');
    } finally {
      setUploading(false);
    }
  };

  const getIcon = (type) => {
    if (type === 'PPT') return <Presentation className="text-amber-500" size={20} />;
    if (type === 'Word' || type === 'Synopsis' || type === 'SRS' || type === 'Project Report' || type === 'Final Report') {
      return <FileText className="text-blue-500" size={20} />;
    }
    return <FileSpreadsheet className="text-emerald-500" size={20} />;
  };

  const filteredTemplates = templates.filter(t => 
    (t.template_title || t.title || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateTimeline = async (e) => {
    e.preventDefault();
    if (!timelineForm.project_id || !timelineForm.start_date) {
      toast.error('Select a project and start date');
      return;
    }

    setCreatingTimeline(true);
    try {
      await api.post('/milestones/timeline', {
        project_id: Number(timelineForm.project_id),
        start_date: timelineForm.start_date,
        interval_days: Number(timelineForm.interval_days) || 15,
        milestones: defaultMilestoneNames
      });
      toast.success('Project timeline created with 6 document milestones');
    } catch (error) {
      console.error('Failed to create project timeline:', error);
      toast.error(error.response?.data?.message || 'Failed to create timeline');
    } finally {
      setCreatingTimeline(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-slate-900" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Academic Templates & Deadlines</h1>
          <p className="text-sm text-slate-500 mt-1">Upload required document templates and set individual deadlines for teams.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search templates..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-950/5 focus:border-slate-950 transition-all shadow-sm"
            />
          </div>
          <button 
            onClick={() => setIsUploadModalOpen(true)}
            className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-800 transition-colors flex items-center gap-2 shadow-sm shrink-0"
          >
            <UploadCloud size={16} />
            Add Template Format
          </button>
        </div>
      </div>

      <SectionCard title="Project Document Timeline" subtitle="Create 6 deliverable milestones, one every 15 days">
        <form onSubmit={handleCreateTimeline} className="grid grid-cols-1 md:grid-cols-[1fr_180px_140px_auto] gap-4 items-end">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 uppercase">Project</label>
            <select
              value={timelineForm.project_id}
              onChange={(e) => setTimelineForm(prev => ({ ...prev, project_id: e.target.value }))}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-950/5"
            >
              {projects.length === 0 ? (
                <option value="">No projects found</option>
              ) : (
                projects.map(project => (
                  <option key={project.id} value={project.id}>{project.title}</option>
                ))
              )}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 uppercase">Start Date</label>
            <input
              type="date"
              value={timelineForm.start_date}
              onChange={(e) => setTimelineForm(prev => ({ ...prev, start_date: e.target.value }))}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-950/5"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 uppercase">Interval</label>
            <input
              type="number"
              min="1"
              value={timelineForm.interval_days}
              onChange={(e) => setTimelineForm(prev => ({ ...prev, interval_days: e.target.value }))}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-950/5"
            />
          </div>

          <button
            type="submit"
            disabled={creatingTimeline || !timelineForm.project_id}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:bg-slate-400 transition-colors"
          >
            {creatingTimeline ? 'Creating...' : 'Create Timeline'}
          </button>
        </form>

        <div className="mt-4 flex flex-wrap gap-2">
          {defaultMilestoneNames.map((name, index) => (
            <span key={name} className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">
              Day {(index + 1) * (Number(timelineForm.interval_days) || 15)}: {name}
            </span>
          ))}
        </div>
      </SectionCard>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <div key={template.id} className="bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col hover:border-slate-300 transition-colors justify-between">
            <div className="p-5">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                  {getIcon(template.document_type || template.type)}
                </div>
              </div>
              <h3 className="text-base font-semibold text-slate-900 mb-1">{template.template_title || template.title}</h3>
              <p className="text-xs font-medium text-slate-500 mb-4">{template.document_type || 'Academic Format'}</p>
              
              {template.deadline_date && (
                <div className="flex items-center justify-between text-xs font-semibold text-slate-600 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200/50">
                  <span className="flex items-center gap-1.5 text-indigo-600">
                    <Clock size={14} />
                    Due Date:
                  </span>
                  <span className="text-slate-900">{new Date(template.deadline_date).toLocaleDateString()}</span>
                </div>
              )}
            </div>
            
            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50">
              <button 
                onClick={() => handleOpenAssign(template)}
                className="w-full py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 hover:text-slate-900 transition-colors flex items-center justify-center gap-2"
              >
                <Clock size={16} />
                Set Deliverable Deadline
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Set Deadline Modal */}
      <Modal 
        isOpen={isAssignModalOpen} 
        onClose={() => setIsAssignModalOpen(false)}
        title="Set Submission Deadline"
        footer={
          <>
            <button onClick={() => setIsAssignModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
            <button 
              onClick={handleAssignSubmit} 
              disabled={assigning}
              className="px-4 py-2 bg-slate-900 text-white text-sm font-semibold rounded-lg shadow-sm hover:bg-slate-800 transition-colors"
            >
              {assigning ? 'Saving...' : 'Set Deadline'}
            </button>
          </>
        }
      >
        <form onSubmit={handleAssignSubmit} className="space-y-4">
          <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg flex items-center gap-3">
            {getIcon(selectedTemplate?.document_type)}
            <span className="font-semibold text-slate-900 text-sm">{selectedTemplate?.template_title}</span>
          </div>
          
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 uppercase">Target Project Type</label>
            <select 
              value={assignForm.project_type}
              onChange={(e) => setAssignForm(prev => ({ ...prev, project_type: e.target.value }))}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-950/5"
            >
              <option>Mini Project</option>
              <option>Major Project</option>
              <option>Final Year Project</option>
              <option>Hackathon</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 uppercase">Deadline Date & Time</label>
            <div className="relative">
              <input 
                type="datetime-local" 
                value={assignForm.deadline_date}
                onChange={(e) => setAssignForm(prev => ({ ...prev, deadline_date: e.target.value }))}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-950/5"
                required
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* Upload Modal */}
      <Modal 
        isOpen={isUploadModalOpen} 
        onClose={() => setIsUploadModalOpen(false)}
        title="Upload Academic Deliverable Format"
        footer={
          <>
            <button onClick={() => setIsUploadModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
            <button 
              onClick={handleUploadSubmit} 
              disabled={uploading}
              className="px-4 py-2 bg-slate-900 text-white text-sm font-semibold rounded-lg shadow-sm hover:bg-slate-800 transition-colors"
            >
              {uploading ? 'Registering...' : 'Publish Template'}
            </button>
          </>
        }
      >
        <form onSubmit={handleUploadSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 uppercase">Template Name</label>
            <input 
              type="text" 
              placeholder="e.g. Synopsis Standard Format"
              value={uploadForm.title}
              onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-950/5"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 uppercase">Document Category</label>
            <select 
              value={uploadForm.document_type}
              onChange={(e) => setUploadForm(prev => ({ ...prev, document_type: e.target.value }))}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-950/5"
            >
              <option>Poster</option>
              <option>PPT</option>
              <option>Project Report</option>
              <option>Research Paper</option>
              <option>Synopsis</option>
              <option>SRS</option>
              <option>Final Report</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 uppercase">Description / Instruction Remarks</label>
            <textarea 
              rows="3"
              placeholder="Guidelines for students on how to prepare this deliverable..."
              value={uploadForm.description}
              onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 resize-none"
            ></textarea>
          </div>
        </form>
      </Modal>

    </div>
  );
};

export default MentorTemplates;
