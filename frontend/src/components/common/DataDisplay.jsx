import React from 'react';
import { Search, Filter, ChevronDown, Download, MoreHorizontal } from 'lucide-react';
import { cn } from '../../utils/utils';

export const SearchFilterBar = ({ onSearch, onFilter, placeholder = "Search..." }) => (
  <div className="flex flex-col sm:flex-row gap-4 mb-6">
    <div className="flex-1 relative group">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
      <input 
        type="text" 
        placeholder={placeholder}
        className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all shadow-sm group-hover:border-slate-300"
        onChange={(e) => onSearch?.(e.target.value)}
      />
    </div>
    <div className="flex gap-2">
      <button className="px-4 py-3 bg-white border border-slate-200 rounded-xl flex items-center gap-2 font-bold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm active:scale-95">
        <Filter size={18} />
        Filter
        <ChevronDown size={14} />
      </button>
      <button className="p-3 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-all shadow-sm active:scale-95">
        <Download size={18} />
      </button>
    </div>
  </div>
);

export const DataTableWrapper = ({ columns, data, onRowClick }) => (
  <div className="overflow-x-auto custom-scrollbar">
    <table className="w-full text-left border-collapse">
      <thead>
        <tr className="bg-slate-50/50 border-b border-slate-100">
          {columns.map((col, i) => (
            <th 
              key={i} 
              className={cn(
                "px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest",
                col.className
              )}
            >
              {col.header}
            </th>
          ))}
          <th className="px-6 py-4"></th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-50">
        {data.map((row, i) => (
          <tr 
            key={i} 
            onClick={() => onRowClick?.(row)}
            className="group hover:bg-blue-50/30 transition-colors cursor-pointer"
          >
            {columns.map((col, j) => (
              <td key={j} className={cn("px-6 py-4", col.cellClassName)}>
                {col.render ? col.render(row) : <span className="text-sm font-medium text-slate-700">{row[col.key]}</span>}
              </td>
            ))}
            <td className="px-6 py-4 text-right">
              <button className="p-2 text-slate-300 hover:text-slate-600 hover:bg-white rounded-lg transition-all opacity-0 group-hover:opacity-100">
                <MoreHorizontal size={18} />
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export const ActivityTimeline = ({ activities }) => (
  <div className="space-y-6">
    {activities.map((activity, i) => (
      <div key={i} className="flex gap-4 relative">
        {i !== activities.length - 1 && (
          <div className="absolute left-4 top-10 bottom-[-24px] w-0.5 bg-slate-100"></div>
        )}
        <div className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10",
          activity.type === 'success' ? "bg-emerald-50 text-emerald-600" :
          activity.type === 'warning' ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600"
        )}>
          {activity.icon && <activity.icon size={16} />}
        </div>
        <div className="flex-1 pb-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-800">{activity.title}</h4>
            <span className="text-[10px] font-medium text-slate-400">{activity.time}</span>
          </div>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">{activity.description}</p>
        </div>
      </div>
    ))}
  </div>
);
