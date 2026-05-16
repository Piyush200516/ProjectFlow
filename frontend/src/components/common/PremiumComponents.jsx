import React from 'react';
import { X } from 'lucide-react';
import { cn } from '../../utils/utils';

// Page Header Component
export const PageHeader = ({ title, description, actions, children }) => (
  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10 animate-in fade-in slide-in-from-top-2 duration-500">
    <div>
      <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">{title}</h1>
      {description && <p className="text-slate-500 text-sm mt-1.5 leading-relaxed">{description}</p>}
      {children}
    </div>
    {actions && <div className="flex items-center gap-2.5">{actions}</div>}
  </div>
);

// Premium Stat Card
export const StatCard = ({ icon: Icon, label, value, trend, trendValue, color = 'blue' }) => {
  const colors = {
    blue: 'text-blue-600',
    green: 'text-emerald-600',
    amber: 'text-amber-600',
    indigo: 'text-indigo-600',
    rose: 'text-rose-600',
  };

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-subtle hover:shadow-minimal transition-all duration-200 group">
      <div className="flex items-start justify-between">
        <div className={cn("p-2 rounded-lg bg-slate-50 border border-slate-100 transition-colors group-hover:bg-white", colors[color])}>
          <Icon size={20} />
        </div>
        {trend && (
          <div className={cn(
            "flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider",
            trend === 'up' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
          )}>
            {trend === 'up' ? '↑' : '↓'} {trendValue}
          </div>
        )}
      </div>
      <div className="mt-4">
        <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">{label}</p>
        <p className="text-xl font-semibold text-slate-900 mt-1 tracking-tight">{value}</p>
      </div>
    </div>
  );
};

// Section Card / Glassmorphism Container
export const SectionCard = ({ title, subtitle, children, className, headerActions }) => (
  <div className={cn("bg-white rounded-xl border border-slate-200 shadow-subtle overflow-hidden", className)}>
    {(title || subtitle) && (
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
        <div>
          {title && <h3 className="text-sm font-semibold text-slate-900">{title}</h3>}
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
        {headerActions && <div>{headerActions}</div>}
      </div>
    )}
    <div className="p-6">{children}</div>
  </div>
);

// Status Badge
export const StatusBadge = ({ status, variant = 'default' }) => {
  const variants = {
    default: 'bg-slate-100 text-slate-600',
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
    warning: 'bg-amber-50 text-amber-700 border border-amber-100',
    error: 'bg-rose-50 text-rose-700 border border-rose-100',
    info: 'bg-blue-50 text-blue-700 border border-blue-100',
    indigo: 'bg-indigo-50 text-indigo-700 border border-indigo-100',
  };

  return (
    <span className={cn(
      "px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-tight inline-flex items-center justify-center",
      variants[variant] || variants.default
    )}>
      {status}
    </span>
  );
};

// Empty State
export const EmptyState = ({ icon: Icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-12 px-4 text-center animate-in fade-in zoom-in-95 duration-500">
    <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-lg flex items-center justify-center mb-4">
      {Icon && <Icon size={24} />}
    </div>
    <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
    <p className="text-slate-500 text-xs mt-1.5 max-w-xs mx-auto leading-relaxed">{description}</p>
    {action && <div className="mt-6">{action}</div>}
  </div>
);

// Progress Card
export const ProgressCard = ({ label, value, color = 'blue', showValue = true }) => (
  <div className="space-y-2">
    <div className="flex justify-between items-center text-xs font-medium text-slate-600">
      <span>{label}</span>
      {showValue && <span className="text-slate-400">{value}%</span>}
    </div>
    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
      <div 
        className={cn("h-full rounded-full transition-all duration-1000 ease-out", 
          color === 'blue' ? "bg-slate-900" : 
          color === 'emerald' ? "bg-emerald-500" : 
          color === 'amber' ? "bg-amber-500" : "bg-slate-400"
        )} 
        style={{ width: `${value}%` }}
      />
    </div>
  </div>
);

// Premium Modal Component
export const Modal = ({ isOpen, onClose, title, children, footer }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/20 backdrop-blur-[2px] animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-xl rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-2 duration-300">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-all">
            <X size={16} />
          </button>
        </div>
        <div className="px-6 py-6 overflow-y-auto max-h-[70vh] custom-scrollbar text-sm text-slate-600">
          {children}
        </div>
        {footer && (
          <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-end gap-2.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
