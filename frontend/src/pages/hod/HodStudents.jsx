import React from 'react';
import { Users, Search, Filter, Plus } from 'lucide-react';
import { PageHeader, SectionCard } from '../../components/common/PremiumComponents';

const HodStudents = () => (
  <div className="space-y-10 animate-in fade-in duration-700">
    <PageHeader title="Student Registry" description="Manage and monitor student enrollments across departmental projects." />
    <SectionCard title="Department Students" subtitle="Active student database">
       <div className="py-20 text-center border-2 border-dashed border-slate-100 rounded-3xl">
          <Users size={48} className="mx-auto text-slate-200 mb-4" />
          <p className="text-slate-400 font-bold">Student management system coming soon.</p>
       </div>
    </SectionCard>
  </div>
);

export default HodStudents;
