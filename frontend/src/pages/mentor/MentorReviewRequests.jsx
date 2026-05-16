import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { 
  PageHeader, 
  SectionCard, 
  StatusBadge 
} from '../../components/common/PremiumComponents';
import { 
  CheckCircle2, 
  XCircle, 
  MessageSquare, 
  Clock, 
  AlertCircle,
  Loader2
} from 'lucide-react';
import api from '../../lib/api';

const MentorReviewRequests = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const { data } = await api.get('/mentor/reviews');
        setReviews(data);
      } catch (error) {
        console.error('Failed to fetch reviews:', error);
        toast.error('Failed to load review queue');
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, []);

  const handleAction = async (id, action) => {
    try {
      // In a real app, this would update the task status or create a feedback record
      toast.success(`Request ${action} successfully!`);
      setReviews(prev => prev.filter(r => r.id !== id));
    } catch (error) {
      toast.error(`Failed to ${action} request`);
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
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader 
        title="Review Requests" 
        description="Approve artifacts, provide technical feedback, and guide project development."
      />

      <div className="space-y-6">
        {reviews.length > 0 ? reviews.map((req) => (
          <SectionCard 
            key={req.id}
            title={req.title}
            subtitle={`${req.project_title} • ${req.team_name || 'Team'}`}
            headerActions={
              <div className="flex items-center gap-2">
                 <button 
                   onClick={() => handleAction(req.id, 'rejected')}
                   className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                   title="Reject"
                 >
                    <XCircle size={18} />
                 </button>
                 <button 
                   onClick={() => handleAction(req.id, 'approved')}
                   className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-all"
                   title="Approve"
                 >
                    <CheckCircle2 size={18} />
                 </button>
              </div>
            }
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
               <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                     <StatusBadge status={req.priority} variant={req.priority === 'High' ? 'error' : 'info'} />
                     <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        <Clock size={12} />
                        Received {new Date(req.updated_at).toLocaleDateString()}
                     </div>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">
                     {req.description || 'No description provided for this review request.'}
                  </p>
               </div>

               <div className="flex flex-col gap-2 min-w-48">
                  <button 
                    onClick={() => toast.info('Artifact viewer coming soon!')}
                    className="w-full px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2"
                  >
                     <AlertCircle size={14} />
                     View Artifact
                  </button>
                  <button className="w-full px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2">
                     <MessageSquare size={14} />
                     Write Feedback
                  </button>
               </div>
            </div>
          </SectionCard>
        )) : (
          <div className="text-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
             <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                <CheckCircle2 size={32} />
             </div>
             <p className="text-slate-400 font-bold">All caught up! No pending review requests.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MentorReviewRequests;
