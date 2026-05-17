import React, { useState } from 'react';
import { CheckCircle2, XCircle, Search, Link as LinkIcon, FileText, Download } from 'lucide-react';
import { toast } from 'sonner';

const dummySubmissions = [
  { id: 1, projectName: 'AI Powered Student Tracker', team: 'Team Alpha', githubUrl: 'https://github.com/piyush/ai-tracker', demoUrl: 'https://demo.com', timeliness: 5, status: 'pending', submittedAt: '2 days ago' },
  { id: 2, projectName: 'Blockchain Voting System', team: 'Team Beta', githubUrl: 'https://github.com/rahul/voting', demoUrl: '', timeliness: 3, status: 'approved', submittedAt: '1 week ago' },
  { id: 3, projectName: 'IoT Smart Agriculture', team: 'Team Gamma', githubUrl: 'https://github.com/aditi/iot-agri', demoUrl: '', timeliness: 1, status: 'rejected', submittedAt: '3 weeks ago' },
];

const MentorFinalSubmissions = () => {
  const [submissions, setSubmissions] = useState(dummySubmissions);
  const [searchTerm, setSearchTerm] = useState('');

  const handleAction = (id, action) => {
    setSubmissions(submissions.map(sub => {
      if (sub.id === id) {
        return { ...sub, status: action };
      }
      return sub;
    }));
    toast.success(`Submission ${action} successfully`);
  };

  const filteredSubmissions = submissions.filter(sub => 
    sub.projectName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    sub.team.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Final Submissions</h1>
          <p className="text-sm text-slate-500 mt-1">Review and approve final project submissions from your assigned teams.</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search projects or teams..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredSubmissions.map((sub) => (
          <div key={sub.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col md:flex-row gap-6 md:items-center justify-between">
            
            <div className="flex-1 space-y-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-lg font-semibold text-slate-900">{sub.projectName}</h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                    sub.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                    sub.status === 'rejected' ? 'bg-rose-100 text-rose-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {sub.status}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                    sub.timeliness === 5 ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
                    sub.timeliness >= 3 ? 'bg-amber-50 text-amber-600 border border-amber-200' :
                    'bg-rose-50 text-rose-600 border border-rose-200'
                  }`}>
                    {sub.timeliness}/5 Timeliness
                  </span>
                </div>
                <p className="text-sm text-slate-500">By {sub.team} • Submitted {sub.submittedAt}</p>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-sm">
                <a href={sub.githubUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-slate-600 hover:text-blue-600 transition-colors">
                  <LinkIcon size={16} />
                  <span className="font-medium underline underline-offset-2">GitHub Repo</span>
                </a>
                {sub.demoUrl && (
                  <a href={sub.demoUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-slate-600 hover:text-blue-600 transition-colors">
                    <LinkIcon size={16} />
                    <span className="font-medium underline underline-offset-2">Live Demo</span>
                  </a>
                )}
                <div className="flex items-center gap-1.5 text-slate-600 cursor-pointer hover:text-slate-900 transition-colors">
                  <FileText size={16} />
                  <span className="font-medium">Project_Report.pdf</span>
                  <Download size={14} className="ml-0.5" />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0 pt-4 md:pt-0 border-t md:border-t-0 border-slate-100 md:pl-6 md:border-l">
              {sub.status === 'pending' ? (
                <>
                  <button 
                    onClick={() => handleAction(sub.id, 'rejected')}
                    className="flex-1 md:flex-none px-4 py-2 border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <XCircle size={16} className="text-rose-500" />
                    Reject
                  </button>
                  <button 
                    onClick={() => handleAction(sub.id, 'approved')}
                    className="flex-1 md:flex-none px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 shadow-sm"
                  >
                    <CheckCircle2 size={16} className="text-emerald-400" />
                    Approve
                  </button>
                </>
              ) : (
                <div className="flex flex-col items-end">
                  <span className="text-xs font-medium text-slate-500 mb-1">Status</span>
                  <span className={`text-sm font-semibold capitalize ${sub.status === 'approved' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {sub.status}
                  </span>
                  <button 
                    onClick={() => handleAction(sub.id, 'pending')}
                    className="text-xs text-blue-600 hover:underline mt-2"
                  >
                    Undo Action
                  </button>
                </div>
              )}
            </div>

          </div>
        ))}
      </div>
    </div>
  );
};

export default MentorFinalSubmissions;
