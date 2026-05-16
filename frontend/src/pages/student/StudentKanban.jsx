import React, { useState } from 'react';
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  Plus, 
  MoreHorizontal, 
  MessageCircle, 
  Paperclip,
  CheckCircle2,
  Clock,
  User,
  GripVertical,
  Layout,
  Filter,
  Search,
  Settings2
} from 'lucide-react';
import { 
  PageHeader, 
  StatusBadge 
} from '../../components/common/PremiumComponents';
import { cn } from '../../utils/utils';

const initialTasks = [
  { id: 't1', title: 'User Authentication Flow', status: 'Requirements', priority: 'High', members: ['P'], comments: 4, attachments: 2 },
  { id: 't2', title: 'Database Schema Design', status: 'Requirements', priority: 'Medium', members: ['A'], comments: 1, attachments: 5 },
  { id: 't3', title: 'API Integration for Dashboard', status: 'Development', priority: 'High', members: ['P', 'S'], comments: 12, attachments: 1 },
  { id: 't4', title: 'Landing Page Hero Section', status: 'UI Design', priority: 'Low', members: ['S'], comments: 0, attachments: 3 },
  { id: 't5', title: 'Unit Testing for Auth', status: 'Testing', priority: 'Medium', members: ['A'], comments: 2, attachments: 0 },
];

const stages = [
  'Requirements',
  'UI Design',
  'Architecture',
  'Development',
  'Testing',
  'Code Review',
  'Deployment',
  'Final Review'
];

const SortableTask = ({ task, id }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  const priorityColors = {
    High: 'bg-rose-50 text-rose-600 border-rose-100',
    Medium: 'bg-amber-50 text-amber-600 border-amber-100',
    Low: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className="group bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-300 cursor-grab active:cursor-grabbing mb-3"
    >
      <div className="flex items-start justify-between mb-3">
        <div 
          {...attributes} {...listeners}
          className="p-1 text-slate-300 group-hover:text-slate-500 transition-colors"
        >
          <GripVertical size={16} />
        </div>
        <div className={cn("px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border", priorityColors[task.priority])}>
          {task.priority}
        </div>
      </div>
      
      <h4 className="text-sm font-bold text-slate-800 leading-snug mb-4 group-hover:text-blue-600 transition-colors">
        {task.title}
      </h4>

      <div className="flex items-center justify-between pt-4 border-t border-slate-50">
        <div className="flex -space-x-2">
          {task.members.map((m, i) => (
            <div key={i} className="w-6 h-6 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center text-[8px] font-black text-blue-700">
              {m}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-3 text-slate-400">
          <div className="flex items-center gap-1 text-[10px] font-bold">
            <MessageCircle size={12} />
            {task.comments}
          </div>
          <div className="flex items-center gap-1 text-[10px] font-bold">
            <Paperclip size={12} />
            {task.attachments}
          </div>
        </div>
      </div>
    </div>
  );
};

const StudentKanban = () => {
  const [tasks, setTasks] = useState(initialTasks);
  const [activeId, setActiveId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setTasks((items) => {
        const oldIndex = items.findIndex(t => t.id === active.id);
        const newIndex = items.findIndex(t => t.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
    setActiveId(null);
  };

  return (
    <div className="h-full flex flex-col space-y-8 animate-in fade-in duration-700">
      <PageHeader 
        title="Project Workflow Board" 
        description="Agile SDLC management for 'ProjectFlow v2.0'"
        actions={
          <div className="flex items-center gap-3">
             <div className="flex bg-white border border-slate-200 p-1 rounded-xl shadow-sm">
                <button className="p-2 text-blue-600 bg-slate-50 rounded-lg"><Layout size={18} /></button>
                <button className="p-2 text-slate-400 hover:text-slate-600 rounded-lg"><Clock size={18} /></button>
             </div>
             <button className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 font-black shadow-lg shadow-slate-900/10 transition-all">
                <Plus size={18} />
                New Task
             </button>
          </div>
        }
      />

      {/* Board Controls */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={16} />
            <input type="text" placeholder="Search tasks..." className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all" />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 rounded-xl transition-all">
            <Filter size={16} />
            Filters
          </button>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
             <div className="flex -space-x-2">
                {[1,2,3].map(i => <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-600">U</div>)}
             </div>
             <span className="text-xs font-bold text-slate-500">6 Members</span>
          </div>
          <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors"><Settings2 size={18} /></button>
        </div>
      </div>

      {/* Kanban Board Container */}
      <div className="overflow-x-auto pb-8 custom-scrollbar">
        <div className="flex gap-6 min-w-max px-1">
          <DndContext 
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            {stages.map((stage) => {
              const stageTasks = tasks.filter(t => t.status === stage);
              return (
                <div key={stage} className="w-80 flex flex-col shrink-0 group/column">
                  <div className="flex items-center justify-between mb-4 px-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 group-hover/column:text-blue-600 transition-colors">
                        {stage}
                      </h3>
                      <span className="bg-slate-100 text-slate-500 text-[9px] font-black px-1.5 py-0.5 rounded-full">
                        {stageTasks.length}
                      </span>
                    </div>
                    <button className="p-1 text-slate-300 hover:text-slate-600 transition-colors opacity-0 group-hover/column:opacity-100">
                      <Plus size={16} />
                    </button>
                  </div>

                  <div className="flex-1 bg-slate-100/40 border border-transparent group-hover/column:border-slate-200/50 rounded-2xl p-2 min-h-[500px] transition-all">
                    <SortableContext items={stageTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                      {stageTasks.map((task) => (
                        <SortableTask key={task.id} id={task.id} task={task} />
                      ))}
                    </SortableContext>
                    
                    <button className="w-full py-3 mt-1 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 hover:bg-white rounded-xl border border-transparent hover:border-slate-200 transition-all opacity-0 group-hover/column:opacity-100">
                      <Plus size={14} />
                      Add Task
                    </button>
                  </div>
                </div>
              );
            })}
            
            <DragOverlay dropAnimation={{
              sideEffects: defaultDropAnimationSideEffects({
                styles: {
                  active: {
                    opacity: '0.5',
                  },
                },
              }),
            }}>
              {activeId ? (
                <div className="bg-white p-4 rounded-xl border-2 border-blue-500 shadow-2xl opacity-90 scale-105 rotate-2">
                  <h4 className="text-sm font-bold text-slate-800 leading-snug">
                    {tasks.find(t => t.id === activeId)?.title}
                  </h4>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>
      </div>
    </div>
  );
};

export default StudentKanban;
