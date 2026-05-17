import React, { useState } from 'react';
import { 
  FileText, 
  Search, 
  CheckCircle2, 
  XCircle,
  Eye,
  History,
  MessageSquare
} from 'lucide-react';
import { toast } from 'sonner';
import { Modal } from '../../components/common/PremiumComponents';

const dummyReviews = [
  { id: 1, title: 'Project Synopsis', team: 'Team Alpha', student: 'Piyush Mishra', type: 'Word', submittedAt: '2 hours ago', status: 'Under Review', version: 'v2' },
  { id: 2, title: 'System Architecture', team: 'Team Beta', student: 'John Doe', type: 'PPT', submittedAt: '1 day ago', status: 'Submitted', version: 'v1' },
  { id: 3, title: 'SRS Document', team: 'Team Gamma', student: 'Jane Smith', type: 'Word', submittedAt: '3 days ago', status: 'Approved', version: 'v3' },
];

const MentorDocumentReviews = () => {
  const [reviews, setReviews] = useState(dummyReviews);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReview, setSelectedReview] = useState(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [remarks, setRemarks] = useState('');

  const handleOpenReview = (review) => {
    setSelectedReview(review);
    setRemarks('');
    setIsReviewModalOpen(true);
  };

  const handleAction = (status) => {
    setReviews(reviews.map(r => r.id === selectedReview.id ? { ...r, status } : r));
    toast.success(`Document marked as ${status}`);
    setIsReviewModalOpen(false);
  };

  const filteredReviews = reviews.filter(r => 
    r.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.team.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Document Reviews</h1>
          <p className="text-sm text-slate-500 mt-1">Review student document submissions, add feedback, and approve versions.</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search documents or teams..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-medium">Document</th>
                <th className="px-6 py-4 font-medium">Team Info</th>
                <th className="px-6 py-4 font-medium">Status & Version</th>
                <th className="px-6 py-4 font-medium">Submitted</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredReviews.map((review) => (
                <tr key={review.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                        <FileText size={18} />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">{review.title}</div>
                        <div className="text-xs text-slate-500">{review.type} Template</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-900">{review.team}</div>
                    <div className="text-xs text-slate-500">by {review.student}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1.5 items-start">
                      <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        review.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' :
                        review.status === 'Under Review' ? 'bg-amber-100 text-amber-700' :
                        review.status === 'Rejected' ? 'bg-rose-100 text-rose-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {review.status}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-slate-500 font-medium">
                        <History size={12} /> {review.version}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600 font-medium">{review.submittedAt}</td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => handleOpenReview(review)}
                      className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 hover:text-blue-600 transition-colors shadow-sm flex items-center justify-end gap-1.5 ml-auto"
                    >
                      <Eye size={14} />
                      Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Modal */}
      <Modal 
        isOpen={isReviewModalOpen} 
        onClose={() => setIsReviewModalOpen(false)}
        title="Document Review & Feedback"
        footer={
          <div className="flex w-full justify-between items-center">
            <button onClick={() => setIsReviewModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Close</button>
            <div className="flex gap-2">
              <button 
                onClick={() => handleAction('Rejected')} 
                className="px-4 py-2 bg-white border border-rose-200 text-rose-600 text-sm font-semibold rounded-lg hover:bg-rose-50 transition-colors flex items-center gap-2"
              >
                <XCircle size={16} /> Needs Work
              </button>
              <button 
                onClick={() => handleAction('Approved')} 
                className="px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg shadow-sm hover:bg-emerald-700 transition-colors flex items-center gap-2"
              >
                <CheckCircle2 size={16} /> Approve Version
              </button>
            </div>
          </div>
        }
      >
        <div className="space-y-6">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-bold text-slate-900">{selectedReview?.title}</h3>
                <p className="text-xs text-slate-500">{selectedReview?.team} • {selectedReview?.student}</p>
              </div>
              <span className="text-xs font-bold text-slate-500 px-2 py-1 bg-slate-200 rounded-md">
                {selectedReview?.version}
              </span>
            </div>
            <button className="w-full mt-2 py-2 bg-white border border-slate-200 text-blue-600 rounded-lg text-sm font-semibold hover:bg-blue-50 transition-colors flex items-center justify-center gap-2">
              <Eye size={16} /> Open in Viewer Placeholder
            </button>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <MessageSquare size={16} className="text-slate-400" />
              Add Review Remarks
            </label>
            <textarea 
              rows="4"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Provide specific feedback on this version..."
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
            ></textarea>
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default MentorDocumentReviews;
