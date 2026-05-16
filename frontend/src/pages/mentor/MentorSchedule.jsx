import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  Plus, 
  ChevronLeft, 
  ChevronRight,
  MoreVertical,
  Users,
  Video,
  MapPin
} from 'lucide-react';
import { 
  PageHeader, 
  SectionCard,
  StatusBadge 
} from '../../components/common/PremiumComponents';
import { toast } from 'sonner';

const MentorSchedule = () => {
  const [meetings] = useState([
    { id: 1, team: 'Quantum Team', topic: 'Architecture Deep-Dive', date: 'Today, 2:00 PM', type: 'Virtual', status: 'Upcoming' },
    { id: 2, team: 'Health AI', topic: 'Weekly Sync', date: 'Tomorrow, 11:00 AM', type: 'Office', status: 'Scheduled' },
  ]);

  const handleAdd = () => {
    toast.success('Meeting scheduling form opened! (Dummy)');
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <PageHeader 
        title="Session Scheduler" 
        description="Coordinate meetings and review sessions with your student teams."
        actions={
          <button 
            onClick={handleAdd}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl flex items-center gap-2 font-black shadow-xl shadow-blue-600/20 transition-all active:scale-95"
          >
            <Plus size={20} />
            New Meeting
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
        {/* Calendar View Placeholder */}
        <div className="lg:col-span-3 space-y-6">
          <SectionCard title="Active Schedule" subtitle="Synchronized with your institutional calendar">
            <div className="space-y-4 mt-6">
              {meetings.map((m) => (
                <div key={m.id} className="group flex flex-col md:flex-row items-center gap-6 p-6 rounded-3xl border border-slate-100 bg-white hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/5 transition-all">
                  <div className="w-full md:w-40 flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50 border border-slate-100 group-hover:bg-blue-50 transition-colors">
                     <Calendar className="text-blue-600 mb-2" size={24} />
                     <p className="text-sm font-black text-slate-800">{m.date.split(',')[0]}</p>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{m.date.split(',')[1]}</p>
                  </div>
                  
                  <div className="flex-1 text-center md:text-left">
                     <h4 className="text-lg font-black text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors">{m.topic}</h4>
                     <p className="text-sm font-bold text-slate-500 mt-1 flex items-center justify-center md:justify-start gap-2">
                        <Users size={14} />
                        {m.team}
                     </p>
                  </div>

                  <div className="flex items-center gap-6">
                     <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 border border-slate-100 text-slate-600">
                        {m.type === 'Virtual' ? <Video size={16} /> : <MapPin size={16} />}
                        <span className="text-[10px] font-black uppercase tracking-widest">{m.type}</span>
                     </div>
                     <StatusBadge 
                       status={m.status} 
                       variant={m.status === 'Upcoming' ? 'info' : 'default'} 
                     />
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

        {/* Side Panel */}
        <div className="space-y-8">
           <SectionCard title="Weekly Stats" subtitle="Your mentoring bandwidth">
              <div className="space-y-4">
                 <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100">
                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Total Hours</p>
                    <p className="text-2xl font-black text-blue-700">12.5h</p>
                 </div>
                 <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
                    <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Teams Met</p>
                    <p className="text-2xl font-black text-emerald-700">8/12</p>
                 </div>
              </div>
           </SectionCard>
        </div>
      </div>
    </div>
  );
};

export default MentorSchedule;
