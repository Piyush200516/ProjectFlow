import React from 'react';
import { cn } from '../../utils/utils';

// Page Header Component
export const PageHeader = ({ title, description, actions, children }) => (
  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
    <div>
      <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{title}</h1>
      {description && <p className="text-slate-500 mt-1">{description}</p>}
      {children}
    </div>
    {actions && <div className="flex items-center gap-3">{actions}</div>}
  </div>
);

// Premium Stat Card
export const StatCard = ({ icon: Icon, label, value, trend, trendValue, color = 'blue' }) => {
  const colors = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    green: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:shadow-slate-200/50 transition-all duration-300 group">
      <div className="flex items-start justify-between">
        <div className={cn("p-3 rounded-xl border transition-colors group-hover:bg-white", colors[color])}>
          <Icon size={24} />
        </div>
        {trend && (
          <div className={cn(
            "flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
            trend === 'up' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
          )}>
            {trend === 'up' ? '↑' : '↓'} {trendValue}
          </div>
        )}
      </div>
      <div className="mt-4">
        <p className="text-slate-500 text-sm font-medium">{label}</p>
        <p className="text-2xl font-extrabold text-slate-900 mt-1 tracking-tight">{value}</p>
      </div>
    </div>
  );
};

// Section Card / Glassmorphism Container
export const SectionCard = ({ title, subtitle, children, className, headerActions }) => (
  <div className={cn("bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden", className)}>
    {(title || subtitle) && (
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div>
          {title && <h3 className="text-lg font-bold text-slate-900">{title}</h3>}
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
    success: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
    warning: 'bg-amber-50 text-amber-600 border border-amber-100',
    error: 'bg-rose-50 text-rose-600 border border-rose-100',
    info: 'bg-blue-50 text-blue-600 border border-blue-100',
    indigo: 'bg-indigo-50 text-indigo-600 border border-indigo-100',
  };

  return (
    <span className={cn(
      "px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider inline-flex items-center justify-center",
      variants[variant] || variants.default
    )}>
      {status}
    </span>
  );
};

// Empty State
export const EmptyState = ({ icon: Icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-12 px-4 text-center animate-in fade-in zoom-in-95 duration-500">
    <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-2xl flex items-center justify-center mb-4">
      {Icon && <Icon size={32} />}
    </div>
    <h3 className="text-lg font-bold text-slate-900">{title}</h3>
    <p className="text-slate-500 text-sm mt-1 max-w-xs mx-auto">{description}</p>
    {action && <div className="mt-6">{action}</div>}
  </div>
);

// Progress Card
export const ProgressCard = ({ label, value, color = 'blue', showValue = true }) => (
  <div className="space-y-2">
    <div className="flex justify-between items-center text-xs font-bold text-slate-600">
      <span>{label}</span>
      {showValue && <span>{value}%</span>}
    </div>
    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
      <div 
        className={cn("h-full rounded-full transition-all duration-1000 ease-out", 
          color === 'blue' ? "bg-blue-600" : 
          color === 'emerald' ? "bg-emerald-500" : 
          color === 'amber' ? "bg-amber-500" : "bg-slate-600"
        )} 
        style={{ width: `${value}%` }}
      />
    </div>
  </div>
);
