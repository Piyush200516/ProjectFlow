import React, { useEffect, useMemo, useState } from 'react';
import {
  Download,
  Eye,
  FileText,
  Loader2,
  Pencil,
  Send,
  Trash2,
  UploadCloud
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../../lib/api';
import { SectionCard, StatusBadge } from '../../components/common/PremiumComponents';

const documentTypes = [
  'Synopsis',
  'SRS',
  'PPT',
  'Poster',
  'Project Report',
  'Research Paper',
  'Demo Presentation',
  'Final Submission'
];

const allowedAccept = '.doc,.docx,.ppt,.pptx,.pdf,.xlsx,.zip,.png,.jpg,.jpeg,.mp4,.txt';

const emptyForm = {
  document_name: 'Synopsis',
  document_type: 'Synopsis',
  deadline: '',
  max_marks: 10,
  instructions: '',
  file: null
};

const toDateInput = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 16);
};

const templateUrl = (template) => {
  const path = template?.file_path;
  if (!path) return '';
  if (String(path).startsWith('http')) return path;
  return `${import.meta.env.VITE_API_URL || '/api'}/uploads/${path}`;
};

const projectKey = (project) => String(project?.project_registration_id || project?.registration_id || project?.id || '');
const projectLabel = (project) => project?.project_title || project?.title || `Project #${projectKey(project)}`;

