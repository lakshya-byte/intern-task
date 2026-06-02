'use client';
import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { tasksApi, getErrorMessage, type TaskData } from '@/lib/api';
import { Task } from './TaskCard';
import toast from 'react-hot-toast';

interface TaskModalProps {
  task?: Task | null;
  onClose: () => void;
  onSuccess: () => void;
}

const defaultForm: TaskData = {
  title: '', description: '', status: 'pending', priority: 'medium', dueDate: '',
};

export default function TaskModal({ task, onClose, onSuccess }: TaskModalProps) {
  const isEdit = Boolean(task);
  const [form, setForm] = useState<TaskData>(defaultForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (task) {
      setForm({
        title: task.title,
        description: task.description || '',
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 16) : '',
      });
    } else {
      setForm(defaultForm);
    }
  }, [task]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.title.trim()) e.title = 'Title is required';
    else if (form.title.length > 120) e.title = 'Title too long (max 120 chars)';
    if (form.description && form.description.length > 1000) e.description = 'Description too long';
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    try {
      const payload: TaskData = {
        ...form,
        dueDate: form.dueDate ? new Date(form.dueDate as string).toISOString() : null,
      };
      if (isEdit && task) {
        await tasksApi.update(task._id, payload);
        toast.success('Task updated!');
      } else {
        await tasksApi.create(payload);
        toast.success('Task created!');
      }
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const inputCls = (field: string) =>
    `w-full rounded-xl border px-4 py-2.5 text-sm text-white outline-none transition-all bg-white/[0.06] placeholder-[#606080] ${
      errors[field]
        ? 'border-red-500/60 focus:border-red-400 focus:ring-2 focus:ring-red-500/20'
        : 'border-white/[0.08] focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/15 focus:bg-violet-500/5'
    }`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-lg rounded-3xl p-8 animate-slide-up"
        style={{
          background: 'rgba(15,15,46,0.96)',
          border: '1px solid rgba(139,92,246,0.25)',
          boxShadow: '0 25px 60px rgba(0,0,0,0.6), 0 0 60px rgba(139,92,246,0.15)',
        }}
      >
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">
            {isEdit ? 'Edit Task' : 'Create New Task'}
          </h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04] text-[#a0a0c0] transition-all hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400 cursor-pointer"
          >
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#a0a0c0]">
              Title *
            </label>
            <input
              className={inputCls('title')}
              placeholder="What needs to be done?"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
            {errors.title && <p className="mt-1 text-xs text-red-400">{errors.title}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#a0a0c0]">
              Description
            </label>
            <textarea
              className={`${inputCls('description')} min-h-[90px] resize-y`}
              placeholder="Add more details…"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
            {errors.description && <p className="mt-1 text-xs text-red-400">{errors.description}</p>}
          </div>

          {/* Status + Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#a0a0c0]">
                Status
              </label>
              <select
                className={inputCls('status')}
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as TaskData['status'] })}
              >
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#a0a0c0]">
                Priority
              </label>
              <select
                className={inputCls('priority')}
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value as TaskData['priority'] })}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          {/* Due Date */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#a0a0c0]">
              Due Date
            </label>
            <input
              type="datetime-local"
              className={inputCls('dueDate')}
              value={form.dueDate as string}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              style={{ colorScheme: 'dark' }}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-white/[0.08] bg-white/[0.04] py-2.5 text-sm font-semibold text-[#a0a0c0] transition-all hover:bg-white/[0.08] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white btn-gradient disabled:opacity-50 cursor-pointer"
            >
              {loading ? <Loader2 size={15} className="animate-spin" /> : null}
              {isEdit ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
