import React, { useState } from 'react';
import { 
  FileText, 
  FileSpreadsheet, 
  Presentation, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Edit3, 
  Download,
  X,
  Save,
  Upload,
  MessageSquare,
  History,
  Link as LinkIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { Modal } from '../../components/common/PremiumComponents';

const assignedTemplates = [
  { id: 1, title: 'Project Synopsis', type: 'Word', deadline: '2026-05-20', assignedBy: 'Dr. Sharma', status: 'Draft', version: 'v1' },
  { id: 2, title: 'SRS Document', type: 'Word', deadline: '2026-05-25', assignedBy: 'Dr. Sharma', status: 'Under Review', version: 'v2' },
  { id: 3, title: 'System Architecture', type: 'PPT', deadline: '2026-06-01', assignedBy: 'HOD', status: 'Approved', version: 'v3' },
  { id: 4, title: 'Test Cases', type: 'Excel', deadline: '2026-06-10', assignedBy: 'Dr. Sharma', status: 'Draft', version: 'v1' },
  { id: 5, title: 'Final Project Report', type: 'Word', deadline: '2026-06-20', assignedBy: 'HOD', status: 'Pending', version: 'v0' },
];

const StudentDocumentWorkspace = () => {
  const [activeEditor, setActiveEditor] = useState(null);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [githubUrl, setGithubUrl] = useState('');
  
  const handleOpenEditor = (template) => {
    setActiveEditor(template);
    document.body.style.overflow = 'hidden'; // Prevent scrolling on main body
  };

  const handleCloseEditor = () => {
    setActiveEditor(null);
    document.body.style.overflow = 'auto';
  };

  const handleSaveDraft = () => {
    toast.success('Draft saved locally.');
  };

  const handleFinalSubmit = () => {
    if (!githubUrl.startsWith('https://github.com/')) {
      toast.error('Invalid GitHub link. Must start with https://github.com/');
      return;
    }
    toast.success(`${activeEditor.title} submitted successfully!`);
    setIsSubmitModalOpen(false);
    handleCloseEditor();
  };

  const getIcon = (type) => {
    switch(type) {
      case 'Word': return <FileText className="text-blue-500" size={24} />;
      case 'PPT': return <Presentation className="text-amber-500" size={24} />;
      case 'Excel': return <FileSpreadsheet className="text-emerald-500" size={24} />;
      default: return <FileText className="text-slate-500" size={24} />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Document Workspace</h1>
          <p className="text-sm text-slate-500 mt-1">View, edit, and submit assigned project templates.</p>
        </div>
      </div>

      {/* Grid of Templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {assignedTemplates.map((template) => (
          <div key={template.id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col">
            <div className="p-5 flex-1">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-slate-50 rounded-xl">
                  {getIcon(template.type)}
                </div>
                <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                  template.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' :
                  template.status === 'Under Review' ? 'bg-amber-100 text-amber-700' :
                  template.status === 'Draft' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                }`}>
                  {template.status}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-1">{template.title}</h3>
              <p className="text-xs text-slate-500 font-medium mb-4">Version: {template.version} • Assigned by {template.assignedBy}</p>
              
              <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 px-3 py-2 rounded-lg">
                <Clock size={14} className="text-slate-400" />
                <span>Deadline: <span className="font-semibold text-slate-700">{template.deadline}</span></span>
              </div>
            </div>
            
            <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/50 flex gap-3">
              <button 
                onClick={() => handleOpenEditor(template)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
              >
                <Edit3 size={16} />
                Open Editor
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Full Screen Editor Placeholder */}
      {activeEditor && (
        <div className="fixed inset-0 z-[100] bg-white flex flex-col animate-in slide-in-from-bottom-4 duration-300">
          {/* Editor Header */}
          <header className="h-14 border-b border-slate-200 bg-slate-50 flex items-center justify-between px-4 shrink-0">
            <div className="flex items-center gap-3">
              <button 
                onClick={handleCloseEditor}
                className="p-1.5 text-slate-500 hover:bg-slate-200 rounded-md transition-colors"
              >
                <X size={20} />
              </button>
              <div className="w-px h-6 bg-slate-200 mx-1"></div>
              {getIcon(activeEditor.type)}
              <div>
                <h2 className="text-sm font-bold text-slate-900">{activeEditor.title}</h2>
                <div className="text-[10px] text-slate-500 font-medium">Auto-saved 2 mins ago • {activeEditor.version}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleSaveDraft} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200 rounded-md transition-colors">
                <Save size={14} /> Save Draft
              </button>
              <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200 rounded-md transition-colors">
                <History size={14} /> History
              </button>
              <div className="w-px h-5 bg-slate-200 mx-1"></div>
              <button 
                onClick={() => setIsSubmitModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-md hover:bg-blue-700 transition-colors shadow-sm"
              >
                <Upload size={14} /> Submit Final
              </button>
            </div>
          </header>

          {/* Editor Workspace Layout */}
          <div className="flex-1 flex overflow-hidden">
            {/* Left Sidebar - Outline */}
            <div className="w-64 border-r border-slate-200 bg-slate-50/50 flex flex-col hidden md:flex">
              <div className="p-3 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                Document Outline
              </div>
              <div className="p-4 space-y-3 overflow-y-auto">
                <div className="text-sm font-medium text-blue-600 cursor-pointer">1. Introduction</div>
                <div className="text-sm font-medium text-slate-600 pl-4 cursor-pointer hover:text-blue-600">1.1 Purpose</div>
                <div className="text-sm font-medium text-slate-600 pl-4 cursor-pointer hover:text-blue-600">1.2 Scope</div>
                <div className="text-sm font-medium text-slate-700 cursor-pointer hover:text-blue-600">2. Overall Description</div>
                <div className="text-sm font-medium text-slate-600 pl-4 cursor-pointer hover:text-blue-600">2.1 Product Perspective</div>
                <div className="text-sm font-medium text-slate-700 cursor-pointer hover:text-blue-600">3. System Features</div>
              </div>
            </div>

            {/* Center - Canvas Placeholder */}
            <div className="flex-1 bg-slate-200/50 overflow-y-auto flex items-center justify-center p-8">
              <div className="w-full max-w-4xl min-h-[800px] bg-white shadow-xl shadow-slate-200/50 rounded-sm border border-slate-200 p-12 flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-blue-100">
                  <Edit3 size={32} />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">OnlyOffice / Collabora Ready</h3>
                <p className="text-slate-500 max-w-md mx-auto mb-8">
                  This canvas is an integration placeholder. Once the backend document server is connected, the real-time collaborative editor will render here.
                </p>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-lg text-sm font-semibold border border-amber-200">
                  <AlertCircle size={16} />
                  Currently using frontend dummy state
                </div>
              </div>
            </div>

            {/* Right Sidebar - Comments/Status */}
            <div className="w-80 border-l border-slate-200 bg-white flex flex-col hidden lg:flex">
              <div className="p-3 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <MessageSquare size={14} />
                Mentor Feedback
              </div>
              <div className="flex-1 p-4 overflow-y-auto space-y-4">
                <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-sm">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-blue-900">{activeEditor.assignedBy}</span>
                    <span className="text-[10px] text-blue-500">2 days ago</span>
                  </div>
                  <p className="text-blue-800">Please make sure to elaborate more on the System Architecture section before final submission.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Final Submit Modal */}
      <Modal 
        isOpen={isSubmitModalOpen} 
        onClose={() => setIsSubmitModalOpen(false)}
        title="Submit Final Document"
        footer={
          <>
            <button onClick={() => setIsSubmitModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
            <button onClick={handleFinalSubmit} className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg shadow-sm hover:bg-blue-700 transition-colors">Confirm Submission</button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-3">
            {getIcon(activeEditor?.type)}
            <div>
              <div className="font-bold text-slate-900 text-sm">{activeEditor?.title}</div>
              <div className="text-xs text-slate-500">Version: Final Release</div>
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">GitHub Link <span className="text-rose-500">*</span></label>
            <div className="relative">
              <LinkIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                placeholder="https://github.com/username/repo"
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Remarks</label>
            <textarea 
              rows="3"
              placeholder="Any comments for your mentor..."
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
            ></textarea>
          </div>
          
          <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
            <AlertCircle size={14} className="text-amber-500" />
            Note: Once submitted, the document will be locked for further editing.
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default StudentDocumentWorkspace;
