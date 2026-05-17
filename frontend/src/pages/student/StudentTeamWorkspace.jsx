import React from 'react';
import { 
  Users, 
  Mail, 
  Phone, 
  CheckSquare, 
  BarChart3, 
  Award,
  MoreVertical
} from 'lucide-react';
import { cn } from '../../utils/utils';

const teamMembers = [
  { id: 1, name: 'Piyush Mishra', role: 'Team Leader', email: 'piyush@example.com', phone: '+91 9876543210', tasksCompleted: 12, totalTasks: 12, contribution: 35, avatar: 'P' },
  { id: 2, name: 'John Doe', role: 'Frontend Dev', email: 'john@example.com', phone: '+91 9876543211', tasksCompleted: 8, totalTasks: 10, contribution: 25, avatar: 'J' },
  { id: 3, name: 'Jane Smith', role: 'Backend Dev', email: 'jane@example.com', phone: '+91 9876543212', tasksCompleted: 7, totalTasks: 10, contribution: 20, avatar: 'JS' },
  { id: 4, name: 'Rahul Verma', role: 'QA Tester', email: 'rahul@example.com', phone: '+91 9876543213', tasksCompleted: 5, totalTasks: 8, contribution: 15, avatar: 'R' },
  { id: 5, name: 'Neha Gupta', role: 'Documentation', email: 'neha@example.com', phone: '+91 9876543214', tasksCompleted: 4, totalTasks: 4, contribution: 5, avatar: 'N' },
];

const StudentTeamWorkspace = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Team Workspace</h1>
          <p className="text-sm text-slate-500 mt-1">Manage your project team, view roles, and track individual contributions.</p>
        </div>
        <div className="flex items-center gap-2">
           <button className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-800 transition-colors shadow-sm">
             Add Member
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm col-span-1 md:col-span-2 lg:col-span-3 xl:col-span-5 flex items-center justify-between">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                 <Users size={24} />
              </div>
              <div>
                 <h2 className="text-lg font-bold text-slate-900">Team Alpha</h2>
                 <p className="text-sm font-medium text-slate-500">AI Powered Student Tracker</p>
              </div>
           </div>
           <div className="hidden sm:flex items-center gap-6">
              <div className="text-center">
                 <div className="text-2xl font-black text-slate-900">5/5</div>
                 <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Members</div>
              </div>
              <div className="text-center">
                 <div className="text-2xl font-black text-slate-900">36/44</div>
                 <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tasks Done</div>
              </div>
           </div>
        </div>

        {teamMembers.map((member) => (
          <div key={member.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col group hover:border-blue-200 hover:shadow-md transition-all">
            <div className="p-5 flex-1 relative">
              <button className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 transition-colors">
                <MoreVertical size={16} />
              </button>
              
              <div className="flex flex-col items-center text-center mb-4">
                <div className="w-16 h-16 bg-slate-900 text-white rounded-2xl flex items-center justify-center text-2xl font-bold mb-3 shadow-sm group-hover:scale-105 transition-transform">
                  {member.avatar}
                </div>
                <h3 className="font-bold text-slate-900 text-base">{member.name}</h3>
                <span className={cn(
                  "px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider mt-1.5",
                  member.role === 'Team Leader' ? "bg-amber-100 text-amber-700" : "bg-blue-50 text-blue-600"
                )}>
                  {member.role}
                </span>
              </div>

              <div className="space-y-2 mt-6">
                <div className="flex items-center gap-2 text-xs text-slate-600 font-medium bg-slate-50 p-2 rounded-lg">
                  <Mail size={14} className="text-slate-400" />
                  <span className="truncate">{member.email}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-600 font-medium bg-slate-50 p-2 rounded-lg">
                  <Phone size={14} className="text-slate-400" />
                  <span>{member.phone}</span>
                </div>
              </div>
            </div>
            
            <div className="px-5 py-4 border-t border-slate-100 bg-slate-50 space-y-3">
              <div>
                 <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5"><CheckSquare size={12}/> Tasks</span>
                    <span className="text-xs font-bold text-slate-900">{member.tasksCompleted}/{member.totalTasks}</span>
                 </div>
                 <div className="w-full bg-slate-200 rounded-full h-1.5">
                    <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${(member.tasksCompleted / member.totalTasks) * 100}%` }}></div>
                 </div>
              </div>
              
              <div className="flex justify-between items-center pt-1">
                 <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5"><Award size={12}/> Contribution</span>
                 <span className="text-xs font-bold text-emerald-600">{member.contribution}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StudentTeamWorkspace;
