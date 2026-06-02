'use client';
import { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, Eye, EyeOff, Zap } from 'lucide-react';
import { authApi, getErrorMessage } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'user' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { login } = useAuth();
  const router = useRouter();

  const container = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    gsap.fromTo('.auth-anim', 
      { y: 20, opacity: 0 }, 
      { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: 'power2.out' }
    );
  }, { scope: container });

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Name is required';
    else if (form.name.length < 2) e.name = 'Name must be at least 2 characters';
    if (!form.email) e.email = 'Email is required';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 8) e.password = 'Password must be at least 8 characters';
    else if (!/[A-Z]/.test(form.password)) e.password = 'Must contain at least one uppercase letter';
    else if (!/[0-9]/.test(form.password)) e.password = 'Must contain at least one number';
    else if (!/[^A-Za-z0-9]/.test(form.password)) e.password = 'Must contain at least one special character';
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    try {
      const { data } = await authApi.register(form);
      login(data.data.token, data.data.user);
      toast.success('Account created successfully!');
      router.push('/dashboard');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const inputCls = (field: string) =>
    `w-full rounded-xl border bg-white/[0.03] px-4 py-3 text-sm text-white transition-all shadow-inner focus:outline-none focus:ring-2 ${
      errors[field] 
        ? 'border-red-500/50 focus:ring-red-500/20' 
        : 'border-white/10 focus:border-white/30 focus:ring-white/10'
    }`;

  const pwStrength = (() => {
    const p = form.password;
    if (!p) return { score: 0, color: '' };
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    const colors = ['', 'bg-red-500', 'bg-amber-500', 'bg-blue-500', 'bg-white'];
    return { score: s, color: colors[s] };
  })();

  return (
    <div ref={container} className="flex min-h-screen items-center justify-center p-4 bg-[#05050A]">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noise%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noise)%22/%3E%3C/svg%3E')] opacity-[0.02] pointer-events-none" />

      <div className="w-full max-w-[400px] relative z-10">
        
        {/* Logo */}
        <div className="auth-anim mb-8 flex flex-col items-center">
          <Link href="/" className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-white/10 shadow-xl transition-transform hover:scale-105">
            <Zap size={28} className="text-white" />
          </Link>
          <h1 className="text-3xl font-bold text-white tracking-tight">Create account</h1>
          <p className="mt-2 text-sm text-zinc-400">Sign up to start using TaskFlow.</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-anim space-y-4 rounded-3xl border border-white/10 bg-white/[0.02] p-8 backdrop-blur-xl shadow-2xl">
          {/* Name */}
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-400">Full Name</label>
            <input
              type="text"
              className={inputCls('name')}
              placeholder="John Doe"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              autoComplete="name"
            />
            {errors.name && <p className="mt-1.5 text-xs font-medium text-red-500">{errors.name}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-400">Email</label>
            <input
              type="email"
              className={inputCls('email')}
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              autoComplete="email"
            />
            {errors.email && <p className="mt-1.5 text-xs font-medium text-red-500">{errors.email}</p>}
          </div>

          {/* Password */}
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-400">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                className={`${inputCls('password')} pr-12`}
                placeholder="Min 8 chars, 1 upper, 1 num, 1 symbol"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {/* Strength bar */}
            {form.password && (
              <div className="mt-3 flex gap-1.5">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= pwStrength.score ? pwStrength.color : 'bg-white/10'}`}
                  />
                ))}
              </div>
            )}
            {errors.password && <p className="mt-1.5 text-xs font-medium text-red-500">{errors.password}</p>}
          </div>

          {/* Role */}
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-400">Role</label>
            <select
              className="w-full rounded-xl border border-white/10 bg-[#0A0A0F] px-4 py-3 text-sm text-white transition-all focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/10"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3.5 text-sm font-semibold text-black transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : null}
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="auth-anim mt-8 text-center text-sm text-zinc-500 font-medium">
          Already have an account?{' '}
          <Link href="/login" className="text-white hover:underline underline-offset-4 transition-all">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
