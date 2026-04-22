import Portfolio from '../components/Portfolio';
import AppShell from '../components/AppShell';
import AmbientScene from '../components/AmbientScene';
import { Wallet } from 'lucide-react';

export default function Home() {
  return (
    <AppShell>
      <main className="relative min-h-screen overflow-hidden bg-[var(--page-bg)] transition-colors duration-300">
        <AmbientScene />

        <nav className="relative z-10 border-b border-[var(--nav-border)] bg-[var(--nav-bg)] px-4 py-5 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 rotate-6 items-center justify-center rounded-lg shadow-lg shadow-[#9945FF]/25 solana-gradient">
                <Wallet className="h-6 w-6 -rotate-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)] sm:text-2xl">
                  Solana Portfolio Tracker
                </h1>
                <p className="text-sm text-[var(--text-muted)]">One address at a time</p>
              </div>
            </div>
            <div className="hidden items-center gap-2 rounded-full border border-[var(--nav-border)] bg-[var(--surface-soft)] px-3 py-1.5 text-xs font-medium text-[var(--text-muted)] shadow-sm backdrop-blur md:flex">
              <span className="h-2 w-2 rounded-full bg-[#14F195] shadow-[0_0_16px_rgba(20,241,149,0.8)]" />
              Live query mode
            </div>
          </div>
        </nav>

        <div className="relative z-10 mx-auto max-w-7xl px-4 pb-14 pt-8 sm:pt-10">
          <Portfolio />
        </div>
      </main>
    </AppShell>
  );
}
