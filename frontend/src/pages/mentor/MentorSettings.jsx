import React, { useState } from 'react';
import { 
  User, 
  Bell, 
  Shield, 
  Globe, 
  Mail,
  Camera,
  Calendar,
  Briefcase
} from 'lucide-react';
import { 
  PageHeader, 
  SectionCard 
} from '../../components/common/PremiumComponents';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';
import { cn } from '../../utils/utils';

const MentorSettings = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [isSaving, setIsSaving] = useState(false);

  const tabs = [
    { id: 'profile', label: 'Mentor Profile', icon: User },
    { id: 'availability', label: 'Availability', icon: Calendar },
    { id: 'notifications', label: 'Alerts', icon: Bell },
    { id: 'security', label: 'Privacy', icon: Shield },
  ];

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast.success('Mentor preferences updated!');
    }, 1000);
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <PageHeader 
        title="Settings" 
        description="Customize your mentoring preferences and administrative controls."
        actions={
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-2xl flex items-center justify-center gap-2 font-black shadow-xl shadow-blue-600/20 transition-all active:scale-95 disabled:opacity-70"
          >
            {isSaving ? 'Updating...' : 'Save Settings'}
          </button>
        }
      />

      <div className="flex flex-col lg:flex-row gap-10">
        <div className="w-full lg:w-64 space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-bold text-sm",
                activeTab === tab.id 
                  ? "bg-white text-blue-600 shadow-sm border border-slate-200" 
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 max-w-3xl">
          {activeTab === 'profile' && (
            <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
              <SectionCard title="Professional Details" subtitle="Information visible to assigned student teams">
                <div className="flex flex-col md:flex-row items-center gap-8 mb-10 pb-8 border-b border-slate-50">
                  <div className="relative group">
                    <div className="w-24 h-24 bg-emerald-100 rounded-3xl flex items-center justify-center text-emerald-700 text-3xl font-black shadow-lg">
                      {user?.name?.[0]?.toUpperCase()}
                    </div>
                    <button className="absolute -bottom-2 -right-2 p-2 bg-white border border-slate-200 rounded-xl shadow-lg text-slate-500 hover:text-emerald-600 transition-all">
                      <Camera size={16} />
                    </button>
                  </div>
                  <div className="text-center md:text-left">
                    <h3 className="text-xl font-black text-slate-900">{user?.name}</h3>
                    <p className="text-slate-500 text-sm">{user?.email}</p>
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-2 px-2 py-0.5 bg-emerald-50 rounded-full inline-block">
                      Senior Academic Mentor
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Designation</label>
                    <input type="text" defaultValue="Assistant Professor" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-500 font-medium" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Specialization</label>
                    <input type="text" defaultValue="AI & Machine Learning" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-500 font-medium" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Office Location</label>
                    <input type="text" defaultValue="Department of CSE, Lab 402" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-500 font-medium" />
                  </div>
                </div>
              </SectionCard>
            </div>
          )}

          {activeTab === 'availability' && (
            <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
               <SectionCard title="Meeting Availability" subtitle="Set your default mentoring hours">
                  <div className="grid grid-cols-2 gap-4">
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => (
                      <div key={day} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
                        <span className="text-sm font-bold text-slate-700">{day}</span>
                        <span className="text-[10px] font-black text-blue-600">2:00 PM - 5:00 PM</span>
                      </div>
                    ))}
                  </div>
               </SectionCard>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MentorSettings;
