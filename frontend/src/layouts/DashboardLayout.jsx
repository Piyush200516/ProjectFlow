import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Briefcase, 
  CheckSquare, 
  Clock, 
  FileText, 
  MessageSquare, 
  BarChart3, 
  Settings, 
  LogOut,
  Bell,
  Search,
  Menu,
  ChevronDown,
  Rocket,
  ShieldCheck,
  Building2,
  Users,
  Calendar as CalendarIcon,
  MessageCircle
} from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { cn } from '../utils/utils';
import { toast } from 'sonner';
import logo from '../assets/projectflow-logo.png';
import { useApiQuery } from '../hooks/useApiQuery';
import { queryKeys } from '../lib/queryKeys';
import { useUiStore } from '../store/uiStore';
import { queryClient } from '../lib/queryClient';
import { AnimatePresence, motion } from 'framer-motion';

const SidebarItem = ({ icon: Icon, label, href, active, collapsed }) => (
  <Link 
    to={href} 
    className={cn(
      "flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-200 relative group",
      active 
        ? "bg-slate-100 text-slate-900" 
        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
    )}
  >
    <Icon size={18} strokeWidth={active ? 2 : 1.5} className={cn("shrink-0 transition-colors", active ? "text-slate-900" : "group-hover:text-slate-900")} />
    {!collapsed && <span className={cn("text-sm tracking-tight", active ? "font-semibold" : "font-medium")}>{label}</span>}
    {active && (
      <div className="absolute left-0 w-0.5 h-4 bg-slate-900 rounded-full"></div>
    )}
    {collapsed && (
      <div className="absolute left-full ml-4 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-[60]">
        {label}
      </div>
    )}
  </Link>
);

const NotificationDropdown = ({ isOpen, onClose, notifications, onRead, onReadAll }) => {
  const recentNotifications = useMemo(() => [...notifications]
    .sort((a, b) => {
      const byDate = new Date(b.created_at || 0) - new Date(a.created_at || 0);
      return byDate || ((b.id || 0) - (a.id || 0));
    })
    .slice(0, 3), [notifications]);

  const formatNotificationDateTime = (notification) => {
    if (notification.notification_date && notification.notification_time) {
      return `${notification.notification_date} at ${notification.notification_time}`;
    }

    if (!notification.created_at) return '';

    return new Date(notification.created_at).toLocaleString(undefined, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
      <>
      <div className="fixed inset-0 z-40" onClick={onClose}></div>
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.16 }}
        className="absolute top-12 right-0 w-80 bg-white border border-slate-200 shadow-xl rounded-xl z-50 overflow-hidden animate-in slide-in-from-top-2 duration-200"
      >
        <div className="p-3 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <span className="font-bold text-slate-800 text-sm">Notifications</span>
          {notifications.some((n) => !n.is_read) && (
            <button
              type="button"
              onClick={onReadAll}
              className="text-[10px] font-bold text-blue-600 hover:text-blue-700"
            >
              Mark all read
            </button>
          )}
        </div>
        <div className="max-h-[300px] overflow-y-auto">
          {recentNotifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-slate-500">No new notifications</div>
          ) : (
            recentNotifications.map((n) => (
              <div 
                key={n.id} 
                onClick={() => onRead(n)}
                className={cn("p-3 border-b border-slate-50 flex gap-3 hover:bg-slate-50 transition-colors cursor-pointer", !n.is_read && "bg-blue-50/30")}
              >
                <div className="mt-0.5">
                  {!n.is_read ? <div className="w-2 h-2 bg-blue-600 rounded-full"></div> : <div className="w-2 h-2"></div>}
                </div>
                <div>
                  <p className={cn("text-xs leading-snug", !n.is_read ? "font-semibold text-slate-900" : "font-medium text-slate-600")}>{n.title}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{n.message}</p>
                  <p className="text-[9px] text-slate-400 font-medium mt-1">{formatNotificationDateTime(n)}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>
      </>
      )}
    </AnimatePresence>
  );
};

