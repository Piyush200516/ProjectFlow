import React, { useState } from 'react';
import { 
  FileText, 
  UploadCloud, 
  Search, 
  Trash2,
  FileSpreadsheet, 
  Presentation,
  Building2,
  Share2
} from 'lucide-react';
import { toast } from 'sonner';
import { Modal } from '../../components/common/PremiumComponents';

const dummyHodTemplates = [
  { id: 1, title: 'Department Standard Synopsis', type: 'Word', uploadedDate: '2026-04-10', sharedWith: 'All Mentors' },
  { id: 2, title: 'Final Year Presentation Format', type: 'PPT', uploadedDate: '2026-04-12', sharedWith: 'All Mentors' },
  { id: 3, title: 'Evaluation Criteria Rubric', type: 'Excel', uploadedDate: '2026-04-15', sharedWith: 'HOD Only' },
];

const HodTemplates = () => {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const handleUploadSubmit = (e) => {
    e.preventDefault();
    toast.success('Department template uploaded successfully.');
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

  const filteredTemplates = dummyHodTemplates.filter(t => t.title.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Department Templates</h1>
          <p className="text-sm text-slate-500 mt-1">Manage global templates distributed to all mentors and students.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search dept templates..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
            />
          </div>
          <button 
            onClick={() => setIsUploadModalOpen(true)}
            className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-800 transition-colors flex items-center gap-2 shadow-sm shrink-0"
          >
            <UploadCloud size={16} />
            Upload Master
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
          <Building2 size={18} className="text-slate-500" />
          <h2 className="text-sm font-bold text-slate-700">Master Repository</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-medium">Template Name</th>
                <th className="px-6 py-4 font-medium">Uploaded</th>
                <th className="px-6 py-4 font-medium">Distribution</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTemplates.map((template) => (
                <tr key={template.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-100 rounded-lg">
                        {getIcon(template.type)}
                      </div>
                      <div className="font-semibold text-slate-900">{template.title}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-500 font-medium">{template.uploadedDate}</td>
                  <td className="px-6 py-4">
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md w-fit">
                      <Share2 size={12} /> {template.sharedWith}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors ml-auto">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload Modal */}
      <Modal 
        isOpen={isUploadModalOpen} 
        onClose={() => setIsUploadModalOpen(false)}
        title="Upload Department Template"
        footer={
          <>
            <button onClick={() => setIsUploadModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
            <button onClick={handleUploadSubmit} className="px-4 py-2 bg-slate-900 text-white text-sm font-semibold rounded-lg shadow-sm hover:bg-slate-800 transition-colors">Upload & Share</button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Template Title</label>
            <input 
              type="text" 
              placeholder="e.g. Master SRS Format v2"
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Distribution / Visibility</label>
            <select className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
              <option>All Mentors</option>
              <option>Specific Mentors</option>
              <option>HOD Only (Private)</option>
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

export default HodTemplates;
