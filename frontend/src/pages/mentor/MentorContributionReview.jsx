import React, { useState } from 'react';
import { Search, Save, User } from 'lucide-react';
import { toast } from 'sonner';

const dummyStudents = [
  { id: 1, name: 'Piyush Mishra', team: 'Team Alpha', roll: '2021CS01', tasksCompleted: 12, tasksAssigned: 12, timeliness: 5, docsScore: 10, githubScore: 5, mentorScore: 45 },
  { id: 2, name: 'Aditi Sharma', team: 'Team Alpha', roll: '2021CS02', tasksCompleted: 9, tasksAssigned: 10, timeliness: 4, docsScore: 8, githubScore: 5, mentorScore: 40 },
  { id: 3, name: 'John Doe', team: 'Team Beta', roll: '2021CS08', tasksCompleted: 5, tasksAssigned: 5, timeliness: 5, docsScore: 9, githubScore: 0, mentorScore: 35 },
];

const MentorContributionReview = () => {
  const [students, setStudents] = useState(dummyStudents);
  const [searchTerm, setSearchTerm] = useState('');

  const handleScoreChange = (id, newScore) => {
    let score = parseInt(newScore, 10);
    if (isNaN(score)) score = 0;
    if (score > 50) score = 50;
    if (score < 0) score = 0;

    setStudents(students.map(s => s.id === id ? { ...s, mentorScore: score } : s));
  };

  const calculateTotal = (student) => {
    const taskScore = (student.tasksCompleted / student.tasksAssigned) * 20;
    const timeScore = (student.timeliness / 5) * 15;
    return Math.round(student.mentorScore + taskScore + timeScore + student.docsScore + student.githubScore);
  };

  const handleSave = () => {
    toast.success('Scores saved successfully!');
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.team.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Contribution Review</h1>
          <p className="text-sm text-slate-500 mt-1">Evaluate and assign work contribution marks (out of 50) for each student.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search students..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
            />
          </div>
          <button 
            onClick={handleSave}
            className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors flex items-center gap-2 shadow-sm shrink-0"
          >
            <Save size={16} />
            Save All
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-medium">Student Info</th>
                <th className="px-6 py-4 font-medium text-center">System Calculated (50 pts)</th>
                <th className="px-6 py-4 font-medium text-center">Mentor Work Score (50 pts)</th>
                <th className="px-6 py-4 font-medium text-right">Total Final Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.map((student) => {
                const total = calculateTotal(student);
                const taskScore = Math.round((student.tasksCompleted / student.tasksAssigned) * 20);
                const timeScore = Math.round((student.timeliness / 5) * 15);
                const sysCalcTotal = taskScore + timeScore + student.docsScore + student.githubScore;

                return (
                  <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                          {student.name[0]}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">{student.name}</div>
                          <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                            <span>{student.roll}</span>
                            <span>•</span>
                            <span className="font-medium">{student.team}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col items-center gap-1">
                        <div className="text-lg font-bold text-slate-700">{sysCalcTotal} <span className="text-xs text-slate-400 font-medium">/ 50</span></div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-wider">
                          Tsk:{taskScore} Tim:{timeScore} Doc:{student.docsScore} Git:{student.githubScore}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center items-center gap-2">
                        <input 
                          type="number"
                          min="0"
                          max="50"
                          value={student.mentorScore}
                          onChange={(e) => handleScoreChange(student.id, e.target.value)}
                          className="w-20 px-3 py-1.5 text-center bg-white border border-slate-300 rounded-lg text-lg font-bold text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        />
                        <span className="text-sm font-medium text-slate-400">/ 50</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right bg-slate-50/30">
                      <div className="flex flex-col items-end">
                        <span className={`text-xl font-bold ${
                          total >= 90 ? 'text-emerald-600' :
                          total >= 75 ? 'text-blue-600' :
                          total >= 60 ? 'text-amber-600' : 'text-rose-600'
                        }`}>
                          {total}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Out of 100</span>
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

export default MentorContributionReview;
