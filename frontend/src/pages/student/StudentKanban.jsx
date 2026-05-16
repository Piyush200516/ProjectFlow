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
  StatusBadge,
  Modal 
} from '../../components/common/PremiumComponents';
import { toast } from 'sonner';
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
  'Deployment'
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
    High: 'text-rose-600',
    Medium: 'text-amber-600',
    Low: 'text-emerald-600',
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className="group bg-white p-4 rounded-lg border border-slate-200 shadow-subtle hover:border-slate-300 transition-all duration-200 cursor-grab active:cursor-grabbing mb-2.5"
    >
      <div className="flex items-start justify-between mb-2.5">
        <div {...attributes} {...listeners} className="p-0.5 text-slate-300 group-hover:text-slate-500">
          <GripVertical size={14} />
        </div>
        <div className={cn("text-[9px] font-bold uppercase tracking-tight", priorityColors[task.priority])}>
          {task.priority}
        </div>
      </div>
      
      <h4 className="text-sm font-medium text-slate-900 leading-snug mb-4">
        {task.title}
      </h4>

      <div className="flex items-center justify-between pt-3 border-t border-slate-50">
        <div className="flex -space-x-1.5">
          {task.members.map((m, i) => (
            <div key={i} className="w-6 h-6 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[8px] font-bold text-slate-600">
              {m}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2.5 text-slate-400">
          <div className="flex items-center gap-1 text-[10px] font-medium">
            <MessageCircle size={12} />
            {task.comments}
          </div>
          <div className="flex items-center gap-1 text-[10px] font-medium">
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', status: 'Requirements', priority: 'Medium' });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleAddTask = () => {
    if (!newTask.title) {
      toast.error('Task title required');
      return;
    }
    const task = {
      ...newTask,
      id: 't' + Date.now(),
      members: ['P'],
      comments: 0,
      attachments: 0
    };
    setTasks([...tasks, task]);
    setIsModalOpen(false);
    setNewTask({ title: '', status: 'Requirements', priority: 'Medium' });
    toast.success('Task added');
  };

  const handleDragStart = (event) => setActiveId(event.active.id);

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
    <div className="h-full flex flex-col space-y-8 animate-in fade-in duration-500">
      <PageHeader 
        title="Workflow" 
        description="Manage your project execution stages."
        actions={
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-semibold transition-all active:scale-95"
          >
            <Plus size={16} />
            Add Task
          </button>
        }
      />

      <div className="flex items-center justify-between gap-4 py-3 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors" size={14} />
            <input type="text" placeholder="Search tasks..." className="w-64 pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:border-slate-900 outline-none transition-all" />
          </div>
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 rounded-lg transition-all">
            <Filter size={14} />
            Filter
          </button>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex -space-x-1.5">
            {[1,2,3].map(i => <div key={i} className="w-7 h-7 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[9px] font-bold text-slate-500">U</div>)}
          </div>
          <button className="p-1.5 text-slate-400 hover:text-slate-900 transition-colors"><Settings2 size={16} /></button>
        </div>
      </div>

      <div className="overflow-x-auto pb-6 custom-scrollbar">
        <div className="flex gap-5 min-w-max">
          <DndContext 
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            {stages.map((stage) => {
              const stageTasks = tasks.filter(t => t.status === stage);
              return (
                <div key={stage} className="w-72 flex flex-col shrink-0">
                  <div className="flex items-center gap-2 mb-4 px-1">
                    <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      {stage}
                    </h3>
                    <span className="text-[9px] font-bold text-slate-400 px-1.5 py-0.5 rounded-md bg-slate-50 border border-slate-100">
                      {stageTasks.length}
                    </span>
                  </div>

                  <div className="flex-1 rounded-xl min-h-[400px] transition-all">
                    <SortableContext items={stageTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                      {stageTasks.map((task) => (
                        <SortableTask key={task.id} id={task.id} task={task} />
                      ))}
                    </SortableContext>
                    
                    <button onClick={() => setIsModalOpen(true)} className="w-full py-2.5 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-tight text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-lg border border-transparent hover:border-slate-100 transition-all mt-1">
                      <Plus size={14} />
                      New Task
                    </button>
                  </div>
                </div>
              );
            })}
            
            <DragOverlay dropAnimation={{
              sideEffects: defaultDropAnimationSideEffects({
                styles: { active: { opacity: '0.5' } },
              }),
            }}>
              {activeId ? (
                <div className="bg-white p-4 rounded-lg border border-slate-900 shadow-xl opacity-90 scale-105">
                  <h4 className="text-sm font-medium text-slate-900 leading-snug">
                    {tasks.find(t => t.id === activeId)?.title}
                  </h4>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title="New Task"
        footer={
          <>
            <button onClick={() => setIsModalOpen(false)} className="px-5 py-2 text-sm font-medium text-slate-500 hover:text-slate-900 rounded-lg transition-all">Discard</button>
            <button onClick={handleAddTask} className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg shadow-sm transition-all active:scale-95">Create</button>
          </>
        }
      >
        <div className="space-y-6">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-900 ml-1">Title</label>
            <input 
              type="text" 
              value={newTask.title}
              onChange={(e) => setNewTask({...newTask, title: e.target.value})}
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all text-sm" 
              placeholder="What needs to be done?" 
            />
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-900 ml-1">Stage</label>
              <select 
                value={newTask.status}
                onChange={(e) => setNewTask({...newTask, status: e.target.value})}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all text-sm appearance-none"
              >
                {stages.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-900 ml-1">Priority</label>
              <select 
                value={newTask.priority}
                onChange={(e) => setNewTask({...newTask, priority: e.target.value})}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all text-sm appearance-none"
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default StudentKanban;
