import React, { useState } from 'react';
import { 
  FileText, 
  Upload, 
  Download, 
  Trash2, 
  File, 
  Search, 
  Filter,
  Plus
} from 'lucide-react';
import { 
  PageHeader, 
  SectionCard 
} from '../../components/common/PremiumComponents';
import { toast } from 'sonner';

const StudentDocumentation = () => {
  const [docs, setDocs] = useState([
    { id: 1, name: 'Project_Proposal_v1.pdf', size: '2.4 MB', date: 'Oct 12, 2025', type: 'PDF' },
    { id: 2, name: 'System_Architecture_Diagram.png', size: '1.8 MB', date: 'Oct 20, 2025', type: 'Image' },
    { id: 3, name: 'SRS_Document_Draft.docx', size: '3.1 MB', date: 'Nov 02, 2025', type: 'Doc' },
  ]);

  const handleUpload = () => {
    toast.info('Upload feature coming soon! (Dummy mode)');
  };

  const handleDelete = (id) => {
    setDocs(docs.filter(doc => doc.id !== id));
    toast.success('Document deleted successfully');
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <PageHeader 
        title="Project Documentation" 
        description="Repository for your project artifacts, reports, and diagrams."
        actions={
          <button 
            onClick={handleUpload}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl flex items-center gap-2 font-black shadow-xl shadow-blue-600/20 transition-all active:scale-95"
          >
            <Upload size={20} />
            Upload New
          </button>
        }
      />

      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input type="text" placeholder="Search documents..." className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500" />
        </div>
        <div className="flex items-center gap-2">
          <button className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl">All Types</button>
          <button className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl">Latest First</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {docs.map((doc) => (
          <div key={doc.id} className="group p-6 bg-white border border-slate-200 rounded-3xl hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/5 transition-all">
            <div className="flex items-start justify-between mb-6">
              <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-blue-600 group-hover:bg-blue-50 transition-colors">
                <FileText size={28} />
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="p-2 text-slate-400 hover:text-blue-600"><Download size={18} /></button>
                <button onClick={() => handleDelete(doc.id)} className="p-2 text-slate-400 hover:text-rose-600"><Trash2 size={18} /></button>
              </div>
            </div>
            
            <h4 className="font-black text-slate-900 tracking-tight mb-1 truncate">{doc.name}</h4>
            <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <span>{doc.type}</span>
              <span>•</span>
              <span>{doc.size}</span>
            </div>
            
            <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400">{doc.date}</span>
              <span className="text-[10px] font-black text-blue-600">VIEW ARTIFACT</span>
            </div>
          </div>
        ))}

        {docs.length === 0 && (
          <div className="col-span-full py-20 text-center">
            <p className="text-slate-400 font-bold">No documents found. Start by uploading one.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDocumentation;
