'use client';
import { useRef } from 'react';
import { Edit2, Trash2, Clock, User as UserIcon } from 'lucide-react';
import gsap from 'gsap';

export interface Task {
  _id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  createdBy: { _id: string; name: string; email: string } | string;
  createdAt: string;
}

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  showOwner?: boolean;
}

const statusConfig = {
  pending:     { label: 'Pending',     className: 'bg-zinc-500/10 text-zinc-300 border border-zinc-500/20' },
  'in-progress': { label: 'In Progress', className: 'bg-blue-500/10 text-blue-400 border border-blue-500/20' },
  completed:   { label: 'Completed',   className: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' },
};

const priorityConfig = {
  low:    { label: 'Low',    className: 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20' },
  medium: { label: 'Medium', className: 'bg-amber-500/10 text-amber-400 border border-amber-500/20' },
  high:   { label: 'High',   className: 'bg-red-500/10 text-red-400 border border-red-500/20' },
};

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = d.getTime() - now.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days < 0) return { label: `${Math.abs(days)}d overdue`, color: 'text-red-400' };
  if (days <= 3) return { label: `${days}d left`, color: 'text-amber-400' };
  return { label: d.toLocaleDateString(), color: 'text-zinc-500' };
};

export default function TaskCard({ task, onEdit, onDelete, showOwner }: TaskCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const status = statusConfig[task.status];
  const priority = priorityConfig[task.priority];
  const due = task.dueDate ? formatDate(task.dueDate) : null;
  const ownerName = typeof task.createdBy === 'object' ? task.createdBy.name : '';

  const handleMouseEnter = () => {
    gsap.to(cardRef.current, {
      y: -4,
      scale: 1.01,
      boxShadow: '0 20px 40px -10px rgba(0,0,0,0.5)',
      borderColor: 'rgba(255,255,255,0.15)',
      background: 'rgba(255,255,255,0.04)',
      duration: 0.3,
      ease: 'power2.out'
    });
  };

  const handleMouseLeave = () => {
    gsap.to(cardRef.current, {
      y: 0,
      scale: 1,
      boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
      borderColor: 'rgba(255,255,255,0.05)',
      background: 'rgba(255,255,255,0.02)',
      duration: 0.3,
      ease: 'power2.out'
    });
  };

  return (
    <div
      ref={cardRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="task-item relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] p-6 backdrop-blur-xl transition-colors"
    >
      {/* Top Gradient Accent line */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-50" />

      {/* Header */}
      <div className="mb-4 flex items-start justify-between gap-3">
        <h3 className="flex-1 text-base font-semibold leading-snug text-white tracking-tight">
          {task.title}
        </h3>
        <div className="flex shrink-0 gap-1.5 opacity-60 transition-opacity hover:opacity-100">
          <button
            onClick={() => onEdit(task)}
            className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-white/10 hover:text-white text-zinc-400 transition-colors"
            title="Edit task"
          >
            <Edit2 size={14} />
          </button>
          <button
            onClick={() => onDelete(task)}
            className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-red-500/20 hover:text-red-400 text-zinc-400 transition-colors"
            title="Delete task"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Description */}
      {task.description && (
        <p className="mb-5 line-clamp-2 text-sm leading-relaxed text-zinc-400">
          {task.description}
        </p>
      )}

      {/* Badges */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${status.className}`}>
          {status.label}
        </span>
        <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${priority.className}`}>
          {priority.label}
        </span>
        {due && (
          <span className={`inline-flex items-center gap-1 text-xs font-medium ${due.color}`}>
            <Clock size={12} />
            {due.label}
          </span>
        )}
      </div>

      {/* Footer */}
      {showOwner && ownerName && (
        <div className="flex items-center gap-1.5 border-t border-white/5 pt-4 text-xs font-medium text-zinc-500">
          <UserIcon size={12} />
          <span>{ownerName}</span>
        </div>
      )}
    </div>
  );
}
