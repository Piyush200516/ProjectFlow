import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Users, 
  Info, 
  Layers, 
  Send, 
  Calendar,
  AlertCircle,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../../lib/api';
import { PageHeader, SectionCard, StatusBadge } from '../../components/common/PremiumComponents';

const StudentProjectForm = () => {
  const [loading, setLoading] = useState(true);
  const [activeForms, setActiveForms] = useState([]);
  const [selectedForm, setSelectedForm] = useState(null);
  const [activeStatus, setActiveStatus] = useState({ hasActive: false, type: null, details: null });
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    domain: '',
    github_link: '',
    member1_email: '',
    member2_email: '',
    member3_email: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchActiveForms();
  }, []);

  const fetchActiveForms = async () => {
    try {
      const statusRes = await api.get('/workflow/student/active-status');
      setActiveStatus(statusRes.data);

      const res = await api.get('/workflow/student/forms/active');
      setActiveForms(res.data);
      if (res.data.length > 0) {
        setSelectedForm(res.data[0]);
      }
    } catch (error) {
      console.error('Failed to fetch active forms:', error);
      toast.error('Failed to load active project registration forms');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectForm = (form) => {
    setSelectedForm(form);
    setFormData({
      title: '',
      description: '',
      domain: '',
      github_link: '',
      member1_email: '',
      member2_email: '',
      member3_email: ''
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.domain) {
      toast.error('Project Title and Domain are required.');
      return;
    }

    if (!formData.member1_email || !formData.member2_email || !formData.member3_email) {
      toast.error('Exactly 3 team member emails must be entered to complete team of 4.');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/workflow/student/forms/submit', {
        form_id: selectedForm.id,
        title: formData.title,
        description: formData.description,
        domain: formData.domain,
        github_link: formData.github_link,
        team_member_emails: [
          formData.member1_email.trim(),
          formData.member2_email.trim(),
          formData.member3_email.trim()
        ]
      });

      toast.success('Project and team details registered successfully!');
      fetchActiveForms();
    } catch (error) {
      console.error('Registration failed:', error);
      toast.error(error.response?.data?.message || 'Failed to submit registration form.');
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
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 w-full text-left space-y-2">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Your Active Enrollment Details:</div>
            <div className="text-sm font-semibold text-slate-900">
              {activeStatus.type === 'project' ? 'Project Title: ' : 'Proposal Title: '}
              <span className="text-indigo-650 font-black">{activeStatus.details?.title}</span>
            </div>
            <div className="flex gap-4 mt-2 text-xs font-bold text-slate-500 uppercase">
              <span>Status: <span className="text-slate-800 font-extrabold">{activeStatus.details?.status}</span></span>
              {activeStatus.details?.mentor_name && (
                <span>Mentor: <span className="text-slate-800 font-extrabold">{activeStatus.details?.mentor_name}</span></span>
              )}
            </div>
          </div>
          <a 
            href="/student/team" 
            className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-bold transition-all shadow-md active:scale-95"
          >
            Go to Team Workspace
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader 
        title="Project Registration" 
        description="Fill and submit active academic project registration forms sent by your HOD."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Form Selector */}
        <div className="space-y-6 lg:col-span-1">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Active HOD Project Forms</h3>
          {activeForms.length === 0 ? (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center text-slate-500 text-sm">
              <Info className="mx-auto mb-2 text-slate-400" size={20} />
              No active project forms found for your branch/semester.
            </div>
          ) : (
            activeForms.map((form) => (
              <div 
                key={form.id}
                onClick={() => handleSelectForm(form)}
                className={`p-5 rounded-xl border cursor-pointer transition-all duration-200 ${
                  selectedForm?.id === form.id 
                    ? 'bg-slate-900 border-slate-900 text-white shadow-md' 
                    : 'bg-white border-slate-200 text-slate-900 hover:border-slate-300 hover:bg-slate-50/50'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${
                    selectedForm?.id === form.id ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {form.project_type}
                  </span>
                  {form.has_submitted && (
                    <StatusBadge status="Registered" variant="success" />
                  )}
                </div>
                <h4 className="font-bold text-sm leading-snug">{form.title}</h4>
                <p className={`text-xs mt-2 flex items-center gap-1.5 ${selectedForm?.id === form.id ? 'text-slate-300' : 'text-slate-500'}`}>
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
                    Status: {selectedForm.submission_status || 'Pending Review'}
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Part 1: Project Details */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">1. Project Proposal details</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">Project Title <span className="text-rose-500">*</span></label>
                        <input 
                          type="text" 
                          name="title"
                          value={formData.title}
                          onChange={handleInputChange}
                          placeholder="e.g. Smart Campus Navigation SaaS"
                          className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900"
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
                          placeholder="e.g. Web / Machine Learning / IoT"
                          className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Description</label>
                      <textarea 
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows="3"
                        placeholder="Brief summary of the goals, target users, and technology stack..."
                        className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 resize-none"
                      ></textarea>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <FileText size={14} /> GitHub Repository Link
                      </label>
                      <input 
                        type="url" 
                        name="github_link"
                        value={formData.github_link}
                        onChange={handleInputChange}
                        placeholder="https://github.com/your-username/repo"
                        className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900"
                      />
                    </div>
                  </div>

                  {/* Part 2: Team Members */}
                  <div className="space-y-4">
                    <div className="border-b border-slate-100 pb-2 flex justify-between items-center">
                      <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">2. Team Details (Fixed to 4 Students)</h3>
                      <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 uppercase">
                        <Users size={12} />
                        4 Member Team
                      </div>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-start gap-3">
                      <Info size={16} className="text-slate-600 mt-0.5 shrink-0" />
                      <p className="text-xs text-slate-600 leading-relaxed">
                        As the creator of this registration form, you are automatically assigned as the <strong>Team Leader (Student 1)</strong>. Please fill out the registered emails of your 3 other team members.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Student 2 Email <span className="text-rose-500">*</span></label>
                        <input 
                          type="email" 
                          name="member1_email"
                          value={formData.member1_email}
                          onChange={handleInputChange}
                          placeholder="member1@college.edu"
                          className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Student 3 Email <span className="text-rose-500">*</span></label>
                        <input 
                          type="email" 
                          name="member2_email"
                          value={formData.member2_email}
                          onChange={handleInputChange}
                          placeholder="member2@college.edu"
                          className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Student 4 Email <span className="text-rose-500">*</span></label>
                        <input 
                          type="email" 
                          name="member3_email"
                          value={formData.member3_email}
                          onChange={handleInputChange}
                          placeholder="member3@college.edu"
                          className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex justify-end">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex items-center gap-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white font-semibold rounded-xl transition-all shadow-md active:scale-95 shrink-0"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" /> Submitting...
                        </>
                      ) : (
                        <>
                          <Send size={16} /> Register Proposal
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
