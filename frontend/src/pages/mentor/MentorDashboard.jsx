import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { 
  PageHeader, 
  StatCard, 
  SectionCard, 
  StatusBadge 
} from '../../components/common/PremiumComponents';
import { 
  Users, 
  CheckCircle, 
  Clock, 
  MessageCircle,
  TrendingUp,
  ExternalLink,
  Calendar,
  AlertCircle,
  Mail,
  ChevronRight,
  ShieldCheck,
  Search,
  Filter,
  Loader2
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import api from '../../lib/api';
import { cn } from '../../utils/utils';

const MentorDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsRes, reviewsRes] = await Promise.all([
          api.get('/mentor/dashboard'),
          api.get('/mentor/reviews')
        ]);
        setStats(statsRes.data);
        setReviews(reviewsRes.data);
      } catch (error) {
        console.error('Failed to fetch mentor dashboard:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const statCards = [
    { label: 'Assigned', value: stats?.assigned || '0', icon: Users, color: 'blue' },
    { label: 'Pending', value: stats?.pending || '0', icon: Clock, color: 'amber' },
    { label: 'Completed', value: stats?.completed || '0', icon: CheckCircle, color: 'green' },
    { label: 'Late', value: stats?.lateSubmissions || '0', icon: AlertCircle, color: 'rose' },
  ];

  const submissionData = [
    { name: 'Week 1', submissions: 12 },
    { name: 'Week 2', submissions: 18 },
    { name: 'Week 3', submissions: 15 },
    { name: 'Week 4', submissions: 22 },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader 
        title="Dashboard" 
        description="Monitor assigned project pipelines and evaluate team progress."
        actions={
          <div className="flex items-center gap-2">
             <button 
               onClick={() => navigate('/mentor/schedule')}
               className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-semibold transition-all active:scale-95"
             >
                <Calendar size={16} />
                Schedule
             </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <SectionCard 
          title="Submission Velocity" 
          subtitle="Artifacts uploaded across teams"
          className="lg:col-span-2"
          headerActions={
             <div className="flex bg-slate-50 p-1 rounded-lg border border-slate-200/60">
                <button className="px-3 py-1 bg-white text-xs font-semibold rounded shadow-sm border border-slate-100">Review</button>
                <button className="px-3 py-1 text-xs font-semibold text-slate-500">History</button>
             </div>
          }
        >
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={submissionData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 500}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 500}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontWeight: 600, fontSize: '12px', color: '#0f172a' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="submissions" 
                  stroke="#0f172a" 
                  strokeWidth={2} 
                  dot={{ r: 4, fill: '#0f172a', strokeWidth: 2, stroke: '#fff' }} 
                  activeDot={{ r: 6, strokeWidth: 0 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <div className="space-y-6">
          <SectionCard title="Review Queue" subtitle="Pending approvals">
            <div className="space-y-3">
              {reviews.length > 0 ? reviews.map((item, i) => (
                <div 
                  key={item.id} 
                  onClick={() => navigate('/mentor/review-requests')}
                  className="p-3 rounded-lg border border-slate-100 hover:border-slate-200 hover:bg-slate-50/50 transition-all group relative cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                         <span className={cn("w-1.5 h-1.5 rounded-full", 
                           item.priority === 'High' ? "bg-rose-500" :
                           item.priority === 'Medium' ? "bg-amber-500" : "bg-emerald-500"
                         )}></span>
                         <h4 className="text-xs font-semibold text-slate-900 tracking-tight">{item.title}</h4>
                      </div>
                      <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{item.team_name || 'Team'} • {new Date(item.updated_at).toLocaleDateString()}</p>
                    </div>
                    <ChevronRight size={14} className="text-slate-300 group-hover:text-slate-900 transition-all group-hover:translate-x-0.5" />
                  </div>
                </div>
              )) : (
                <div className="text-center py-6 text-slate-400 text-xs font-bold">No pending reviews</div>
              )}
            </div>
          </SectionCard>

          <SectionCard title="Performance" subtitle="Response time">
             <div className="flex items-end gap-2 mb-3">
                <span className="text-2xl font-bold text-slate-900">4.2h</span>
                <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full mb-1 uppercase tracking-wider">Top 5%</span>
             </div>
             <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-slate-900 w-[85%] rounded-full"></div>
             </div>
             <p className="text-[9px] font-medium text-slate-400 mt-2 text-center">Avg evaluation turnaround</p>
          </SectionCard>
        </div>
      </div>
    </div>
  );
};

export default MentorDashboard;
