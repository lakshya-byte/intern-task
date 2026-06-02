'use client';
import { useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Zap, ArrowRight, Layers, Shield, ZapIcon } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

export default function LandingPage() {
  const { token, isLoading } = useAuth();
  const router = useRouter();
  
  const container = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (isLoading || token) return; // Wait until auth check is done

    const tl = gsap.timeline();

    // Fade in noise overlay
    gsap.to('.noise-overlay', { opacity: 0.03, duration: 2 });

    // Orbs floating animation
    gsap.to('.orb-1', {
      y: '20px', x: '-20px', duration: 4, repeat: -1, yoyo: true, ease: 'sine.inOut'
    });
    gsap.to('.orb-2', {
      y: '-30px', x: '20px', duration: 5, repeat: -1, yoyo: true, ease: 'sine.inOut', delay: 1
    });

    // Hero content stagger
    tl.fromTo('.hero-anim', 
      { y: 40, opacity: 0 }, 
      { y: 0, opacity: 1, duration: 0.8, stagger: 0.15, ease: 'power3.out', delay: 0.2 }
    );

    // Feature cards stagger
    tl.fromTo('.feature-card',
      { y: 50, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: 'power2.out' },
      '-=0.4'
    );

  }, { scope: container, dependencies: [isLoading, token] });

  // Handle redirect if logged in
  if (token) {
    router.replace('/dashboard');
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#05050A]">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-blue-500" />
      </div>
    );
  }

  return (
    <div ref={container} className="relative min-h-screen overflow-hidden bg-[#05050A] text-zinc-100">
      
      {/* Background Orbs & Noise using pure Tailwind & Inline styles for complex blurs */}
      <div className="noise-overlay fixed inset-0 z-50 pointer-events-none opacity-0 bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')]" />
      
      <div className="orb-1 absolute top-[10%] left-[20%] w-[400px] h-[400px] rounded-full bg-purple-600/30 blur-[100px] -z-10 pointer-events-none" />
      <div className="orb-2 absolute bottom-[20%] right-[10%] w-[500px] h-[500px] rounded-full bg-blue-600/20 blur-[120px] -z-10 pointer-events-none" />

      {/* Navbar (Landing Page specific) */}
      <nav className="hero-anim flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-white/10 shadow-lg shadow-black/50">
            <Zap size={20} className="text-blue-400" />
          </div>
          <span className="text-xl font-bold tracking-tight">TaskFlow</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
            Log in
          </Link>
          <Link href="/register" className="group relative flex items-center gap-2 overflow-hidden rounded-full bg-white px-5 py-2 text-sm font-semibold text-black transition-transform hover:scale-105 active:scale-95">
            <span>Get Started</span>
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative mx-auto mt-24 max-w-7xl px-6 text-center sm:mt-32">
        
        <div className="hero-anim mx-auto mb-8 flex max-w-fit items-center justify-center space-x-2 overflow-hidden rounded-full border border-white/10 bg-white/5 px-4 py-1.5 backdrop-blur-md">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
            TaskFlow v2.0 is live
          </p>
          <div className="h-4 w-px bg-white/20" />
          <span className="text-xs text-zinc-400">Experience the future of productivity</span>
        </div>

        <h1 className="hero-anim mx-auto max-w-5xl text-5xl font-extrabold tracking-tight sm:text-7xl lg:text-8xl">
          Manage work with <br />
          <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
            god-level precision.
          </span>
        </h1>
        
        <p className="hero-anim mx-auto mt-8 max-w-2xl text-lg text-zinc-400 sm:text-xl">
          A beautifully designed, deeply integrated platform to track tasks, collaborate seamlessly, and ship faster. Engineered for the top 1%.
        </p>

        <div className="hero-anim mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link href="/register" className="group relative flex h-14 w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-white px-8 text-base font-semibold text-black shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] transition-all hover:scale-[1.02] active:scale-[0.98] sm:w-auto">
            Start building for free
            <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
          </Link>
          <Link href="/login" className="flex h-14 w-full items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-8 text-base font-medium text-white backdrop-blur-md transition-all hover:bg-white/10 sm:w-auto">
            Sign in to your account
          </Link>
        </div>
      </main>

      {/* Feature Grid */}
      <div className="mx-auto mt-32 max-w-7xl px-6 pb-24">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          
          <div className="feature-card flex flex-col rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-lg transition-colors hover:bg-white/[0.07]">
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 border border-blue-500/20">
              <ZapIcon size={24} className="text-blue-400" />
            </div>
            <h3 className="mb-3 text-xl font-bold text-white">Lightning Fast</h3>
            <p className="text-zinc-400 leading-relaxed">
              Built on Next.js and animated with GSAP. Zero layout shifts and instant interactions that feel magical.
            </p>
          </div>

          <div className="feature-card flex flex-col rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-lg transition-colors hover:bg-white/[0.07]">
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/10 border border-purple-500/20">
              <Layers size={24} className="text-purple-400" />
            </div>
            <h3 className="mb-3 text-xl font-bold text-white">Flawless Workflow</h3>
            <p className="text-zinc-400 leading-relaxed">
              Organize tasks dynamically with beautiful Kanban boards, priority tags, and sophisticated filtering.
            </p>
          </div>

          <div className="feature-card flex flex-col rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-lg transition-colors hover:bg-white/[0.07]">
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-500/20">
              <Shield size={24} className="text-cyan-400" />
            </div>
            <h3 className="mb-3 text-xl font-bold text-white">Enterprise Grade</h3>
            <p className="text-zinc-400 leading-relaxed">
              JWT authentication, Role-Based Access Control, and robust Node.js backend tailored for scale.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
