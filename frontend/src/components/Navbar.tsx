'use client';
import { useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { LogOut, Zap, LayoutDashboard, ShieldCheck } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

export default function Navbar() {
  const { user, isAdmin, logout } = useAuth();
  const navRef = useRef<HTMLElement>(null);

  useGSAP(() => {
    gsap.from(navRef.current, {
      y: -20,
      opacity: 0,
      duration: 0.8,
      ease: 'power3.out'
    });
  }, { scope: navRef });

  return (
    <nav ref={navRef} className="sticky top-0 z-50 h-16 border-b border-white/10 bg-[#05050A]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-6">

        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 border border-white/20 transition-transform group-hover:scale-105">
            <Zap size={16} className="text-white" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">TaskFlow</span>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
          >
            <LayoutDashboard size={15} />
            Dashboard
          </Link>

          {isAdmin && (
            <span className="flex items-center gap-1 rounded-full border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 text-xs font-semibold text-blue-400">
              <ShieldCheck size={11} />
              Admin
            </span>
          )}

          {/* User avatar */}
          <div className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 backdrop-blur-md">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 border border-white/10 text-xs font-bold text-white shadow-inner">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-semibold text-white leading-none">{user?.name}</p>
              <p className="text-[10px] text-zinc-500 mt-0.5 uppercase tracking-wider font-medium">{user?.role}</p>
            </div>
          </div>

          <button
            onClick={logout}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-medium text-zinc-400 transition-all hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400"
          >
            <LogOut size={15} />
            <span className="hidden sm:block">Logout</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
