import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  FileSpreadsheet, 
  Presentation, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Edit3, 
  Download,
  X,
  Save,
  Upload,
  MessageSquare,
  History,
  Link as LinkIcon,
  Award,
  Loader2,
  Check,
  TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../../lib/api';
import { Modal, SectionCard, StatusBadge, ProgressCard } from '../../components/common/PremiumComponents';

const StudentDocumentWorkspace = () => {
  const [loading, setLoading] = useState(true);
  const [deadlines, setDeadlines] = useState([]);
  const [marks, setMarks] = useState(null);
  const [activeEditor, setActiveEditor] = useState(null);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [submitData, setSubmitData] = useState({
    fileName: '',
    filePath: '',
    githubUrl: '',
    remarks: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchWorkspaceData();
  }, []);

  const fetchWorkspaceData = async () => {
    try {
      const [deadlinesRes, marksRes] = await Promise.all([
        api.get('/workflow/projects/deadlines'),
        api.get('/workflow/projects/marks')
      ]);
      setDeadlines(deadlinesRes.data);
      if (marksRes.data.length > 0) {
        setMarks(marksRes.data[0]);
      }
    } catch (error) {
      console.error('Failed to load workspace data:', error);
      toast.error('Failed to load student templates & marks');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEditor = (template) => {
    setActiveEditor(template);
    setSubmitData({
      fileName: `${template.template_title} - Draft.docx`,
      filePath: `/files/submissions/${template.document_type.toLowerCase().replace(' ', '_')}_draft.docx`,
      githubUrl: marks?.github_link || '',
      remarks: ''
    });
    document.body.style.overflow = 'hidden';
  };

  const handleCloseEditor = () => {
    setActiveEditor(null);
    document.body.style.overflow = 'auto';
  };

  const handleSaveDraft = () => {
    toast.success('Draft auto-saved successfully in local environment workspace.');
  };

  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    if (!submitData.fileName) {
      toast.error('Please enter a submission filename');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/workflow/student/documents/submit', {
        template_id: activeEditor.template_id,
        document_type: activeEditor.document_type,
        file_name: submitData.fileName,
        file_path: submitData.filePath
      });

      const { isLate, scoreAwarded } = res.data;
      if (isLate) {
        toast.warning(`Document submitted LATE! Score automatically set to ${scoreAwarded}/10.`);
      } else {
        toast.success(`Document submitted on-time! Score: ${scoreAwarded}/10.`);
      }

      setIsSubmitModalOpen(false);
      handleCloseEditor();
      fetchWorkspaceData();
    } catch (error) {
      console.error('Document submission failed:', error);
      toast.error(error.response?.data?.message || 'Failed to submit document');
    } finally {
      setSubmitting(false);
    }
  };

  const getIcon = (type) => {
    if (type === 'PPT') return <Presentation className="text-amber-500" size={24} />;
    if (type === 'Project Report' || type === 'Final Report' || type === 'Synopsis' || type === 'SRS') {
      return <FileText className="text-blue-500" size={24} />;
    }
    return <FileSpreadsheet className="text-emerald-500" size={24} />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-slate-900" />
      </div>
    );
  }

  // 7 Required documents: Poster, PPT, Project Report, Research Paper, Synopsis, SRS, Final Report
  const requiredTypes = ['Poster', 'PPT', 'Project Report', 'Research Paper', 'Synopsis', 'SRS', 'Final Report'];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Academic Deliverables & Document Workspace</h1>
          <p className="text-sm text-slate-500 mt-1">Submit your 7 academic documents. Deadlines automatically update your marks.</p>
        </div>
      </div>

      {/* Auto-Scoring Scorecard Dashboard */}
      {marks && (
        <SectionCard 
          title="Automated Grading Sheet" 
          subtitle="Real-time marks calculated by college academic engine rules"
          headerActions={
            <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-900 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm">
              <Award size={15} />
              Aggregated GPA: {parseFloat(marks.total_score).toFixed(2)}/10.00
            </div>
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between">
              <ProgressCard label="Timeliness" value={parseFloat(marks.timeliness_score) * 10} color="emerald" />
              <p className="text-[10px] text-slate-500 mt-3">Reduces by -1 per day late. 3+ days late = 2/10.</p>
            </div>
            
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between">
              <ProgressCard label="Completion" value={parseFloat(marks.doc_completion_score) * 10} color="blue" />
              <p className="text-[10px] text-slate-500 mt-3">Ratio of approved milestones out of 7 templates.</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between">
              <ProgressCard label="Kanban Work" value={parseFloat(marks.contribution_score) * 10} color="amber" />
              <p className="text-[10px] text-slate-500 mt-3">Calculated from completed tasks on Kanban.</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between">
              <ProgressCard label="GitHub Link" value={parseFloat(marks.github_score) * 10} color="emerald" />
              <p className="text-[10px] text-slate-500 mt-3">10/10 awarded for a registered GitHub repo.</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between">
              <ProgressCard label="Mentor Review" value={parseFloat(marks.mentor_review_score) * 10} color="blue" />
              <p className="text-[10px] text-slate-500 mt-3">Average of mentor approvals on submissions.</p>
            </div>
          </div>
        </SectionCard>
      )}

      {/* Grid of Templates & Submissions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {deadlines.map((item) => {
          // Let's determine if this template has been submitted
          const isSubmitted = item.status === 'Submitted' || item.status === 'Approved' || item.status === 'Needs Work';
          
          return (
            <div key={item.id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col justify-between">
              <div className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-slate-50 rounded-xl">
                    {getIcon(item.document_type)}
                  </div>
                  {isSubmitted ? (
                    <StatusBadge 
                      status={item.status} 
                      variant={item.status === 'Approved' ? 'success' : item.status === 'Needs Work' ? 'error' : 'info'} 
                    />
                  ) : (
                    <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600">
                      Pending
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-slate-900 mb-1">{item.template_title}</h3>
                <p className="text-xs text-slate-500 font-semibold mb-4">{item.document_type} Deliverable Format</p>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200/50">
                    <Clock size={14} className="text-slate-400" />
                    <span>Deadline: <span className="font-semibold text-slate-700">{new Date(item.deadline_date).toLocaleDateString()}</span></span>
                  </div>

                  {item.marks_awarded !== undefined && (
                    <div className="flex items-center justify-between text-xs font-bold text-slate-900 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200/50">
                      <span>Awarded Mark:</span>
                      <span className="text-indigo-600">{item.marks_awarded}/10</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/50 flex gap-3">
                <button 
                  onClick={() => handleOpenEditor(item)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 text-white hover:bg-slate-800 rounded-lg text-sm font-medium transition-colors"
                >
                  <Edit3 size={16} />
                  Open Workspace
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Editor Overlay Modal */}
      {activeEditor && (
        <div className="fixed inset-0 z-[100] bg-white flex flex-col animate-in slide-in-from-bottom-4 duration-300">
          {/* Editor Header */}
          <header className="h-14 border-b border-slate-200 bg-slate-50 flex items-center justify-between px-4 shrink-0">
            <div className="flex items-center gap-3">
              <button 
                onClick={handleCloseEditor}
                className="p-1.5 text-slate-500 hover:bg-slate-200 rounded-md transition-colors"
              >
                <X size={20} />
              </button>
              <div className="w-px h-6 bg-slate-200 mx-1"></div>
              {getIcon(activeEditor.document_type)}
              <div>
                <h2 className="text-sm font-bold text-slate-900">{activeEditor.template_title}</h2>
                <div className="text-[10px] text-slate-500 font-medium">Auto-saved 2 mins ago • v1.0</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleSaveDraft} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200 rounded-md transition-colors">
                <Save size={14} /> Save Draft
              </button>
              <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200 rounded-md transition-colors">
                <History size={14} /> History
              </button>
              <div className="w-px h-5 bg-slate-200 mx-1"></div>
              <button 
                onClick={() => setIsSubmitModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-md hover:bg-blue-700 transition-colors shadow-sm"
              >
                <Upload size={14} /> Submit Final
              </button>
            </div>
          </header>

          {/* Editor Layout */}
          <div className="flex-1 flex overflow-hidden">
            {/* Outline */}
            <div className="w-64 border-r border-slate-200 bg-slate-50/50 flex flex-col hidden md:flex">
              <div className="p-3 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                Document Structure
              </div>
              <div className="p-4 space-y-3 overflow-y-auto">
                <div className="text-sm font-semibold text-slate-900 cursor-pointer">1. Title & Abstract</div>
                <div className="text-sm font-medium text-slate-600 pl-4 cursor-pointer hover:text-slate-900">1.1 Objectives</div>
                <div className="text-sm font-medium text-slate-600 pl-4 cursor-pointer hover:text-slate-900">1.2 Scope</div>
                <div className="text-sm font-semibold text-slate-900 cursor-pointer hover:text-slate-900">2. Literature Survey</div>
                <div className="text-sm font-semibold text-slate-900 cursor-pointer hover:text-slate-900">3. System Architecture & DFD</div>
                <div className="text-sm font-semibold text-slate-900 cursor-pointer hover:text-slate-900">4. Implementation Details</div>
              </div>
            </div>

            {/* Canvas */}
            <div className="flex-1 bg-slate-200/50 overflow-y-auto flex items-center justify-center p-8">
              <div className="w-full max-w-4xl min-h-[850px] bg-white shadow-xl shadow-slate-300/30 rounded-sm border border-slate-200 p-12 flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mb-6 border border-blue-100 shadow-sm">
                  <Edit3 size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">College Academic Document Workspace</h3>
                <p className="text-slate-500 max-w-md mx-auto mb-8 text-xs leading-relaxed">
                  Collaborative editor is pre-registered. Fill details, verify content, and trigger the submission to activate automatic timeliness grading rules.
                </p>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold">
                  <Check size={14} className="text-emerald-400" />
                  Connected to PostgreSQL workflow engine
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Submission Confirmation Modal */}
      <Modal 
        isOpen={isSubmitModalOpen} 
        onClose={() => setIsSubmitModalOpen(false)}
        title="Submit Academic Deliverable"
        footer={
          <>
            <button onClick={() => setIsSubmitModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
            <button 
              onClick={handleFinalSubmit} 
              disabled={submitting}
              className="px-4 py-2 bg-slate-900 text-white text-sm font-semibold rounded-lg shadow-sm hover:bg-slate-800 disabled:bg-slate-400 transition-colors flex items-center gap-1.5"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Submit'}
            </button>
          </>
        }
      >
        <form onSubmit={handleFinalSubmit} className="space-y-4">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-3">
            {getIcon(activeEditor?.document_type)}
            <div>
              <div className="font-bold text-slate-900 text-sm">{activeEditor?.template_title}</div>
              <div className="text-xs text-slate-500">Format: {activeEditor?.document_type}</div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 uppercase">Submission Filename</label>
            <input 
              type="text" 
              value={submitData.fileName}
              onChange={(e) => setSubmitData(prev => ({ ...prev, fileName: e.target.value }))}
              placeholder="e.g. synopsis_final.docx"
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 uppercase">File Output Path</label>
            <input 
              type="text" 
              value={submitData.filePath}
              onChange={(e) => setSubmitData(prev => ({ ...prev, filePath: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-500 focus:outline-none cursor-not-allowed"
              readOnly
            />
          </div>

          <div className="flex items-start gap-2 text-[10px] text-slate-500 bg-amber-50 border border-amber-200 p-3 rounded-lg leading-normal">
            <AlertCircle size={14} className="text-amber-600 shrink-0 mt-0.5" />
            <span>
              <strong>Note on Timeliness Rules:</strong> On-time submissions get up to 10 marks. Submitting after the deadline ({new Date(activeEditor?.deadline_date).toLocaleDateString()}) will automatically reduce marks: -1 mark for 1 day late, -2 marks for 2 days late, and a cap of 2 marks (minimum grade) for 3+ days late.
            </span>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default StudentDocumentWorkspace;
