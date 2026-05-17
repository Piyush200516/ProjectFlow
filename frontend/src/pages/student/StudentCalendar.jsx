import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Video,
  FileText,
  Flag,
  Clock
} from 'lucide-react';
import { cn } from '../../utils/utils';

const dummyEvents = [
  { id: 1, title: 'SRS Submission Deadline', date: 15, type: 'deadline', time: '11:59 PM' },
  { id: 2, title: 'Mentor Weekly Sync', date: 18, type: 'meeting', time: '10:00 AM' },
  { id: 3, title: 'Phase 1 Milestone', date: 22, type: 'milestone', time: '5:00 PM' },
  { id: 4, title: 'Hackathon Registration', date: 28, type: 'hackathon', time: '11:00 AM' },
];

const StudentCalendar = () => {
  const [view, setView] = useState('month'); // 'month' or 'week'

  // Generate 35 days for a 5-week month grid (dummy data logic)
  const days = Array.from({ length: 35 }, (_, i) => i + 1 - 4); // Start from previous month's end to pad

  const getEventForDay = (dayNum) => {
    return dummyEvents.find(e => e.date === dayNum);
  };

  const getEventStyle = (type) => {
    switch(type) {
      case 'deadline': return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'meeting': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'milestone': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'hackathon': return 'bg-purple-100 text-purple-700 border-purple-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getEventIcon = (type) => {
    switch(type) {
      case 'deadline': return <Clock size={10} className="shrink-0" />;
      case 'meeting': return <Video size={10} className="shrink-0" />;
      case 'milestone': return <Flag size={10} className="shrink-0" />;
      case 'hackathon': return <CalendarIcon size={10} className="shrink-0" />;
      default: return <FileText size={10} className="shrink-0" />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Project Calendar</h1>
          <p className="text-sm text-slate-500 mt-1">Track deadlines, milestones, and mentor syncs.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-100 p-1 rounded-lg">
            <button 
              onClick={() => setView('month')}
              className={cn("px-3 py-1.5 text-xs font-bold rounded-md transition-all", view === 'month' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700")}
            >
              Month
            </button>
            <button 
              onClick={() => setView('week')}
              className={cn("px-3 py-1.5 text-xs font-bold rounded-md transition-all", view === 'week' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700")}
            >
              Week
            </button>
          </div>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm">
            Add Event
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        {/* Calendar Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-bold text-slate-900">May 2026</h2>
            <div className="flex items-center gap-1">
              <button className="p-1 hover:bg-slate-200 rounded-md text-slate-500 transition-colors"><ChevronLeft size={18} /></button>
              <button className="px-2 py-1 hover:bg-slate-200 rounded-md text-xs font-bold text-slate-500 uppercase tracking-wider transition-colors">Today</button>
              <button className="p-1 hover:bg-slate-200 rounded-md text-slate-500 transition-colors"><ChevronRight size={18} /></button>
            </div>
          </div>
          
          <div className="hidden sm:flex items-center gap-4 text-xs font-medium text-slate-500">
            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-500"></span> Deadlines</div>
            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Meetings</div>
            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Milestones</div>
          </div>
        </div>

        {/* Days of Week */}
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/50">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="py-3 text-center text-[10px] font-black uppercase tracking-widest text-slate-400 border-r border-slate-100 last:border-0">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 auto-rows-[120px] bg-slate-100 gap-px">
          {days.map((dayNum, i) => {
            const isCurrentMonth = dayNum > 0 && dayNum <= 31;
            const displayNum = isCurrentMonth ? dayNum : (dayNum <= 0 ? 30 + dayNum : dayNum - 31);
            const isToday = isCurrentMonth && dayNum === 18; // Dummy today
            const event = isCurrentMonth ? getEventForDay(dayNum) : null;

            return (
              <div key={i} className={cn(
                "bg-white p-2 flex flex-col gap-1 overflow-hidden group hover:bg-slate-50 transition-colors",
                !isCurrentMonth && "bg-slate-50/50 text-slate-400"
              )}>
                <div className="flex justify-between items-start">
                  <span className={cn(
                    "w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold",
                    isToday ? "bg-blue-600 text-white shadow-sm" : (isCurrentMonth ? "text-slate-700" : "text-slate-400")
                  )}>
                    {displayNum}
                  </span>
                </div>
                
                {event && (
                  <div className={cn(
                    "p-1.5 rounded-md border text-[10px] font-semibold flex flex-col gap-0.5 truncate cursor-pointer hover:shadow-sm transition-shadow",
                    getEventStyle(event.type)
                  )} title={`${event.time} - ${event.title}`}>
                    <div className="flex items-center gap-1">
                      {getEventIcon(event.type)}
                      <span className="truncate">{event.title}</span>
                    </div>
                    <span className="opacity-75 pl-[14px] truncate">{event.time}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default StudentCalendar;
