import React, { useState } from 'react';
import { 
  MessageSquare, 
  Send, 
  User, 
  Clock, 
  CheckCircle2,
  AlertCircle,
  Plus
} from 'lucide-react';
import { 
  PageHeader, 
  SectionCard,
  StatusBadge 
} from '../../components/common/PremiumComponents';
import { toast } from 'sonner';

const StudentFeedback = () => {
  const [requests, setRequests] = useState([
    { id: 1, subject: 'UI Feedback for Dashboard', date: 'Nov 10, 2025', status: 'Reviewed', mentor: 'Dr. Sarah Wilson' },
    { id: 2, subject: 'Architecture Diagram Review', date: 'Nov 12, 2025', status: 'Pending', mentor: 'Dr. Sarah Wilson' },
  ]);

  const handleRequest = (e) => {
    e.preventDefault();
    toast.success('Feedback request sent to your mentor!');
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <PageHeader 
        title="Mentor Feedback" 
        description="Request reviews and view evaluation history from your assigned mentor."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Feedback History */}
        <div className="lg:col-span-2 space-y-6">
          <SectionCard title="Recent Reviews" subtitle="History of your project evaluations">
            <div className="space-y-4">
              {requests.map((req) => (
                <div key={req.id} className="p-6 rounded-3xl border border-slate-100 bg-white hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/5 transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-black">
                        {req.mentor[0]}
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-slate-900">{req.subject}</h4>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{req.mentor} • {req.date}</p>
                      </div>
                    </div>
                    <StatusBadge 
                      status={req.status} 
                      variant={req.status === 'Reviewed' ? 'success' : 'warning'} 
                    />
                  </div>
                  
                  {req.status === 'Reviewed' ? (
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                      <p className="text-xs text-slate-600 leading-relaxed italic">
                        "The UI flow is intuitive. Consider adding more contrast to the primary action buttons in the student portal. Overall architecture looks solid for scaling."
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-4 py-2 rounded-xl border border-amber-100">
                      <Clock size={14} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Waiting for evaluation</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

        {/* Request Form */}
        <div className="space-y-6">
           <SectionCard title="Request Review" subtitle="Select a phase for evaluation">
              <form onSubmit={handleRequest} className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Phase/Module</label>
                    <select className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all font-medium appearance-none">
                       <option>UI/UX Design</option>
                       <option>Backend Architecture</option>
                       <option>Database Schema</option>
                       <option>Final Documentation</option>
                    </select>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Comment</label>
                    <textarea rows="4" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all font-medium" placeholder="What should the mentor focus on?"></textarea>
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
