import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Plus, 
  Search, 
  Trash2,
  Edit2,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  Users
} from 'lucide-react';
import { toast } from 'sonner';
import { Modal } from '../../components/common/PremiumComponents';
import api from '../../lib/api';

const generateFutureAcademicYears = () => {
  const date = new Date();
  const currentYear = date.getFullYear();
  const currentMonth = date.getMonth();
  const currentAcademicStartYear = currentMonth < 6 ? currentYear - 1 : currentYear;
  
  const futureYears = [];
  for (let i = 1; i <= 4; i++) {
    const startYear = currentAcademicStartYear + i;
    const endYear = (startYear + 1).toString().slice(-2);
    futureYears.push(`${startYear}-${endYear}`);
  }
  return futureYears;
};

const HodRegistrationForms = () => {
  const futureAcademicYears = generateFutureAcademicYears();
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    instructions: '',
    branch: 'Computer Science & Engineering',
    academic_year: futureAcademicYears[0],
    semester: '',
    section: '1',
    subsection: '1',
    team_size_min: 2,
    team_size_max: 4,
    project_type: 'Minor Project',
    start_date: '',
    deadline: '',
    status: 'Draft'
  });

  const fetchForms = async () => {
    try {
      const res = await api.get('/hod/registration-forms');
      setForms(res.data);
    } catch (error) {
      toast.error('Failed to load registration forms');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForms();
  }, []);

  const handleCreateForm = async (e) => {
    e.preventDefault();
    if (formData.team_size_min > formData.team_size_max) {
      toast.error('Team Size Min cannot be greater than Team Size Max');
      return;
    }
    try {
      await api.post('/hod/registration-forms', formData);
      toast.success('Registration form created successfully');
      setIsModalOpen(false);
      fetchForms();
    } catch (error) {
      toast.error('Failed to create form');
    }
  };

  const handlePublish = async (id) => {
    try {
      await api.patch(`/hod/registration-forms/${id}/publish`);
      toast.success('Form published to students');
      fetchForms();
    } catch (error) {
      toast.error('Failed to publish form');
    }
  };

  const handleClose = async (id) => {
    try {
      await api.patch(`/hod/registration-forms/${id}/close`);
      toast.success('Form closed');
      fetchForms();
    } catch (error) {
      toast.error('Failed to close form');
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'Published': return <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-1 rounded-md"><CheckCircle2 size={12}/> Published</span>;
      case 'Closed': return <span className="flex items-center gap-1.5 text-xs font-bold text-rose-700 bg-rose-100 px-2 py-1 rounded-md"><XCircle size={12}/> Closed</span>;
      default: return <span className="flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-slate-200 px-2 py-1 rounded-md"><Clock size={12}/> Draft</span>;
    }
  };

  const filteredForms = forms.filter(f => f.title.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Registration Forms</h1>
          <p className="text-sm text-slate-500 mt-1">Create and manage project registration forms for students.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search forms..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
            />
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm shrink-0"
          >
            <Plus size={16} />
            Create Form
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-6 py-4 font-medium">Form Title</th>
                  <th className="px-6 py-4 font-medium">Target</th>
                  <th className="px-6 py-4 font-medium">Timeline</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Submissions</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredForms.length === 0 ? (
                  <tr><td colSpan="6" className="px-6 py-8 text-center text-slate-500">No forms found. Create one to get started.</td></tr>
                ) : filteredForms.map((form) => (
                  <tr key={form.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{form.title}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{form.project_type} (Team: {form.team_size_min}-{form.team_size_max})</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-700">{form.branch}</div>
                      <div className="text-xs text-slate-500">Sem {form.semester} • Sec {form.section}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs font-medium text-slate-700">Starts: {new Date(form.start_date).toLocaleDateString()}</div>
                      <div className="text-xs font-medium text-rose-600">Ends: {new Date(form.deadline).toLocaleDateString()}</div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(form.status.charAt(0).toUpperCase() + form.status.slice(1))}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md w-fit">
                        <Users size={14} /> {form.submissions_count || 0}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {form.status.toLowerCase() === 'draft' && (
                          <button 
                            onClick={() => handlePublish(form.id)}
                            className="px-3 py-1 bg-emerald-50 text-emerald-600 text-xs font-bold rounded hover:bg-emerald-100 transition-colors"
                          >
                            Publish
                          </button>
                        )}
                        {form.status.toLowerCase() === 'published' && (
                          <button 
                            onClick={() => handleClose(form.id)}
                            className="px-3 py-1 bg-rose-50 text-rose-600 text-xs font-bold rounded hover:bg-rose-100 transition-colors"
                          >
                            Close
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Form Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title="Create Registration Form"
        footer={
          <>
            <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
            <button onClick={handleCreateForm} className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg shadow-sm hover:bg-blue-700 transition-colors">Create Form</button>
          </>
        }
      >
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Form Title</label>
            <input 
              type="text" 
              required
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              placeholder="e.g. Minor Project Registration - Sem 6"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Instructions</label>
            <textarea 
              value={formData.instructions}
              onChange={(e) => setFormData({...formData, instructions: e.target.value})}
              rows={3}
              placeholder="Guidelines for students..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Branch</label>
              <select 
                value={formData.branch}
                onChange={(e) => setFormData({...formData, branch: e.target.value})}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="Computer Science & Engineering">CSE</option>
                <option value="Electronics & Communication Engineering">ECE</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Project Type</label>
              <select 
                value={formData.project_type}
                onChange={(e) => setFormData({...formData, project_type: e.target.value, semester: ''})}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="Minor Project">Minor Project</option>
                <option value="Major Project">Major Project</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Year</label>
              <select 
                value={formData.academic_year}
                onChange={(e) => setFormData({...formData, academic_year: e.target.value})}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                {futureAcademicYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Semester</label>
              <select 
                value={formData.semester}
                onChange={(e) => setFormData({...formData, semester: parseInt(e.target.value) || ''})}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="" disabled>Select Semester</option>
                {formData.project_type === 'Minor Project' && (
                  <>
                    <option value="5">5</option>
                    <option value="6">6</option>
                  </>
                )}
                {formData.project_type === 'Major Project' && (
                  <>
                    <option value="7">7</option>
                    <option value="8">8</option>
                  </>
                )}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Section</label>
              <select 
                value={formData.section}
                onChange={(e) => setFormData({...formData, section: e.target.value})}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                {[1,2,3,4,5,6].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Subsection</label>
              <select 
                value={formData.subsection}
                onChange={(e) => setFormData({...formData, subsection: e.target.value})}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="1">1</option>
                <option value="2">2</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Team Size Min</label>
              <select 
                value={formData.team_size_min}
                onChange={(e) => setFormData({...formData, team_size_min: parseInt(e.target.value)})}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Team Size Max</label>
              <select 
                value={formData.team_size_max}
                onChange={(e) => setFormData({...formData, team_size_max: parseInt(e.target.value)})}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Start Date</label>
              <input 
                type="datetime-local" 
                required
                value={formData.start_date}
                onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Deadline</label>
              <input 
                type="datetime-local" 
                required
                value={formData.deadline}
                onChange={(e) => setFormData({...formData, deadline: e.target.value})}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
              />
            </div>
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default HodRegistrationForms;
