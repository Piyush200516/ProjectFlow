import React, { useState } from 'react';
import { 
  FileDown, 
  Search, 
  CheckCircle2, 
  AlertCircle,
  FileText,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';

const dummyTracking = [
  { id: 1, project: 'AI Powered Student Tracker', team: 'Team Alpha', document: 'Project Synopsis', mentor: 'Dr. Sharma', status: 'Approved', timeliness: 'On Time', isLate: false },
  { id: 2, project: 'Blockchain Voting System', team: 'Team Beta', document: 'SRS Document', mentor: 'Dr. Verma', status: 'Under Review', timeliness: '1 Day Late', isLate: true },
  { id: 3, project: 'IoT Smart Agriculture', team: 'Team Gamma', document: 'Final Report', mentor: 'Dr. Singh', status: 'Pending', timeliness: '3 Days Late', isLate: true },
  { id: 4, project: 'E-commerce Platform', team: 'Team Delta', document: 'Project Synopsis', mentor: 'Dr. Sharma', status: 'Approved', timeliness: 'On Time', isLate: false },
];

const HodSubmissionTracking = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLate, setFilterLate] = useState(false);

  const handleExport = () => {
    toast.success('Submission report exported to Excel successfully.');
  };

  let filteredData = dummyTracking.filter(t => 
    t.project.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.team.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (filterLate) {
    filteredData = filteredData.filter(t => t.isLate);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Submission Tracking</h1>
          <p className="text-sm text-slate-500 mt-1">Track document submissions, late filings, and mentor approvals across all teams.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700 bg-white px-3 py-2 border border-slate-200 rounded-lg shadow-sm cursor-pointer hover:bg-slate-50">
            <input 
              type="checkbox" 
              checked={filterLate} 
              onChange={(e) => setFilterLate(e.target.checked)}
              className="rounded border-slate-300 text-rose-600 focus:ring-rose-500"
            />
            Show Late Only
          </label>
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
          <button 
            onClick={handleExport}
            className="w-full sm:w-auto px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 shadow-sm shrink-0"
          >
            <FileDown size={16} />
            Export Report
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-medium">Project & Team</th>
                <th className="px-6 py-4 font-medium">Document</th>
                <th className="px-6 py-4 font-medium">Mentor</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Timeliness</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-900">{item.project}</div>
                    <div className="text-xs text-slate-500">{item.team}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 font-medium text-slate-700">
                      <FileText size={16} className="text-blue-500" />
                      {item.document}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-600">{item.mentor}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 w-fit ${
                      item.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' :
                      item.status === 'Under Review' ? 'bg-amber-100 text-amber-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {item.status === 'Approved' && <CheckCircle2 size={12} />}
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`flex items-center gap-1.5 font-medium text-xs ${
                      item.isLate ? 'text-rose-600 bg-rose-50 px-2 py-1 rounded-md w-fit' : 'text-emerald-600'
                    }`}>
                      {item.isLate ? <AlertCircle size={14} /> : <Clock size={14} />}
                      {item.timeliness}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-slate-500 font-medium">
                    No submissions found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default HodSubmissionTracking;
