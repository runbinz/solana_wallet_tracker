import Portfolio from '../components/Portfolio';
import AppShell from '../components/AppShell';
import AmbientScene from '../components/AmbientScene';
import { Wallet } from 'lucide-react';

export default function Home() {
  return (
    <AppShell>
      <main className="relative min-h-screen overflow-hidden bg-[var(--page-bg)] transition-colors duration-500">
        <AmbientScene />

        {/* ── Navigation ── */}
        <nav className="relative z-10 border-b border-[var(--nav-border)] bg-[var(--nav-bg)] px-4 py-4 backdrop-blur-2xl sm:py-5">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl solana-gradient shadow-lg animate-glow-ring">
                <Wallet className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight text-[var(--text-primary)] sm:text-xl">
                  Solana Portfolio Tracker
                </h1>
                <p className="text-xs text-[var(--text-muted)]">Real-time wallet dashboard</p>
              </div>
            </div>

            <div className="hidden items-center gap-2.5 rounded-full border border-[var(--nav-border)] bg-[var(--surface-soft)] px-4 py-2 text-xs font-medium text-[var(--text-secondary)] backdrop-blur-md md:flex">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-[#14F195] opacity-75 animate-ping" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#14F195] shadow-[0_0_8px_rgba(20,241,149,0.6)]" />
              </span>
              Live on Mainnet
            </div>
          </div>
        </nav>

        {/* Gradient divider */}
        <div className="relative z-10 h-px bg-gradient-to-r from-transparent via-accent-purple/30 to-transparent" />

        {/* ── Content ── */}
        <div className="relative z-10 mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6 sm:pt-10">
          <Portfolio />
        </div>
      </main>
    </AppShell>
  );
}
