import React, { useEffect, useMemo, useState } from 'react';
import { Edit3, Loader2, Plus, Save, Trash2, UserCheck, X } from 'lucide-react';
import { PageHeader, SectionCard, EmptyState } from '../../components/common/PremiumComponents';
import { useApiQuery } from '../../hooks/useApiQuery';
import { queryKeys } from '../../lib/queryKeys';
import { queryClient } from '../../lib/queryClient';
import api from '../../lib/api';
import { toast } from 'sonner';

const currentYear = new Date().getFullYear();
const academicYears = Array.from({ length: 5 }, (_, index) => {
  const start = currentYear - 2 + index;
  return `${start}-${String(start + 1).slice(-2)}`;
});
const semesters = [5, 6, 7, 8];
const sections = ['1', '2', '3', '4', '5', '6', 'ALL'];
const subsections = ['1', '2', 'ALL'];

const emptyForm = {
  year: academicYears[2] || '',
  semester: '6',
  section: '1',
  subsection: '1',
  mentorId: '',
};

const getMentorId = (mentor) => mentor.user_id || mentor.id || mentor.mentor_id;

const HodMentorAllocations = () => {
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: mentors = [], isLoading: mentorsLoading, isError: mentorsError } = useApiQuery(
    queryKeys.hodMentors,
    '/hod/mentors',
    {
      staleTime: 5 * 60_000,
      select: (data) => data || [],
    }
  );

  const { data: allocations = [], isLoading: allocationsLoading, isError: allocationsError } = useApiQuery(
    queryKeys.hodMentorAllocations,
    '/hod/mentor-allocations',
    {
      staleTime: 60_000,
      select: (data) => data?.data || data || [],
    }
  );

  useEffect(() => {
    if (mentorsError) toast.error('Failed to load mentors');
    if (allocationsError) toast.error('Failed to load mentor allocations');
  }, [mentorsError, allocationsError]);

  const selectedMentor = useMemo(
    () => mentors.find((mentor) => String(getMentorId(mentor)) === String(form.mentorId)),
    [form.mentorId, mentors]
  );

  const handleChange = (field, value) => {
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleEdit = (allocation) => {
    setEditingId(allocation.id);
    setForm({
      year: allocation.year || allocation.academic_year || '',
      semester: String(allocation.semester || ''),
      section: allocation.section || '1',
      subsection: allocation.subsection || '1',
      mentorId: String(allocation.mentorId || allocation.mentor_id || ''),
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.year || !form.semester || !form.section || !form.subsection || !form.mentorId) {
      toast.error('Please select all allocation fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        year: form.year,
        semester: Number(form.semester),
        section: form.section,
        subsection: form.subsection,
        mentorId: Number(form.mentorId),
      };

      if (editingId) {
        await api.patch(`/hod/mentor-allocations/${editingId}`, payload);
        toast.success('Mentor allocation updated');
      } else {
        await api.post('/hod/mentor-allocations', payload);
        toast.success('Mentor allocation created');
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.hodMentorAllocations }),
        queryClient.invalidateQueries({ queryKey: queryKeys.hodStudents({ limit: 50 }) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.hodStats }),
        queryClient.invalidateQueries({ queryKey: queryKeys.mentorTeams }),
        queryClient.invalidateQueries({ queryKey: queryKeys.mentorAllocatedStudents }),
      ]);
      resetForm();
    } catch (error) {
      console.error('Mentor allocation submit failed:', {
        status: error.response?.status,
        data: error.response?.data,
        payload: form,
      });
      toast.error(error.response?.data?.message || 'Failed to save mentor allocation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (allocation) => {
    const confirmed = window.confirm(`Delete mentor allocation for ${allocation.year || allocation.academic_year}, semester ${allocation.semester}, section ${allocation.section}-${allocation.subsection}?`);
    if (!confirmed) return;

    try {
      await api.delete(`/hod/mentor-allocations/${allocation.id}`);
      toast.success('Mentor allocation deleted');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.hodMentorAllocations }),
        queryClient.invalidateQueries({ queryKey: queryKeys.hodStudents({ limit: 50 }) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.hodStats }),
        queryClient.invalidateQueries({ queryKey: queryKeys.mentorTeams }),
        queryClient.invalidateQueries({ queryKey: queryKeys.mentorAllocatedStudents }),
      ]);
      if (editingId === allocation.id) resetForm();
    } catch (error) {
      console.error('Mentor allocation delete failed:', {
        status: error.response?.status,
        data: error.response?.data,
        allocation,
      });
      toast.error(error.response?.data?.message || 'Failed to delete mentor allocation');
    }
  };

  const isLoading = mentorsLoading || allocationsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <PageHeader
        title="Mentor Allocation"
        description="Assign mentors to a specific academic year, semester, section, and subsection."
      />

      <SectionCard title={editingId ? 'Edit Allocation' : 'Create Allocation'} subtitle="One subsection can be mapped to one mentor.">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4">
          <label className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Academic Year</span>
            <select value={form.year} onChange={(event) => handleChange('year', event.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20">
              {academicYears.map((year) => <option key={year} value={year}>{year}</option>)}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Semester</span>
            <select value={form.semester} onChange={(event) => handleChange('semester', event.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20">
              {semesters.map((semester) => <option key={semester} value={semester}>Semester {semester}</option>)}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Section</span>
            <select value={form.section} onChange={(event) => handleChange('section', event.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20">
              {sections.map((section) => <option key={section} value={section}>{section}</option>)}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Subsection</span>
            <select value={form.subsection} onChange={(event) => handleChange('subsection', event.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20">
              {subsections.map((subsection) => <option key={subsection} value={subsection}>{subsection}</option>)}
            </select>
          </label>

          <label className="space-y-2 xl:col-span-2">
            <span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Mentor Name</span>
            <select value={form.mentorId} onChange={(event) => handleChange('mentorId', event.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20">
              <option value="">Select mentor</option>
              {mentors.map((mentor) => (
                <option key={getMentorId(mentor)} value={getMentorId(mentor)}>
                  {mentor.full_name || mentor.mentor_name || mentor.email}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2 md:col-span-2 xl:col-span-4">
            <span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Mentor Email</span>
            <input
              type="email"
              value={selectedMentor?.email || ''}
              readOnly
              placeholder="Mentor email auto-fills after selection"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-600 outline-none"
            />
          </label>

          <div className="md:col-span-2 xl:col-span-2 flex items-end gap-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white shadow-sm transition-all hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : editingId ? <Save size={16} /> : <Plus size={16} />}
              {editingId ? 'Update Allocation' : 'Assign Mentor'}
            </button>
            {editingId && (
              <button type="button" onClick={resetForm} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 transition-all hover:bg-slate-50">
                <X size={16} />
                Cancel
              </button>
            )}
          </div>
        </form>
      </SectionCard>

      <SectionCard title="Allocation List" subtitle="Current mentor-to-cohort mappings">
        {allocations.length === 0 ? (
          <EmptyState icon={UserCheck} title="No mentor allocations" description="Create the first allocation to allow a mentor to view students in a cohort." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                  <th className="pb-4">Cohort</th>
                  <th className="pb-4">Mentor</th>
                  <th className="pb-4">Students</th>
                  <th className="pb-4">Created By</th>
                  <th className="pb-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {allocations.map((allocation) => (
                  <tr key={allocation.id} className="transition-colors hover:bg-slate-50/60">
                    <td className="py-4">
                      <p className="text-sm font-black text-slate-800">{allocation.year || allocation.academic_year} / Semester {allocation.semester}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-400">Section {allocation.section} - Subsection {allocation.subsection}</p>
                    </td>
                    <td className="py-4">
                      <p className="text-sm font-black text-slate-800">{allocation.mentorName || allocation.mentor_name}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-400">{allocation.mentorEmail || allocation.mentor_email}</p>
                    </td>
                    <td className="py-4 text-sm font-bold text-slate-600">{allocation.student_count || 0}</td>
                    <td className="py-4 text-sm font-bold text-slate-500">{allocation.hod_name || 'HOD'}</td>
                    <td className="py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleEdit(allocation)} className="rounded-lg border border-slate-200 p-2 text-slate-500 transition-all hover:bg-white hover:text-slate-900">
                          <Edit3 size={15} />
                        </button>
                        <button onClick={() => handleDelete(allocation)} className="rounded-lg border border-rose-100 p-2 text-rose-500 transition-all hover:bg-rose-50">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
};

export default HodMentorAllocations;
