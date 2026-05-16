import React, { useState } from 'react';
import { 
  User, 
  Bell, 
  Shield, 
  Moon, 
  Globe, 
  Mail,
  Camera,
  Check
} from 'lucide-react';
import { 
  PageHeader, 
  SectionCard 
} from '../../components/common/PremiumComponents';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';
import { cn } from '../../utils/utils';

const StudentSettings = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [isSaving, setIsSaving] = useState(false);

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'display', label: 'Display & Language', icon: Globe },
  ];

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast.success('Settings updated successfully!');
    }, 1000);
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <PageHeader 
        title="Settings" 
        description="Manage your account preferences and system settings."
        actions={
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-2xl flex items-center justify-center gap-2 font-black shadow-xl shadow-blue-600/20 transition-all active:scale-95 disabled:opacity-70"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        }
      />

      <div className="flex flex-col lg:flex-row gap-10">
        {/* Sidebar Tabs */}
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

        {/* Content Area */}
        <div className="flex-1 max-w-3xl">
          {activeTab === 'profile' && (
            <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
              <SectionCard title="Profile Information" subtitle="Update your basic details and avatar">
                <div className="flex flex-col md:flex-row items-center gap-8 mb-10 pb-8 border-b border-slate-50">
                  <div className="relative group">
                    <div className="w-24 h-24 bg-blue-100 rounded-3xl flex items-center justify-center text-blue-700 text-3xl font-black shadow-lg">
                      {user?.name?.[0]?.toUpperCase()}
                    </div>
                    <button className="absolute -bottom-2 -right-2 p-2 bg-white border border-slate-200 rounded-xl shadow-lg text-slate-500 hover:text-blue-600 transition-all">
                      <Camera size={16} />
                    </button>
                  </div>
                  <div className="text-center md:text-left">
                    <h3 className="text-xl font-black text-slate-900">{user?.name}</h3>
                    <p className="text-slate-500 text-sm">{user?.email}</p>
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-2 px-2 py-0.5 bg-blue-50 rounded-full inline-block">
                      Verified Student
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Full Name</label>
                    <input type="text" defaultValue={user?.name} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all font-medium" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">University Email</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input type="email" defaultValue={user?.email} disabled className="w-full pl-12 pr-4 py-4 bg-slate-50/50 border border-slate-100 rounded-2xl text-slate-400 font-medium cursor-not-allowed" />
                    </div>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Bio / Statement</label>
                    <textarea rows="4" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all font-medium" placeholder="Briefly describe your academic focus..."></textarea>
                  </div>
                </div>
              </SectionCard>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
               <SectionCard title="Notification Preferences" subtitle="Control how you receive updates">
                  <div className="space-y-4">
                    {[
                      { title: 'Project Updates', desc: 'When a team member updates a task or milestone' },
                      { title: 'Mentor Feedback', desc: 'When a mentor provides feedback on your review request' },
                      { title: 'System Alerts', desc: 'Important platform updates and maintenance notices' },
                      { title: 'Deadline Reminders', desc: 'Get notified 24h before a task deadline' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
                        <div>
                          <p className="text-sm font-bold text-slate-800">{item.title}</p>
                          <p className="text-[10px] text-slate-500">{item.desc}</p>
                        </div>
                        <div className="w-12 h-6 bg-blue-600 rounded-full relative cursor-pointer">
                          <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div>
                        </div>
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

export default StudentSettings;
