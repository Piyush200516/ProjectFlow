import React, { useState } from 'react';
import { ShieldCheck, CheckCircle2, XCircle, Search, Clock } from 'lucide-react';
import { PageHeader, SectionCard, StatusBadge } from '../../components/common/PremiumComponents';
import { toast } from 'sonner';

const HodApprovals = () => {
  const [approvals, setApprovals] = useState([
    { id: 1, title: 'Autonomous Drone Swarm', lead: 'Piyush Mishra', type: 'Major Project', date: '1d ago', status: 'Pending' },
    { id: 2, title: 'Agri-Tech IoT v2', lead: 'Ananya Sharma', type: 'Mini Project', date: '2d ago', status: 'Pending' },
  ]);

  const handleAction = (id, type) => {
    setApprovals(approvals.filter(a => a.id !== id));
    toast.success(`Project ${type} successfully!`);
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <PageHeader title="Administrative Approvals" description="Review and authorize project registrations and milestone completion." />
      <div className="grid grid-cols-1 gap-6">
        <SectionCard title="Pending Authorizations" subtitle="Requests requiring HOD signature">
          <div className="space-y-4">
            {approvals.map((item) => (
              <div key={item.id} className="p-6 rounded-3xl border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6 hover:border-blue-200 transition-all">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                      <ShieldCheck size={24} />
                   </div>
                   <div>
                      <h4 className="text-lg font-black text-slate-900 tracking-tight">{item.title}</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.lead} • {item.type}</p>
                   </div>
                </div>
                <div className="flex items-center gap-3">
                   <button onClick={() => handleAction(item.id, 'Approved')} className="px-6 py-3 bg-emerald-600 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/10">Approve</button>
                   <button onClick={() => handleAction(item.id, 'Rejected')} className="px-6 py-3 bg-white border border-slate-200 text-rose-600 text-xs font-black uppercase tracking-widest rounded-xl hover:bg-rose-50 transition-all">Reject</button>
                </div>
              </div>
            ))}
            {approvals.length === 0 && <p className="text-center py-10 text-slate-400 font-bold">No pending approvals.</p>}
          </div>
        </SectionCard>
      </div>
    </div>
  );
};

export default HodApprovals;
