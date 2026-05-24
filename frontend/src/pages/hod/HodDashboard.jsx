import React, { useState } from 'react';
import { 
  Building2, 
  Users, 
  CheckCircle2, 
  FileDown,
  ShieldCheck,
  Search,
  Award,
  Loader2,
  TrendingUp,
  FileText,
  Clock,
  UserCheck
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { 
  PageHeader, 
  StatCard, 
  SectionCard, 
  StatusBadge 
} from '../../components/common/PremiumComponents';
import api from '../../lib/api';
import { toast } from 'sonner';
import { cn } from '../../utils/utils';
import { useApiQuery } from '../../hooks/useApiQuery';
import { queryKeys } from '../../lib/queryKeys';
import { useHodStatsChartOptions } from '../../hooks/useEChartOptions';

const HodDashboard = () => {
  const [exporting, setExporting] = useState(false);
  const { data: stats = null, isLoading: loading } = useApiQuery(
    queryKeys.hodStats,
    '/hod/dashboard-stats',
    { staleTime: 60_000 }
  );
  useHodStatsChartOptions(stats);

  const handleExport = async (type) => {
    try {
      setExporting(true);
      const res = await api.get(`/hod/export-report?type=${type}`);
      
      const data = res.data;
      if (!data || data.length === 0) {
        toast.error(`No data found for ${type} report.`);
        return;
      }
      
      // Convert JSON to CSV
      const headers = Object.keys(data[0]).join(',');
      const rows = data.map(row => 
        Object.values(row).map(val => 
          typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val
        ).join(',')
      ).join('\n');
      
      const csvContent = `${headers}\n${rows}`;
      
      // Trigger download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `ProjectFlow_${type}_report.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`Exported ${type} report successfully.`);
    } catch (error) {
      toast.error(`Failed to export ${type} report.`);
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const deptStats = [
    { label: 'Total Forms', value: stats?.totalForms || 0, icon: FileText, color: 'indigo' },
    { label: 'Published Forms', value: stats?.publishedForms || 0, icon: CheckCircle2, color: 'blue' },
    { label: 'Total Submissions', value: stats?.totalSubmissions || 0, icon: Users, color: 'fuchsia' },
    { label: 'Pending Approvals', value: stats?.pendingApprovals || 0, icon: Clock, color: 'amber' },
    { label: 'Approved Projects', value: stats?.approvedProjects || 0, icon: ShieldCheck, color: 'emerald' },
    { label: 'Rejected Projects', value: stats?.rejectedProjects || 0, icon: TrendingUp, color: 'rose' },
    { label: 'Mentor Assigned', value: stats?.mentorAssignedProjects || 0, icon: UserCheck, color: 'violet' },
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <PageHeader 
        title="Department Administration" 
        description="Global oversight of academic projects, mentor evaluations, and student outcomes."
        actions={
          <div className="flex items-center gap-3">
             <button 
               onClick={() => handleExport('submissions')}
               disabled={exporting}
               className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-all shadow-sm active:scale-95"
             >
                <FileDown size={18} />
                Submissions
             </button>
             <button 
               onClick={() => handleExport('approved')}
               disabled={exporting}
               className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-all shadow-sm active:scale-95"
             >
                <FileDown size={18} />
                Approved
             </button>
             <button 
               onClick={() => handleExport('mentors')}
               disabled={exporting}
               className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-95"
             >
                <FileDown size={18} />
                Mentors
             </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {deptStats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>
      
      <SectionCard 
        title="Quick Actions" 
        subtitle="Manage forms and submissions"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="p-6 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col gap-2">
            <h3 className="font-bold text-slate-900">Registration Forms</h3>
            <p className="text-sm text-slate-500">Create, publish, and manage project registration forms for students.</p>
            <a href="/hod/templates" className="mt-4 flex items-center justify-center w-full px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors">
              Publish Student Project Form
            </a>
          </div>
          <div className="p-6 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col gap-2">
            <h3 className="font-bold text-slate-900">Submissions & Approvals</h3>
            <p className="text-sm text-slate-500">Review student registrations, approve projects, and assign mentors.</p>
            <a href="/hod/approvals" className="mt-4 flex items-center justify-center w-full px-4 py-2 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 transition-colors">
              Review Submissions
            </a>
          </div>
        </div>
      </SectionCard>
    </div>
  );
};

export default HodDashboard;
