'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Filter, RefreshCw, LayoutGrid, ShieldCheck, Trash2, Users, CheckCircle, Clock, ListTodo } from 'lucide-react';
import Navbar from '@/components/Navbar';
import TaskCard, { Task } from '@/components/TaskCard';
import TaskModal from '@/components/TaskModal';
import { tasksApi, adminApi, getErrorMessage } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

interface AdminUser {
  _id: string; name: string; email: string; role: string; createdAt: string;
}

interface Stats {
  totalUsers: number; totalTasks: number;
  tasksByStatus: Record<string, number>;
  tasksByPriority: Record<string, number>;
}

type TaskFilter = { status: string; priority: string; sort: string };

export default function DashboardPage() {
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [totalTasks, setTotalTasks] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<TaskFilter>({ status: '', priority: '', sort: '-createdAt' });

  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Task | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [adminLoading, setAdminLoading] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [authLoading, user, router]);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, limit: 9, sort: filter.sort };
      if (filter.status) params.status = filter.status;
      if (filter.priority) params.priority = filter.priority;
      const { data } = await tasksApi.list(params);
      setTasks(data.data.tasks);
      setTotalTasks(data.meta.total);
      setTotalPages(data.meta.totalPages);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [page, filter]);

  const fetchAdminData = useCallback(async () => {
    if (!isAdmin) return;
    setAdminLoading(true);
    try {
      const [usersRes, statsRes] = await Promise.all([adminApi.users(), adminApi.stats()]);
      setAdminUsers(usersRes.data.data.users);
      setStats(statsRes.data.data);
    } catch {
      // silent
    } finally {
      setAdminLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => { if (user) { fetchTasks(); fetchAdminData(); } }, [user, fetchTasks, fetchAdminData]);

  // --- GSAP Animations ---
  useGSAP(() => {
    if (authLoading) return;
    const tl = gsap.timeline();

    // Fade in background noise slightly
    gsap.to('.noise-overlay', { opacity: 0.02, duration: 2 });

    // Header stagger
    tl.fromTo('.dash-header',
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: 'power2.out' }
    );

    // Stats cards
    tl.fromTo('.stat-card',
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: 'power2.out' },
      '-=0.4'
    );

    // Filters
    tl.fromTo('.dash-filters',
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, ease: 'power2.out' },
      '-=0.4'
    );
  }, { scope: containerRef, dependencies: [authLoading] });

  useGSAP(() => {
    if (!loading && tasks.length > 0) {
      gsap.fromTo('.task-item',
        { y: 30, opacity: 0, scale: 0.98 },
        { y: 0, opacity: 1, scale: 1, duration: 0.5, stagger: 0.05, ease: 'power2.out', clearProps: 'all' }
      );
    }
  }, { scope: containerRef, dependencies: [loading, tasks] });

  // GSAP Counter Animation
  useEffect(() => {
    if (authLoading || loading) return;
    const counters = document.querySelectorAll('.stat-counter');
    counters.forEach((el) => {
      const target = parseFloat(el.getAttribute('data-target') || '0');
      gsap.to(el, {
        innerHTML: target,
        duration: 1.5,
        ease: 'power3.out',
        snap: { innerHTML: 1 },
      });
    });
  }, [authLoading, loading, totalTasks, tasks]); // run when data updates


  const handleDelete = async (task: Task) => {
    setDeletingId(task._id);
    try {
      await tasksApi.delete(task._id);
      toast.success('Task deleted');
      setDeleteConfirm(null);
      fetchTasks();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteUser = async (id: string) => {
    try {
      await adminApi.deleteUser(id);
      toast.success('User deleted');
      fetchAdminData();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#05050A]">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-blue-500" />
      </div>
    );
  }

  const completedCount = tasks.filter(t => t.status === 'completed').length;
  const pendingCount   = tasks.filter(t => t.status === 'pending').length;
  const inProgressCount= tasks.filter(t => t.status === 'in-progress').length;

  return (
    <div ref={containerRef} className="min-h-screen bg-[#05050A] text-zinc-100 relative">
      <div className="noise-overlay fixed inset-0 z-50 pointer-events-none opacity-0 bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')]" />
      
      <Navbar />
      <main className="mx-auto max-w-7xl px-6 py-10 relative z-10">

        {/* Page Header */}
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="dash-header text-4xl font-extrabold tracking-tight text-white mb-2">
              {isAdmin ? 'Admin Dashboard' : 'My Tasks'}
            </h1>
            <p className="dash-header text-sm text-zinc-400 font-medium">
              {isAdmin
                ? `Managing ${stats?.totalTasks ?? 0} tasks across ${stats?.totalUsers ?? 0} users`
                : `You have ${totalTasks} task${totalTasks !== 1 ? 's' : ''} in total`}
            </p>
          </div>
          <button
            onClick={() => { setEditTask(null); setShowModal(true); }}
            className="dash-header flex items-center gap-2 rounded-xl bg-white text-black px-5 py-2.5 text-sm font-semibold hover:scale-105 hover:shadow-lg transition-transform"
          >
            <Plus size={16} />
            New Task
          </button>
        </div>

        {/* Stats Cards */}
        <div className="mb-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: 'Total', value: totalTasks, icon: <LayoutGrid size={18} />, color: 'text-zinc-300', bg: 'bg-zinc-500/10' },
            { label: 'Pending', value: pendingCount, icon: <Clock size={18} />, color: 'text-amber-400', bg: 'bg-amber-500/10' },
            { label: 'In Progress', value: inProgressCount, icon: <ListTodo size={18} />, color: 'text-blue-400', bg: 'bg-blue-500/10' },
            { label: 'Completed', value: completedCount, icon: <CheckCircle size={18} />, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          ].map((s) => (
            <div key={s.label} className="stat-card flex flex-col rounded-2xl border border-white/5 bg-white/[0.02] p-5 backdrop-blur-md">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">{s.label}</p>
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${s.bg} ${s.color}`}>
                  {s.icon}
                </div>
              </div>
              <p className="stat-counter text-3xl font-bold text-white tracking-tight" data-target={s.value}>0</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="dash-filters mb-8 flex flex-wrap items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.02] px-5 py-3.5 backdrop-blur-md">
          <Filter size={16} className="text-zinc-500" />
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mr-2">Filters</span>

          {(['', 'pending', 'in-progress', 'completed'] as const).map((s) => (
            <button
              key={s}
              onClick={() => { setFilter({ ...filter, status: s }); setPage(1); }}
              className={`rounded-lg px-4 py-1.5 text-xs font-medium transition-colors ${
                filter.status === s
                  ? 'bg-white text-black'
                  : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              {s === '' ? 'All Status' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}

          <div className="mx-2 h-4 w-[1px] bg-white/10" />

          {(['', 'low', 'medium', 'high'] as const).map((p) => (
            <button
              key={p}
              onClick={() => { setFilter({ ...filter, priority: p }); setPage(1); }}
              className={`rounded-lg px-4 py-1.5 text-xs font-medium transition-colors ${
                filter.priority === p
                  ? 'bg-white text-black'
                  : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              {p === '' ? 'All Priority' : p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}

          <button
            onClick={() => fetchTasks()}
            className="ml-auto flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Tasks Grid */}
        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-48 animate-pulse rounded-2xl bg-white/5" />
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <div className="dash-filters flex flex-col items-center justify-center rounded-3xl border border-white/5 bg-white/[0.02] py-28 text-center backdrop-blur-md">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 border border-white/10">
              <LayoutGrid size={28} className="text-zinc-600" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No tasks found</h3>
            <p className="text-sm text-zinc-400 mb-6">Create your first task to get started.</p>
            <button
              onClick={() => { setEditTask(null); setShowModal(true); }}
              className="flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-black transition-transform hover:scale-105"
            >
              <Plus size={16} /> Create Task
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {tasks.map((task) => (
              <TaskCard
                key={task._id}
                task={task}
                showOwner={isAdmin}
                onEdit={(t) => { setEditTask(t); setShowModal(true); }}
                onDelete={(t) => setDeleteConfirm(t)}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-12 flex items-center justify-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-medium transition-colors ${
                  p === page
                    ? 'bg-white text-black'
                    : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        )}

        {/* ── Admin Section ──────────────────────────────────── */}
        {isAdmin && (
          <div className="mt-16 border-t border-white/10 pt-12">
            <h2 className="mb-8 flex items-center gap-3 text-2xl font-bold text-white tracking-tight">
              <ShieldCheck size={24} className="text-blue-500" />
              User Management
            </h2>

            {adminLoading ? (
              <div className="h-40 animate-pulse rounded-2xl bg-white/5" />
            ) : (
              <div className="space-y-4">
                {adminUsers.map((u) => (
                  <div key={u._id}
                    className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.02] px-6 py-5 backdrop-blur-md transition-colors hover:bg-white/[0.04]">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 text-sm font-bold text-white shadow-inner">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="flex items-center gap-2 text-sm font-bold text-white">
                          {u.name}
                          {u.role === 'admin' && (
                            <span className="rounded-md bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-400">
                              Admin
                            </span>
                          )}
                          {u._id === user?._id && (
                            <span className="rounded-md bg-zinc-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                              You
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-zinc-500 mt-1">{u.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="hidden text-xs font-medium text-zinc-600 sm:block">
                        Joined {new Date(u.createdAt).toLocaleDateString()}
                      </span>
                      {u._id !== user?._id && (
                        <button
                          onClick={() => handleDeleteUser(u._id)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10 text-red-400 transition-colors hover:bg-red-500/20"
                          title="Delete user"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Admin Stats */}
            {stats && (
              <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
                  <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    <Users size={14} /> Total Users
                  </div>
                  <p className="text-3xl font-bold text-white">{stats.totalUsers}</p>
                </div>
                <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">All Tasks</div>
                  <p className="text-3xl font-bold text-white">{stats.totalTasks}</p>
                </div>
                <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-emerald-500">Completed</div>
                  <p className="text-3xl font-bold text-emerald-400">{stats.tasksByStatus?.completed ?? 0}</p>
                </div>
                <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-red-500">High Priority</div>
                  <p className="text-3xl font-bold text-red-400">{stats.tasksByPriority?.high ?? 0}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Task Modal */}
      {showModal && (
        <TaskModal
          task={editTask}
          onClose={() => { setShowModal(false); setEditTask(null); }}
          onSuccess={() => { fetchTasks(); fetchAdminData(); }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl border border-red-500/20 bg-[#0A0A0F] p-8 shadow-2xl">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
              <Trash2 size={24} className="text-red-500" />
            </div>
            <h3 className="mb-2 text-xl font-bold text-white tracking-tight">Delete Task?</h3>
            <p className="mb-8 text-sm text-zinc-400 leading-relaxed">
              Are you sure you want to delete <strong className="text-white">&quot;{deleteConfirm.title}&quot;</strong>? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 rounded-xl bg-white/5 py-3 text-sm font-medium text-white transition-colors hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                disabled={deletingId === deleteConfirm._id}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-500 py-3 text-sm font-medium text-white transition-colors hover:bg-red-600 disabled:opacity-50"
              >
                {deletingId === deleteConfirm._id ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : null}
                Delete Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
