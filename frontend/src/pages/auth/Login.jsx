import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogIn, Github, Mail, Lock, Loader2, Rocket, ShieldCheck, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../../utils/utils';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1200));
      login(email, password, role);
      toast.success('Welcome back, ' + email.split('@')[0] + '!');
      navigate(`/${role}/dashboard`);
    } catch (error) {
      toast.error('Invalid credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const roleConfigs = {
    student: { icon: Rocket, label: 'Student', desc: 'Work on your projects', color: 'blue' },
    mentor: { icon: ShieldCheck, label: 'Mentor', desc: 'Review & Guide', color: 'emerald' },
    hod: { icon: Zap, label: 'HOD', desc: 'Manage Dept', color: 'amber' },
    cdc: { icon: Rocket, label: 'CDC', desc: 'Innovation Hub', color: 'indigo' },
  };

  return (
    <div className="min-h-screen flex items-stretch bg-white">
      {/* Left side: Hero/Visual (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#0f172a] relative overflow-hidden p-12 flex-col justify-between">
        {/* Animated Background Elements */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/4"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-blue-500/20">P</div>
            <span className="text-2xl font-black text-white tracking-tighter">ProjectFlow Edu</span>
          </div>
        </div>

        <div className="relative z-10 max-w-lg">
          <h2 className="text-5xl font-black text-white leading-tight tracking-tight mb-6">
            The standard in <span className="text-blue-500">academic project</span> lifecycle management.
          </h2>
          <p className="text-slate-400 text-lg leading-relaxed mb-10">
            A comprehensive, AI-powered platform for schools and colleges to manage projects, track progress, and foster innovation.
          </p>
          
          <div className="grid grid-cols-2 gap-6">
            <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm group hover:bg-white/10 transition-all">
              <p className="text-3xl font-black text-white mb-1">1.2k+</p>
              <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Projects Tracked</p>
            </div>
            <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm group hover:bg-white/10 transition-all">
              <p className="text-3xl font-black text-white mb-1">45+</p>
              <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Institutions</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-slate-500 text-sm font-medium">
          &copy; 2026 Advanced Agentic Coding. Built for excellence.
        </div>
      </div>

      {/* Right side: Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 md:p-16 relative">
        {/* Mobile Logo */}
        <div className="lg:hidden absolute top-8 left-8 flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black">P</div>
          <span className="font-black text-slate-900">ProjectFlow</span>
        </div>

        <div className="w-full max-w-md">
          <div className="mb-10 text-center lg:text-left">
            <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-3">Sign In</h1>
            <p className="text-slate-500 font-medium">Please select your role and enter credentials.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Improved Role Selector */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(roleConfigs).map(([id, cfg]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setRole(id)}
                  className={cn(
                    "flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all group",
                    role === id 
                      ? `bg-${cfg.color}-50 border-${cfg.color}-600/50 shadow-lg shadow-${cfg.color}-600/5` 
                      : "bg-white border-slate-100 hover:border-slate-200"
                  )}
                >
                  <cfg.icon size={20} className={cn("mb-2", role === id ? `text-${cfg.color}-600` : "text-slate-400")} />
                  <span className={cn("text-[10px] font-black uppercase tracking-widest", role === id ? `text-${cfg.color}-700` : "text-slate-500")}>
                    {cfg.label}
                  </span>
                </button>
              ))}
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50/50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all font-medium text-slate-700"
                    placeholder="name@college.edu"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Password</label>
                  <Link to="/forgot-password" px-1 className="text-xs font-bold text-blue-600 hover:text-blue-700">Reset Password?</Link>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50/50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all font-medium text-slate-700"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-500/20 flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-70"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Authenticating...
                </>
              ) : (
                <>
                  Sign in
                  <Zap size={18} className="fill-current" />
                </>
              )}
            </button>
          </form>

          <div className="mt-12 pt-8 border-t border-slate-100 flex items-center justify-between">
            <p className="text-sm text-slate-500 font-medium">New to ProjectFlow?</p>
            <Link to="/signup" className="text-sm font-black text-blue-600 hover:text-blue-700 hover:underline">Create Account</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
