import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis
} from 'recharts';
import { 
  Trophy, 
  Target, 
  Award, 
  TrendingUp,
  ChevronRight,
  Download
} from 'lucide-react';

const StudentScore = () => {
  const performanceData = [
    { subject: 'Innovation', A: 120, fullMark: 150 },
    { subject: 'Development', A: 98, fullMark: 150 },
    { subject: 'Documentation', A: 86, fullMark: 150 },
    { subject: 'Presentation', A: 99, fullMark: 150 },
    { subject: 'Collaboration', A: 85, fullMark: 150 },
  ];

  const taskCompletionData = [
    { name: 'Completed', value: 400 },
    { name: 'In Progress', value: 300 },
    { name: 'Pending', value: 300 },
  ];

  const COLORS = ['#2563eb', '#8b5cf6', '#e2e8f0'];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Student Performance Score</h1>
          <p className="text-slate-500 mt-1">Holistic analysis of your academic project contributions.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-all">
          <Download size={18} />
          Export Report
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Radar Chart for Skills */}
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center">
          <h3 className="text-lg font-bold text-slate-900 mb-6 w-full text-left">Skill Matrix</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={performanceData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="subject" tick={{fill: '#64748b', fontSize: 12}} />
                <PolarRadiusAxis angle={30} domain={[0, 150]} />
                <Radar
                  name="Piyush"
                  dataKey="A"
                  stroke="#2563eb"
                  fill="#2563eb"
                  fillOpacity={0.5}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 p-4 bg-blue-50 rounded-xl w-full text-center">
            <p className="text-xs text-blue-600 font-bold uppercase tracking-wider">Overall Ranking</p>
            <p className="text-3xl font-extrabold text-blue-900 mt-1">A+</p>
          </div>
        </div>

        {/* Detailed Stats */}
        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                  <Trophy size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">Total Credits</h4>
                  <p className="text-sm text-slate-500">Earned from all projects</p>
                </div>
              </div>
              <p className="text-4xl font-black text-slate-900 tracking-tighter">840 <span className="text-lg font-normal text-slate-400">/ 1000</span></p>
            </div>
            
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-green-50 text-green-600 rounded-xl">
                  <Target size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">Consistency Score</h4>
                  <p className="text-sm text-slate-500">Based on task completion</p>
                </div>
              </div>
              <p className="text-4xl font-black text-slate-900 tracking-tighter">92%</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Task Distribution</h3>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={taskCompletionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {taskCompletionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-8 mt-4">
              {taskCompletionData.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{backgroundColor: COLORS[index]}}></div>
                  <span className="text-xs font-medium text-slate-600">{entry.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentScore;
