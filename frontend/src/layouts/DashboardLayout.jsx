import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
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
  X,
  User,
  ChevronRight,
  HelpCircle,
  Rocket,
  Lightbulb,
  Handshake,
  ShieldCheck,
  Building2,
  Users
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { cn } from '../utils/utils';

const SidebarItem = ({ icon: Icon, label, href, active, collapsed }) => (
  <Link 
    to={href} 
    className={cn(
      "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 relative group",
      active 
        ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" 
        : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
    )}
  >
    <Icon size={20} className={cn("shrink-0", active ? "text-white" : "group-hover:text-blue-600 transition-colors")} />
    {!collapsed && <span className="font-semibold text-sm tracking-tight">{label}</span>}
    {active && !collapsed && (
      <div className="absolute right-2 w-1.5 h-1.5 bg-white rounded-full"></div>
    )}
    {collapsed && (
      <div className="absolute left-full ml-4 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-[60]">
        {label}
      </div>
    )}
  </Link>
);

const DashboardLayout = ({ children }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isCollapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();

  // Handle auto-collapse on small screens
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
  }, []);

  const menuItems = {
    student: [
      { icon: LayoutDashboard, label: 'Overview', href: '/student/dashboard' },
      { icon: Briefcase, label: 'Projects', href: '/student/projects' },
      { icon: CheckSquare, label: 'SDLC Kanban', href: '/student/kanban' },
      { icon: Clock, label: 'Timeline', href: '/student/timeline' },
      { icon: FileText, label: 'Documentation', href: '/student/documentation' },
      { icon: MessageSquare, label: 'Feedback', href: '/student/mentor-feedback' },
      { icon: BarChart3, label: 'Performance', href: '/student/student-score' },
    ],
    mentor: [
      { icon: LayoutDashboard, label: 'Overview', href: '/mentor/dashboard' },
      { icon: Briefcase, label: 'Projects', href: '/mentor/projects' },
      { icon: CheckSquare, label: 'Review Hub', href: '/mentor/review-requests' },
      { icon: BarChart3, label: 'Student Growth', href: '/mentor/student-progress' },
      { icon: Clock, label: 'Schedules', href: '/mentor/schedule' },
    ],
    hod: [
      { icon: LayoutDashboard, label: 'Department Overview', href: '/hod/dashboard' },
      { icon: Building2, label: 'All Projects', href: '/hod/projects' },
      { icon: Users, label: 'Manage Students', href: '/hod/students' },
      { icon: ShieldCheck, label: 'Approvals', href: '/hod/approvals' },
      { icon: BarChart3, label: 'Global Analytics', href: '/hod/analytics' },
    ],
    cdc: [
      { icon: LayoutDashboard, label: 'Innovation Hub', href: '/cdc/dashboard' },
      { icon: Rocket, label: 'Startups', href: '/cdc/startups' },
      { icon: Lightbulb, label: 'Hackathons', href: '/cdc/hackathons' },
      { icon: Handshake, label: 'Collaborations', href: '/cdc/industry-collaboration' },
    ],
  };

  const currentMenu = menuItems[user?.role || 'student'] || [];

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      {/* Sidebar Overlay */}
      {!isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed inset-y-0 left-0 z-50 bg-white border-r border-slate-200 transition-all duration-500 ease-in-out transform flex flex-col shadow-xl shadow-slate-200/50",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full",
          isCollapsed ? "w-20" : "w-64",
          "lg:relative lg:translate-x-0"
        )}
      >
        {/* Sidebar Logo */}
        <div className="h-20 flex items-center px-6 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-600/30">
              P
            </div>
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="text-lg font-black text-slate-900 tracking-tight leading-tight">ProjectFlow</span>
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest leading-tight">Edu Platform</span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 px-4 py-6 space-y-1 overflow-y-auto custom-scrollbar">
          {!isCollapsed && <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Main Menu</p>}
          {currentMenu.map((item) => (
            <SidebarItem 
              key={item.href}
              {...item}
              active={location.pathname === item.href}
              collapsed={isCollapsed}
            />
          ))}
          
          <div className="pt-6 mt-6 border-t border-slate-100">
            {!isCollapsed && <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">System</p>}
            <SidebarItem icon={Settings} label="Settings" href={`/${user?.role || 'student'}/settings`} active={location.pathname.includes('/settings')} collapsed={isCollapsed} />
            <SidebarItem icon={HelpCircle} label="Support" href="#" collapsed={isCollapsed} />
          </div>
        </div>

        {/* User Card */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className={cn("flex items-center gap-3 p-2 rounded-2xl bg-white border border-slate-200 shadow-sm transition-all", isCollapsed ? "justify-center" : "px-3 py-2")}>
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-700 font-bold shrink-0">
              {user?.name?.[0]?.toUpperCase() || 'P'}
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 truncate">{user?.name || 'User'}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider capitalize">{user?.role}</p>
              </div>
            )}
            {!isCollapsed && (
              <button 
                onClick={logout}
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
              >
                <LogOut size={18} />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-6 lg:px-8 sticky top-0 z-40 transition-all">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => isCollapsed ? setCollapsed(false) : setSidebarOpen(!isSidebarOpen)}
              className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-all"
            >
              <Menu size={22} />
            </button>
            <div className="hidden sm:flex items-center bg-slate-100/50 border border-slate-200/60 px-4 py-2 rounded-2xl w-64 lg:w-96 group focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-500/5 focus-within:border-blue-500 transition-all">
              <Search size={18} className="text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              <input 
                type="text" 
                placeholder="Global search..." 
                className="bg-transparent border-none focus:ring-0 text-sm ml-3 w-full outline-none text-slate-700 font-medium"
              />
              <span className="text-[10px] font-bold text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200 ml-2 shadow-sm">⌘K</span>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-5">
            <div className="hidden md:flex flex-col items-end mr-2">
              <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-widest">Server Online</span>
              <span className="text-[9px] font-bold text-slate-400 mt-0.5">v1.0.4 production</span>
            </div>
            
            <button className="relative p-2.5 text-slate-500 hover:bg-slate-100 rounded-2xl transition-all group">
              <Bell size={22} className="group-hover:text-blue-600 transition-colors" />
              <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white animate-pulse"></span>
            </button>
            
            <div className="h-10 w-px bg-slate-200 mx-1 hidden sm:block"></div>
            
            <div className="flex items-center gap-2 p-1.5 pr-3 hover:bg-slate-100 rounded-2xl transition-all cursor-pointer group">
              <div className="w-9 h-9 bg-gradient-to-tr from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-200 group-hover:scale-105 transition-transform">
                <User size={20} />
              </div>
              <ChevronDown size={16} className="text-slate-400 group-hover:text-slate-600" />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto custom-scrollbar bg-[#f8fafc] p-6 lg:p-10">
          <div className="max-w-7xl mx-auto space-y-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
