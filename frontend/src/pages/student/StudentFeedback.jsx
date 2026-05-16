import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Send, 
  Clock, 
  AlertCircle,
  Loader2
} from 'lucide-react';
import { 
  PageHeader, 
  SectionCard,
  StatusBadge 
} from '../../components/common/PremiumComponents';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';

const StudentFeedback = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState(null);
  const [feedback, setFeedback] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [subject, setSubject] = useState('UI/UX Design');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: projects } = await api.get('/projects');
        if (projects.length > 0) {
          const { data: projectDetails } = await api.get(`/projects/${projects[0].id}`);
          setProject(projectDetails);
          setFeedback(projectDetails.feedback || []);
        }
      } catch (error) {
        console.error('Failed to fetch feedback:', error);
        toast.error('Failed to load mentor feedback');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleRequest = async (e) => {
    e.preventDefault();
    if (!project) return;
    
    try {
      // In a real app, this might send a notification or create a pending feedback record
      // For now, we'll just simulate the request since we don't have a POST /feedback yet
      toast.success('Feedback request sent to your mentor!');
      setNewComment('');
    } catch (error) {
      toast.error('Failed to send request');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <PageHeader 
        title="Mentor Feedback" 
        description="Request reviews and view evaluation history from your assigned mentor."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-6">
          <SectionCard title="Recent Reviews" subtitle="History of your project evaluations">
            <div className="space-y-4">
              {feedback.length > 0 ? feedback.map((item) => (
                <div key={item.id} className="p-6 rounded-3xl border border-slate-100 bg-white hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/5 transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-black">
                        {item.mentor_name?.[0] || 'M'}
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-slate-900">{item.subject}</h4>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.mentor_name} • {new Date(item.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <StatusBadge 
                      status={item.status} 
                      variant={item.status === 'Reviewed' ? 'success' : 'warning'} 
                    />
                  </div>
                  
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <p className="text-xs text-slate-600 leading-relaxed italic">
                      "{item.comment}"
                    </p>
                  </div>
                </div>
              )) : (
                <div className="text-center py-10 text-slate-500 font-bold">No feedback received yet.</div>
              )}
            </div>
          </SectionCard>
        </div>

        <div className="space-y-6">
           <SectionCard title="Request Review" subtitle="Select a phase for evaluation">
              <form onSubmit={handleRequest} className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Phase/Module</label>
                    <select 
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all font-medium appearance-none"
                    >
                       <option>UI/UX Design</option>
                       <option>Backend Architecture</option>
                       <option>Database Schema</option>
                       <option>Final Documentation</option>
                    </select>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Comment</label>
                    <textarea 
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      rows="4" 
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all font-medium" 
                      placeholder="What should the mentor focus on?"
                    ></textarea>
                 </div>
                 <button type="submit" className="w-full bg-slate-900 text-white py-4 rounded-2xl flex items-center justify-center gap-2 font-black shadow-lg shadow-slate-900/10 hover:bg-slate-800 transition-all">
                    <Send size={18} />
                    Submit Request
                 </button>
              </form>
           </SectionCard>

           <div className="p-6 rounded-3xl bg-blue-600 text-white shadow-xl shadow-blue-500/20">
              <div className="flex items-center gap-3 mb-4">
                 <AlertCircle size={24} />
                 <h4 className="font-black text-lg">Pro Tip</h4>
              </div>
              <p className="text-sm font-medium text-blue-50 opacity-90 leading-relaxed">
                 Mentors typically respond within 24-48 hours. Ensure your documents are uploaded before requesting a review.
              </p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default StudentFeedback;
