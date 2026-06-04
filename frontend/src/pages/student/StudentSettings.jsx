import React, { useEffect, useState } from 'react';
import { 
  User, 
  Mail,
  Camera,
  Loader2,
  RotateCcw,
  Save,
  Phone,
  Bookmark,
  Hash,
  Activity,
  Layers,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { 
  PageHeader, 
  SectionCard,
  StatusBadge
} from '../../components/common/PremiumComponents';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';
import api from '../../lib/api';

const academicYears = ["2026-27", "2027-28", "2028-29"];

const emptyProfile = {
  full_name: '',
  roll_number: '',
  branch: '',
  semester: 5,
  section: '1',
  subsection: '1',
  university_email: '',
  academic_year: '2026-27',
  mobile_number: '',
  profile_image: '',
  is_active: true
};

const StudentSettings = () => {
  const { user, updateUser } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState(emptyProfile);
  const [savedProfile, setSavedProfile] = useState(emptyProfile);

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get('/student/profile');
      if (data && data.student) {
        const studentData = {
          ...emptyProfile,
          ...data.student,
          semester: data.student.semester || 5,
          section: String(data.student.section || '1'),
          subsection: String(data.student.subsection || '1'),
          academic_year: academicYears.includes(data.student.academic_year) 
            ? data.student.academic_year 
            : '2026-27',
          profile_image: data.student.profile_image || ''
        };
        setProfile(studentData);
        setSavedProfile(studentData);
      }
    } catch (error) {
      console.error('Failed to load student profile:', error);
      toast.error(error.response?.data?.message || 'Failed to load profile from database');
    } finally {
      setIsLoading(false);
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
    toast.info('Form reset to last saved profile');
  };

  const handleSave = async () => {
    // Validations
    if (!profile.full_name || String(profile.full_name).trim() === '') {
      toast.error('Full name is required');
      return;
    }
    if (!profile.mobile_number || String(profile.mobile_number).trim() === '') {
      toast.error('Mobile number is required');
      return;
    }
    if (!profile.section || String(profile.section).trim() === '') {
      toast.error('Section is required');
      return;
    }
    if (!profile.subsection || String(profile.subsection).trim() === '') {
      toast.error('Subsection is required');
      return;
    }

    if (!academicYears.includes(profile.academic_year)) {
      toast.error('Invalid academic year. Please choose from the dropdown options.');
      return;
    }

    setIsSaving(true);
    try {
      const { data } = await api.put('/student/profile/update', {
        full_name: profile.full_name,
        semester: Number(profile.semester),
        section: profile.section,
        subsection: profile.subsection,
        academic_year: profile.academic_year,
        mobile_number: profile.mobile_number,
        profile_image: profile.profile_image
      });

      if (data && data.student) {
        const studentData = {
          ...emptyProfile,
          ...data.student,
          semester: data.student.semester || 5,
          section: String(data.student.section || '1'),
          subsection: String(data.student.subsection || '1'),
          academic_year: data.student.academic_year,
          profile_image: data.student.profile_image || ''
        };
        
        setProfile(studentData);
        setSavedProfile(studentData);

        // Update local auth context
        if (user) {
          const updatedUser = {
            ...user,
            full_name: studentData.full_name,
            name: studentData.full_name,
            profile_photo: studentData.profile_image
          };
          updateUser(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }

        // Trigger global event to refresh dashboard
        window.dispatchEvent(new CustomEvent('profile-updated'));

        toast.success(data.message || 'Profile saved successfully in database');
      }
    } catch (error) {
      console.error('Failed to save profile:', error);
      toast.error(error.response?.data?.message || 'Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <PageHeader 
        title="Academic Profile" 
        description="Manage your verified profile details, section allocation, and contact information."
        actions={
          <button 
            onClick={handleSave}
            disabled={isSaving || isLoading}
            className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-3 rounded-xl flex items-center justify-center gap-2 font-semibold shadow-md transition-all active:scale-95 disabled:opacity-50"
          >
            {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        }
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-slate-800" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Visual Profile Card */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 shadow-subtle p-6 flex flex-col items-center text-center group">
              <div className="relative mb-5">
                <div className="w-28 h-28 bg-slate-100 border border-slate-200 rounded-full flex items-center justify-center text-slate-700 text-4xl font-extrabold shadow-inner overflow-hidden">
                  {profile.profile_image ? (
                    <img 
                      src={profile.profile_image} 
                      alt="Student Profile" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '';
                      }}
                    />
                  ) : (
                    (profile.full_name || 'S')[0].toUpperCase()
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 p-2 bg-white border border-slate-200 rounded-lg shadow-sm text-slate-500">
                  <User size={16} />
                </div>
              </div>

              <h3 className="text-lg font-bold text-slate-900">{profile.full_name || 'Student Profile'}</h3>
              <p className="text-slate-500 text-xs mt-1 font-medium">{profile.university_email}</p>
              
              <div className="mt-4 inline-flex items-center gap-2">
                <StatusBadge 
                  status={profile.is_active ? "Active Student" : "Inactive Account"} 
                  variant={profile.is_active ? "success" : "error"} 
                />
              </div>

              <div className="w-full mt-6 pt-6 border-t border-slate-100 grid grid-cols-2 gap-4 text-left text-xs">
                <div>
                  <p className="text-slate-400 font-bold uppercase tracking-wider">Roll Number</p>
                  <p className="text-slate-700 font-semibold mt-1">{profile.roll_number || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-bold uppercase tracking-wider">Branch</p>
                  <p className="text-slate-700 font-semibold mt-1">{profile.branch || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Editable Profile Sections */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Section 1: Personal Information */}
            <SectionCard title="1. Personal Information" subtitle="Basic identity settings">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <User size={14} /> Full Name
                  </label>
                  <input 
                    value={profile.full_name} 
                    onChange={(e) => handleFieldChange('full_name', e.target.value)} 
                    type="text" 
                    placeholder="Enter full name"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all font-medium text-sm" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Camera size={14} /> Profile Image URL
                  </label>
                  <input 
                    value={profile.profile_image} 
                    onChange={(e) => handleFieldChange('profile_image', e.target.value)} 
                    type="text" 
                    placeholder="Enter image URL"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all font-medium text-sm" 
                  />
                </div>
              </div>
            </SectionCard>

            {/* Section 2: Academic Information */}
            <SectionCard title="2. Academic Information" subtitle="Verification details, batch status, and section mapping">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Hash size={14} /> Roll Number
                  </label>
                  <input 
                    disabled 
                    value={profile.roll_number} 
                    type="text" 
                    className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 font-medium text-sm cursor-not-allowed" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Layers size={14} /> Branch
                  </label>
                  <input 
                    disabled 
                    value={profile.branch} 
                    type="text" 
                    className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 font-medium text-sm cursor-not-allowed" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Bookmark size={14} /> Academic Year
                  </label>
                  <select 
                    value={profile.academic_year} 
                    onChange={(e) => handleFieldChange('academic_year', e.target.value)} 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all font-medium text-sm"
                  >
                    {academicYears.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Layers size={14} /> Semester
                  </label>
                  <select 
                    value={profile.semester} 
                    onChange={(e) => handleFieldChange('semester', e.target.value)} 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all font-medium text-sm"
                  >
                    {[5, 6, 7, 8].map(semester => (
                      <option key={semester} value={semester}>Semester {semester}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    Section
                  </label>
                  <select 
                    value={profile.section} 
                    onChange={(e) => handleFieldChange('section', e.target.value)} 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all font-medium text-sm"
                  >
                    {['1', '2', '3', '4', '5', '6'].map(sec => (
                      <option key={sec} value={sec}>Section {sec}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    Subsection
                  </label>
                  <select 
                    value={profile.subsection} 
                    onChange={(e) => handleFieldChange('subsection', e.target.value)} 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all font-medium text-sm"
                  >
                    {['1', '2'].map(subsec => (
                      <option key={subsec} value={subsec}>Subsection {subsec}</option>
                    ))}
                  </select>
                </div>
              </div>
            </SectionCard>

            {/* Section 3: Contact Information */}
            <SectionCard title="3. Contact Information" subtitle="How you can be reached">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Phone size={14} /> Mobile Number
                  </label>
                  <input 
                    value={profile.mobile_number} 
                    onChange={(e) => handleFieldChange('mobile_number', e.target.value)} 
                    type="text" 
                    placeholder="Enter mobile number"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all font-medium text-sm" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Mail size={14} /> University Email
                  </label>
                  <input 
                    disabled 
                    value={profile.university_email} 
                    type="email" 
                    className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 font-medium text-sm cursor-not-allowed" 
                  />
                </div>
              </div>
            </SectionCard>

            {/* Section 4: Account Information */}
            <SectionCard title="4. Account Information" subtitle="Current status of the profile on ProjectFlow">
              <div className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                    <CheckCircle2 size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">PostgreSQL Verified Status</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Your profile is synchronized in real time with the PostgreSQL database.</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
                  <span className="text-xs font-bold text-slate-700">Verified</span>
                </div>
              </div>
            </SectionCard>

            {/* Form Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-slate-100">
              <button 
                type="button" 
                onClick={handleReset} 
                disabled={isSaving} 
                className="px-6 py-3 rounded-lg border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <RotateCcw size={16} />
                Reset Form
              </button>
              <button 
                type="button" 
                onClick={handleSave} 
                disabled={isSaving} 
                className="px-6 py-3 rounded-lg bg-slate-900 text-white font-semibold text-sm hover:bg-slate-800 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentSettings;
