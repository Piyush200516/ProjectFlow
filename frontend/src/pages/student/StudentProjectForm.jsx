import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Users, 
  Info, 
  Layers, 
  Send, 
  Calendar,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Plus,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { PageHeader, SectionCard, StatusBadge } from '../../components/common/PremiumComponents';

const StudentProjectForm = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeForms, setActiveForms] = useState([]);
  const [selectedForm, setSelectedForm] = useState(null);
  const selectedFormIdRef = useRef(null);
  const [studentProfile, setStudentProfile] = useState(null);
  const [activeStatus, setActiveStatus] = useState({ hasActive: false, type: null, details: null });
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    domain: '',
    tech_stack: '',
    github_link: '',
  });
  
  // Member array
  const [members, setMembers] = useState([]);
  const [memberErrors, setMemberErrors] = useState({});
  
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchStudentProfile();
    fetchActiveForms();
    const interval = window.setInterval(fetchActiveForms, 60000);
    return () => window.clearInterval(interval);
  }, []);

  const fetchStudentProfile = async () => {
    try {
      const res = await api.get('/student/profile');
      setStudentProfile(res.data?.student || null);
    } catch (error) {
      console.error('Failed to fetch student profile:', error);
      toast.error('Failed to load your academic profile');
    }
  };

  const fetchActiveForms = async () => {
    try {
      // Check if student already has a project or pending submission
      try {
        const statusRes = await api.get('/workflow/student/active-status');
        setActiveStatus(statusRes.data);
      } catch (e) {
        // Ignored for now if workflow endpoint is missing
      }

      const res = await api.get('/student/registration-forms/active');
      console.log("Forms response:", res.data);
      const forms = res.data?.forms || [];
      console.log("Loaded active forms:", forms);
      setActiveForms(forms);
      if (forms.length > 0) {
        const currentForm = forms.find((form) => String(form.id) === String(selectedFormIdRef.current));
        if (selectedFormIdRef.current && currentForm) {
          setSelectedForm(currentForm);
        } else {
          handleSelectForm(forms[0]);
        }
      } else {
        selectedFormIdRef.current = null;
        setSelectedForm(null);
      }
    } catch (error) {
      console.error('Failed to fetch active forms:', error);
      toast.error('Failed to load active project registration forms');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectForm = (form) => {
    selectedFormIdRef.current = form.id;
    setSelectedForm(form);
    setFormData({
      title: '',
      description: '',
      domain: '',
      tech_stack: '',
      github_link: ''
    });
    // Initialize required minimum members minus leader
    const initialMembers = [];
    const minOthers = Math.max(0, (form.team_size_min || 1) - 1);
    for(let i=0; i<minOthers; i++){
      initialMembers.push(createEmptyMember());
    }
    setMembers(initialMembers);
    setMemberErrors({});
  };

  const createEmptyMember = () => ({
    name: '',
    email: '',
    roll_number: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleMemberChange = (index, field, value) => {
    const updated = [...members];
    updated[index][field] = value;
    setMembers(updated);
    setMemberErrors(prev => {
      if (!prev[index]?.[field]) return prev;
      const next = { ...prev, [index]: { ...prev[index], [field]: '' } };
      if (Object.values(next[index]).every(error => !error)) {
        delete next[index];
      }
      return next;
    });
  };

  const addMember = () => {
    if (selectedForm && members.length + 1 >= selectedForm.team_size_max) {
      toast.error(`Maximum team size is ${selectedForm.team_size_max}`);
      return;
    }
    setMembers([...members, createEmptyMember()]);
  };

  const removeMember = (index) => {
    if (selectedForm && members.length + 1 <= selectedForm.team_size_min) {
      toast.error(`Minimum team size is ${selectedForm.team_size_min}`);
      return;
    }
    const updated = [...members];
    updated.splice(index, 1);
    setMembers(updated);
    setMemberErrors({});
  };

  const normalizeEmail = (email) => String(email || '').trim().toLowerCase();
  const normalizeRollNumber = (rollNumber) => String(rollNumber || '').trim().toUpperCase();

  const validateTeamDuplicates = () => {
    const errors = {};
    const leaderEmail = normalizeEmail(studentProfile?.email || user?.email);
    const leaderRollNumber = normalizeRollNumber(studentProfile?.roll_number);
    const memberEmails = members.map((member) => normalizeEmail(member.email));
    const memberRollNumbers = members.map((member) => normalizeRollNumber(member.roll_number));

    const emails = [leaderEmail, ...memberEmails].filter(Boolean);
    const uniqueEmails = new Set(emails);
    const rollNumbers = [leaderRollNumber, ...memberRollNumbers].filter(Boolean);
    const uniqueRollNumbers = new Set(rollNumbers);

    if (emails.length !== uniqueEmails.size) {
      const emailCounts = emails.reduce((counts, email) => {
        counts[email] = (counts[email] || 0) + 1;
        return counts;
      }, {});

      memberEmails.forEach((email, index) => {
        if (!email || emailCounts[email] <= 1) return;
        errors[index] = {
          ...(errors[index] || {}),
          email: 'This email is already used in team'
        };
      });
    }

    if (rollNumbers.length !== uniqueRollNumbers.size) {
      const rollCounts = rollNumbers.reduce((counts, rollNumber) => {
        counts[rollNumber] = (counts[rollNumber] || 0) + 1;
        return counts;
      }, {});

      memberRollNumbers.forEach((rollNumber, index) => {
        if (!rollNumber || rollCounts[rollNumber] <= 1) return;
        errors[index] = {
          ...(errors[index] || {}),
          roll_number: 'This roll number is already used in team'
        };
      });
    }

    setMemberErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.domain || !formData.description) {
      toast.error('Project Title, Domain, and Problem Statement are required.');
      return;
    }

    const normalizedMembers = members.map((member) => ({
      name: member.name.trim(),
      email: normalizeEmail(member.email),
      roll_number: normalizeRollNumber(member.roll_number)
    }));
    const submittedMembers = normalizedMembers
      .map((member, index) => ({ ...member, originalIndex: index }))
      .filter((member) => member.name || member.email || member.roll_number);

    if (!validateTeamDuplicates()) {
      toast.error('Duplicate team member details found');
      return;
    }

    // Validate members
    for (let i = 0; i < submittedMembers.length; i++) {
      const m = submittedMembers[i];
      if (!m.name || !m.email || !m.roll_number) {
        toast.error(`Please fill all details for Member ${m.originalIndex + 2}`);
        return;
      }
    }

    setSubmitting(true);
    try {
      await api.post(`/student/registration-forms/${selectedForm.id}/submit`, {
        project_title: formData.title,
        project_type: selectedForm.project_type,
        project_domain: formData.domain,
        problem_statement: formData.description,
        abstract: formData.description,
        tech_stack: formData.tech_stack,
        github_link: formData.github_link,
        team_members: submittedMembers.map(({ originalIndex, ...member }) => member)
      });

      toast.success('Project registration submitted successfully');
      
      // Update UI
      fetchActiveForms();
      setSelectedForm(prev => ({...prev, has_submitted: true}));
      navigate('/student/dashboard', { replace: true });
    } catch (error) {
      const status = error.response?.status;
      const message = error.response?.data?.message || error.message || 'Failed to submit registration form.';
      console.error('Registration failed:', {
        status,
        message,
        response: error.response?.data,
        payload: {
          formId: selectedForm.id,
          project_title: formData.title,
          project_domain: formData.domain,
          team_member_count: submittedMembers.length,
        },
      });
      toast.error(status ? `${message} (${status})` : message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-slate-900" />
      </div>
    );
  }

  if (activeStatus.hasActive) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <PageHeader 
          title="Project Registration" 
          description="Fill and submit active academic project registration forms sent by your HOD."
        />
        
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center max-w-2xl mx-auto flex flex-col items-center justify-center space-y-6">
          <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center border border-slate-100 relative">
            <Users size={32} />
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center text-xs font-bold shadow animate-pulse">!</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 font-black">You are already working on an active project.</h2>
            <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
              Under ProjectFlow Edu academic rules, students are strictly limited to exactly one active project and team enrollment at a time.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader 
        title="Project Registration" 
        description="Fill and submit active academic project registration forms published by your HOD."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Form Selector */}
        <div className="space-y-6 lg:col-span-1">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Active Registration Forms</h3>
          {activeForms.length === 0 ? (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center text-slate-500 text-sm">
              <Info className="mx-auto mb-2 text-slate-400" size={20} />
              No active registration forms available for your branch/section.
            </div>
          ) : (
            activeForms.map((form) => (
              <div 
                key={form.id}
                onClick={() => handleSelectForm(form)}
                className={`p-5 rounded-xl border cursor-pointer transition-all duration-200 ${
                  selectedForm?.id === form.id 
                    ? 'bg-blue-600 border-blue-600 text-white shadow-md' 
                    : 'bg-white border-slate-200 text-slate-900 hover:border-slate-300 hover:bg-slate-50/50'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${
                    selectedForm?.id === form.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {form.project_type}
                  </span>
                  {form.has_submitted && (
                    <StatusBadge status="Registered" variant="success" />
                  )}
                </div>
                <h4 className="font-bold text-sm leading-snug">{form.title}</h4>
                <p className={`text-xs mt-2 flex items-center gap-1.5 ${selectedForm?.id === form.id ? 'text-blue-100' : 'text-slate-500'}`}>
                  <Calendar size={12} />
                  Deadline: {new Date(form.deadline).toLocaleDateString()}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Right Side: Form Content */}
        <div className="lg:col-span-2">
          {selectedForm ? (
            <SectionCard 
              title={selectedForm.title} 
              subtitle={`Digitized Registration Form for ${selectedForm.project_type} • Branch: ${selectedForm.branch}`}
            >
              {selectedForm.has_submitted ? (
                <div className="flex flex-col items-center justify-center text-center py-10 space-y-4">
                  <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center border border-emerald-100 shadow-sm">
                    <CheckCircle2 size={32} />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-slate-900">Form Already Submitted</h3>
                    <p className="text-sm text-slate-500 max-w-sm">
                      Your team details and project proposal have been successfully sent to the HOD.
                    </p>
                  </div>
                  <div className="bg-slate-50 px-4 py-2.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600">
                    Status: Pending Review
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-8">
                  
                  {/* Instructions if any */}
                  {selectedForm.instructions && (
                    <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
                      <Info size={16} className="text-blue-600 mt-0.5 shrink-0" />
                      <div className="text-sm text-blue-900">
                        <strong>HOD Instructions:</strong> {selectedForm.instructions}
                      </div>
                    </div>
                  )}

                  {/* Part 1: Project Details */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">1. Project Details</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">Project Title <span className="text-rose-500">*</span></label>
                        <input 
                          type="text" 
                          name="title"
                          value={formData.title}
                          onChange={handleInputChange}
                          placeholder="e.g. Smart Campus Navigation"
                          className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">Project Domain <span className="text-rose-500">*</span></label>
                        <input 
                          type="text" 
                          name="domain"
                          value={formData.domain}
                          onChange={handleInputChange}
                          placeholder="e.g. Web / ML / IoT"
                          className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Problem Statement & Abstract <span className="text-rose-500">*</span></label>
                      <textarea 
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows="3"
                        placeholder="Brief summary of the goals, target users, and abstract..."
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
                        required
                      ></textarea>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">Technology Stack</label>
                        <input 
                          type="text" 
                          name="tech_stack"
                          value={formData.tech_stack}
                          onChange={handleInputChange}
                          placeholder="e.g. React, Node.js, Postgres"
                          className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                          GitHub Link (Optional)
                        </label>
                        <input 
                          type="url" 
                          name="github_link"
                          value={formData.github_link}
                          onChange={handleInputChange}
                          placeholder="https://github.com/..."
                          className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Part 2: Team Members */}
                  <div className="space-y-4">
                    <div className="border-b border-slate-100 pb-2 flex justify-between items-center">
                      <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">2. Team Details</h3>
                      <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 uppercase">
                        <Users size={12} />
                        Min: {selectedForm.team_size_min} | Max: {selectedForm.team_size_max}
                      </div>
                    </div>

                    <div className="flex items-start gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs font-semibold text-blue-900">
                      <Info size={16} className="mt-0.5 shrink-0" />
                      <span>All team members must belong to your same branch, year, semester, section and subsection.</span>
                    </div>

                    {/* Team Leader (Auto-filled) */}
                    <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
                      <h4 className="text-xs font-bold text-blue-900 mb-3 flex items-center justify-between">
                        Team Leader (Student 1) 
                        <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded">Auto-filled</span>
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Name</label>
                          <div className="text-sm font-semibold text-slate-800">{studentProfile?.full_name || user?.full_name || 'Loading...'}</div>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Email</label>
                          <div className="text-sm font-semibold text-slate-800 break-words">{studentProfile?.email || user?.email || 'Loading...'}</div>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Roll Number</label>
                          <div className="text-sm font-semibold text-slate-800">{studentProfile?.roll_number || 'Loading...'}</div>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Branch</label>
                          <div className="text-sm font-semibold text-slate-800">{studentProfile?.branch_name || studentProfile?.branch_id || 'Loading...'}</div>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Academic Year</label>
                          <div className="text-sm font-semibold text-slate-800">{studentProfile?.academic_year || 'Loading...'}</div>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Semester</label>
                          <div className="text-sm font-semibold text-slate-800">{studentProfile?.semester || 'Loading...'}</div>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Section</label>
                          <div className="text-sm font-semibold text-slate-800">{studentProfile?.section || 'Loading...'}</div>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Subsection</label>
                          <div className="text-sm font-semibold text-slate-800">{studentProfile?.subsection || 'All'}</div>
                        </div>
                      </div>
                    </div>

                    {/* Team Members List */}
                    {members.map((member, index) => (
                      <div key={index} className="p-4 bg-slate-50 border border-slate-200 rounded-xl relative">
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="text-xs font-bold text-slate-900">Member {index + 2}</h4>
                          {members.length + 1 > selectedForm.team_size_min && (
                            <button type="button" onClick={() => removeMember(index)} className="text-rose-500 hover:bg-rose-50 p-1 rounded transition-colors">
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Full Name <span className="text-rose-500">*</span></label>
                            <input 
                              type="text" 
                              value={member.name}
                              onChange={(e) => handleMemberChange(index, 'name', e.target.value)}
                              className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-sm"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Email <span className="text-rose-500">*</span></label>
                            <input 
                              type="email" 
                              value={member.email}
                              onChange={(e) => handleMemberChange(index, 'email', e.target.value)}
                              className={`w-full px-2 py-1.5 bg-white border rounded-lg text-sm ${memberErrors[index]?.email ? 'border-rose-300' : 'border-slate-200'}`}
                            />
                            {memberErrors[index]?.email && (
                              <p className="text-[11px] font-semibold text-rose-600">{memberErrors[index].email}</p>
                            )}
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Roll Number <span className="text-rose-500">*</span></label>
                            <input 
                              type="text" 
                              value={member.roll_number}
                              onChange={(e) => handleMemberChange(index, 'roll_number', e.target.value)}
                              className={`w-full px-2 py-1.5 bg-white border rounded-lg text-sm ${memberErrors[index]?.roll_number ? 'border-rose-300' : 'border-slate-200'}`}
                            />
                            {memberErrors[index]?.roll_number && (
                              <p className="text-[11px] font-semibold text-rose-600">{memberErrors[index].roll_number}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}

                    {members.length + 1 < selectedForm.team_size_max && (
                      <button 
                        type="button" 
                        onClick={addMember}
                        className="w-full py-2 border-2 border-dashed border-slate-200 text-slate-500 rounded-xl hover:bg-slate-50 hover:text-blue-600 transition-colors flex items-center justify-center gap-2 text-sm font-semibold"
                      >
                        <Plus size={16} /> Add Team Member
                      </button>
                    )}
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex justify-end">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-bold rounded-xl transition-all shadow-md active:scale-95 shrink-0"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" /> Processing...
                        </>
                      ) : (
                        <>
                          <Send size={18} /> Submit Registration
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </SectionCard>
          ) : (
            <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-12 text-center text-slate-500">
              <Layers className="mx-auto mb-4 text-slate-400" size={32} />
              Please select a project registration form from the list to start your submission.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentProjectForm;
