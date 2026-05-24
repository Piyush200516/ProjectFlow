import React, { useEffect, useMemo, useState } from 'react';
import {
  Award,
  Calendar,
  Download,
  FileText,
  Loader2,
  MessageSquare,
  Presentation,
  Upload
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../../lib/api';
import { PageHeader, SectionCard, StatusBadge } from '../../components/common/PremiumComponents';

const statusVariant = {
  pending: 'info',
  submitted: 'info',
  approved: 'success',
  late: 'error',
  rejected: 'error',
  'needs revision': 'warning'
};

const getIcon = (type) => {
  const text = String(type || '').toLowerCase();
  if (text.includes('ppt') || text.includes('presentation')) {
    return <Presentation className="text-amber-500" size={22} />;
  }
  return <FileText className="text-blue-500" size={22} />;
};

const formatDate = (value) => {
  if (!value) return 'Not scheduled';
  return new Date(value).toLocaleDateString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

const getDaysLeft = (value) => {
  if (!value) return 'Not scheduled';
  const diff = Math.ceil((new Date(value) - new Date()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return `${Math.abs(diff)} day${Math.abs(diff) === 1 ? '' : 's'} late`;
  if (diff === 0) return 'Due today';
  return `${diff} day${diff === 1 ? '' : 's'} left`;
};

const StudentDocumentWorkspace = () => {
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [uploadingId, setUploadingId] = useState(null);

  const stats = useMemo(() => {
    const total = milestones.length;
    const submitted = milestones.filter((item) => item.submission_id).length;
    const approved = milestones.filter((item) => item.workspace_status === 'approved').length;
    const late = milestones.filter((item) => item.workspace_status === 'late').length;
    return { total, submitted, approved, late };
  }, [milestones]);

  const fetchWorkspace = async () => {
    try {
      const { data } = await api.get('/student/document-workspace');
      setProject(data.project || null);
      setTeamMembers(data.team_members || []);
      setMilestones(data.milestones || []);
    } catch (error) {
      console.error('Failed to load document workspace:', error);
      toast.error('Failed to load document workspace');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspace();
  }, []);

  const downloadTemplate = async (milestone) => {
    if (!milestone.template_id) {
      toast.info('Template is not uploaded yet');
      return;
    }
    try {
      const { data } = await api.get('/student/templates/download', {
        params: { template_id: milestone.template_id }
      });
      window.open(data.download_url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('Template download failed:', error);
      toast.error('Failed to download template');
    }
  };

  const submitMilestone = async (milestone, file) => {
    if (!file) return;
    const formData = new FormData();
    formData.append('project_milestone_id', milestone.id);
    formData.append('file', file);

    setUploadingId(milestone.id);
    try {
      const { data } = await api.post('/student/milestone-submit', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success(data.status === 'late' ? 'Submitted and marked late' : 'Document submitted');
      await fetchWorkspace();
    } catch (error) {
      console.error('Document upload failed:', error);
      toast.error(error.response?.data?.message || 'Failed to upload document');
    } finally {
      setUploadingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader
        title="Document Workspace"
        description={project ? `Shared workspace for ${project.title}` : 'Your mentor-defined document workflow will appear here.'}
      />

      {!project ? (
        <SectionCard title="No Active Project Workspace" subtitle="Your workspace opens after HOD approval and mentor assignment.">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm font-medium text-slate-500">
            Student-created custom documents are disabled. Your mentor will publish the document workflow for your project.
          </div>
        </SectionCard>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <SectionCard title="Project Details" subtitle={project.type || project.status}>
              <div className="space-y-2 text-sm">
                <div className="font-bold text-slate-900">{project.title}</div>
                <div className="text-slate-500">Mentor: {project.mentor_name || 'Assigned mentor'}</div>
                <div className="text-slate-500">{project.mentor_email || 'Mentor contact unavailable'}</div>
              </div>
            </SectionCard>

            <SectionCard title="Team Members" subtitle={`${teamMembers.length} members`}>
              <div className="space-y-2">
                {teamMembers.slice(0, 4).map((member) => (
                  <div key={`${member.id}-${member.email}`} className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-slate-800">{member.full_name}</span>
                    <span className="text-xs text-slate-500">{member.role}</span>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Marks" subtitle="Live document status">
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="rounded-lg bg-slate-50 p-3">
                  <div className="text-lg font-black text-slate-900">{stats.total}</div>
                  <div className="text-[10px] font-bold uppercase text-slate-400">Total</div>
                </div>
                <div className="rounded-lg bg-blue-50 p-3">
                  <div className="text-lg font-black text-blue-700">{stats.submitted}</div>
                  <div className="text-[10px] font-bold uppercase text-blue-400">Sent</div>
                </div>
                <div className="rounded-lg bg-emerald-50 p-3">
                  <div className="text-lg font-black text-emerald-700">{stats.approved}</div>
                  <div className="text-[10px] font-bold uppercase text-emerald-400">OK</div>
                </div>
                <div className="rounded-lg bg-rose-50 p-3">
                  <div className="text-lg font-black text-rose-700">{stats.late}</div>
                  <div className="text-[10px] font-bold uppercase text-rose-400">Late</div>
                </div>
              </div>
            </SectionCard>
          </div>

          <SectionCard title="Timeline" subtitle="Mentor-defined document workflow shared by the full team">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 font-medium">Document</th>
                    <th className="px-4 py-3 font-medium">Deadline</th>
                    <th className="px-4 py-3 font-medium">Days Left</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Marks</th>
                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {milestones.map((milestone) => {
                    const status = milestone.workspace_status || 'pending';
                    const isUploading = uploadingId === milestone.id;
                    return (
                      <tr key={milestone.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-4">
                          <div className="flex items-start gap-3">
                            <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                              {getIcon(milestone.document_type)}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900">{milestone.title}</div>
                              <div className="text-xs text-slate-500">{milestone.document_type || 'Document'} • Allowed: {milestone.allowed_formats || 'Mentor defined'}</div>
                              {milestone.instructions && (
                                <div className="mt-2 max-w-xl text-xs text-slate-500">{milestone.instructions}</div>
                              )}
                              {milestone.file_name && (
                                <div className="mt-2 text-xs font-semibold text-slate-600">
                                  v{milestone.version_no || 1}: {milestone.file_name}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                            <Calendar size={14} />
                            {formatDate(milestone.deadline)}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-xs font-bold text-slate-700">{getDaysLeft(milestone.deadline)}</td>
                        <td className="px-4 py-4">
                          <StatusBadge status={status} variant={statusVariant[status] || 'default'} />
                          {milestone.feedback && (
                            <div className="mt-2 flex items-start gap-1.5 text-xs text-slate-500">
                              <MessageSquare size={13} className="mt-0.5" />
                              {milestone.feedback}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700">
                            <Award size={14} />
                            {milestone.marks || 0}/{milestone.max_marks || 10}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => downloadTemplate(milestone)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                            >
                              <Download size={14} />
                              Template
                            </button>
                            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white hover:bg-slate-800">
                              {isUploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                              Upload
                              <input
                                type="file"
                                className="hidden"
                                accept=".doc,.docx,.ppt,.pptx,.pdf,.zip,.png,.jpg,.jpeg,.mp4"
                                disabled={isUploading}
                                onChange={(event) => submitMilestone(milestone, event.target.files?.[0])}
                              />
                            </label>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </>
      )}
    </div>
  );
};

export default StudentDocumentWorkspace;
