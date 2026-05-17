import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Mail, 
  User,
  Plus,
  X,
  CheckCircle,
  AlertTriangle,
  Folder,
  Calendar,
  Layers,
  TrendingUp,
  FileText,
  Clock,
  ChevronRight,
  Info,
  CheckSquare,
  Award,
  Crown,
  Bell
} from 'lucide-react';
import api from '../../lib/api';
import { cn } from '../../utils/utils';

const StudentTeamWorkspace = () => {
  // Current user details
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  // Page States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Workspace States
  const [activeProject, setActiveProject] = useState(null); // Simple metadata from projects list
  const [workspaceData, setWorkspaceData] = useState(null); // Detailed metrics from getTeamProject
  const [invitations, setInvitations] = useState([]);
  const [notifications, setNotifications] = useState([]);
  
  // UI Tabs & Modals
  const [activeTab, setActiveTab] = useState('overview');
  const [showInviteModal, setShowInviteModal] = useState(false);
  
  // Invitation Form
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRollNumber, setInviteRollNumber] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState(null);
  const [inviteSuccess, setInviteSuccess] = useState(null);

  // Initial Data Fetching
  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Fetch user's projects to find an active one
      const projRes = await api.get('/projects');
      const activeProj = projRes.data.find(
        (p) => p.status !== 'Completed' && p.status !== 'Rejected'
      );

      // 2. Fetch received invitations
      const inviteRes = await api.get('/team/invitations');
      setInvitations(inviteRes.data);

      // 3. Fetch notifications
      const notifyRes = await api.get('/team/notifications');
      setNotifications(notifyRes.data);

      if (activeProj) {
        setActiveProject(activeProj);
        // Fetch full workspace details
        const workspaceRes = await api.get(`/team/project/${activeProj.id}`);
        setWorkspaceData(workspaceRes.data);
      } else {
        setActiveProject(null);
        setWorkspaceData(null);
      }
    } catch (err) {
      console.error('Error fetching team workspace data:', err);
      setError(err.response?.data?.message || 'Failed to load team workspace');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Handle invitation accept
  const handleAcceptInvite = async (inviteId) => {
    try {
      setLoading(true);
      await api.post('/team/accept', { inviteId });
      // Reload everything
      await fetchInitialData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to accept invitation');
      setLoading(false);
    }
  };

  // Handle invitation reject
  const handleRejectInvite = async (inviteId) => {
    try {
      setLoading(true);
      await api.post('/team/reject', { inviteId });
      // Reload everything
      await fetchInitialData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reject invitation');
      setLoading(false);
    }
  };

  // Handle sending team invitation
  const handleSendInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail || !inviteRollNumber) {
      setInviteError('Please fill out all fields.');
      return;
    }

    try {
      setInviteLoading(true);
      setInviteError(null);
      setInviteSuccess(null);

      const res = await api.post('/team/invite', {
        email: inviteEmail,
        rollNumber: inviteRollNumber,
      });

      setInviteSuccess(res.data.message || 'Invitation sent successfully!');
      setInviteEmail('');
      setInviteRollNumber('');
      
      // Refresh notifications & state
      const notifyRes = await api.get('/team/notifications');
      setNotifications(notifyRes.data);
      
      // Auto close modal after 1.5s
      setTimeout(() => {
        setShowInviteModal(false);
        setInviteSuccess(null);
      }, 1500);
    } catch (err) {
      setInviteError(err.response?.data?.message || 'Failed to send invitation');
    } finally {
      setInviteLoading(false);
    }
  };

  // Determine if the logged-in student is the leader of the active project
  const isTeamLeader = workspaceData?.members?.some(
    (m) => m.user_id === currentUser.id && m.is_leader
  );

  // Determine if the logged-in student is an active member of the project
  const isTeamMember = workspaceData?.members?.some(
    (m) => m.user_id === currentUser.id
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="w-10 h-10 border-4 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium text-slate-500">Synchronizing team details...</p>
      </div>
    );
  }

  // State: No Active Project
  if (!activeProject) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Team Workspace</h1>
          <p className="text-sm text-slate-500 mt-1">Manage project groups, team collaborations, and peer invitations.</p>
        </div>

        {/* Invitation Center (Top Alert banner) */}
        {invitations.length > 0 && (
          <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden border border-slate-800">
            <div className="absolute right-0 bottom-0 translate-x-10 translate-y-10 w-48 h-48 bg-blue-600/10 rounded-full blur-2xl"></div>
            <div className="flex items-center gap-3 mb-4">
              <span className="p-2 bg-blue-500/20 text-blue-400 rounded-xl">
                <Bell size={20} />
              </span>
              <h2 className="text-lg font-bold">Team Invitations Received</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {invitations.map((invite) => (
                <div 
                  key={invite.invite_id} 
                  className="bg-slate-850 p-5 rounded-xl border border-slate-800 flex flex-col justify-between space-y-4"
                >
                  <div>
                    <h3 className="font-bold text-white text-base">Join Team "{invite.team_name}"</h3>
                    <p className="text-slate-400 text-sm mt-1">Project: <span className="text-slate-200 font-semibold">{invite.project_title}</span></p>
                    <p className="text-slate-400 text-xs mt-0.5">Invited by: <span className="text-blue-400">{invite.inviter_name}</span></p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleAcceptInvite(invite.invite_id)}
                      className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle size={14} /> Accept
                    </button>
                    <button 
                      onClick={() => handleRejectInvite(invite.invite_id)}
                      className="flex-1 py-2 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 rounded-lg text-xs font-bold transition-all border border-rose-500/20 flex items-center justify-center gap-1.5"
                    >
                      <X size={14} /> Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State Banner */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center max-w-2xl mx-auto flex flex-col items-center justify-center space-y-6">
          <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center border border-slate-100">
            <Users size={32} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">No Active Team Workspace</h2>
            <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
              You are not currently enrolled in any active project team. You can either accept one of your pending team invitations (if any) or create a new project proposal to start your own team!
            </p>
          </div>
          <div className="flex gap-3">
            <a 
              href="/student/projects" 
              className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold transition-all shadow-sm"
            >
              Create Project Proposal
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Active Team Workspace Dashboard
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Team Workspace</h1>
          <p className="text-sm text-slate-500 mt-1">Manage project groups, monitor members role-contributions, and track deliverable milestones.</p>
        </div>
        
        <div className="flex items-center gap-3">
          {workspaceData?.members?.length >= 5 && (
            <span className="text-xs text-rose-500 font-semibold bg-rose-50 border border-rose-100 px-3 py-1.5 rounded-lg">
              Team is full. Maximum 5 members allowed.
            </span>
          )}
          {isTeamMember && (
            <button 
              onClick={() => setShowInviteModal(true)}
              disabled={workspaceData?.members?.length >= 5}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm flex items-center gap-1.5",
                workspaceData?.members?.length >= 5
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                  : "bg-slate-900 hover:bg-slate-850 text-white"
              )}
            >
              <Plus size={16} /> Add Member
            </button>
          )}
        </div>
      </div>

      {/* Main Workspace Metrics Summary Card */}
      <div className="bg-slate-900 text-white rounded-2xl border border-slate-800 shadow-xl overflow-hidden relative">
        <div className="absolute right-0 top-0 translate-x-1/4 -translate-y-1/4 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 relative">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-blue-500/20 text-blue-400 rounded-2xl flex items-center justify-center border border-blue-500/10">
              <Users size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold">{workspaceData?.project?.team_name || 'Team Workspace'}</h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  {workspaceData?.project?.status}
                </span>
              </div>
              <p className="text-slate-400 text-sm mt-1">Project Name: <span className="text-slate-200 font-semibold">{workspaceData?.project?.title}</span></p>
              {workspaceData?.project?.mentor_name && (
                <p className="text-slate-400 text-xs mt-0.5">Assigned Mentor: <span className="text-slate-200 font-medium">{workspaceData.project.mentor_name}</span></p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-8 border-t border-slate-800 md:border-t-0 pt-4 md:pt-0">
            <div className="text-left md:text-center">
              <div className="text-2xl font-black text-white">{workspaceData?.members?.length || 0}/5</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Members</div>
            </div>
            <div className="text-left md:text-center">
              <div className="text-2xl font-black text-white">
                {workspaceData?.tasks?.filter(t => t.status === 'Completed').length || 0}/{workspaceData?.tasks?.length || 0}
              </div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Tasks Done</div>
            </div>
            <div className="text-left md:text-center">
              <div className="text-2xl font-black text-emerald-400">{workspaceData?.project?.progress_percent || 0}%</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Progress</div>
            </div>
          </div>
        </div>
        
        {/* Sync Progress Bar */}
        <div className="w-full bg-slate-800 h-1.5">
          <div 
            className="bg-blue-500 h-1.5 transition-all duration-500" 
            style={{ width: `${workspaceData?.project?.progress_percent || 0}%` }}
          ></div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6">
        {[
          { id: 'overview', name: 'Overview' },
          { id: 'members', name: 'Team Members' },
          { id: 'milestones', name: 'Milestones & Tasks' },
          { id: 'submissions', name: 'Submissions & Docs' },
          { id: 'notifications', name: 'Notifications Activity' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "pb-4 text-sm font-semibold transition-all relative",
              activeTab === tab.id 
                ? "text-slate-900 border-b-2 border-slate-900" 
                : "text-slate-500 hover:text-slate-900"
            )}
          >
            {tab.name}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      <div className="space-y-6">
        
        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              
              {/* Project Details */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Folder size={18} className="text-slate-400" /> Project Description
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">
                  {workspaceData?.project?.description || 'No description provided.'}
                </p>
              </div>

              {/* Latest Synced Tasks */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <CheckSquare size={18} className="text-slate-400" /> Shared Kanban Tasks
                  </h3>
                  <button onClick={() => setActiveTab('milestones')} className="text-xs text-blue-600 hover:text-blue-500 font-semibold flex items-center gap-1">
                    View All Tasks <ChevronRight size={14} />
                  </button>
                </div>
                
                {workspaceData?.tasks?.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 text-sm">
                    No team tasks defined yet. Add them in the Kanban tracker!
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {workspaceData?.tasks?.slice(0, 5).map((task) => (
                      <div key={task.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between">
                        <div>
                          <div className="font-bold text-slate-800 text-sm">{task.title}</div>
                          <p className="text-slate-400 text-xs mt-0.5">Status: <span className="font-semibold text-slate-650">{task.status}</span></p>
                        </div>
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                          task.priority === 'High' || task.priority === 'Critical'
                            ? "bg-rose-50 text-rose-600" 
                            : task.priority === 'Medium'
                            ? "bg-amber-50 text-amber-600"
                            : "bg-slate-100 text-slate-600"
                        )}>
                          {task.priority}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar quick metadata */}
            <div className="space-y-6">
              
              {/* Deliverables summary */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <FileText size={18} className="text-slate-400" /> Shared Deliverables
                </h3>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <span className="text-xs font-semibold text-slate-600">Documents Shared</span>
                    <span className="text-sm font-bold text-slate-900">{workspaceData?.documents?.length || 0} files</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <span className="text-xs font-semibold text-slate-600">Assignments Submitted</span>
                    <span className="text-sm font-bold text-slate-900">{workspaceData?.submissions?.length || 0} submissions</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <span className="text-xs font-semibold text-slate-600">Sync Deadlines</span>
                    <span className="text-sm font-bold text-blue-600">
                      {workspaceData?.milestones?.filter(m => new Date(m.due_date) > new Date()).length || 0} Active
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick notification stream */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Bell size={18} className="text-slate-400" /> Recent Synced Logs
                </h3>
                
                {notifications.length === 0 ? (
                  <div className="text-center py-4 text-xs text-slate-400">
                    No activity logs recorded.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {notifications.slice(0, 4).map((notif) => (
                      <div key={notif.id} className="text-xs space-y-1 p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                        <div className="font-bold text-slate-800">{notif.title}</div>
                        <p className="text-slate-500 font-medium leading-normal">{notif.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Team Members */}
        {activeTab === 'members' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {workspaceData?.members?.map((member) => (
              <div 
                key={member.member_id} 
                className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col group hover:border-blue-200 hover:shadow-md transition-all duration-300"
              >
                <div className="p-5 flex-1 relative flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-slate-900 text-white rounded-2xl flex items-center justify-center text-2xl font-bold mb-3 shadow-sm relative group-hover:scale-105 transition-transform">
                    {member.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                    {member.is_leader && (
                      <span className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-amber-500 text-white border-2 border-white rounded-full flex items-center justify-center shadow">
                        <Crown size={12} />
                      </span>
                    )}
                  </div>
                  
                  <h3 className="font-bold text-slate-900 text-base">{member.full_name}</h3>
                  <span className={cn(
                    "px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider mt-1.5 border",
                    member.is_leader 
                      ? "bg-amber-50 text-amber-700 border-amber-250" 
                      : "bg-blue-50 text-blue-600 border-blue-100"
                  )}>
                    {member.is_leader ? 'Team Leader' : 'Team Member'}
                  </span>

                  <div className="space-y-2 mt-6 w-full">
                    <div className="flex items-center gap-2 text-xs text-slate-600 font-medium bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <Mail size={14} className="text-slate-400 flex-shrink-0" />
                      <span className="truncate flex-1 text-left">{member.email}</span>
                    </div>
                    {member.roll_number && (
                      <div className="flex items-center gap-2 text-xs text-slate-600 font-medium bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <User size={14} className="text-slate-400 flex-shrink-0" />
                        <span className="text-left">Roll No: {member.roll_number}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-xs text-slate-400 font-medium p-1">
                      <Clock size={12} />
                      <span>Joined: {new Date(member.joined_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 3: Milestones & Tasks */}
        {activeTab === 'milestones' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Milestones timeline */}
            <div className="lg:col-span-1 bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Calendar size={18} className="text-slate-400" /> Academic Deadlines
              </h3>
              
              {workspaceData?.milestones?.length === 0 ? (
                <div className="text-slate-450 text-sm text-center py-6">
                  No academic deadlines configured.
                </div>
              ) : (
                <div className="relative pl-6 border-l-2 border-slate-100 space-y-6">
                  {workspaceData?.milestones?.map((milestone) => (
                    <div key={milestone.id} className="relative">
                      {/* Timeline dot */}
                      <span className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-4 border-white bg-blue-500 shadow-sm"></span>
                      <div>
                        <div className="font-bold text-slate-800 text-sm">{milestone.title}</div>
                        <p className="text-slate-400 text-xs mt-1">Due Date: {new Date(milestone.due_date).toLocaleDateString()}</p>
                        {milestone.description && (
                          <p className="text-slate-500 text-xs mt-1.5 font-medium leading-relaxed">{milestone.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Complete Tasks list */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CheckSquare size={18} className="text-slate-400" /> Complete Task Checklist
              </h3>
              
              {workspaceData?.tasks?.length === 0 ? (
                <div className="text-slate-450 text-sm text-center py-8">
                  No project tasks allocated yet.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {workspaceData?.tasks?.map((task) => (
                    <div key={task.id} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                      <div>
                        <div className="font-bold text-slate-800 text-sm flex items-center gap-2">
                          {task.title}
                        </div>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border",
                            task.status === 'Completed'
                              ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                              : task.status === 'In Progress' || task.status === 'Development'
                              ? "bg-blue-50 text-blue-700 border-blue-100"
                              : "bg-slate-100 text-slate-600 border-slate-200"
                          )}>
                            {task.status}
                          </span>
                          
                          <span className="text-[11px] font-semibold text-slate-400">
                            Priority: <span className="text-slate-500">{task.priority}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 4: Submissions & Docs */}
        {activeTab === 'submissions' && (
          <div className="space-y-6">
            
            {/* Shared Documents */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileText size={18} className="text-slate-400" /> Workspace Shared Documents
              </h3>
              
              {workspaceData?.documents?.length === 0 ? (
                <div className="text-center py-6 text-slate-450 text-sm">
                  No documents shared in this team workspace yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-450 text-xs font-bold uppercase tracking-wider">
                        <th className="pb-3 font-semibold">Document Name</th>
                        <th className="pb-3 font-semibold">Uploader</th>
                        <th className="pb-3 font-semibold">Uploaded Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-55">
                      {workspaceData?.documents?.map((doc) => (
                        <tr key={doc.id} className="text-slate-750">
                          <td className="py-3.5 font-semibold text-slate-800">{doc.name || doc.file_name}</td>
                          <td className="py-3.5 font-medium text-slate-500">{doc.uploader_name || 'Team Member'}</td>
                          <td className="py-3.5 font-medium text-slate-500">{new Date(doc.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Assignments Deliverables Submissions */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Layers size={18} className="text-slate-400" /> Academic Submissions
              </h3>
              
              {workspaceData?.submissions?.length === 0 ? (
                <div className="text-center py-6 text-slate-450 text-sm">
                  No deliverables submitted for review yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-450 text-xs font-bold uppercase tracking-wider">
                        <th className="pb-3 font-semibold">Assignment Title</th>
                        <th className="pb-3 font-semibold">Submitted File</th>
                        <th className="pb-3 font-semibold">Submission Date</th>
                        <th className="pb-3 font-semibold">Evaluation Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-55">
                      {workspaceData?.submissions?.map((sub) => (
                        <tr key={sub.id} className="text-slate-750">
                          <td className="py-3.5 font-semibold text-slate-800">{sub.assignment_title}</td>
                          <td className="py-3.5 font-medium text-blue-600">{sub.file_name || 'deliverable.pdf'}</td>
                          <td className="py-3.5 font-medium text-slate-500">{new Date(sub.submitted_at).toLocaleDateString()}</td>
                          <td className="py-3.5 font-medium">
                            <span className={cn(
                              "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border",
                              sub.grade
                                ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                : "bg-amber-50 text-amber-700 border-amber-100"
                            )}>
                              {sub.grade ? `Graded: ${sub.grade}` : 'Pending Evaluation'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 5: Notifications Sync Logs */}
        {activeTab === 'notifications' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Bell size={18} className="text-slate-400" /> Sync Activity Logs
            </h3>
            
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-slate-450 text-sm">
                No active notifications sync log.
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((notif) => (
                  <div key={notif.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="font-bold text-slate-800 text-sm flex items-center gap-2">
                        {notif.title}
                        {!notif.is_read && (
                          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                        )}
                      </div>
                      <p className="text-slate-500 text-xs font-medium leading-relaxed">{notif.message}</p>
                    </div>
                    <span className="text-[10px] text-slate-400 font-semibold whitespace-nowrap">
                      {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal: Invite Member Form */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setShowInviteModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 p-1 hover:bg-slate-50 rounded-lg transition-all"
            >
              <X size={18} />
            </button>
            
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 bg-slate-100 text-slate-900 rounded-xl">
                  <Users size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">Add Team Member</h3>
                  <p className="text-xs text-slate-500">Invite a peer to join your project team.</p>
                </div>
              </div>
              
              <form onSubmit={handleSendInvite} className="space-y-4">
                {inviteError && (
                  <div className="bg-rose-50 text-rose-605 p-3.5 rounded-xl border border-rose-100 text-xs font-semibold flex items-start gap-2">
                    <AlertTriangle size={16} className="flex-shrink-0" />
                    <span>{inviteError}</span>
                  </div>
                )}
                {inviteSuccess && (
                  <div className="bg-emerald-50 text-emerald-650 p-3.5 rounded-xl border border-emerald-100 text-xs font-semibold flex items-start gap-2">
                    <CheckCircle size={16} className="flex-shrink-0" />
                    <span>{inviteSuccess}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label htmlFor="invite-email" className="text-xs font-bold text-slate-650 uppercase tracking-wider">Student Email ID</label>
                  <input 
                    id="invite-email"
                    type="email"
                    placeholder="student@college.edu"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    disabled={inviteLoading || inviteSuccess}
                    className="w-full px-3.5 py-2 border border-slate-250 rounded-lg text-sm bg-white placeholder-slate-400 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 disabled:opacity-50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="invite-roll" className="text-xs font-bold text-slate-650 uppercase tracking-wider">Roll Number</label>
                  <input 
                    id="invite-roll"
                    type="text"
                    placeholder="CS2026002"
                    value={inviteRollNumber}
                    onChange={(e) => setInviteRollNumber(e.target.value)}
                    disabled={inviteLoading || inviteSuccess}
                    className="w-full px-3.5 py-2 border border-slate-250 rounded-lg text-sm bg-white placeholder-slate-400 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 disabled:opacity-50"
                  />
                </div>

                <div className="pt-2 flex gap-2">
                  <button 
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    disabled={inviteLoading}
                    className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={inviteLoading || inviteSuccess}
                    className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold transition-all shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {inviteLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Inviting...
                      </>
                    ) : (
                      'Send Invitation'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentTeamWorkspace;