const MentorTemplates = () => {
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [templates, setTemplates] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [replacingId, setReplacingId] = useState(null);

  const selectedProject = useMemo(
    () => projects.find((project) => projectKey(project) === String(selectedProjectId)),
    [projects, selectedProjectId]
  );

  const fetchProjects = async () => {
    const { data } = await api.get('/mentor/assigned-projects');
    const nextProjects = data.projects || data || [];
    setProjects(nextProjects);
    setSelectedProjectId((current) => current || projectKey(nextProjects[0]));
  };

  const fetchTemplates = async (projectId = selectedProjectId) => {
    if (!projectId) {
      setTemplates([]);
      return;
    }
    const { data } = await api.get(`/mentor/templates/${projectId}`);
    setTemplates(data.templates || []);
  };

  useEffect(() => {
    const load = async () => {
      try {
        await fetchProjects();
      } catch (error) {
        console.error('Failed to load assigned projects:', error);
        toast.error('Failed to load assigned projects');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      fetchTemplates(selectedProjectId).catch((error) => {
        console.error('Failed to load templates:', error);
        toast.error('Failed to load document templates');
      });
    }
  }, [selectedProjectId]);

  const updateForm = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const uploadTemplate = async (event) => {
    event.preventDefault();
    if (!selectedProjectId) {
      toast.error('Select a project first');
      return;
    }
    if (!form.file) {
      toast.error('Choose a template file');
      return;
    }

    const payload = new FormData();
    payload.append('project_registration_id', selectedProjectId);
    payload.append('document_name', form.document_name);
    payload.append('document_type', form.document_type);
    payload.append('deadline', form.deadline);
    payload.append('max_marks', form.max_marks);
    payload.append('instructions', form.instructions);
    payload.append('is_published', 'true');
    payload.append('template_file', form.file);

    setSaving(true);
    try {
      await api.post('/mentor/templates/upload', payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Template uploaded');
      setForm(emptyForm);
      await fetchTemplates(selectedProjectId);
    } catch (error) {
      console.error('Template upload failed:', error);
      toast.error(error.response?.data?.message || 'Failed to upload template');
    } finally {
      setSaving(false);
    }
  };

  const updateTemplate = async (template, updates = {}) => {
    const payload = new FormData();
    const merged = {
      document_name: template.document_name || template.template_name,
      document_type: template.document_type,
      deadline: toDateInput(template.deadline),
      max_marks: template.max_marks || 10,
      instructions: template.instructions || '',
      is_published: template.is_published,
      ...updates
    };
    Object.entries(merged).forEach(([key, value]) => {
      if (value !== undefined && value !== null) payload.append(key, value);
    });

    setSaving(true);
    try {
      await api.patch(`/mentor/templates/${template.id}`, payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success(updates.is_published === 'true' ? 'Template published' : 'Template updated');
      await fetchTemplates(selectedProjectId);
    } catch (error) {
      console.error('Template update failed:', error);
      toast.error(error.response?.data?.message || 'Failed to update template');
    } finally {
      setSaving(false);
    }
  };

  const replaceTemplate = async (template, file) => {
    if (!file) return;
    const payload = new FormData();
    payload.append('template_file', file);
    payload.append('document_name', template.document_name || template.template_name);
    payload.append('document_type', template.document_type || '');
    payload.append('deadline', toDateInput(template.deadline));
    payload.append('max_marks', template.max_marks || 10);
    payload.append('instructions', template.instructions || '');
    payload.append('is_published', template.is_published ? 'true' : 'false');

    setReplacingId(template.id);
    try {
      await api.patch(`/mentor/templates/${template.id}`, payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Template replaced');
      await fetchTemplates(selectedProjectId);
    } catch (error) {
      console.error('Template replace failed:', error);
      toast.error(error.response?.data?.message || 'Failed to replace template');
    } finally {
      setReplacingId(null);
    }
  };

  const deleteTemplate = async (template) => {
    setSaving(true);
    try {
      await api.delete(`/mentor/templates/${template.id}`);
      toast.success('Template deleted');
      await fetchTemplates(selectedProjectId);
    } catch (error) {
      console.error('Template delete failed:', error);
      toast.error(error.response?.data?.message || 'Failed to delete template');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-slate-900" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Document Templates</h1>
          <p className="text-sm text-slate-500 mt-1">Upload and manage templates for assigned student teams.</p>
        </div>
        <select
          value={selectedProjectId}
          onChange={(event) => setSelectedProjectId(event.target.value)}
          className="w-full sm:w-80 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-950/5"
        >
          {projects.length === 0 ? (
            <option value="">No assigned projects</option>
          ) : projects.map((project) => (
            <option key={projectKey(project)} value={projectKey(project)}>{projectLabel(project)}</option>
          ))}
        </select>
      </div>

      <SectionCard title="Upload New Template" subtitle={selectedProject ? projectLabel(selectedProject) : 'Select an assigned project'}>
        <form onSubmit={uploadTemplate} className="grid grid-cols-1 lg:grid-cols-[1fr_180px_190px_100px_1.2fr_170px_auto] gap-3 items-end">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 uppercase">Document Name</label>
            <input
              value={form.document_name}
              onChange={(event) => updateForm('document_name', event.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 uppercase">Type</label>
            <select
              value={form.document_type}
              onChange={(event) => updateForm('document_type', event.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
            >
              {documentTypes.map((type) => <option key={type}>{type}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 uppercase">Deadline</label>
            <input
              type="datetime-local"
              value={form.deadline}
              onChange={(event) => updateForm('deadline', event.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 uppercase">Marks</label>
            <input
              type="number"
              min="1"
              value={form.max_marks}
              onChange={(event) => updateForm('max_marks', event.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 uppercase">Instructions</label>
            <input
              value={form.instructions}
              onChange={(event) => updateForm('instructions', event.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 uppercase">Template File</label>
            <input
              type="file"
              accept={allowedAccept}
              onChange={(event) => updateForm('file', event.target.files?.[0] || null)}
              className="w-full text-xs file:mr-3 file:rounded-lg file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:text-xs file:font-bold file:text-white"
            />
          </div>
          <button
            type="submit"
            disabled={saving || !selectedProjectId}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-slate-400"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <UploadCloud size={16} />}
            Upload
          </button>
        </form>
      </SectionCard>

      <SectionCard title="Template Management" subtitle="Publish templates to make them visible in the student Document Workspace">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-4 py-3 font-medium">Document Name</th>
                <th className="px-4 py-3 font-medium">Template File</th>
                <th className="px-4 py-3 font-medium">Deadline</th>
                <th className="px-4 py-3 font-medium">Max Marks</th>
                <th className="px-4 py-3 font-medium">Instructions</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {templates.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center text-slate-500">No templates uploaded for this project.</td>
                </tr>
              ) : templates.map((template) => (
                <tr key={template.id} className="hover:bg-slate-50 align-top">
                  <td className="px-4 py-4 min-w-44">
                    <input
                      defaultValue={template.document_name || template.template_name}
                      onBlur={(event) => updateTemplate(template, { document_name: event.target.value })}
                      className="w-full bg-transparent font-bold text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/10 rounded px-2 py-1"
                    />
                    <div className="mt-1 text-xs text-slate-500">{template.document_type}</div>
                  </td>
                  <td className="px-4 py-4 min-w-44">
                    <div className="flex items-center gap-2 font-semibold text-slate-700">
                      <FileText size={15} />
                      {template.file_name || template.template_name}
                    </div>
                    <label className="mt-2 inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50">
                      {replacingId === template.id ? <Loader2 size={13} className="animate-spin" /> : <Pencil size={13} />}
                      Replace
                      <input
                        type="file"
                        accept={allowedAccept}
                        className="hidden"
                        onChange={(event) => replaceTemplate(template, event.target.files?.[0])}
                      />
                    </label>
                  </td>
                  <td className="px-4 py-4 min-w-48">
                    <input
                      type="datetime-local"
                      defaultValue={toDateInput(template.deadline)}
                      onBlur={(event) => updateTemplate(template, { deadline: event.target.value })}
                      className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </td>
                  <td className="px-4 py-4 w-28">
                    <input
                      type="number"
                      min="1"
                      defaultValue={template.max_marks || 10}
                      onBlur={(event) => updateTemplate(template, { max_marks: event.target.value })}
                      className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </td>
                  <td className="px-4 py-4 min-w-64">
                    <textarea
                      defaultValue={template.instructions || ''}
                      onBlur={(event) => updateTemplate(template, { instructions: event.target.value })}
                      rows={2}
                      className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs resize-none"
                    />
                  </td>
                  <td className="px-4 py-4">
                    <StatusBadge status={template.is_published ? 'Published' : 'Draft'} variant={template.is_published ? 'success' : 'default'} />
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => window.open(templateUrl(template), '_blank', 'noopener,noreferrer')}
                        className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                        title="Preview"
                      >
                        <Eye size={15} />
                      </button>
                      <a
                        href={templateUrl(template)}
                        download
                        className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                        title="Download"
                      >
                        <Download size={15} />
                      </a>
                      <button
                        type="button"
                        onClick={() => updateTemplate(template, { is_published: 'true' })}
                        className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                        title="Publish"
                      >
                        <Send size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteTemplate(template)}
                        className="p-2 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50"
                        title="Delete"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
};

export default MentorTemplates;
