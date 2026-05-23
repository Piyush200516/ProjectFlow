import React, { useEffect, useState } from 'react';
import {
  Calendar,
  Clock,
  Loader2,
  Upload,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../../lib/api';
import { PageHeader, SectionCard, StatusBadge } from '../../components/common/PremiumComponents';
import { cn } from '../../utils/utils';

const statusVariant = {
  Submitted: 'success',
  Late: 'error',
  Pending: 'info',
};

const StudentTimeline = () => {
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [uploadingId, setUploadingId] = useState(null);

  const fetchTimeline = async () => {
    try {
      const { data } = await api.get('/student/timeline');
      console.log('Student timeline:', data);
      setForm(data.form || null);
      setMilestones(data.timeline || []);
    } catch (error) {
      console.error('Failed to fetch project timeline:', error);
      toast.error('Failed to load project timeline');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimeline();
  }, []);

  const formatDate = (value) => {
    if (!value) return 'Not scheduled';
    return new Date(value).toLocaleDateString(undefined, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const handleUpload = async (milestone, file) => {
    if (!file) return;

    if (!milestone.project_id) {
      toast.info('Timeline published. Document upload opens after your project is approved.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setUploadingId(milestone.id);
    try {
      const { data } = await api.post(`/milestones/${milestone.id}/submit`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success(data.status === 'Late' ? 'Submitted, marked late' : 'Milestone submitted');
      fetchTimeline();
    } catch (error) {
      console.error('Milestone upload failed:', error);
      toast.error(error.response?.data?.message || 'Failed to upload milestone file');
    } finally {
      setUploadingId(null);
    }
  };

  const getDaysLeft = (value) => {
    if (!value) return 'Not scheduled';
    const today = new Date();
    const deadline = new Date(value);
    const diff = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
    if (diff < 0) return `${Math.abs(diff)} day${Math.abs(diff) === 1 ? '' : 's'} late`;
    if (diff === 0) return 'Due today';
    return `${diff} day${diff === 1 ? '' : 's'} left`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <PageHeader
        title="Project Timeline"
        description={form ? `Document submission plan for ${form.title}` : 'Document submission deadlines will appear after your HOD publishes the timeline.'}
      />

      {!form || milestones.length === 0 ? (
        <SectionCard title="No Timeline Created" subtitle="Ask your mentor or HOD to create the project document timeline.">
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            The timeline is not available yet. Once created, you will see Synopsis, SRS, PPT, Poster, Project Report, and GitHub Final Submission here.
          </div>
        </SectionCard>
      ) : (
        <SectionCard title="Document Milestones" subtitle="Submit each deliverable before its deadline">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-4 py-3 font-medium">#</th>
                  <th className="px-4 py-3 font-medium">Document Title</th>
                  <th className="px-4 py-3 font-medium">Document Type</th>
                  <th className="px-4 py-3 font-medium">Deadline</th>
                  <th className="px-4 py-3 font-medium">Days Left</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
              {milestones.map((milestone) => {
                const status = milestone.timeline_status || milestone.status || 'Pending';
                const sequenceNo = milestone.sequence_no || milestone.display_sequence_no || milestone.sequence_order;
                const isUploading = uploadingId === milestone.id;

                return (
                  <tr key={milestone.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-4 font-bold text-slate-700">{sequenceNo}</td>
                    <td className="px-4 py-4">
                      <div className="font-bold text-slate-900">{milestone.title}</div>
                      {milestone.submitted_at && (
                        <div className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                          <Clock size={13} />
                          Submitted: {formatDate(milestone.submitted_at)}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 font-medium text-slate-600">{milestone.document_type || 'Document'}</td>
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                        <Calendar size={14} />
                        {formatDate(milestone.deadline)}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-xs font-bold text-slate-700">{getDaysLeft(milestone.deadline)}</td>
                    <td className="px-4 py-4">
                      <StatusBadge status={status} variant={statusVariant[status] || 'default'} />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end">
                        <label className={cn(
                          'inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all',
                          isUploading ? 'bg-slate-100 text-slate-400' : 'bg-slate-900 text-white hover:bg-slate-800'
                        )}>
                          {isUploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                          Submit
                          <input
                            type="file"
                            className="hidden"
                            disabled={isUploading}
                            onChange={(event) => handleUpload(milestone, event.target.files?.[0])}
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
      )}
    </div>
  );
};

export default StudentTimeline;
