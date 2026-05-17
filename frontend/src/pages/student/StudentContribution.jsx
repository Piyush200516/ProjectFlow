import React from 'react';
import { Award, CheckCircle2, Clock, FileText, GitBranch, Target } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { cn } from '../../utils/utils';

// Dummy Team Data
const teamMembers = [
  { id: 1, name: 'Piyush Mishra', roll: '2021CS01', branch: 'CSE', role: 'Team Leader', tasksAssigned: 12, tasksCompleted: 12, timeliness: 5, docsScore: 10, githubScore: 5, mentorScore: 48 },
  { id: 2, name: 'Aditi Sharma', roll: '2021CS02', branch: 'CSE', role: 'Member', tasksAssigned: 10, tasksCompleted: 9, timeliness: 4, docsScore: 8, githubScore: 5, mentorScore: 42 },
  { id: 3, name: 'Rahul Verma', roll: '2021CS03', branch: 'CSE', role: 'Member', tasksAssigned: 8, tasksCompleted: 8, timeliness: 5, docsScore: 9, githubScore: 5, mentorScore: 45 },
  { id: 4, name: 'Sneha Gupta', roll: '2021CS04', branch: 'CSE', role: 'Member', tasksAssigned: 10, tasksCompleted: 7, timeliness: 3, docsScore: 7, githubScore: 0, mentorScore: 35 },
  { id: 5, name: 'Karan Singh', roll: '2021CS05', branch: 'CSE', role: 'Member', tasksAssigned: 6, tasksCompleted: 6, timeliness: 5, docsScore: 8, githubScore: 5, mentorScore: 40 },
];

const StudentContribution = () => {
  // Logic to calculate final marks
  const calculateMarks = (member) => {
    // Breakdown logic:
    // Work Contribution (Mentor score out of 50): max 50
    // Task Completion (out of 20): (tasksCompleted / tasksAssigned) * 20
    // Timeliness (out of 15): (timeliness / 5) * 15
    // Documentation (out of 10): docsScore
    // GitHub Submission (out of 5): githubScore
    
    const taskCompletionScore = (member.tasksCompleted / member.tasksAssigned) * 20;
    const timelinessScore = (member.timeliness / 5) * 15;
    
    const total = member.mentorScore + taskCompletionScore + timelinessScore + member.docsScore + member.githubScore;
    
    return {
      work: member.mentorScore,
      tasks: Math.round(taskCompletionScore),
      time: timelinessScore,
      docs: member.docsScore,
      github: member.githubScore,
      total: Math.round(total)
    };
  };

  const chartData = teamMembers.map(member => {
    const marks = calculateMarks(member);
    return {
      name: member.name.split(' ')[0],
      tasks: Math.round((member.tasksCompleted / member.tasksAssigned) * 100),
      totalScore: marks.total
    };
  });

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Contribution & Marks</h1>
          <p className="text-sm text-slate-500 mt-1">View individual contribution metrics and final scores for all team members.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg shadow-sm">
          <Award size={18} />
          <span className="text-sm font-semibold">Total: 100 Marks</span>
        </div>
      </div>

      {/* Evaluation Rubric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center space-y-2">
          <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-1">
            <Target size={20} />
          </div>
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Work / Mentor</div>
          <div className="text-xl font-bold text-slate-900">50 <span className="text-sm font-medium text-slate-500">pts</span></div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center space-y-2">
          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-1">
            <CheckCircle2 size={20} />
          </div>
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tasks</div>
          <div className="text-xl font-bold text-slate-900">20 <span className="text-sm font-medium text-slate-500">pts</span></div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center space-y-2">
          <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mb-1">
            <Clock size={20} />
          </div>
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Timeliness</div>
          <div className="text-xl font-bold text-slate-900">15 <span className="text-sm font-medium text-slate-500">pts</span></div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center space-y-2">
          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-1">
            <FileText size={20} />
          </div>
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Docs</div>
          <div className="text-xl font-bold text-slate-900">10 <span className="text-sm font-medium text-slate-500">pts</span></div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center space-y-2">
          <div className="w-10 h-10 bg-slate-100 text-slate-700 rounded-full flex items-center justify-center mb-1">
            <GitBranch size={20} />
          </div>
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">GitHub</div>
          <div className="text-xl font-bold text-slate-900">5 <span className="text-sm font-medium text-slate-500">pts</span></div>
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="mb-4">
            <h3 className="text-base font-bold text-slate-900">Task Completion Rate</h3>
            <p className="text-xs text-slate-500">Percentage of assigned tasks completed by each member</p>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} domain={[0, 100]} />
                <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="tasks" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Completion %" maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="mb-4">
            <h3 className="text-base font-bold text-slate-900">Overall Contribution Marks</h3>
            <p className="text-xs text-slate-500">Final calculated marks out of 100 per member</p>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="totalScore"
                  nameKey="name"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Team Contribution Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
          <h2 className="text-base font-semibold text-slate-900">Team Score Breakdown</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 font-medium">Student</th>
                <th className="px-6 py-3 font-medium">Tasks (Comp/Assigned)</th>
                <th className="px-6 py-3 font-medium">% Comp</th>
                <th className="px-6 py-3 font-medium">Timeliness (x/5)</th>
                <th className="px-6 py-3 font-medium text-right bg-indigo-50/30">Final Marks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {teamMembers.map((member) => {
                const marks = calculateMarks(member);
                const completionPercentage = Math.round((member.tasksCompleted / member.tasksAssigned) * 100);
                
                return (
                  <tr key={member.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-900">{member.name}</span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-slate-500">{member.roll}</span>
                          <span className="text-slate-300">•</span>
                          <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider", 
                            member.role === 'Team Leader' ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"
                          )}>
                            {member.role}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-slate-900">{member.tasksCompleted}</span>
                        <span className="text-slate-400">/</span>
                        <span className="text-slate-500">{member.tasksAssigned}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 w-32">
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={cn("h-full rounded-full transition-all", 
                              completionPercentage >= 90 ? "bg-emerald-500" : 
                              completionPercentage >= 70 ? "bg-blue-500" : "bg-amber-500"
                            )}
                            style={{ width: `${completionPercentage}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-slate-700 w-8">{completionPercentage}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <Clock size={14} className={cn(
                          member.timeliness === 5 ? "text-emerald-500" : 
                          member.timeliness >= 3 ? "text-amber-500" : "text-rose-500"
                        )} />
                        <span className="font-medium text-slate-900">{member.timeliness}</span>
                        <span className="text-slate-400 text-xs">/5</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right bg-indigo-50/10">
                      <div className="flex flex-col items-end">
                        <span className={cn("text-lg font-bold", 
                          marks.total >= 90 ? "text-emerald-600" : 
                          marks.total >= 75 ? "text-blue-600" : 
                          marks.total >= 60 ? "text-amber-600" : "text-rose-600"
                        )}>
                          {marks.total}
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium">/ 100</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default StudentContribution;
