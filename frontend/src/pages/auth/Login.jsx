import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogIn, Mail, Lock, Loader2, Rocket, ShieldCheck, Zap, Briefcase, User } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../../utils/utils';

const Login = ({ role = 'student', title = 'Sign In' }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      login(email, password, role);
      toast.success('Welcome back!');
      navigate(`/${role}/dashboard`, { replace: true });
    } catch (error) {
      toast.error('Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6">
      <div className="w-full max-w-[400px] space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-slate-900 rounded-xl text-white mb-4">
            <span className="text-xl font-bold">P</span>
          </div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">{title}</h1>
          <p className="text-sm text-slate-500">Access the ProjectFlow Edu {role} workspace</p>
        </div>

        <div className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-900 ml-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all text-sm"
                  placeholder="name@university.edu"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between ml-1">
                  <label className="text-xs font-semibold text-slate-900">Password</label>
                  {role === 'student' && (
                    <Link to="/auth/student/forgot-password" px-1 className="text-xs font-medium text-slate-500 hover:text-slate-900">Forgot?</Link>
                  )}
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 rounded-lg shadow-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-70"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          {role === 'student' && (
            <div className="pt-6 border-t border-slate-100 flex items-center justify-center gap-2">
              <p className="text-xs text-slate-500">Need an account?</p>
              <Link to="/auth/student/register" className="text-xs font-semibold text-slate-900 hover:underline underline-offset-4">Create account</Link>
            </div>
          )}
        </div>
      </div>
      
      <footer className="absolute bottom-8 text-xs text-slate-400 font-medium">
        &copy; 2026 ProjectFlow Edu Platform
      </footer>
    </div>
  );
};

export default Login;
