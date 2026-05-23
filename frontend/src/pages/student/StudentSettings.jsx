import React, { useEffect, useState } from 'react';
import { 
  User, 
  Bell, 
  Shield, 
  Globe, 
  Mail,
  Camera,
  Loader2,
  RotateCcw,
  Save
} from 'lucide-react';
import { 
  PageHeader, 
  SectionCard 
} from '../../components/common/PremiumComponents';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';
import { cn } from '../../utils/utils';
import api from '../../lib/api';

const branchOptions = [
  { id: 1, name: 'Computer Science & Engineering' },
  { id: 2, name: 'Electronics & Communication Engineering' },
];

const generateAcademicYears = () => {
  const date = new Date();
  const currentYear = date.getFullYear();
  const currentMonth = date.getMonth();
  const currentAcademicStartYear = currentMonth < 6 ? currentYear - 1 : currentYear;

  return Array.from({ length: 5 }, (_, index) => {
    const start = currentAcademicStartYear - 1 + index;
    return `${start}-${String(start + 1).slice(-2)}`;
  });
};

const emptyProfile = {
  full_name: '',
  email: '',
  roll_number: '',
  branch_id: 1,
  academic_year: generateAcademicYears()[1],
  semester: 1,
  section: '1',
  subsection: '1',
  profile_locked: false,
  profile_updated_at: null,
};

const StudentSettings = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState(emptyProfile);
  const [savedProfile, setSavedProfile] = useState(emptyProfile);
  const academicYears = generateAcademicYears();

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'display', label: 'Display & Language', icon: Globe },
  ];

  const fetchProfile = async () => {
    setIsLoadingProfile(true);
    try {
      const { data } = await api.get('/student/profile');
      const nextProfile = {
        ...emptyProfile,
        ...data.student,
        branch_id: data.student?.branch_id || 1,
        semester: data.student?.semester || 1,
        section: data.student?.section || '1',
        subsection: data.student?.subsection || '1',
      };
      setProfile(nextProfile);
      setSavedProfile(nextProfile);
    } catch (error) {
      console.error('Failed to load student profile:', error);
      toast.error(error.response?.data?.message || 'Failed to load profile');
    } finally {
      setIsLoadingProfile(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleFieldChange = (field, value) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleReset = () => {
    setProfile(savedProfile);
    toast.info('Profile form reset');
  };

  const handleSave = async () => {
    if (activeTab !== 'profile') return;
    const requiredFields = ['full_name', 'email', 'roll_number', 'branch_id', 'academic_year', 'semester', 'section', 'subsection'];
    const missing = requiredFields.find(field => !String(profile[field] || '').trim());
    if (missing) {
      toast.error('Please fill all required profile fields');
      return;
    }

    setIsSaving(true);
    try {
      const { data } = await api.put('/student/profile', {
        semester: Number(profile.semester),
      });
      const nextProfile = { ...emptyProfile, ...data.student };
      setProfile(nextProfile);
      setSavedProfile(nextProfile);
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        localStorage.setItem('user', JSON.stringify({
          ...parsedUser,
          full_name: data.student.full_name,
          name: data.student.full_name,
          email: data.student.email,
        }));
      }
      toast.success(data.message || 'Semester updated successfully');
    } catch (error) {
      console.error('Failed to save profile:', error);
      toast.error(error.response?.data?.message || 'Failed to save profile');
    } finally {
      setIsSaving(false);
    }
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
            {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
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
              <SectionCard title="Academic Profile" subtitle="Update the details used for HOD form visibility and notifications">
                <div className="flex flex-col md:flex-row items-center gap-8 mb-10 pb-8 border-b border-slate-50">
                  <div className="relative group">
                    <div className="w-24 h-24 bg-blue-100 rounded-3xl flex items-center justify-center text-blue-700 text-3xl font-black shadow-lg">
                      {(profile.full_name || user?.full_name || user?.name || 'S')?.[0]?.toUpperCase()}
                    </div>
                    <button className="absolute -bottom-2 -right-2 p-2 bg-white border border-slate-200 rounded-xl shadow-lg text-slate-500 hover:text-blue-600 transition-all">
                      <Camera size={16} />
                    </button>
                  </div>
                  <div className="text-center md:text-left">
                    <h3 className="text-xl font-black text-slate-900">{profile.full_name || user?.full_name || user?.name}</h3>
                    <p className="text-slate-500 text-sm">{profile.email || user?.email}</p>
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-2 px-2 py-0.5 bg-blue-50 rounded-full inline-block">
                      Verified Student
                    </p>
                  </div>
                </div>

                {isLoadingProfile ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  </div>
                ) : (
                  <div className="space-y-8">
                    <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm font-semibold text-blue-900">
                      Only Semester can be updated from this page. Contact HOD/Admin for other profile corrections.
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Full Name</label>
                        <input disabled value={profile.full_name} onChange={(event) => handleFieldChange('full_name', event.target.value)} type="text" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all font-medium disabled:text-slate-400 disabled:cursor-not-allowed" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Email ID</label>
                        <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                          <input disabled value={profile.email} onChange={(event) => handleFieldChange('email', event.target.value)} type="email" className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all font-medium disabled:text-slate-400 disabled:cursor-not-allowed" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Roll Number</label>
                        <input disabled value={profile.roll_number} onChange={(event) => handleFieldChange('roll_number', event.target.value)} type="text" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all font-medium disabled:text-slate-400 disabled:cursor-not-allowed" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Branch</label>
                        <select disabled value={profile.branch_id} onChange={(event) => handleFieldChange('branch_id', event.target.value)} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all font-medium disabled:text-slate-400 disabled:cursor-not-allowed">
                          {branchOptions.map(branch => (
                            <option key={branch.id} value={branch.id}>{branch.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Academic Year</label>
                        <select disabled value={profile.academic_year} onChange={(event) => handleFieldChange('academic_year', event.target.value)} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all font-medium disabled:text-slate-400 disabled:cursor-not-allowed">
                          {academicYears.map(year => <option key={year} value={year}>{year}</option>)}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Semester</label>
                        <select value={profile.semester} onChange={(event) => handleFieldChange('semester', event.target.value)} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all font-medium">
                          {[1, 2, 3, 4, 5, 6, 7, 8].map(semester => <option key={semester} value={semester}>{semester}</option>)}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Section</label>
                        <select disabled value={profile.section} onChange={(event) => handleFieldChange('section', event.target.value)} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all font-medium disabled:text-slate-400 disabled:cursor-not-allowed">
                          {[1, 2, 3, 4, 5, 6].map(section => <option key={section} value={section}>{section}</option>)}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Subsection</label>
                        <select disabled value={profile.subsection} onChange={(event) => handleFieldChange('subsection', event.target.value)} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all font-medium disabled:text-slate-400 disabled:cursor-not-allowed">
                          {[1, 2].map(subsection => <option key={subsection} value={subsection}>{subsection}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-slate-100">
                      <button type="button" onClick={handleReset} disabled={isSaving} className="px-6 py-3 rounded-2xl border border-slate-200 text-slate-600 font-black text-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-2 disabled:opacity-60">
                        <RotateCcw size={16} />
                        Reset
                      </button>
                      <button type="button" onClick={handleSave} disabled={isSaving} className="px-6 py-3 rounded-2xl bg-blue-600 text-white font-black text-sm hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-60">
                        {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        Save Changes
                      </button>
                    </div>
                  </div>
                )}
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
