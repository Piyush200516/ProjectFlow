import React, { useState, useEffect } from 'react';
import { Users, Search, Filter, Loader2, Mail } from 'lucide-react';
import { PageHeader, SectionCard } from '../../components/common/PremiumComponents';
import api from '../../lib/api';
import { toast } from 'sonner';

const HodStudents = () => {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        // We'll use a generic /auth/users or /students endpoint if available, 
        // for now let's assume we can fetch students from a dedicated endpoint
        const { data } = await api.get('/auth/me'); // This is just to test API connection
        // In a real app, HOD would have access to list all users
        // Mocking for now since we don't have a list-all-users API yet
        setStudents([
          { id: 1, full_name: 'Piyush Mishra', email: 'student@college.edu', role: 'student', active: true },
          { id: 2, full_name: 'Rahul Verma', email: 'rahul@college.edu', role: 'student', active: true },
        ]);
      } catch (error) {
        console.error('Failed to fetch students:', error);
        toast.error('Failed to load student registry');
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
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
      <PageHeader title="Student Registry" description="Manage and monitor student enrollments across departmental projects." />
      
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search students..." 
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

      <SectionCard title="Department Students" subtitle="Active student database">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-100">
                <th className="pb-4 font-black">Full Name</th>
                <th className="pb-4 font-black">Email</th>
                <th className="pb-4 font-black">Status</th>
                <th className="pb-4 font-black text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {students.map((student) => (
                <tr key={student.id} className="group hover:bg-slate-50/50 transition-colors cursor-pointer">
                  <td className="py-5">
                     <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-xs font-black text-slate-600">{student.full_name[0]}</div>
                        <span className="font-black text-slate-800 text-sm tracking-tight">{student.full_name}</span>
                     </div>
                  </td>
                  <td className="py-5 text-xs font-bold text-slate-500">{student.email}</td>
                  <td className="py-5">
                    <div className="flex items-center gap-2">
                       <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                       <span className="text-[10px] font-black uppercase text-slate-400">Active</span>
                    </div>
                  </td>
                  <td className="py-5 text-right">
                    <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-900 transition-all">
                      <Mail size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
};

export default HodStudents;
