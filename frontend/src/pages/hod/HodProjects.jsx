import React from 'react';
import { Building2, Search, Filter, Download } from 'lucide-react';
import { PageHeader, SectionCard, StatusBadge } from '../../components/common/PremiumComponents';

const HodProjects = () => (
  <div className="space-y-10 animate-in fade-in duration-700">
    <PageHeader title="Department Project Repository" description="Global view of all projects within the department." />
    <SectionCard title="All Projects" subtitle="Filter and monitor across all academic years">
      <div className="py-20 text-center border-2 border-dashed border-slate-100 rounded-3xl">
         <Building2 size={48} className="mx-auto text-slate-200 mb-4" />
         <p className="text-slate-400 font-bold">Project data visualization coming soon.</p>
      </div>
    </SectionCard>
  </div>
);

export default HodProjects;
