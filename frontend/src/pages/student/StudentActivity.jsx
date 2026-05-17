import React from 'react';
import { Activity, MessageSquare, CheckSquare, Rocket, AlertCircle, Clock } from 'lucide-react';

const activities = [
  { id: 1, type: 'task', user: 'Piyush Mishra', action: 'completed task', target: 'Frontend UI for Login', time: '10 minutes ago', icon: CheckSquare, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  { id: 2, type: 'comment', user: 'Dr. Sharma (Mentor)', action: 'commented on', target: 'Project Synopsis', time: '2 hours ago', icon: MessageSquare, color: 'text-blue-500', bg: 'bg-blue-50' },
  { id: 3, type: 'milestone', user: 'Team Alpha', action: 'reached milestone', target: 'Design Phase Complete', time: '1 day ago', icon: Rocket, color: 'text-indigo-500', bg: 'bg-indigo-50' },
  { id: 4, type: 'alert', user: 'System', action: 'deadline approaching for', target: 'Final Submission', time: '2 days ago', icon: AlertCircle, color: 'text-rose-500', bg: 'bg-rose-50' },
  { id: 5, type: 'task', user: 'Aditi Sharma', action: 'started working on', target: 'Backend API Integration', time: '3 days ago', icon: Activity, color: 'text-amber-500', bg: 'bg-amber-50' },
];

const StudentActivity = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Activity Feed</h1>
          <p className="text-sm text-slate-500 mt-1">Real-time updates on your project, tasks, and mentor feedback.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="relative border-l-2 border-slate-100 ml-4 space-y-8 py-2">
          {activities.map((activity, index) => {
            const Icon = activity.icon;
            return (
              <div key={activity.id} className="relative pl-8">
                {/* Timeline Dot */}
                <div className={`absolute -left-[17px] top-1 w-8 h-8 rounded-full flex items-center justify-center border-4 border-white ${activity.bg} ${activity.color} shadow-sm`}>
                  <Icon size={14} strokeWidth={2.5} />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <p className="text-sm text-slate-700">
                      <span className="font-semibold text-slate-900">{activity.user}</span>{' '}
                      {activity.action}{' '}
                      <span className="font-medium text-slate-900">{activity.target}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 shrink-0">
                    <Clock size={12} />
                    <span>{activity.time}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default StudentActivity;
