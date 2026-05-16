import React from 'react';
import { mockProjects } from '../../data/mockData';
import { 
  Users, 
  CheckCircle, 
  Clock, 
  MessageCircle,
  TrendingUp,
  ExternalLink,
  Calendar
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';

const MentorDashboard = () => {
  const stats = [
    { label: 'Assigned Projects', value: '12', icon: Users, color: 'blue' },
    { label: 'Pending Reviews', value: '5', icon: Clock, color: 'amber' },
    { label: 'Completed Stages', value: '28', icon: CheckCircle, color: 'green' },
    { label: 'Unread Messages', value: '8', icon: MessageCircle, color: 'indigo' },
  ];

  const submissionData = [
    { name: 'Week 1', submissions: 12 },
    { name: 'Week 2', submissions: 18 },
    { name: 'Week 3', submissions: 15 },
    { name: 'Week 4', submissions: 22 },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Mentor Dashboard</h1>
          <p className="text-slate-500 mt-1">Manage your assigned projects and review student progress.</p>
        </div>
        <button className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all">
          <Calendar size={20} />
          Schedule Review
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <div className={`w-12 h-12 bg-${stat.color}-50 text-${stat.color}-600 rounded-xl flex items-center justify-center mb-4`}>
              <stat.icon size={24} />
            </div>
            <h3 className="text-slate-500 text-sm font-medium">{stat.label}</h3>
            <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Submission Activity</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={submissionData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Line type="monotone" dataKey="submissions" stroke="#2563eb" strokeWidth={3} dot={{ r: 6, fill: '#2563eb', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Recent Review Requests</h3>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 rounded-xl border border-slate-50 hover:border-slate-200 hover:bg-slate-50 transition-all group">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">Milestone: UI Design</h4>
                    <p className="text-xs text-slate-500 mt-1">Project Flow Team • 2h ago</p>
                  </div>
                  <button className="text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ExternalLink size={16} />
                  </button>
                </div>
                <div className="mt-3 flex gap-2">
                  <button className="flex-1 py-1.5 bg-blue-600 text-white text-[10px] font-bold rounded-lg">Approve</button>
                  <button className="flex-1 py-1.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-lg">Details</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MentorDashboard;