const DashboardLayout = ({ children }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const isCollapsed = useUiStore((state) => state.sidebarCollapsed);
  const setCollapsed = useUiStore((state) => state.setSidebarCollapsed);
  const isNotifOpen = useUiStore((state) => state.notificationPanelOpen);
  const setNotifOpen = useUiStore((state) => state.setNotificationPanelOpen);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const notificationEndpoint = user?.role === 'student' ? '/student/notifications' : '/notifications';
  const { data: notifications = [] } = useApiQuery(
    queryKeys.studentNotifications({ role: user?.role, limit: 10 }),
    notificationEndpoint,
    {
      params: { limit: 10 },
      enabled: Boolean(user),
      refetchInterval: 60_000,
      select: (data) => data?.notifications || data || [],
    }
  );

  const fetchNotifications = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['studentNotifications'] });
  }, []);

  const getNotificationTarget = (notif) => {
    const key = notif.reference_type || notif.type;
    const targets = {
      registration_form: '/student/project-form',
      registration_form_updated: '/student/project-form',
      registration_form_closed: '/student/project-form',
      deadline_updated: '/student/project-form',
      timeline: '/student/timeline',
      project_timeline: '/student/timeline',
      project_timeline_updated: '/student/timeline',
      mentor_assignment: '/student/dashboard',
      approval: '/student/dashboard',
      rejection: '/student/dashboard',
      team_project_registered: '/student/dashboard'
    };
    return targets[key] || null;
  };

  const handleReadNotification = useCallback(async (notif) => {
    try {
      if (!notif.is_read) {
        const endpoint = user?.role === 'student'
          ? `/student/notifications/${notif.id}/read`
          : `/notifications/${notif.id}/read`;
        await api.patch(endpoint);
        await fetchNotifications();
      }
      setNotifOpen(false);
      if (user?.role === 'student') {
        const target = getNotificationTarget(notif);
        if (target) {
          navigate(target);
        }
      }
    } catch (error) {
      console.error("Failed to read notification");
    }
  }, [fetchNotifications, navigate, user?.role]);

  const handleReadAllNotifications = useCallback(async () => {
    try {
      const endpoint = user?.role === 'student'
        ? '/student/notifications/read-all'
        : '/notifications/read-all';
      await api.patch(endpoint);
      await fetchNotifications();
    } catch (error) {
      console.error("Failed to mark all notifications as read");
    }
  }, [fetchNotifications, user?.role]);

  const unreadCount = useMemo(() => notifications.filter(n => !n.is_read).length, [notifications]);
  const visibleUnreadCount = Math.min(unreadCount, 3);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarOpen(false);
        setCollapsed(false);
      } else {
        setSidebarOpen(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setCollapsed]);

  const menuItems = useMemo(() => ({
    student: [
      { icon: LayoutDashboard, label: 'Dashboard', href: '/student/dashboard' },
      { icon: FileText, label: 'Project Form', href: '/student/project-form' },
      { icon: Briefcase, label: 'Assigned Project', href: '/student/projects' },
      { icon: CheckSquare, label: 'Kanban', href: '/student/kanban' },
      { icon: Clock, label: 'Timeline', href: '/student/timeline' },
      { icon: FileText, label: 'Documentation', href: '/student/documentation' },
      { icon: Rocket, label: 'Final Submission', href: '/student/final-submission' },
      { icon: MessageSquare, label: 'Feedback', href: '/student/mentor-feedback' },
      { icon: BarChart3, label: 'Contribution Score', href: '/student/contribution' },
      { icon: Bell, label: 'Activity Feed', href: '/student/activity' },
      { icon: FileText, label: 'Doc Workspace', href: '/student/document-workspace' },
      { icon: Users, label: 'Team Workspace', href: '/student/team-workspace' },
      { icon: CalendarIcon, label: 'Calendar', href: '/student/calendar' },
      { icon: MessageCircle, label: 'Project Chat', href: '/student/chat' },
    ],
    mentor: [
      { icon: LayoutDashboard, label: 'Dashboard', href: '/mentor/dashboard' },
      { icon: Briefcase, label: 'Projects', href: '/mentor/projects' },
      { icon: CheckSquare, label: 'Review Hub', href: '/mentor/review-requests' },
      { icon: Rocket, label: 'Final Submissions', href: '/mentor/final-submissions' },
      { icon: BarChart3, label: 'Progress', href: '/mentor/student-progress' },
      { icon: Users, label: 'Contribution Review', href: '/mentor/contribution-review' },
      { icon: FileText, label: 'Templates', href: '/mentor/templates' },
      { icon: CheckSquare, label: 'Doc Reviews', href: '/mentor/document-reviews' },
      { icon: Clock, label: 'Schedule', href: '/mentor/schedule' },
    ],
    hod: [
      { icon: LayoutDashboard, label: 'Dashboard', href: '/hod/dashboard' },
      { icon: Building2, label: 'Projects', href: '/hod/projects' },
      { icon: Users, label: 'Students', href: '/hod/students' },
      { icon: ShieldCheck, label: 'Approvals', href: '/hod/approvals' },
      { icon: BarChart3, label: 'Analytics', href: '/hod/analytics' },
      { icon: FileText, label: 'Dept Templates', href: '/hod/templates' },
      { icon: CheckSquare, label: 'Doc Tracking', href: '/hod/submission-tracking' },
    ],
  }), []);

  const currentMenu = menuItems[user?.role || 'student'] || [];

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate(`/auth/${user?.role || 'student'}/login`, { replace: true });
  };

  return (
    <div className="flex min-h-screen bg-white">
      {/* Sidebar Overlay */}
      {!isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/10 backdrop-blur-[1px] z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed inset-y-0 left-0 z-50 bg-white border-r border-slate-100 transition-all duration-300 ease-in-out transform flex flex-col",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full",
          isCollapsed ? "w-16" : "w-60",
          "lg:relative lg:translate-x-0"
        )}
      >
        {/* Sidebar Logo */}
        <div className="h-16 flex items-center px-5 shrink-0">
          <Link to="/" className="flex items-center gap-2.5 w-full">
            <img 
              src={logo} 
              alt="ProjectFlow Logo" 
              className={cn("h-8 w-auto object-contain transition-all duration-300", isCollapsed && "h-7 mx-auto")} 
            />
            {!isCollapsed && (
              <span className="text-sm font-extrabold text-slate-900 tracking-tight bg-gradient-to-r from-slate-900 via-blue-900 to-blue-600 bg-clip-text text-transparent">
                ProjectFlow
              </span>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <div className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto custom-scrollbar">
          {currentMenu.map((item) => (
            <SidebarItem 
              key={item.href}
              {...item}
              active={location.pathname === item.href || (item.href !== '/' && location.pathname.startsWith(item.href))}
              collapsed={isCollapsed}
            />
          ))}
        </div>

        {/* Bottom Section */}
        <div className="p-3 border-t border-slate-100">
          <SidebarItem icon={Settings} label="Settings" href={`/${user?.role || 'student'}/settings`} active={location.pathname.includes('/settings')} collapsed={isCollapsed} />
          <button 
            onClick={handleLogout}
            className={cn(
              "flex w-full items-center gap-2.5 px-3 py-2 rounded-lg text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-all duration-200 mt-1",
              isCollapsed && "justify-center"
            )}
          >
            <LogOut size={18} strokeWidth={1.5} />
            {!isCollapsed && <span className="text-sm font-medium tracking-tight">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-6 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => isCollapsed ? setCollapsed(false) : setSidebarOpen(!isSidebarOpen)}
              className="lg:hidden p-1.5 text-slate-500 hover:bg-slate-100 rounded-md transition-all"
            >
              <Menu size={20} />
            </button>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg w-64 lg:w-80 group focus-within:bg-white focus-within:ring-2 focus-within:ring-slate-900/5 focus-within:border-slate-900 transition-all">
              <Search size={14} className="text-slate-400 group-focus-within:text-slate-900 transition-colors" />
              <input 
                type="text" 
                placeholder="Search..." 
                className="bg-transparent border-none focus:ring-0 text-xs w-full outline-none text-slate-700 font-medium"
              />
              <span className="text-[10px] font-semibold text-slate-400 border border-slate-200 px-1 rounded shadow-sm">/</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <button 
                onClick={() => setNotifOpen(!isNotifOpen)}
                className="p-2 text-slate-500 hover:bg-slate-50 rounded-lg transition-all relative"
              >
                <Bell size={18} strokeWidth={1.5} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-bold leading-none text-white border border-white">
                    {visibleUnreadCount}
                  </span>
                )}
              </button>
              <NotificationDropdown 
                isOpen={isNotifOpen} 
                onClose={() => setNotifOpen(false)} 
                notifications={notifications}
                onRead={handleReadNotification}
                onReadAll={handleReadAllNotifications}
              />
            </div>
            
            <div className="h-4 w-px bg-slate-200 mx-1"></div>
            
            <button 
              onClick={() => toast.success(`Profile: ${user?.full_name}`)}
              className="flex items-center gap-2 pl-1 pr-2 py-1 hover:bg-slate-50 rounded-lg transition-all"
            >
              <div className="w-7 h-7 bg-slate-900 rounded-md flex items-center justify-center text-white text-xs font-bold">
                {user?.full_name?.[0]?.toUpperCase() || 'P'}
              </div>
              <ChevronDown size={14} className="text-slate-400" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-8 bg-white">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
