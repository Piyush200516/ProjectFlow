import React, { useState } from 'react';
import { 
  FileText, 
  UploadCloud, 
  Send, 
  Search, 
  MoreVertical, 
  Clock, 
  CheckCircle2, 
  FileSpreadsheet, 
  Presentation 
} from 'lucide-react';
import { toast } from 'sonner';
import { Modal } from '../../components/common/PremiumComponents';

const dummyTemplates = [
  { id: 1, title: 'Project Synopsis Template', type: 'Word', uploadedDate: '2026-05-10', assignedTo: 3 },
  { id: 2, title: 'System Architecture Diagram', type: 'PPT', uploadedDate: '2026-05-12', assignedTo: 1 },
  { id: 3, title: 'Use Case Scenarios', type: 'Excel', uploadedDate: '2026-05-15', assignedTo: 0 },
  { id: 4, title: 'SRS Document', type: 'Word', uploadedDate: '2026-05-16', assignedTo: 5 },
];

const MentorTemplates = () => {
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const handleOpenAssign = (template) => {
    setSelectedTemplate(template);
    setIsAssignModalOpen(true);
  };

  const handleAssignSubmit = (e) => {
    e.preventDefault();
    toast.success(`${selectedTemplate?.title} assigned successfully.`);
    setIsAssignModalOpen(false);
  };

  const handleUploadSubmit = (e) => {
    e.preventDefault();
    toast.success('Template uploaded successfully.');
    setIsUploadModalOpen(false);
  };

  const getIcon = (type) => {
    switch(type) {
      case 'Word': return <FileText className="text-blue-500" size={20} />;
      case 'PPT': return <Presentation className="text-amber-500" size={20} />;
      case 'Excel': return <FileSpreadsheet className="text-emerald-500" size={20} />;
      default: return <FileText className="text-slate-500" size={20} />;
    }
  };

  const filteredTemplates = dummyTemplates.filter(t => t.title.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Document Templates</h1>
          <p className="text-sm text-slate-500 mt-1">Upload and distribute standard templates to your assigned project teams.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search templates..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
            />
          </div>
          <button 
            onClick={() => setIsUploadModalOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm shrink-0"
          >
            <UploadCloud size={16} />
            Upload Template
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <div key={template.id} className="bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col hover:border-slate-300 transition-colors">
            <div className="p-5 flex-1">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                  {getIcon(template.type)}
                </div>
                <button className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors">
                  <MoreVertical size={16} />
                </button>
              </div>
              <h3 className="text-base font-semibold text-slate-900 mb-1">{template.title}</h3>
              <p className="text-xs font-medium text-slate-500 mb-4">Uploaded {template.uploadedDate}</p>
              
              <div className="flex items-center justify-between text-xs font-medium text-slate-600 bg-slate-50 px-3 py-2 rounded-lg">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-emerald-500" />
                  Assigned
                </span>
                <span className="text-slate-900">{template.assignedTo} Teams</span>
              </div>
            </div>
            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50">
              <button 
                onClick={() => handleOpenAssign(template)}
                className="w-full py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 hover:text-slate-900 transition-colors flex items-center justify-center gap-2"
              >
                <Send size={16} />
                Assign to Team
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Assign Modal */}
      <Modal 
        isOpen={isAssignModalOpen} 
        onClose={() => setIsAssignModalOpen(false)}
        title="Assign Template"
        footer={
          <>
            <button onClick={() => setIsAssignModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
            <button onClick={handleAssignSubmit} className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg shadow-sm hover:bg-blue-700 transition-colors">Assign Template</button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg flex items-center gap-3">
            {getIcon(selectedTemplate?.type)}
            <span className="font-semibold text-slate-900 text-sm">{selectedTemplate?.title}</span>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Select Team(s)</label>
            <select className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
              <option>Team Alpha - AI Tracker</option>
              <option>Team Beta - Blockchain Voting</option>
              <option>All Assigned Teams</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Set Deadline</label>
            <div className="relative">
              <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="date" 
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      </Modal>

      {/* Upload Modal */}
      <Modal 
        isOpen={isUploadModalOpen} 
        onClose={() => setIsUploadModalOpen(false)}
        title="Upload New Template"
        footer={
          <>
            <button onClick={() => setIsUploadModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
            <button onClick={handleUploadSubmit} className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg shadow-sm hover:bg-blue-700 transition-colors">Upload</button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Template Title</label>
            <input 
              type="text" 
              placeholder="e.g. Chapter 1 Format"
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">File Type</label>
            <select className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
              <option>Word Document (.docx)</option>
              <option>PowerPoint (.pptx)</option>
              <option>Excel Sheet (.xlsx)</option>
            </select>
          </div>

          <div className="space-y-2 pt-2">
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-200 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <UploadCloud size={24} className="text-slate-400 mb-2" />
                <p className="text-xs text-slate-500 font-medium">Click to select template file</p>
              </div>
              <input type="file" className="hidden" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx" />
            </label>
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default MentorTemplates;
