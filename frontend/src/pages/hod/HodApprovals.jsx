import React, { useState, useEffect } from 'react';
import { ShieldCheck, CheckCircle2, XCircle, Search, Clock, Loader2 } from 'lucide-react';
import { PageHeader, SectionCard, StatusBadge } from '../../components/common/PremiumComponents';
import api from '../../lib/api';
import { toast } from 'sonner';

const HodApprovals = () => {
  const [loading, setLoading] = useState(true);
  const [approvals, setApprovals] = useState([]);

  useEffect(() => {
    const fetchApprovals = async () => {
      try {
        const { data } = await api.get('/hod/projects');
        // Filter for projects in 'Proposal' or 'Pending' status
        setApprovals(data.filter(p => p.status === 'Proposal' || p.status === 'Pending'));
      } catch (error) {
        console.error('Failed to fetch approvals:', error);
        toast.error('Failed to load pending authorizations');
      } finally {
        setLoading(false);
      }
    };
    fetchApprovals();
  }, []);

  const handleAction = async (id, action) => {
    try {
      // In a real app, this would call an API like PATCH /projects/:id/status
      toast.success(`Project ${action} successfully!`);
      setApprovals(prev => prev.filter(a => a.id !== id));
    } catch (error) {
      toast.error(`Failed to ${action} project`);
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
      <PageHeader title="Administrative Approvals" description="Review and authorize project registrations and milestone completion." />
      <div className="grid grid-cols-1 gap-6">
        <SectionCard title="Pending Authorizations" subtitle="Requests requiring HOD signature">
          <div className="space-y-4">
            {approvals.length > 0 ? approvals.map((item) => (
              <div key={item.id} className="p-6 rounded-3xl border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6 hover:border-blue-200 transition-all">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                      <ShieldCheck size={24} />
                   </div>
                   <div>
                      <h4 className="text-lg font-black text-slate-900 tracking-tight">{item.title}</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.mentor_name || 'Unassigned'} • {item.type}</p>
                   </div>
                </div>
                <div className="flex items-center gap-3">
                   <button onClick={() => handleAction(item.id, 'Approved')} className="px-6 py-3 bg-emerald-600 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/10">Approve</button>
                   <button onClick={() => handleAction(item.id, 'Rejected')} className="px-6 py-3 bg-white border border-slate-200 text-rose-600 text-xs font-black uppercase tracking-widest rounded-xl hover:bg-rose-50 transition-all">Reject</button>
                </div>
              </div>
            )) : (
              <div className="text-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                 <p className="text-slate-400 font-bold">No pending authorizations at this time.</p>
              </div>
            )}
          </div>
        </SectionCard>
      </div>
    </div>
  );
};

export default HodApprovals;
