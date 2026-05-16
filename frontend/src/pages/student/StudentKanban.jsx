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
  GripVertical,
  Clock,
  AlertCircle,
  MessageSquare
} from 'lucide-react';
import { cn } from '../../utils/utils';

const STAGES = [
  'Requirement Analysis',
  'Planning',
  'UI/UX Design',
  'Development',
  'Testing',
  'Documentation',
  'Review',
  'Completed'
];

const SortableTask = ({ task }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group cursor-default"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <button {...attributes} {...listeners} className="text-slate-400 hover:text-slate-600 cursor-grab active:cursor-grabbing">
            <GripVertical size={16} />
          </button>
          <span className={cn(
            "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider",
            task.priority === 'High' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
          )}>
            {task.priority}
          </span>
        </div>
        <button className="text-slate-400 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">
          <MoreHorizontal size={16} />
        </button>
      </div>
      
      <h4 className="text-sm font-bold text-slate-800 mb-4">{task.title}</h4>
      
      <div className="flex items-center justify-between">
        <div className="flex -space-x-2">
          {[1, 2].map((i) => (
            <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500">
              U{i}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-3 text-slate-400">
          <div className="flex items-center gap-1">
            <MessageSquare size={12} />
            <span className="text-[10px]">2</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock size={12} />
            <span className="text-[10px]">2d</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const KanbanColumn = ({ stage, tasks }) => {
  return (
    <div className="flex flex-col w-72 min-w-[18rem] bg-slate-100/50 rounded-2xl border border-slate-200/60 p-4">
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-slate-700">{stage}</h3>
          <span className="bg-slate-200 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full">{tasks.length}</span>
        </div>
        <button className="text-slate-400 hover:text-blue-600 transition-colors">
          <Plus size={18} />
        </button>
      </div>
      
      <div className="flex-1 space-y-3">
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map(task => (
            <SortableTask key={task.id} task={task} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
};

const StudentKanban = () => {
  const [tasks, setTasks] = useState([
    { id: '1', title: 'Define project scope and requirements', stage: 'Requirement Analysis', priority: 'High' },
    { id: '2', title: 'Research competitors and technologies', stage: 'Requirement Analysis', priority: 'Medium' },
    { id: '3', title: 'Create system architecture diagram', stage: 'Planning', priority: 'High' },
    { id: '4', title: 'Design high-fidelity mockups', stage: 'UI/UX Design', priority: 'High' },
    { id: '5', title: 'Implement authentication module', stage: 'Development', priority: 'High' },
    { id: '6', title: 'Setup database schema', stage: 'Development', priority: 'Medium' },
  ]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      // Logic to move tasks between stages or reorder
      // For this prototype, we'll just log
      console.log('Moved task', active.id, 'over', over.id);
    }
  };

  return (
    <div className="h-full flex flex-col gap-6 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">SDLC Kanban</h1>
          <p className="text-slate-500 mt-1">Track your project tasks across standard SDLC stages.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex -space-x-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="w-10 h-10 rounded-full border-4 border-white bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                M{i}
              </div>
            ))}
          </div>
          <button className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm">
            Manage Team
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto pb-4 custom-scrollbar">
        <div className="flex gap-6 h-full">
          <DndContext 
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            {STAGES.map(stage => (
              <KanbanColumn 
                key={stage} 
                stage={stage} 
                tasks={tasks.filter(t => t.stage === stage)} 
              />
            ))}
          </DndContext>
        </div>
      </div>
    </div>
  );
};

export default StudentKanban;
