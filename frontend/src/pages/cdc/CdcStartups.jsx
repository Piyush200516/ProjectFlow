import React, { useState, useEffect } from 'react';
import { Rocket, Plus, Search, Loader2, ExternalLink } from 'lucide-react';
import { PageHeader, SectionCard, StatusBadge } from '../../components/common/PremiumComponents';
import api from '../../lib/api';
import { toast } from 'sonner';

const CdcStartups = () => {
  const [loading, setLoading] = useState(true);
  const [startups, setStartups] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchStartups = async () => {
      try {
        const { data } = await api.get('/cdc/startups');
        setStartups(data);
      } catch (error) {
        console.error('Failed to fetch startups:', error);
        toast.error('Failed to load startup incubation records');
      } finally {
        setLoading(false);
      }
    };
    fetchStartups();
  }, []);

  const filteredStartups = startups.filter(s =>
    (s.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        title="Startup Ecosystem" 
        description="Monitor and manage all incubated projects transitioning into commercial startups." 
        actions={
          <button className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-95">
            <Plus size={18} />
            Register Startup
          </button>
        }
      />
      
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search startups..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStartups.length > 0 ? filteredStartups.map((startup) => (
          <SectionCard 
            key={startup.id}
            title={startup.name}
            subtitle={startup.project_title || 'Independent Startup'}
            headerActions={
              <button className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-900 transition-all">
                <ExternalLink size={16} />
              </button>
            }
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                 <StatusBadge status={startup.stage} variant="info" />
                 <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-widest">{startup.funding}</span>
              </div>
              <div className="flex flex-col gap-1">
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Founder</p>
                 <p className="text-xs font-black text-slate-700">{startup.founder_name}</p>
              </div>
            </div>
          </SectionCard>
        )) : (
          <div className="col-span-full text-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
             <Rocket size={48} className="mx-auto text-slate-200 mb-4" />
             <p className="text-slate-400 font-bold">No active startups found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CdcStartups;
