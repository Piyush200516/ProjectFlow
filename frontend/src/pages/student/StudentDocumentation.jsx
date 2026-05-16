import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, Upload, Download, Trash2, Search, Loader2
} from 'lucide-react';
import { PageHeader, SectionCard } from '../../components/common/PremiumComponents';
import { toast } from 'sonner';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useSearchParams } from 'react-router-dom';

const StudentDocumentation = () => {
  const [docs, setDocs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('projectId');
  const { user } = useAuth();

  const fetchDocs = async () => {
    setIsLoading(true);
    try {
      if (!projectId) {
        setDocs([]);
        return;
      }
      const { data } = await api.get(`/documents/project/${projectId}`);
      setDocs(data);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('Failed to load documents.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, [projectId]);

  const handleUploadClick = () => {
    if (!projectId) {
      toast.error('No project selected. Go to projects and select one first.');
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('projectId', projectId);

      const { data } = await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setDocs(prev => [...prev, data]);
      toast.success('Document uploaded successfully');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.message || 'Upload failed');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (docId) => {
    try {
      await api.delete(`/documents/${docId}`);
      setDocs(docs.filter(d => d.id !== docId));
      toast.success('Document deleted');
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete document');
    }
  };

  if (!projectId) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-in fade-in">
        <FileText className="text-slate-300 mb-4" size={48} />
        <h2 className="text-xl font-semibold text-slate-900 mb-2">No Project Selected</h2>
        <p className="text-slate-500 mb-6">Please select a project from the projects page to view its documentation.</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <PageHeader 
        title="Project Documentation" 
        description="Repository for your project artifacts, reports, and diagrams."
        actions={
          <>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={handleFileChange}
            />
            <button 
              onClick={handleUploadClick}
              disabled={isUploading}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-70 text-white px-6 py-3 rounded-2xl flex items-center gap-2 font-black shadow-xl shadow-blue-600/20 transition-all active:scale-95"
            >
              {isUploading ? <Loader2 size={20} className="animate-spin" /> : <Upload size={20} />}
              {isUploading ? 'Uploading...' : 'Upload New'}
            </button>
          </>
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

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="animate-spin text-slate-400" size={32} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {docs.map((docItem) => (
            <div key={docItem.id} className="group p-6 bg-white border border-slate-200 rounded-3xl hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/5 transition-all">
              <div className="flex items-start justify-between mb-6">
                <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-blue-600 group-hover:bg-blue-50 transition-colors">
                  <FileText size={28} />
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {docItem.url && (
                    <a href={docItem.url} target="_blank" rel="noopener noreferrer" className="p-2 text-slate-400 hover:text-blue-600">
                      <Download size={18} />
                    </a>
                  )}
                  <button onClick={() => handleDelete(docItem.id)} className="p-2 text-slate-400 hover:text-rose-600"><Trash2 size={18} /></button>
                </div>
              </div>
              
              <h4 className="font-black text-slate-900 tracking-tight mb-1 truncate" title={docItem.name || docItem.original_name}>{docItem.name || docItem.original_name}</h4>
              <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <span>{docItem.file_type || docItem.type || 'FILE'}</span>
                <span>•</span>
                <span>{docItem.size || docItem.file_size || '—'}</span>
              </div>
              
              <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400">
                  {docItem.created_at ? new Date(docItem.created_at).toLocaleDateString() : 'Just now'}
                </span>
                {docItem.url && (
                  <a href={docItem.url} target="_blank" rel="noopener noreferrer" className="text-[10px] font-black text-blue-600 hover:underline">VIEW ARTIFACT</a>
                )}
              </div>
            </div>
          ))}

          {docs.length === 0 && (
            <div className="col-span-full py-20 text-center">
              <p className="text-slate-400 font-bold">No documents found for this project.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StudentDocumentation;
