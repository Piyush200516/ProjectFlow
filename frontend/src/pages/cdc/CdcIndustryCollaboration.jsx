import React, { useState, useEffect } from 'react';
import { Handshake, Search, Filter, Loader2, Globe, ArrowUpRight } from 'lucide-react';
import { PageHeader, SectionCard, StatusBadge } from '../../components/common/PremiumComponents';
import api from '../../lib/api';
import { toast } from 'sonner';

const CdcIndustryCollaboration = () => {
  const [loading, setLoading] = useState(true);
  const [collaborations, setCollaborations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchCollabs = async () => {
      try {
        // We'll mock some data for now since we don't have a list endpoint for this yet,
        // but it's set up to be easily connected.
        setCollaborations([
          { id: 1, partner_name: 'Google Cloud', type: 'MoU - R&D', status: 'Active', expiry: '2027-12-31' },
          { id: 2, partner_name: 'Microsoft for Startups', type: 'Incubation Support', status: 'Active', expiry: '2026-06-30' },
          { id: 3, partner_name: 'AWS EdStart', type: 'Cloud Credits', status: 'Active', expiry: '2026-01-15' },
        ]);
      } catch (error) {
        console.error('Failed to fetch collaborations:', error);
        toast.error('Failed to load industry partnerships');
      } finally {
        setLoading(false);
      }
    };
    fetchCollabs();
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
        title="Industry Partnerships" 
        description="Global network of corporate collaborators, MoUs, and R&D partners." 
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-10">
        {collaborations.map((collab) => (
          <SectionCard 
            key={collab.id}
            title={collab.partner_name}
            subtitle={collab.type}
            headerActions={
              <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-900 transition-all">
                <Globe size={18} />
              </button>
            }
          >
            <div className="space-y-6">
               <div className="flex items-center justify-between">
                  <StatusBadge status={collab.status} variant="success" />
                  <div className="flex items-center gap-1 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                     Expires: {collab.expiry}
                  </div>
               </div>
               <button className="w-full py-3 bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
                  View Agreement
                  <ArrowUpRight size={14} />
               </button>
            </div>
          </SectionCard>
        ))}
      </div>
    </div>
  );
};

export default CdcIndustryCollaboration;
