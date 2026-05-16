import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Loader2, KeyRound } from 'lucide-react';
import { toast } from 'sonner';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSent(true);
    toast.success('Reset link sent!');
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6">
      <div className="w-full max-w-[400px] space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-slate-900 rounded-xl text-white mb-4">
            <span className="text-xl font-bold">P</span>
          </div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Reset Password</h1>
          <p className="text-sm text-slate-500">We'll send you recovery instructions</p>
        </div>

        <div className="space-y-6">
          {!isSent ? (
            <form onSubmit={handleSubmit} className="space-y-5">
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

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 rounded-lg shadow-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-70"
              >
                {isLoading ? <Loader2 className="animate-spin" size={18} /> : 'Send Reset Link'}
              </button>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg text-slate-600 text-sm font-medium text-center">
                Recovery link sent to <span className="font-bold text-slate-900">{email}</span>
              </div>
              <button 
                onClick={() => setIsSent(false)}
                className="w-full py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-all"
              >
                Try another email
              </button>
            </div>
          )}

          <div className="pt-6 border-t border-slate-100 text-center">
            <Link to="/login" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors">
              <ArrowLeft size={14} />
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
      
      <footer className="absolute bottom-8 text-xs text-slate-400 font-medium">
        &copy; 2026 ProjectFlow Edu Platform
      </footer>
    </div>
  );
};

export default ForgotPassword;
