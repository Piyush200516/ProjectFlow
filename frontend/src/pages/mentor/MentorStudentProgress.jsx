import React, { useEffect, useMemo } from 'react';
import { Download, Loader2, Star, Users } from 'lucide-react';
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { toast } from 'sonner';
import { EmptyState, PageHeader, SectionCard, StatusBadge } from '../../components/common/PremiumComponents';
import { useApiQuery } from '../../hooks/useApiQuery';
import { queryKeys } from '../../lib/queryKeys';

const COLORS = ['#2563eb', '#8b5cf6', '#10b981', '#f59e0b', '#3b82f6'];

const MentorStudentProgress = () => {
  const { data: students = [], isLoading, isError } = useApiQuery(
    queryKeys.mentorAllocatedStudents,
    '/mentor/allocated-students',
    {
      staleTime: 60_000,
      select: (data) => data?.data || data || [],
    }
  );

  useEffect(() => {
    if (isError) toast.error('Failed to load assigned students');
  }, [isError]);

  const chartData = useMemo(() => students.map((student) => ({
    name: student.full_name || student.email || 'Student',
    score: Number(student.score || 0),
  })), [students]);

  const topStudents = useMemo(
    () => [...chartData].sort((a, b) => b.score - a.score).slice(0, 3),
    [chartData]
  );

  const handleExport = () => {
    const rows = students.map((student) => [
      student.full_name || '',
      student.email || '',
      student.roll_number || '',
      student.academic_year || '',
      student.semester || '',
      student.section || '',
      student.subsection || '',
      Number(student.score || 0),
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,'
      + [
        'Name,Email,Roll Number,Academic Year,Semester,Section,Subsection,Score',
        ...rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')),
      ].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'assigned_student_progress_report.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
    toast.success('Report exported as CSV');
  };

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
        title="Student Growth Hub"
        description="Monitor students assigned to you by HOD mentor allocation."
        actions={
          <button
            onClick={handleExport}
            disabled={students.length === 0}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download size={18} />
            Export Report
          </button>
        }
      />

      {students.length === 0 ? (
        <SectionCard>
          <EmptyState icon={Users} title="No students assigned" description="Students will appear here after the HOD assigns your mentor allocation." />
        </SectionCard>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <SectionCard title="Performance Distribution" subtitle="Scores for students in your allocated cohorts">
                <div className="mt-4 h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }} dy={15} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }} />
                      <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 16px 24px -12px rgb(15 23 42 / 0.25)' }} />
                      <Bar dataKey="score" radius={[8, 8, 0, 0]} barSize={40}>
                        {chartData.map((entry, index) => (
                          <Cell key={`${entry.name}-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </SectionCard>
            </div>

            <SectionCard title="Performance Leaders" subtitle="Top students from your allocations">
              <div className="space-y-4">
                {topStudents.map((student, index) => (
                  <div key={`${student.name}-${index}`} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-4 transition-all hover:border-blue-200">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-sm font-black text-blue-600 shadow-sm">
                        {student.name[0] || 'S'}
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-800">{student.name}</p>
                        <p className="text-xs font-bold text-slate-400">Score: {student.score}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-amber-500">
                      <Star size={14} className="fill-current" />
                      <span className="text-xs font-black">Top {index + 1}</span>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>

          <SectionCard title="Assigned Students" subtitle="Only students in your allocated sections are listed">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                    <th className="pb-4">Student</th>
                    <th className="pb-4">Cohort</th>
                    <th className="pb-4">Score</th>
                    <th className="pb-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {students.map((student) => (
                    <tr key={student.id} className="transition-colors hover:bg-slate-50/60">
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-xs font-black text-slate-600">
                            {(student.full_name || student.email || 'S')[0]}
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-800">{student.full_name}</p>
                            <p className="text-xs font-semibold text-slate-400">{student.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 text-sm font-bold text-slate-500">
                        {student.academic_year || 'N/A'} / Sem {student.semester || 'N/A'} / {student.section || '-'}-{student.subsection || '-'}
                      </td>
                      <td className="py-4 text-sm font-black text-slate-700">{Number(student.score || 0)}</td>
                      <td className="py-4">
                        <StatusBadge status={student.is_active ? 'Active' : 'Inactive'} variant={student.is_active ? 'success' : 'warning'} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </>
      )}
    </div>
  );
};

export default MentorStudentProgress;
