import React, { useEffect, useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
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
  const [project, setProject] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [uploadingId, setUploadingId] = useState(null);

  const fetchTimeline = async () => {
    try {
      const { data } = await api.get('/milestones/student/timeline');
      setProject(data.project);
      setMilestones(data.milestones || []);
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
        description={project ? `Document submission plan for ${project.title}` : 'Document submission deadlines will appear after your mentor or HOD creates the timeline.'}
      />

      {!project || milestones.length === 0 ? (
        <SectionCard title="No Timeline Created" subtitle="Ask your mentor or HOD to create the project document timeline.">
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            The timeline is not available yet. Once created, you will see Synopsis, SRS, PPT, Poster, Project Report, and GitHub Final Submission here.
          </div>
        </SectionCard>
      ) : (
        <SectionCard title="Document Milestones" subtitle="Submit each deliverable before its deadline">
          <div className="relative mt-8 ml-2">
            <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-slate-100"></div>

            <div className="space-y-6">
              {milestones.map((milestone) => {
                const status = milestone.timeline_status || 'Pending';
                const isUploading = uploadingId === milestone.id;

                return (
                  <div key={milestone.id} className="relative flex gap-6">
                    <div
                      className={cn(
                        'z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border-2 bg-white',
                        status === 'Submitted' && 'border-emerald-500 bg-emerald-500 text-white',
                        status === 'Late' && 'border-rose-500 bg-rose-500 text-white',
                        status === 'Pending' && 'border-slate-100 text-slate-300'
                      )}
                    >
                      {status === 'Submitted' ? <CheckCircle2 size={20} /> : <FileText size={20} />}
                    </div>

                    <div className="flex-1 rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="flex items-center gap-3">
                            <h3 className="text-base font-bold text-slate-900">{milestone.sequence_order}. {milestone.title}</h3>
                            <StatusBadge status={status} variant={statusVariant[status] || 'default'} />
                          </div>
                          <p className="mt-2 flex items-center gap-2 text-xs font-semibold text-slate-500">
                            <Calendar size={14} />
                            Deadline: {formatDate(milestone.deadline)}
                          </p>
                          {milestone.submitted_at && (
                            <p className="mt-1 flex items-center gap-2 text-xs font-semibold text-slate-400">
                              <Clock size={14} />
                              Submitted: {formatDate(milestone.submitted_at)}
                            </p>
                          )}
                          {milestone.file_name && (
                            <a
                              href={milestone.file_url}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-2 inline-block text-xs font-bold text-blue-600 hover:underline"
                            >
                              {milestone.file_name}
                            </a>
                          )}
                        </div>

                        <label className={cn(
                          'inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all',
                          isUploading ? 'bg-slate-100 text-slate-400' : 'bg-slate-900 text-white hover:bg-slate-800'
                        )}>
                          {isUploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                          {milestone.submission_id ? 'Replace File' : 'Upload File'}
                          <input
                            type="file"
                            className="hidden"
                            disabled={isUploading}
                            onChange={(event) => handleUpload(milestone, event.target.files?.[0])}
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </SectionCard>
      )}
    </div>
  );
};

export default StudentTimeline;
