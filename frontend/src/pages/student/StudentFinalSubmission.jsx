import React, { useState } from 'react';
import { Rocket, Upload, Link as LinkIcon, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const StudentFinalSubmission = () => {
  const [formData, setFormData] = useState({
    projectName: 'AI Powered Student Tracker',
    projectType: 'Major Project',
    teamName: 'Team Alpha',
    githubUrl: '',
    demoUrl: '',
    reportFile: null,
    pptFile: null,
    remarks: ''
  });

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [timelinessScore, setTimelinessScore] = useState(null);

  const calculateTimeliness = () => {
    // Dummy logic: random late days between 0 and 5
    const lateDays = Math.floor(Math.random() * 6);
    if (lateDays === 0) return { score: 5, label: 'On Time' };
    if (lateDays === 1) return { score: 4, label: '1 Day Late' };
    if (lateDays === 2) return { score: 3, label: '2 Days Late' };
    if (lateDays === 3) return { score: 2, label: '3 Days Late' };
    return { score: 1, label: 'More than 3 Days Late' };
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (files.length > 0) {
      setFormData((prev) => ({ ...prev, [name]: files[0] }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.githubUrl.startsWith('https://github.com/')) {
      toast.error('Invalid GitHub URL. Must start with https://github.com/');
      return;
    }

    if (!formData.reportFile || !formData.pptFile) {
      toast.error('Both Project Report and PPT files are required.');
      return;
    }

    const timeliness = calculateTimeliness();
    setTimelinessScore(timeliness);
    setIsSubmitted(true);
    
    toast.success('Project submitted successfully!');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Final Submission</h1>
          <p className="text-sm text-slate-500 mt-1">Submit your project deliverables for final evaluation.</p>
        </div>
      </div>

      {isSubmitted ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-8 text-center space-y-4">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={32} />
          </div>
          <h2 className="text-xl font-semibold text-emerald-900">Submission Successful!</h2>
          <p className="text-emerald-700 max-w-md mx-auto">
            Your project "{formData.projectName}" has been successfully submitted to your mentor for review.
          </p>
          
          <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto mt-6">
            <div className="bg-white rounded-lg p-4 shadow-sm border border-emerald-100">
              <div className="text-sm text-slate-500 mb-1">Timeliness Score</div>
              <div className="text-2xl font-bold text-slate-900">{timelinessScore?.score}/5</div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm border border-emerald-100">
              <div className="text-sm text-slate-500 mb-1">Status</div>
              <div className="text-sm font-semibold text-slate-900 mt-2">
                <span className={`px-2 py-1 rounded-md ${timelinessScore?.score === 5 ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                  {timelinessScore?.label}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-6 space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Project Name</label>
                <input 
                  type="text" 
                  name="projectName"
                  value={formData.projectName}
                  onChange={handleInputChange}
                  readOnly
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 text-sm focus:outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Team Name</label>
                <input 
                  type="text" 
                  name="teamName"
                  value={formData.teamName}
                  onChange={handleInputChange}
                  readOnly
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 text-sm focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">GitHub Repository Link <span className="text-rose-500">*</span></label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LinkIcon size={16} className="text-slate-400" />
                </div>
                <input 
                  type="url" 
                  name="githubUrl"
                  value={formData.githubUrl}
                  onChange={handleInputChange}
                  placeholder="https://github.com/username/repository"
                  className="w-full pl-10 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Live Demo Link (Optional)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Rocket size={16} className="text-slate-400" />
                </div>
                <input 
                  type="url" 
                  name="demoUrl"
                  value={formData.demoUrl}
                  onChange={handleInputChange}
                  placeholder="https://your-demo-url.com"
                  className="w-full pl-10 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Project Report (PDF/Word) <span className="text-rose-500">*</span></label>
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-200 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload size={24} className="text-slate-400 mb-2" />
                      <p className="text-xs text-slate-500 font-medium">Click to upload report</p>
                      {formData.reportFile && <p className="text-xs text-blue-600 mt-2 font-semibold">{formData.reportFile.name}</p>}
                    </div>
                    <input type="file" name="reportFile" className="hidden" accept=".pdf,.doc,.docx" onChange={handleFileChange} />
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Presentation (PPT) <span className="text-rose-500">*</span></label>
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-200 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload size={24} className="text-slate-400 mb-2" />
                      <p className="text-xs text-slate-500 font-medium">Click to upload PPT</p>
                      {formData.pptFile && <p className="text-xs text-blue-600 mt-2 font-semibold">{formData.pptFile.name}</p>}
                    </div>
                    <input type="file" name="pptFile" className="hidden" accept=".ppt,.pptx" onChange={handleFileChange} />
                  </label>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Additional Remarks (Optional)</label>
              <textarea 
                name="remarks"
                value={formData.remarks}
                onChange={handleInputChange}
                rows="3"
                placeholder="Any comments for the mentor..."
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
              ></textarea>
            </div>

          </div>
          
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <AlertCircle size={14} />
              <span>Ensure all files are final before submitting.</span>
            </div>
            <button 
              type="submit"
              className="px-6 py-2 bg-slate-900 text-white text-sm font-semibold rounded-lg shadow-sm hover:bg-slate-800 transition-colors"
            >
              Submit Project
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default StudentFinalSubmission;
