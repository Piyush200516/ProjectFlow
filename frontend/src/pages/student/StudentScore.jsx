import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Target, 
  Award, 
  Download,
  Zap,
  Star,
  Shield,
  Loader2
} from 'lucide-react';
import { 
  PageHeader, 
  StatCard, 
  SectionCard, 
  ProgressCard 
} from '../../components/common/PremiumComponents';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';

const StudentScore = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [evaluation, setEvaluation] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: projects } = await api.get('/projects');
        if (projects.length > 0) {
          const { data: projectDetails } = await api.get(`/projects/${projects[0].id}`);
          if (projectDetails.evaluations && projectDetails.evaluations.length > 0) {
            setEvaluation(projectDetails.evaluations[0]);
          }
        }
      } catch (error) {
        console.error('Failed to fetch scores:', error);
        toast.error('Failed to load performance analytics');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <PageHeader 
        title="Performance Analytics" 
        description="Comprehensive evaluation of your project contributions and skills."
        actions={
          <button className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-700 font-black rounded-2xl hover:bg-slate-50 transition-all shadow-sm active:scale-95">
            <Download size={20} />
            Download Transcript
          </button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={Trophy} label="Total Credits" value={evaluation?.total_credits || '0'} trend="up" trendValue={evaluation?.total_credits} color="blue" />
        <StatCard icon={Target} label="Innovation" value={`${evaluation?.innovation_score || 0}%`} color="green" />
        <StatCard icon={Star} label="Technical" value={`${evaluation?.technical_score || 0}%`} color="amber" />
        <StatCard icon={Shield} label="Verified Tier" value={evaluation?.tier || 'N/A'} color="indigo" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <SectionCard 
          title="Skill Breakdown" 
          subtitle="Evaluation results across core areas"
          className="lg:col-span-2"
        >
          <div className="space-y-8 mt-6">
            <ProgressCard label="Innovation Score" value={evaluation?.innovation_score || 0} color="blue" />
            <ProgressCard label="Technical Depth" value={evaluation?.technical_score || 0} color="indigo" />
            <ProgressCard label="Documentation" value={evaluation?.documentation_score || 0} color="emerald" />
            <ProgressCard label="Presentation" value={evaluation?.presentation_score || 0} color="amber" />
          </div>
        </SectionCard>

        <div className="space-y-8">
          <SectionCard title="Academic Standing" subtitle="Current ranking status">
            <div className="p-8 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl w-full text-center shadow-xl shadow-blue-600/20">
              <p className="text-[10px] text-white/60 font-black uppercase tracking-[0.2em]">Current Academic Tier</p>
              <p className="text-2xl font-black text-white mt-2 tracking-tighter italic flex items-center justify-center gap-3">
                <Award className="text-amber-400" size={28} />
                {evaluation?.tier || 'PREMIER A+'}
              </p>
            </div>
            <div className="mt-8 p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm">
                     <Zap size={20} />
                  </div>
                  <div>
                     <p className="text-xs font-black text-slate-800">Next Tier Unlock</p>
                     <p className="text-[10px] font-bold text-slate-400">Keep contributing to reach the next level!</p>
                  </div>
               </div>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
};

export default StudentScore;
