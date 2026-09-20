'use client';

import { Search, Loader2, Clock, ClipboardPaste } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRef } from 'react';

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
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const address = (formData.get('address') as string)?.trim();
    if (address) onSubmit(address);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (inputRef.current && text.trim()) {
        inputRef.current.value = text.trim();
        inputRef.current.focus();
      }
    } catch {
      /* clipboard permission denied — ignore */
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl glass shadow-card overflow-hidden"
    >
      {/* Top gradient accent bar */}
      <div className="h-1 w-full solana-gradient" />

      <div className="p-6 sm:p-8">
        <div className="mb-6">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-accent-green">
            Wallet lookup
          </p>
          <h2 className="mb-2 text-2xl font-extrabold tracking-tight text-gradient-heading sm:text-3xl">
            Enter a Solana address
          </h2>
          <p className="max-w-2xl text-sm text-[var(--text-secondary)] leading-relaxed">
            Pull balances, pricing, allocation, and recent signatures into one compact dashboard.
          </p>
        </div>

        {recentWallets.length > 0 && (
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
              <Clock className="h-3.5 w-3.5" />
              Recent
            </span>
            {recentWallets.map((w, i) => (
              <motion.button
                key={w}
                type="button"
                onClick={() => onPickRecent(w)}
                disabled={isLoading}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="max-w-[180px] truncate rounded-full border border-[var(--nav-border)] bg-[var(--surface-soft)] px-3 py-1.5 font-mono text-xs text-[var(--text-secondary)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[var(--surface-strong)] hover:text-[var(--text-primary)] hover:shadow-sm disabled:opacity-50"
                title={w}
              >
                {w.slice(0, 4)}…{w.slice(-4)}
              </motion.button>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1 group">
            <input
              ref={inputRef}
              type="text"
              name="address"
              placeholder="Solana wallet address (e.g. 7xKX…)"
              className="w-full rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-4 py-4 pr-12 font-mono text-sm text-[var(--text-primary)] shadow-inner placeholder:text-[var(--text-muted)] transition-all duration-300 focus:border-accent-purple/60 focus:outline-none focus:ring-2 focus:ring-accent-purple/30 focus:ring-offset-2 focus:ring-offset-[var(--ring-offset)]"
              required
              autoComplete="off"
            />
            <button
              type="button"
              onClick={() => void handlePaste()}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-[var(--text-muted)] opacity-60 transition-all hover:bg-[var(--surface-soft)] hover:text-accent-purple hover:opacity-100"
              aria-label="Paste from clipboard"
              title="Paste from clipboard"
            >
              <ClipboardPaste className="h-4 w-4" />
            </button>
          </div>

          <motion.button
            type="submit"
            disabled={isLoading}
            whileHover={!isLoading ? { y: -2, scale: 1.01 } : undefined}
            whileTap={!isLoading ? { scale: 0.97 } : undefined}
            className="relative flex items-center justify-center gap-2.5 overflow-hidden rounded-xl px-8 py-4 font-semibold text-white shadow-lg shadow-accent-purple/20 transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50 solana-gradient hover:shadow-xl hover:shadow-accent-purple/30"
          >
            {/* Hover shimmer overlay */}
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Loading…
              </>
            ) : (
              <>
                <Search className="h-5 w-5" />
                View Portfolio
              </>
            )}
          </motion.button>
        </form>
      </div>
    </motion.div>
  );
}
