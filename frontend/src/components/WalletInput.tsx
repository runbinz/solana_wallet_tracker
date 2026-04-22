'use client';

import { Search, Loader2, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

const RECENTS_KEY = 'swt-recents';

export function loadRecents(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(RECENTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export function saveRecent(address: string) {
  if (typeof window === 'undefined' || !address.trim()) return;
  const list = loadRecents().filter((x) => x !== address);
  list.unshift(address);
  localStorage.setItem(RECENTS_KEY, JSON.stringify(list.slice(0, 8)));
}

interface WalletInputProps {
  onSubmit: (address: string) => void;
  isLoading: boolean;
  recentWallets: string[];
  onPickRecent: (address: string) => void;
}

export default function WalletInput({ onSubmit, isLoading, recentWallets, onPickRecent }: WalletInputProps) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const address = (formData.get('address') as string)?.trim();
    if (address) onSubmit(address);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-lg border border-[var(--nav-border)] bg-[var(--surface)] p-5 shadow-2xl shadow-black/10 backdrop-blur-xl sm:p-7"
    >
      <div className="mb-6">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#14F195]">Wallet lookup</p>
        <h2 className="mb-2 text-3xl font-bold tracking-tight text-[var(--text-primary)] sm:text-4xl">
          Enter a Solana address
        </h2>
        <p className="max-w-2xl text-[var(--text-muted)]">
          Pull balances, pricing, allocation, and recent signatures into one compact dashboard.
        </p>
      </div>

      {recentWallets.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
            <Clock className="h-3.5 w-3.5" />
            Recent
          </span>
          {recentWallets.map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => onPickRecent(w)}
              disabled={isLoading}
              className="max-w-[200px] truncate rounded-full border border-[var(--nav-border)] bg-[var(--surface-soft)] px-3 py-1 text-xs text-[var(--text-primary)] transition hover:-translate-y-0.5 hover:bg-[var(--surface-strong)] disabled:opacity-50"
              title={w}
            >
              {w.slice(0, 4)}…{w.slice(-4)}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <input
            type="text"
            name="address"
            placeholder="Solana wallet address (e.g. 7xKX…)"
            className="w-full rounded-lg border border-[var(--nav-border)] bg-[var(--input-bg)] p-4 text-[var(--text-primary)] shadow-inner placeholder:text-[var(--text-muted)] transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#9945FF]"
            required
            autoComplete="off"
          />
        </div>
        <motion.button
          type="submit"
          disabled={isLoading}
          whileHover={!isLoading ? { y: -2 } : undefined}
          whileTap={!isLoading ? { scale: 0.98 } : undefined}
          className="flex items-center justify-center gap-2 rounded-lg px-8 py-4 font-semibold text-white shadow-lg shadow-[#9945FF]/20 transition disabled:cursor-not-allowed disabled:opacity-50 solana-gradient"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading...
            </>
          ) : (
            <>
              <Search className="h-5 w-5" />
              View Portfolio
            </>
          )}
        </motion.button>
      </form>
    </motion.div>
  );
}
