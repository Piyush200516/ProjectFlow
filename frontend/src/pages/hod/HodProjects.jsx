import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Building2, Search, Filter, ExternalLink, Loader2 } from 'lucide-react';
import { PageHeader, SectionCard, StatusBadge } from '../../components/common/PremiumComponents';
import { toast } from 'sonner';
import { getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useApiQuery } from '../../hooks/useApiQuery';
import { useFuzzySearch } from '../../hooks/useFuzzySearch';
import { queryKeys } from '../../lib/queryKeys';

const HodProjects = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const tableContainerRef = useRef(null);
  const { data: projects = [], isLoading, isError } = useApiQuery(
    queryKeys.hodProjects({ limit: 50 }),
    '/hod/projects',
    {
      params: { limit: 50 },
      select: (data) => data?.data || data || [],
      staleTime: 2 * 60_000,
    }
  );

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedSearchTerm(searchTerm), 250);
    return () => window.clearTimeout(timeout);
  }, [searchTerm]);

  useEffect(() => {
    if (isError) toast.error('Failed to load project repository');
  }, [isError]);

  const searchKeys = useMemo(() => ['title', 'type', 'mentor_name', 'status'], []);
  const filteredProjects = useFuzzySearch(projects, debouncedSearchTerm, searchKeys);
  const columns = useMemo(() => [
    { accessorKey: 'title' },
    { accessorKey: 'type' },
    { accessorKey: 'mentor_name' },
    { accessorKey: 'status' },
    { accessorKey: 'progress' },
  ], []);
  const table = useReactTable({
    data: filteredProjects,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });
  const rows = table.getRowModel().rows;
  useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 72,
    overscan: 8,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <PageHeader 
        title="Department Project Repository" 
        description="Global view of all academic projects within the department." 
      />
      
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search all projects..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
          />
        </div>
        <div className="flex items-center gap-2">
           <button className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
              <Filter size={18} />
           </button>
        </div>
      </div>

      <SectionCard title="All Projects" subtitle="Filter and monitor across all academic years">
        <div ref={tableContainerRef} className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-100">
                <th className="pb-4 font-black">Project Title</th>
                <th className="pb-4 font-black">Type</th>
                <th className="pb-4 font-black">Mentor</th>
                <th className="pb-4 font-black">Status</th>
                <th className="pb-4 font-black">Progress</th>
                <th className="pb-4 font-black text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {rows.length > 0 ? rows.map((row) => {
                const project = row.original;
                return (
                <tr key={project.id} className="group hover:bg-slate-50/50 transition-colors cursor-pointer">
                  <td className="py-5">
                     <span className="font-black text-slate-800 text-sm tracking-tight">{project.title}</span>
                  </td>
                  <td className="py-5 text-xs font-bold text-slate-500">{project.type}</td>
                  <td className="py-5">
                     <span className="text-xs font-bold text-slate-600">{project.mentor_name || 'Unassigned'}</span>
                  </td>
                  <td className="py-5">
                    <StatusBadge status={project.status} variant={project.status === 'Completed' ? 'success' : 'info'} />
                  </td>
                  <td className="py-5 text-xs font-bold text-slate-500">{project.progress}%</td>
                  <td className="py-5 text-right">
                    <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-900 transition-all">
                      <ExternalLink size={16} />
                    </button>
                  </td>
                </tr>
              )}) : (
                <tr>
                   <td colSpan="6" className="py-20 text-center text-slate-400 font-bold">No projects found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
};

export default HodProjects;
