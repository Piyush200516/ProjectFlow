import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  Plus, 
  Users, 
  Calendar, 
  BookOpen, 
  Layers, 
  ArrowRight,
  TrendingUp,
  Cpu,
  Loader2,
  Sparkles,
  Search,
  Check
} from 'lucide-react';
import { PageHeader, SectionCard, StatusBadge } from '../../components/common/PremiumComponents';
import api from '../../lib/api';
import { toast } from 'sonner';

const HodApprovals = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('submissions');
  
  // States
  const [submissions, setSubmissions] = useState([]);
  const [activeForms, setActiveForms] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [selectedMentor, setSelectedMentor] = useState({});
  const [assigningId, setAssigningId] = useState(null);

  // Form builder state
  const [formBuilder, setFormBuilder] = useState({
    title: '',
    description: '',
    project_type: 'Mini Project',
    branch: 'Computer Science & Engineering',
    academic_year: '2024-25',
    semester: '6',
    section: 'A',
    deadline: ''
  });
  const [formSubmitting, setFormSubmitting] = useState(false);

  useEffect(() => {
    fetchInitData();
  }, []);

  const fetchInitData = async () => {
    setLoading(true);
    try {
      const [subsRes, formsRes, mentorsRes] = await Promise.all([
        api.get('/workflow/hod/submissions'),
        api.get('/workflow/hod/forms'),
        api.get('/workflow/hod/mentors')
      ]);
      setSubmissions(subsRes.data);
      setActiveForms(formsRes.data);
      setMentors(mentorsRes.data);
    } catch (error) {
      console.error('Failed to load HOD admin data:', error);
      toast.error('Failed to load department database records');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateForm = async (e) => {
    e.preventDefault();
    if (!formBuilder.title || !formBuilder.deadline) {
      toast.error('Please enter a Form Title and Submission Deadline');
      return;
    }

    setFormSubmitting(true);
    try {
      await api.post('/workflow/hod/forms', formBuilder);
      toast.success('Registration Form published to department students!');
      setFormBuilder({
        title: '',
        description: '',
        project_type: 'Mini Project',
        branch: 'Computer Science & Engineering',
        academic_year: '2024-25',
        semester: '6',
        section: 'A',
        deadline: ''
      });
      // Refresh forms
      const formsRes = await api.get('/workflow/hod/forms');
      setActiveForms(formsRes.data);
      setActiveTab('forms');
    } catch (error) {
      console.error('Form creation failed:', error);
      toast.error('Failed to publish project registration form');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleAssignMentor = async (submissionId, manual = true) => {
    const mentorId = selectedMentor[submissionId];
    if (manual && !mentorId) {
      toast.error('Please select a mentor to assign');
      return;
    }

    setAssigningId(submissionId);
    try {
      await api.post('/workflow/hod/assign-mentor', {
        submission_id: submissionId,
        mentor_id: manual ? mentorId : null,
        auto_assign: !manual
      });

      toast.success(manual ? 'Mentor assigned successfully!' : 'AI matched and assigned mentor successfully!');
      
      // Refresh all
      const subsRes = await api.get('/workflow/hod/submissions');
      setSubmissions(subsRes.data);
    } catch (error) {
      console.error('Mentor assignment failed:', error);
      toast.error(error.response?.data?.message || 'Failed to complete mentor assignment');
    } finally {
      setAssigningId(null);
    }
  };

  const handleMentorSelectChange = (subId, val) => {
    setSelectedMentor(prev => ({ ...prev, [subId]: val }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-slate-900" />
      </div>
    );
  }

  const pendingSubmissions = submissions.filter(s => s.status === 'Pending' || s.status === 'Pending Review');
  const approvedSubmissions = submissions.filter(s => s.status === 'Approved');

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader 
        title="Administrative & Approvals Portal" 
        description="Launch project forms, review 4-student project registrations, and allocate mentors."
      />

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button 
          onClick={() => setActiveTab('submissions')}
          className={`pb-4 px-6 font-semibold text-sm transition-all border-b-2 ${
            activeTab === 'submissions' 
              ? 'border-slate-900 text-slate-900' 
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Project Proposals ({pendingSubmissions.length})
        </button>
        <button 
          onClick={() => setActiveTab('create')}
          className={`pb-4 px-6 font-semibold text-sm transition-all border-b-2 ${
            activeTab === 'create' 
              ? 'border-slate-900 text-slate-900' 
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Publish New Form
        </button>
        <button 
          onClick={() => setActiveTab('forms')}
          className={`pb-4 px-6 font-semibold text-sm transition-all border-b-2 ${
            activeTab === 'forms' 
              ? 'border-slate-900 text-slate-900' 
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Active Registration Forms ({activeForms.length})
        </button>
        <button 
          onClick={() => setActiveTab('approved')}
          className={`pb-4 px-6 font-semibold text-sm transition-all border-b-2 ${
            activeTab === 'approved' 
              ? 'border-slate-900 text-slate-900' 
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Approved Teams ({approvedSubmissions.length})
        </button>
      </div>

      {/* Submissions View */}
      {activeTab === 'submissions' && (
        <div className="space-y-6">
          {pendingSubmissions.length === 0 ? (
            <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-12 text-center text-slate-500">
              <CheckCircle2 className="mx-auto mb-4 text-emerald-500" size={32} />
              <h3 className="font-bold text-slate-900">All Project Submissions Handled</h3>
              <p className="text-xs text-slate-500 mt-1">There are no pending project registrations requiring mentor assignments.</p>
            </div>
          ) : (
            pendingSubmissions.map((sub) => (
              <SectionCard 
                key={sub.id}
                title={`${sub.title}`} 
                subtitle={`Domain: ${sub.domain} • Form: ${sub.form_title}`}
                headerActions={
                  <div className="flex items-center gap-2">
                    <StatusBadge status="Pending Assignment" variant="warning" />
                  </div>
                }
              >
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column: Details */}
                  <div className="lg:col-span-2 space-y-4">
                    <div>
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Project Summary</h4>
                      <p className="text-slate-600 text-sm">{sub.description || 'No description provided.'}</p>
                    </div>

                    {sub.github_link && (
                      <div className="text-xs font-medium text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200 w-fit">
                        GitHub URL: <a href={sub.github_link} target="_blank" rel="noreferrer" className="text-slate-900 underline">{sub.github_link}</a>
                      </div>
                    )}

                    {/* Team Members List */}
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Users size={14} /> Registered Group (4 Members)
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {sub.team_members?.map((member, i) => (
                          <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                            <div>
                              <div className="text-xs font-semibold text-slate-900">{member.full_name || 'Registered Student'}</div>
                              <div className="text-[10px] text-slate-500">{member.email}</div>
                            </div>
                            <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${
                              member.is_leader ? 'bg-slate-900 text-white' : 'bg-slate-200/70 text-slate-700'
                            }`}>
                              {member.is_leader ? 'Leader' : 'Member'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Mentor Allocation */}
                  <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Cpu size={16} className="text-slate-700 animate-pulse" />
                        <h4 className="text-xs font-bold text-slate-950 uppercase tracking-wider">Faculty Allocation</h4>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Select Mentor</label>
                        <select 
                          value={selectedMentor[sub.id] || ''}
                          onChange={(e) => handleMentorSelectChange(sub.id, e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-slate-900/5"
                        >
                          <option value="">-- Choose Faculty --</option>
                          {mentors.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.full_name} ({m.specialization || 'General'})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2 mt-6">
                      <button
                        onClick={() => handleAssignMentor(sub.id, true)}
                        disabled={assigningId === sub.id}
                        className="w-full py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5"
                      >
                        {assigningId === sub.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Confirm Allocation'}
                      </button>

                      <button
                        onClick={() => handleAssignMentor(sub.id, false)}
                        disabled={assigningId === sub.id}
                        className="w-full py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 group active:scale-95"
                      >
                        <Sparkles size={12} className="text-slate-900 group-hover:animate-bounce" />
                        Auto-Assign Mentor
                      </button>
                    </div>
                  </div>
                </div>
              </SectionCard>
            ))
          )}
        </div>
      )}

      {/* Form Creator Tab */}
      {activeTab === 'create' && (
        <SectionCard title="Form Creator" subtitle="Generate project registration cards for academic batches">
          <form onSubmit={handleCreateForm} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase">Form Title <span className="text-rose-500">*</span></label>
                <input 
                  type="text"
                  placeholder="e.g. Major Project Registration - Batch 2026"
                  value={formBuilder.title}
                  onChange={(e) => setFormBuilder(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase">Project Type</label>
                <select 
                  value={formBuilder.project_type}
                  onChange={(e) => setFormBuilder(prev => ({ ...prev, project_type: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2"
                >
                  <option>Mini Project</option>
                  <option>Major Project</option>
                  <option>Final Year Project</option>
                  <option>Hackathon</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase">Branch Name</label>
                <input 
                  type="text"
                  value={formBuilder.branch}
                  onChange={(e) => setFormBuilder(prev => ({ ...prev, branch: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase">Academic Year</label>
                <input 
                  type="text"
                  value={formBuilder.academic_year}
                  onChange={(e) => setFormBuilder(prev => ({ ...prev, academic_year: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase">Target Semester</label>
                <select 
                  value={formBuilder.semester}
                  onChange={(e) => setFormBuilder(prev => ({ ...prev, semester: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none"
                >
                  <option>1</option>
                  <option>2</option>
                  <option>3</option>
                  <option>4</option>
                  <option>5</option>
                  <option>6</option>
                  <option>7</option>
                  <option>8</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase">Target Section</label>
                <input 
                  type="text"
                  value={formBuilder.section}
                  onChange={(e) => setFormBuilder(prev => ({ ...prev, section: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase">Submission Deadline <span className="text-rose-500">*</span></label>
                <input 
                  type="datetime-local"
                  value={formBuilder.deadline}
                  onChange={(e) => setFormBuilder(prev => ({ ...prev, deadline: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase">Description / Instruction Remarks</label>
              <textarea 
                rows="3"
                value={formBuilder.description}
                onChange={(e) => setFormBuilder(prev => ({ ...prev, description: e.target.value }))}
                placeholder="List the registration guidelines, constraints, and requirements..."
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 resize-none"
              ></textarea>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={formSubmitting}
                className="flex items-center gap-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white font-semibold rounded-xl transition-all shadow-md active:scale-95 shrink-0"
              >
                {formSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Publishing...
                  </>
                ) : (
                  <>
                    <Plus size={16} /> Publish Form
                  </>
                )}
              </button>
            </div>
          </form>
        </SectionCard>
      )}

      {/* Active Forms Tab */}
      {activeTab === 'forms' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {activeForms.length === 0 ? (
            <div className="col-span-full bg-slate-50 border border-dashed border-slate-200 rounded-xl p-12 text-center text-slate-500">
              <Layers className="mx-auto mb-4 text-slate-400" size={32} />
              No active forms found. Publish a registration form to start accepting student groups.
            </div>
          ) : (
            activeForms.map((form) => (
              <div key={form.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between p-6">
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-[10px] font-bold uppercase bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                      {form.project_type}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500">Sem {form.semester} • Sec {form.section}</span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-base leading-snug mb-2">{form.title}</h4>
                  <p className="text-slate-500 text-xs line-clamp-3 mb-4">{form.description || 'No description guidelines provided.'}</p>
                </div>
                <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Calendar size={13} />
                    Due: {new Date(form.deadline).toLocaleDateString()}
                  </span>
                  <span className="font-medium text-slate-700 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                    Batch: {form.academic_year}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Approved Tab */}
      {activeTab === 'approved' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-medium">Project details</th>
                  <th className="px-6 py-4 font-medium">Form Title</th>
                  <th className="px-6 py-4 font-medium">Domain</th>
                  <th className="px-6 py-4 font-medium">Registration Status</th>
                  <th className="px-6 py-4 font-medium">Workspace Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {approvedSubmissions.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-slate-400">
                      No approved groups found yet. Assign a mentor to a team to activate their project.
                    </td>
                  </tr>
                ) : (
                  approvedSubmissions.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-900">{item.title}</td>
                      <td className="px-6 py-4 text-slate-500">{item.form_title}</td>
                      <td className="px-6 py-4 font-medium text-slate-700">{item.domain}</td>
                      <td className="px-6 py-4">
                        <StatusBadge status={item.status} variant="success" />
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold text-emerald-600 flex items-center gap-1.5">
                        <Check size={14} /> Workspace Active
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default HodApprovals;
