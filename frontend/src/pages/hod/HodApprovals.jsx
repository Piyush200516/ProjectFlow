import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  Users, 
  ArrowRight,
  Cpu,
  Loader2,
  Sparkles,
  Search,
  Check,
  XCircle,
  MessageSquare
} from 'lucide-react';
import { PageHeader, SectionCard, StatusBadge, Modal } from '../../components/common/PremiumComponents';
import api from '../../lib/api';
import { toast } from 'sonner';

const HodApprovals = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  
  // States
  const [submissions, setSubmissions] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [selectedMentor, setSelectedMentor] = useState({});
  const [processingId, setProcessingId] = useState(null);
  
  // Remarks Modal State
  const [remarksModalOpen, setRemarksModalOpen] = useState(false);
  const [activeSubmission, setActiveSubmission] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [actionType, setActionType] = useState('approve');

  useEffect(() => {
    fetchInitData();
  }, []);

  const fetchInitData = async () => {
    setLoading(true);
    try {
      const [subsRes, mentorsRes] = await Promise.all([
        api.get('/hod/registration-submissions'),
        api.get('/hod/mentors')
      ]);
      setSubmissions(subsRes.data);
      setMentors(mentorsRes.data);
    } catch (error) {
      console.error('Failed to load HOD admin data:', error);
      toast.error('Failed to load submissions and mentors');
    } finally {
      setLoading(false);
    }
  };

  const handleActionClick = (submission, type) => {
    setActiveSubmission(submission);
    setActionType(type);
    setRemarks(submission.remarks || '');
    setRemarksModalOpen(true);
  };

  const handleConfirmAction = async () => {
    setProcessingId(activeSubmission.id);
    setRemarksModalOpen(false);
    try {
      if (actionType === 'approve') {
        await api.patch(`/hod/registration-submissions/${activeSubmission.id}/approve`, { remarks });
        toast.success('Submission approved');
      } else {
        await api.patch(`/hod/registration-submissions/${activeSubmission.id}/reject`, { remarks });
        toast.success('Submission rejected');
      }
      fetchInitData();
    } catch (error) {
      toast.error(`Failed to ${actionType} submission`);
    } finally {
      setProcessingId(null);
      setActiveSubmission(null);
      setRemarks('');
    }
  };

  const handleAssignMentor = async (submissionId) => {
    const mentorId = selectedMentor[submissionId];
    if (!mentorId) {
      toast.error('Please select a mentor to assign');
      return;
    }

    setProcessingId(submissionId);
    try {
      await api.post('/hod/assign-mentor', {
        submission_id: submissionId,
        mentor_id: mentorId
      });

      toast.success('Mentor assigned successfully!');
      fetchInitData();
    } catch (error) {
      console.error('Mentor assignment failed:', error);
      toast.error(error.response?.data?.message || 'Failed to complete mentor assignment');
    } finally {
      setProcessingId(null);
    }
  };

  const handleMentorSelectChange = (subId, val) => {
    setSelectedMentor(prev => ({ ...prev, [subId]: val }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const pendingSubmissions = submissions.filter(s => s.status === 'Pending');
  const approvedSubmissions = submissions.filter(s => s.status === 'Approved');
  const rejectedSubmissions = submissions.filter(s => s.status === 'Rejected');

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader 
        title="Administrative & Approvals Portal" 
        description="Review student registrations, approve/reject teams, and allocate mentors."
      />

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button 
          onClick={() => setActiveTab('pending')}
          className={`pb-4 px-6 font-semibold text-sm transition-all border-b-2 ${
            activeTab === 'pending' 
              ? 'border-blue-600 text-blue-600' 
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Pending Reviews ({pendingSubmissions.length})
        </button>
        <button 
          onClick={() => setActiveTab('approved')}
          className={`pb-4 px-6 font-semibold text-sm transition-all border-b-2 ${
            activeTab === 'approved' 
              ? 'border-blue-600 text-blue-600' 
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Approved / Mentor Assigned ({approvedSubmissions.length})
        </button>
        <button 
          onClick={() => setActiveTab('rejected')}
          className={`pb-4 px-6 font-semibold text-sm transition-all border-b-2 ${
            activeTab === 'rejected' 
              ? 'border-blue-600 text-blue-600' 
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Rejected ({rejectedSubmissions.length})
        </button>
      </div>

      {/* Pending View */}
      {activeTab === 'pending' && (
        <div className="space-y-6">
          {pendingSubmissions.length === 0 ? (
            <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-12 text-center text-slate-500">
              <CheckCircle2 className="mx-auto mb-4 text-emerald-500" size={32} />
              <h3 className="font-bold text-slate-900">All Project Submissions Handled</h3>
              <p className="text-xs text-slate-500 mt-1">There are no pending project registrations requiring review.</p>
            </div>
          ) : (
            pendingSubmissions.map((sub) => (
              <SectionCard 
                key={sub.id}
                title={sub.project_title} 
                subtitle={`Domain: ${sub.project_domain} • Form: ${sub.form_title}`}
                headerActions={
                  <div className="flex items-center gap-2">
                    <StatusBadge status="Pending" variant="warning" />
                  </div>
                }
              >
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column: Details */}
                  <div className="lg:col-span-2 space-y-4">
                    <div>
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Problem Statement</h4>
                      <p className="text-slate-600 text-sm">{sub.problem_statement || 'N/A'}</p>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Abstract</h4>
                      <p className="text-slate-600 text-sm">{sub.abstract || 'N/A'}</p>
                    </div>

                    <div className="text-xs font-medium text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200 w-fit">
                      Tech Stack: {sub.tech_stack || 'Not specified'}
                    </div>

                    {/* Team Members List */}
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Users size={14} /> Registered Group
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 flex items-center justify-between">
                          <div>
                            <div className="text-xs font-semibold text-slate-900">{sub.leader_name}</div>
                            <div className="text-[10px] text-slate-500">{sub.leader_email}</div>
                          </div>
                          <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-blue-600 text-white">Leader</span>
                        </div>
                        {Array.isArray(sub.team_members) && sub.team_members.map((member, i) => (
                          <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                            <div>
                              <div className="text-xs font-semibold text-slate-900">{member.name || member.roll_number || 'Team Member'}</div>
                              <div className="text-[10px] text-slate-500">{member.email || ''}</div>
                              <div className="text-[9px] text-slate-500 font-medium mt-0.5">
                                {member.roll_number || ''} • {member.branch || ''} • Y{member.year || ''} S{member.semester || ''} • Sec {member.section || ''}
                              </div>
                            </div>
                            <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-slate-200/70 text-slate-700">Member</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Actions */}
                  <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <ShieldCheck size={16} className="text-slate-700" />
                        <h4 className="text-xs font-bold text-slate-950 uppercase tracking-wider">HOD Action</h4>
                      </div>
                      
                      <div className="text-sm text-slate-500">Review the project details and approve or reject the submission.</div>
                    </div>

                    <div className="space-y-2 mt-6">
                      <button
                        onClick={() => handleActionClick(sub, 'approve')}
                        disabled={processingId === sub.id}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5"
                      >
                        {processingId === sub.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><CheckCircle2 size={16}/> Approve Registration</>}
                      </button>
                      <button
                        onClick={() => handleActionClick(sub, 'reject')}
                        disabled={processingId === sub.id}
                        className="w-full py-2 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 disabled:bg-slate-100 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5"
                      >
                        <XCircle size={16}/> Reject
                      </button>
                    </div>
                  </div>
                </div>
              </SectionCard>
            ))
          )}
        </div>
      )}

      {/* Approved Tab */}
      {activeTab === 'approved' && (
        <div className="space-y-6">
          {approvedSubmissions.length === 0 ? (
             <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-12 text-center text-slate-500">
               <ShieldCheck className="mx-auto mb-4 text-emerald-500" size={32} />
               <h3 className="font-bold text-slate-900">No Approved Projects</h3>
               <p className="text-xs text-slate-500 mt-1">Approve pending submissions to see them here.</p>
             </div>
          ) : (
            approvedSubmissions.map((sub) => (
              <SectionCard 
                key={sub.id}
                title={sub.project_title} 
                subtitle={`Leader: ${sub.leader_name} • Domain: ${sub.project_domain}`}
                headerActions={
                  <StatusBadge status="Approved" variant="success" />
                }
              >
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                     <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <MessageSquare size={14} /> Remarks
                     </h4>
                     <p className="text-sm text-slate-600 p-3 bg-slate-50 rounded-lg border border-slate-200">
                       {sub.remarks || 'No remarks provided during approval.'}
                     </p>
                  </div>
                  
                  <div className="p-5 bg-blue-50/50 border border-blue-100 rounded-2xl flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Cpu size={16} className="text-blue-700 animate-pulse" />
                        <h4 className="text-xs font-bold text-blue-950 uppercase tracking-wider">Faculty Allocation</h4>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Select Mentor</label>
                        <select 
                          value={selectedMentor[sub.id] || ''}
                          onChange={(e) => handleMentorSelectChange(sub.id, e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        >
                          <option value="">-- Choose Faculty --</option>
                          {mentors.map((m) => (
                            <option key={m.id} value={m.user_id}>
                              {m.full_name} ({m.specialization || 'General'})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2 mt-6">
                      <button
                        onClick={() => handleAssignMentor(sub.id)}
                        disabled={processingId === sub.id}
                        className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5"
                      >
                        {processingId === sub.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Confirm Allocation'}
                      </button>
                    </div>
                  </div>
                </div>
              </SectionCard>
            ))
          )}
        </div>
      )}
      
      {/* Rejected Tab */}
      {activeTab === 'rejected' && (
        <div className="space-y-6">
          {rejectedSubmissions.length === 0 ? (
             <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-12 text-center text-slate-500">
               <XCircle className="mx-auto mb-4 text-rose-500" size={32} />
               <h3 className="font-bold text-slate-900">No Rejected Projects</h3>
               <p className="text-xs text-slate-500 mt-1">Rejected submissions will appear here.</p>
             </div>
          ) : (
            rejectedSubmissions.map((sub) => (
              <SectionCard 
                key={sub.id}
                title={sub.project_title} 
                subtitle={`Leader: ${sub.leader_name} • Domain: ${sub.project_domain}`}
                headerActions={
                  <StatusBadge status="Rejected" variant="error" />
                }
              >
                <div>
                   <h4 className="text-xs font-bold text-rose-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <MessageSquare size={14} /> Rejection Remarks
                   </h4>
                   <p className="text-sm text-slate-600 p-3 bg-rose-50/50 rounded-lg border border-rose-100">
                     {sub.remarks || 'No remarks provided.'}
                   </p>
                </div>
              </SectionCard>
            ))
          )}
        </div>
      )}

      <Modal
        isOpen={remarksModalOpen}
        onClose={() => setRemarksModalOpen(false)}
        title={`${actionType === 'approve' ? 'Approve' : 'Reject'} Project Registration`}
        footer={
          <>
            <button 
              onClick={() => setRemarksModalOpen(false)} 
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleConfirmAction} 
              disabled={processingId === activeSubmission?.id}
              className={`px-4 py-2 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-2 ${
                actionType === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              {processingId === activeSubmission?.id && <Loader2 className="w-4 h-4 animate-spin" />}
              Confirm {actionType === 'approve' ? 'Approval' : 'Rejection'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            You are about to {actionType} the project <strong>"{activeSubmission?.project_title}"</strong>.
          </p>
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Remarks (Optional)</label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={4}
              placeholder={`Provide feedback or conditions for ${actionType}...`}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default HodApprovals;
