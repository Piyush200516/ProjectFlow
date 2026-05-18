import React, { useState, useEffect } from 'react';
import { 
  FileDown, 
  Search, 
  CheckCircle2, 
  AlertCircle,
  FileText,
  Clock,
  Loader2,
  Filter,
  TrendingUp,
  Layers,
  Award
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../../lib/api';
import { SectionCard, PageHeader, StatusBadge } from '../../components/common/PremiumComponents';

const HodSubmissionTracking = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tracking');
  const [trackingData, setTrackingData] = useState([]);
  const [marksData, setMarksData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLate, setFilterLate] = useState(false);

  useEffect(() => {
    fetchInitData();
  }, []);

  const fetchInitData = async () => {
    setLoading(true);
    try {
      const [trackRes, marksRes] = await Promise.all([
        api.get('/workflow/hod/tracking'),
        api.get('/workflow/projects/marks') // We can query global marks
      ]);
      setTrackingData(trackRes.data);
      setMarksData(marksRes.data);
    } catch (error) {
      console.error('Failed to load tracking data:', error);
      toast.error('Failed to fetch tracking records from backend');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    // Generate simple csv payload
    let csvContent = "data:text/csv;charset=utf-8,";
    if (activeTab === 'tracking') {
      csvContent += "Project,Team Name,Student Name,Document Type,Status,Late Status,Marks Awarded\n";
      trackingData.forEach(row => {
        csvContent += `"${row.project_title}","${row.team_name || 'Group'}","${row.student_name}","${row.document_type}","${row.status}","${row.is_late ? 'Late' : 'On-Time'}","${row.marks_awarded || 0}"\n`;
      });
    } else {
      csvContent += "Student Name,Project Name,Timeliness Score,Completion Score,Kanban Contribution,GitHub Score,Mentor Review,Total Score\n";
      marksData.forEach(row => {
        csvContent += `"${row.student_name}","${row.project_title}","${row.timeliness_score}","${row.doc_completion_score}","${row.contribution_score}","${row.github_score}","${row.mentor_review_score}","${row.total_score}"\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", activeTab === 'tracking' ? "submission_tracking_report.csv" : "student_marks_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Report successfully exported and downloaded in CSV format!');
  };

  let filteredTracking = trackingData.filter(t => 
    (t.project_title || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (t.student_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.document_type || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (filterLate) {
    filteredTracking = filteredTracking.filter(t => t.is_late);
  }

  const filteredMarks = marksData.filter(m => 
    (m.student_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (m.project_title || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-slate-900" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Departmental Oversight & Reports" 
        description="Monitor all batches, submission timeliness, mentor reviews, and export academic grades."
      />

      {/* Tabs */}
      <div className="flex justify-between items-center border-b border-slate-200">
        <div className="flex">
          <button 
            onClick={() => setActiveTab('tracking')}
            className={`pb-4 px-6 font-semibold text-sm transition-all border-b-2 ${
              activeTab === 'tracking' 
                ? 'border-slate-900 text-slate-900' 
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Submissions Tracking ({trackingData.length})
          </button>
          <button 
            onClick={() => setActiveTab('marks')}
            className={`pb-4 px-6 font-semibold text-sm transition-all border-b-2 ${
              activeTab === 'marks' 
                ? 'border-slate-900 text-slate-900' 
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Marks Report ({marksData.length})
          </button>
        </div>

        <div className="flex items-center gap-3 pb-3">
          {activeTab === 'tracking' && (
            <label className="flex items-center gap-2 text-xs font-bold text-slate-700 bg-white px-3 py-2 border border-slate-200 rounded-lg shadow-sm cursor-pointer hover:bg-slate-50 select-none">
              <input 
                type="checkbox" 
                checked={filterLate} 
                onChange={(e) => setFilterLate(e.target.checked)}
                className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
              />
              Show Late Only
            </label>
          )}

          <div className="relative w-48 sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-slate-950/5 focus:border-slate-950 transition-all shadow-sm"
            />
          </div>

          <button 
            onClick={handleExport}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm shrink-0 active:scale-95"
          >
            <FileDown size={14} />
            Export Data
          </button>
        </div>
      </div>

      {/* Tracking View */}
      {activeTab === 'tracking' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-medium">Project & Student</th>
                  <th className="px-6 py-4 font-medium">Academic Deliverable</th>
                  <th className="px-6 py-4 font-medium">Mentor</th>
                  <th className="px-6 py-4 font-medium">Submission Timeliness</th>
                  <th className="px-6 py-4 font-medium">Review Status</th>
                  <th className="px-6 py-4 font-medium">Mark</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTracking.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-slate-400">
                      No deliverables submitted yet.
                    </td>
                  </tr>
                ) : (
                  filteredTracking.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">{item.project_title}</div>
                        <div className="text-xs text-slate-500">by {item.student_name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 font-medium text-slate-700">
                          <FileText size={16} className="text-blue-500" />
                          {item.document_type}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-600">{item.mentor_name || 'Unassigned'}</td>
                      <td className="px-6 py-4">
                        {item.is_late ? (
                          <span className="flex items-center gap-1 text-xs font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100 w-fit">
                            <AlertCircle size={12} /> {item.late_days} Days Late
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 w-fit">
                            <Clock size={12} /> On-Time
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge 
                          status={item.status} 
                          variant={item.status === 'Approved' ? 'success' : item.status === 'Needs Work' ? 'error' : 'info'} 
                        />
                      </td>
                      <td className="px-6 py-4 font-black text-indigo-650">{item.marks_awarded || 0}/10</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Marks Report View */}
      {activeTab === 'marks' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-medium">Student & Team</th>
                  <th className="px-6 py-4 font-medium">Timeliness</th>
                  <th className="px-6 py-4 font-medium">Deliverables Completion</th>
                  <th className="px-6 py-4 font-medium">Kanban Contribution</th>
                  <th className="px-6 py-4 font-medium">GitHub Repository</th>
                  <th className="px-6 py-4 font-medium">Mentor Review</th>
                  <th className="px-6 py-4 font-medium">Aggregated Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMarks.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-slate-400">
                      No evaluation score records computed yet.
                    </td>
                  </tr>
                ) : (
                  filteredMarks.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">{item.student_name}</div>
                        <div className="text-xs text-slate-500">{item.project_title}</div>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-700">{parseFloat(item.timeliness_score).toFixed(2)}/10</td>
                      <td className="px-6 py-4 font-medium text-slate-700">{parseFloat(item.doc_completion_score).toFixed(2)}/10</td>
                      <td className="px-6 py-4 font-medium text-slate-700">{parseFloat(item.contribution_score).toFixed(2)}/10</td>
                      <td className="px-6 py-4 font-medium text-slate-700">{parseFloat(item.github_score).toFixed(2)}/10</td>
                      <td className="px-6 py-4 font-medium text-slate-700">{parseFloat(item.mentor_review_score).toFixed(2)}/10</td>
                      <td className="px-6 py-4 font-black text-emerald-650 flex items-center gap-1">
                        <Award size={14} className="text-emerald-500" />
                        {parseFloat(item.total_score).toFixed(2)}/10
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default HodSubmissionTracking;
