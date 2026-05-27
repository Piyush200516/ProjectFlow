import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import logo from '../../assets/projectflow-logo.png';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signupSchema } from '../../lib/validationSchemas';

const Signup = () => {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      rollNumber: '',
      branch: '1',
      semester: '6',
      section: '1',
      subsection: '1',
    },
  });

  const onSubmit = async (formData) => {
    try {
      await signup(formData.email, formData.password, formData.name, 'student', formData.rollNumber, formData.branch, formData.section, formData.subsection, formData.semester);
      toast.success('Account created! Welcome to ProjectFlow.');
      navigate('/student/dashboard', { replace: true });
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || 'Signup failed. Please try again.';
      toast.error(errorMsg);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6">
      <div className="w-full max-w-[400px] space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <img
              src={logo}
              alt="ProjectFlow Logo"
              className="w-36 h-auto object-contain transition-transform duration-300 hover:scale-105"
            />
          </div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Create Student Account</h1>
          <p className="text-sm text-slate-500">Join the ProjectFlow Edu workspace</p>
        </div>

        <div className="space-y-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-900 ml-1">Full Name</label>
                <input type="text" required className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all text-sm" placeholder="John Doe" {...register('name')} />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-900 ml-1">Roll Number</label>
                <input type="text" required className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all text-sm" placeholder="CS001" {...register('rollNumber')} />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-900 ml-1">Branch</label>
                <select required className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all text-sm" {...register('branch')}>
                  <option value="1">Computer Science & Engineering</option>
                  <option value="2">Information Technology</option>
                  <option value="3">Electronics & Communication</option>
                  <option value="4">Mechanical Engineering</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-900 ml-1">Semester</label>
                <select required className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all text-sm" {...register('semester')}>
                  {[5,6,7,8].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-900 ml-1">Section</label>
                  <select required className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all text-sm" {...register('section')}>
                    {[1,2,3,4,5,6].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-900 ml-1">Subsection</label>
                  <select required className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all text-sm" {...register('subsection')}>
                    <option value="1">1</option>
                    <option value="2">2</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-900 ml-1">University Email</label>
                <input type="email" required className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all text-sm" placeholder="name@university.edu" {...register('email')} />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-900 ml-1">Password</label>
                <input type="password" required className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all text-sm" placeholder="••••••••" {...register('password')} />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-900 ml-1">Confirm Password</label>
                <input type="password" required className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all text-sm" placeholder="••••••••" {...register('confirmPassword')} />
              </div>
            </div>

            <button type="submit" disabled={isSubmitting} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 rounded-lg shadow-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-70">
              {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : 'Create Account'}
            </button>
          </form>

          <div className="pt-6 border-t border-slate-100 flex items-center justify-center gap-2">
            <p className="text-xs text-slate-500">Already have an account?</p>
            <Link to="/auth/student/login" className="text-xs font-semibold text-slate-900 hover:underline underline-offset-4">Sign in</Link>
          </div>
        </div>
      </div>

      <footer className="absolute bottom-8 text-xs text-slate-400 font-medium">
        &copy; 2026 ProjectFlow Edu Platform
      </footer>
    </div>
  );
};

export default Signup;
