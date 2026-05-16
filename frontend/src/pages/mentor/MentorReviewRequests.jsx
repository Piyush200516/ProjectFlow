import React, { useState } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search, 
  MessageSquare,
  FileText,
  AlertCircle
} from 'lucide-react';
import { 
  PageHeader, 
  SectionCard,
  StatusBadge 
} from '../../components/common/PremiumComponents';
import { toast } from 'sonner';

const MentorReviewRequests = () => {
  const [requests, setRequests] = useState([
    { id: 1, team: 'Quantum Team', subject: 'UI Mockups Approval', date: '2h ago', status: 'Pending', priority: 'High' },
    { id: 2, team: 'Health AI', subject: 'Schema Verification', date: '5h ago', status: 'Pending', priority: 'Medium' },
    { id: 3, team: 'Eco Track', subject: 'Testing Log Review', date: 'Yesterday', status: 'Completed', priority: 'Low' },
  ]);

  const handleApprove = (id) => {
    setRequests(requests.map(r => r.id === id ? { ...r, status: 'Completed' } : r));
    toast.success('Request approved successfully!');
  };

  const handleReject = (id) => {
    toast.error('Review rejected with comments.');
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <PageHeader 
        title="Review Requests" 
        description="Pending evaluation requests from your student project teams."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-6">
          <SectionCard title="Active Queue" subtitle="Pending artifact reviews">
            <div className="space-y-4">
              {requests.filter(r => r.status === 'Pending').map((req) => (
                <div key={req.id} className="p-6 rounded-3xl border border-slate-100 bg-white hover:border-blue-200 transition-all group">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-blue-600 group-hover:bg-blue-50 transition-colors">
                          <FileText size={24} />
                       </div>
                       <div>
                          <h4 className="text-lg font-black text-slate-900 tracking-tight">{req.subject}</h4>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{req.team} • {req.date}</p>
                       </div>
                    </div>
                    <div className="flex items-center gap-2">
                       <span className={cn("px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border", 
                         req.priority === 'High' ? "bg-rose-50 text-rose-600 border-rose-100" : "bg-slate-50 text-slate-500 border-slate-100"
                       )}>
                          {req.priority} Priority
                       </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => handleApprove(req.id)}
                      className="flex-1 py-3 bg-emerald-600 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/10"
                    >
                      <CheckCircle2 size={16} />
                      Approve
                    </button>
                    <button 
                      onClick={() => handleReject(req.id)}
                      className="flex-1 py-3 bg-white border border-slate-200 text-rose-600 text-xs font-black uppercase tracking-widest rounded-xl hover:bg-rose-50 transition-all flex items-center justify-center gap-2"
                    >
                      <XCircle size={16} />
                      Reject
                    </button>
                    <button className="p-3 bg-slate-50 text-slate-400 hover:text-blue-600 rounded-xl transition-all">
                      <MessageSquare size={20} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

        <div className="space-y-8">
           <SectionCard title="Team Velocity" subtitle="Average review cycle">
              <div className="flex items-end gap-2 mb-6">
                 <span className="text-3xl font-black text-slate-900 tracking-tighter">1.8d</span>
                 <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full mb-1">On Track</span>
              </div>
              <div className="space-y-4">
                 <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 w-4/5 rounded-full"></div>
                 </div>
                 <p className="text-[10px] font-bold text-slate-400 leading-relaxed italic">
                    Fast feedback loops improve project success by 40%. Keep up the velocity!
                 </p>
              </div>
           </SectionCard>
        </div>
      </div>
    </div>
  );
};

export default MentorReviewRequests;
