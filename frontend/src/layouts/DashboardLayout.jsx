import React, { useState } from 'react';
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
  User
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const SidebarItem = ({ icon: Icon, label, href, active }) => (
  <Link 
    to={href} 
    className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 ${
      active 
        ? 'bg-blue-600 text-white shadow-md' 
        : 'text-slate-600 hover:bg-slate-100'
    }`}
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
  </Link>
);

const DashboardLayout = ({ children, role = 'student' }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const { user, logout } = useAuth();

  const menuItems = {
    student: [
      { icon: LayoutDashboard, label: 'Dashboard', href: '/student/dashboard' },
      { icon: Briefcase, label: 'Projects', href: '/student/projects' },
      { icon: CheckSquare, label: 'Kanban', href: '/student/kanban' },
      { icon: Clock, label: 'Timeline', href: '/student/timeline' },
      { icon: FileText, label: 'Documentation', href: '/student/documentation' },
      { icon: MessageSquare, label: 'Feedback', href: '/student/mentor-feedback' },
      { icon: BarChart3, label: 'My Score', href: '/student/student-score' },
      { icon: Settings, label: 'Settings', href: '/student/settings' },
    ],
    mentor: [
      { icon: LayoutDashboard, label: 'Dashboard', href: '/mentor/dashboard' },
      { icon: Briefcase, label: 'Projects', href: '/mentor/projects' },
      { icon: CheckSquare, label: 'Review Requests', href: '/mentor/review-requests' },
      { icon: BarChart3, label: 'Student Progress', href: '/mentor/student-progress' },
      { icon: Settings, label: 'Settings', href: '/mentor/settings' },
    ],
    hod: [
      { icon: LayoutDashboard, label: 'Dashboard', href: '/hod/dashboard' },
      { icon: Briefcase, label: 'All Projects', href: '/hod/projects' },
      { icon: Users, label: 'Students', href: '/hod/students' },
      { icon: MessageSquare, label: 'Approvals', href: '/hod/approvals' },
      { icon: BarChart3, label: 'Analytics', href: '/hod/analytics' },
      { icon: FileText, label: 'Reports', href: '/hod/reports' },
      { icon: Settings, label: 'Settings', href: '/hod/settings' },
    ],
    cdc: [
      { icon: LayoutDashboard, label: 'Dashboard', href: '/cdc/dashboard' },
      { icon: Rocket, label: 'Startups', href: '/cdc/startups' },
      { icon: Lightbulb, label: 'Hackathons', href: '/cdc/hackathons' },
      { icon: Handshake, label: 'Industry', href: '/cdc/industry-collaboration' },
      { icon: CheckSquare, label: 'Approvals', href: '/cdc/approvals' },
      { icon: BarChart3, label: 'Analytics', href: '/cdc/analytics' },
      { icon: Settings, label: 'Settings', href: '/cdc/settings' },
    ],
  };

  const currentMenu = menuItems[user?.role || 'student'] || [];

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0`}>
        <div className="flex flex-col h-full">
          <div className="p-6">
            <div className="flex items-center gap-2 text-blue-600 font-bold text-2xl tracking-tight">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">P</div>
              <span>ProjectFlow</span>
            </div>
          </div>
          
          <nav className="flex-1 px-4 space-y-1">
            {currentMenu.map((item) => (
              <SidebarItem 
                key={item.href}
                icon={item.icon}
                label={item.label}
                href={item.href}
                active={location.pathname === item.href}
              />
            ))}
          </nav>

          <div className="p-4 border-t border-slate-100">
            <button 
              onClick={logout}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
            >
              <LogOut size={20} />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-40">
          <button className="md:hidden text-slate-600" onClick={() => setSidebarOpen(!isSidebarOpen)}>
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          
          <div className="hidden md:flex items-center bg-slate-100 px-3 py-1.5 rounded-lg w-96">
            <Search size={18} className="text-slate-400" />
            <input 
              type="text" 
              placeholder="Search projects, tasks..." 
              className="bg-transparent border-none focus:ring-0 text-sm ml-2 w-full outline-none"
            />
          </div>

          <div className="flex items-center gap-4">
            <button className="relative text-slate-500 hover:text-blue-600 p-1.5 hover:bg-blue-50 rounded-full transition-colors">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="h-8 w-px bg-slate-200 mx-1"></div>
            <div className="flex items-center gap-3 pl-1">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-slate-900">{user?.name || 'Guest'}</p>
                <p className="text-xs text-slate-500 capitalize">{user?.role || 'User'}</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold shadow-md">
                {user?.name?.[0]?.toUpperCase() || <User size={20} />}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
