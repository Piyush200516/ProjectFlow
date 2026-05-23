import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Search, 
  CheckCircle2, 
  XCircle,
  Eye,
  History,
  MessageSquare,
  Loader2,
  Clock,
  AlertCircle,
  Download
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../../lib/api';
import { Modal, StatusBadge } from '../../components/common/PremiumComponents';

const MentorDocumentReviews = () => {
  const [loading, setLoading] = useState(true);
  const [submissions, setSubmissions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReview, setSelectedReview] = useState(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [remarks, setRemarks] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      const res = await api.get('/workflow/mentor/submissions');
      setSubmissions(res.data);
    } catch (error) {
      console.error('Failed to fetch mentor submissions:', error);
      toast.error('Failed to load student submissions');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReview = (review) => {
    setSelectedReview(review);
    setRemarks('');
    setIsReviewModalOpen(true);
  };

  const handleAction = async (status) => {
    setSubmittingReview(true);
    try {
      await api.post(`/workflow/mentor/submissions/${selectedReview.id}/review`, {
        status,
        comments: remarks
      });
      toast.success(`Document marked as "${status}" and graded!`);
      setIsReviewModalOpen(false);
      fetchSubmissions();
    } catch (error) {
      console.error('Review failed:', error);
      toast.error('Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const filteredReviews = submissions.filter(r => 
    (r.file_name || r.document_type || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (r.project_title || '').toLowerCase().includes(searchTerm.toLowerCase())
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Academic Document Review Hub</h1>
          <p className="text-sm text-slate-500 mt-1">Review deliverable submissions from your assigned project teams and post final approvals.</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search documents or teams..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-950/5 focus:border-slate-950 transition-all shadow-sm"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-medium">Document / Category</th>
                <th className="px-6 py-4 font-medium">Team & Student</th>
                <th className="px-6 py-4 font-medium">Timeliness Status</th>
                <th className="px-6 py-4 font-medium">Verification Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredReviews.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-400">
                    No deliverables submitted yet for review.
                  </td>
                </tr>
              ) : (
                filteredReviews.map((review) => (
                  <tr key={review.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg border border-blue-100 shadow-sm">
                          <FileText size={18} />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">{review.file_name}</div>
                          <div className="text-xs text-slate-500">{review.document_type}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{review.project_title}</div>
                      <div className="text-xs text-slate-500">by {review.student_name}</div>
                    </td>
                    <td className="px-6 py-4">
                      {review.is_late ? (
                        <span className="flex items-center gap-1 text-xs font-semibold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-md w-fit border border-rose-100">
                          <Clock size={12} /> {review.late_days} Days Late
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md w-fit border border-emerald-100">
                          On-Time
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge 
                        status={review.status} 
                        variant={review.status === 'Approved' ? 'success' : review.status === 'Needs Work' ? 'error' : 'info'} 
                      />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleOpenReview(review)}
                        className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm flex items-center justify-end gap-1.5 ml-auto active:scale-95"
                      >
                        <Eye size={14} />
                        Review
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Modal */}
      <Modal 
        isOpen={isReviewModalOpen} 
        onClose={() => setIsReviewModalOpen(false)}
        title="Faculty Review & Score Approval"
        footer={
          <div className="flex w-full justify-between items-center">
            <button onClick={() => setIsReviewModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Close</button>
            <div className="flex gap-2">
              <button 
                onClick={() => handleAction('Needs Work')} 
                disabled={submittingReview}
                className="px-4 py-2 bg-white border border-rose-200 text-rose-600 text-sm font-semibold rounded-lg hover:bg-rose-50 transition-colors flex items-center gap-2"
              >
                <XCircle size={16} /> Needs Work
              </button>
              <button 
                onClick={() => handleAction('Approved')} 
                disabled={submittingReview}
                className="px-4 py-2 bg-slate-900 text-white text-sm font-semibold rounded-lg shadow-sm hover:bg-slate-800 transition-colors flex items-center gap-2"
              >
                <CheckCircle2 size={16} /> Approve deliverable
              </button>
            </div>
          </div>
        }
      >
        <div className="space-y-6">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-bold text-slate-900">{selectedReview?.file_name}</h3>
                <p className="text-xs text-slate-500">{selectedReview?.project_title} • Submitted by {selectedReview?.student_name}</p>
              </div>
            </div>
            
            <div className="space-y-2 mt-4 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Document Type:</span>
                <span className="font-semibold text-slate-900">{selectedReview?.document_type}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Auto Timeliness Score:</span>
                <span className="font-semibold text-indigo-600">{selectedReview?.marks_awarded}/10</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Timeliness Info:</span>
                <span className="font-semibold text-slate-900">{selectedReview?.is_late ? `LATE by ${selectedReview?.late_days} days` : 'On-Time Submission'}</span>
              </div>
            </div>

            <a 
              href={selectedReview?.file_path} 
              target="_blank" 
              rel="noreferrer"
              className="w-full mt-4 py-2 bg-white border border-slate-200 text-slate-700 hover:text-slate-900 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
            >
              <Download size={14} /> Download Submitted Deliverable
            </a>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <MessageSquare size={16} className="text-slate-400" />
              Add Mentor Feedback
            </label>
            <textarea 
              rows="4"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Provide comments, corrections or reasons for revision..."
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-950/5 resize-none"
            ></textarea>
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default MentorDocumentReviews;
