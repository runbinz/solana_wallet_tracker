'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Portfolio as PortfolioType } from '../types/portfolio';
import type { ActivityResponse } from '../types/activity';
import WalletInput, { loadRecents, saveRecent } from './WalletInput';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  TrendingUp,
  Briefcase,
  Sparkles,
  ExternalLink,
  Copy,
  Check,
  ChevronDown,
  Activity,
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

const PALETTE = ['#9945FF', '#14F195', '#00D18C', '#38bdf8', '#f472b6', '#fbbf24', '#a78bfa', '#fb7185'];

function fmtUsd(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function shortMint(m: string) {
  if (m.length <= 12) return m;
  return `${m.slice(0, 6)}…${m.slice(-6)}`;
}

function pctChangeDisplay(ratio: number | undefined) {
  if (ratio === undefined || Number.isNaN(ratio)) return null;
  const pct = ratio * 100;
  const sign = pct > 0 ? '+' : '';
  return `${sign}${pct.toFixed(2)}%`;
}

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-[var(--surface-soft)] ${className ?? ''}`} />;
}

export default function Portfolio() {
  const [portfolio, setPortfolio] = useState<PortfolioType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentWallets, setRecentWallets] = useState<string[]>([]);
  const [copiedMint, setCopiedMint] = useState<string | null>(null);
  const [activity, setActivity] = useState<ActivityResponse | null>(null);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityError, setActivityError] = useState<string | null>(null);

  useEffect(() => {
    setRecentWallets(loadRecents());
  }, []);

  const fetchActivity = useCallback(async (address: string, before?: string) => {
    setActivityLoading(true);
    setActivityError(null);
    try {
      const q = new URLSearchParams({ limit: '15' });
      if (before) q.set('before', before);
      const res = await fetch(`${API_URL}/wallet/${address}/activity?${q}`);
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as ActivityResponse;
      setActivity((prev) => {
        if (before && prev) {
          return {
            wallet_address: data.wallet_address,
            items: [...prev.items, ...data.items],
            next_before: data.next_before,
          };
        }
        return data;
      });
    } catch (e) {
      console.error(e);
      setActivityError(e instanceof Error ? e.message : 'Failed to load activity');
    } finally {
      setActivityLoading(false);
    }
  }, []);

  const fetchPortfolio = async (address: string) => {
    setIsLoading(true);
    setError(null);
    setPortfolio(null);
    setActivity(null);
    try {
      const response = await fetch(`${API_URL}/portfolio/${encodeURIComponent(address)}`);
      if (!response.ok) {
        throw new Error((await response.text()) || 'Failed to fetch portfolio');
      }
      const data = (await response.json()) as PortfolioType;
      setPortfolio(data);
      saveRecent(address);
      setRecentWallets(loadRecents());
      void fetchActivity(address);
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch portfolio data');
    } finally {
      setIsLoading(false);
    }
  };

  const copyMint = async (mint: string) => {
    try {
      await navigator.clipboard.writeText(mint);
      setCopiedMint(mint);
      setTimeout(() => setCopiedMint(null), 2000);
    } catch {
      setCopiedMint(null);
    }
  };

  const total = portfolio?.total_value ?? 0;
  const segments =
    portfolio && total > 0
      ? portfolio.tokens
          .filter((t) => t.value > 0)
          .map((t, i) => ({
            mint: t.token_mint,
            pct: (t.value / total) * 100,
            color: PALETTE[i % PALETTE.length],
            label: t.symbol,
          }))
      : [];

  return (
    <div className="space-y-8">
      <WalletInput
        onSubmit={fetchPortfolio}
        isLoading={isLoading}
        recentWallets={recentWallets}
        onPickRecent={(addr) => {
          void fetchPortfolio(addr);
        }}
      />

      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-3 rounded-lg border border-red-500/50 bg-red-500/20 px-6 py-4 text-[var(--text-primary)] backdrop-blur-md"
          >
            <AlertCircle className="h-6 w-6 shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}

        {isLoading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-6"
          >
            <SkeletonBlock className="h-40 w-full" />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <SkeletonBlock className="h-36" />
              <SkeletonBlock className="h-36" />
              <SkeletonBlock className="h-36" />
              <SkeletonBlock className="h-36" />
            </div>
          </motion.div>
        )}

        {portfolio && !isLoading && (
          <motion.div
            key="portfolio"
            initial={{ opacity: 0, y: 26 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-6"
          >
            <motion.div
              className="rounded-lg p-px shadow-2xl shadow-black/10 solana-gradient"
              whileHover={{ y: -3 }}
              transition={{ type: 'spring', stiffness: 280, damping: 24 }}
            >
              <div className="rounded-lg border border-[var(--nav-border)] bg-[var(--surface)] p-6 backdrop-blur-xl sm:p-8">
                <div className="mb-2 flex items-center justify-between gap-4">
                  <h2 className="text-lg font-medium text-[var(--text-muted)]">Total Portfolio Value</h2>
                  <div className="flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-sm text-[#14F195]">
                    <TrendingUp className="h-4 w-4" />
                    <span>Live</span>
                  </div>
                </div>
                <p className="mb-2 text-4xl font-bold tracking-tight solana-gradient-text sm:text-6xl">
                  ${fmtUsd(portfolio.total_value)}
                </p>
                <p className="text-[var(--text-muted)]">
                  {portfolio.tokens.length} {portfolio.tokens.length === 1 ? 'asset' : 'assets'}
                </p>

              {segments.length > 0 && (
                <div className="mt-6">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                    Allocation
                  </p>
                  <div className="flex h-3 w-full overflow-hidden rounded-full bg-[var(--surface-soft)]">
                    {segments.map((s) => (
                      <motion.div
                        key={s.mint}
                        initial={{ flexGrow: 0 }}
                        animate={{ flexGrow: Math.max(s.pct, 0.02) }}
                        transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
                        style={{
                          flexShrink: 1,
                          flexBasis: 0,
                          minWidth: 2,
                          backgroundColor: s.color,
                        }}
                        className="transition-all"
                        title={`${s.label} ${s.pct.toFixed(1)}%`}
                      />
                    ))}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-[var(--text-muted)]">
                    {segments.map((s, i) => (
                      <span key={s.mint} className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: PALETTE[i % PALETTE.length] }} />
                        {s.label} {s.pct.toFixed(1)}%
                      </span>
                    ))}
                  </div>
                </div>
              )}
              </div>
            </motion.div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {portfolio.tokens.map((token, index) => {
                const change = pctChangeDisplay(token.price_change_24h);
                const changePositive = (token.price_change_24h ?? 0) >= 0;
                return (
                  <motion.div
                    key={token.token_mint}
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.045, duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
                    whileHover={{ y: -4 }}
                    className="group rounded-lg border border-[var(--nav-border)] bg-[var(--surface)] p-5 shadow-lg shadow-black/5 backdrop-blur-xl transition duration-300 hover:border-[#9945FF]/40 hover:shadow-xl hover:shadow-[#9945FF]/15 sm:p-6"
                  >
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {token.logo_uri ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={token.logo_uri}
                          alt=""
                          className="h-12 w-12 rounded-full border border-white/10 object-cover shadow-lg"
                          width={48}
                          height={48}
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold text-white shadow-lg solana-gradient">
                          {token.symbol.charAt(0)}
                        </div>
                      )}
                      <div>
                        <p className="text-lg font-bold text-[var(--text-primary)]">{token.symbol}</p>
                        {token.name && <p className="text-sm text-[var(--text-muted)]">{token.name}</p>}
                        <p className="text-sm text-[var(--text-muted)]">
                          {token.balance.toLocaleString('en-US', {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: Math.min(8, Math.max(2, token.decimals ?? 4)),
                          })}
                        </p>
                      </div>
                    </div>
                    {change && (
                      <span
                        className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
                          changePositive
                            ? 'border-emerald-500/40 text-emerald-400'
                            : 'border-rose-500/40 text-rose-400'
                        }`}
                      >
                        24h {change}
                      </span>
                    )}
                  </div>

                  <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
                    <code className="rounded bg-black/10 px-2 py-1 font-mono dark:bg-white/5">{shortMint(token.token_mint)}</code>
                    <button
                      type="button"
                      onClick={() => void copyMint(token.token_mint)}
                      className="inline-flex items-center gap-1 rounded-md border border-[var(--nav-border)] px-2 py-1 transition hover:bg-[var(--surface-soft)]"
                      aria-label="Copy mint address"
                    >
                      {copiedMint === token.token_mint ? (
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                      Copy
                    </button>
                    <a
                      href={`https://solscan.io/token/${token.token_mint}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-md border border-[var(--nav-border)] px-2 py-1 transition hover:bg-[var(--surface-soft)]"
                    >
                      Solscan
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>

                  <div className="space-y-2 border-t border-[var(--nav-border)] pt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[var(--text-muted)]">Value</span>
                      <span className="text-lg font-bold text-[var(--text-primary)]">${fmtUsd(token.value)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[var(--text-muted)]">Price</span>
                      <span className="text-[var(--text-primary)]">
                        ${fmtUsd(token.current_price)}
                        {token.price_source && (
                          <span className="ml-2 text-xs text-[var(--text-muted)]">({token.price_source})</span>
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 h-1 scale-x-0 transform rounded-full solana-gradient transition-transform duration-300 group-hover:scale-x-100" />
                  </motion.div>
                );
              })}
            </div>

            {portfolio.tokens.length === 0 && (
              <div className="rounded-lg border border-[var(--nav-border)] bg-[var(--surface)] p-12 text-center backdrop-blur-xl">
                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[#9945FF]/20">
                  <Briefcase className="h-10 w-10 text-[#9945FF]" />
                </div>
                <h3 className="mb-2 text-xl font-bold text-[var(--text-primary)]">No tokens found</h3>
                <p className="text-[var(--text-muted)]">This wallet doesn&apos;t contain any tokens yet.</p>
              </div>
            )}

            <div className="rounded-lg border border-[var(--nav-border)] bg-[var(--surface)] p-6 shadow-lg shadow-black/5 backdrop-blur-xl">
              <div className="mb-4 flex items-center gap-2 text-[var(--text-primary)]">
                <Activity className="h-5 w-5 text-[#9945FF]" />
                <h3 className="text-lg font-semibold">Recent activity</h3>
              </div>
              {activityError && <p className="text-sm text-rose-400">{activityError}</p>}
              {activityLoading && !activity && <p className="text-sm text-[var(--text-muted)]">Loading signatures...</p>}
              {activity && activity.items.length === 0 && (
                <p className="text-sm text-[var(--text-muted)]">No recent signatures for this address.</p>
              )}
              {activity && activity.items.length > 0 && (
                <ul className="space-y-2">
                  {activity.items.map((item, index) => (
                    <motion.li
                      key={item.signature}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.025, duration: 0.28 }}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--nav-border)] bg-[var(--surface-soft)] px-3 py-2 text-sm"
                    >
                      <div className="min-w-0 flex-1">
                        <a
                          href={item.solscan_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-xs text-[#14F195] hover:underline sm:text-sm"
                        >
                          {shortMint(item.signature)}
                        </a>
                        <div className="text-xs text-[var(--text-muted)]">
                          slot {item.slot}
                          {item.block_time != null && ` · ${new Date(item.block_time * 1000).toLocaleString()}`}
                          {item.success ? ' · ok' : ' · failed'}
                        </div>
                      </div>
                      <span
                        className={`shrink-0 rounded px-2 py-0.5 text-xs ${item.success ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'}`}
                      >
                        {item.success ? 'Success' : 'Failed'}
                      </span>
                    </motion.li>
                  ))}
                </ul>
              )}
              {activity?.next_before && activity.items.length > 0 && (
                <button
                  type="button"
                  disabled={activityLoading}
                  onClick={() => void fetchActivity(portfolio.wallet_address, activity.next_before)}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--nav-border)] py-3 text-sm font-medium text-[var(--text-primary)] transition hover:bg-[var(--surface-soft)] disabled:opacity-50"
                >
                  {activityLoading ? 'Loading...' : 'Load more'}
                  <ChevronDown className="h-4 w-4" />
                </button>
              )}
            </div>
          </motion.div>
        )}

        {!portfolio && !isLoading && !error && (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="rounded-lg border border-[var(--nav-border)] bg-[var(--surface)] p-8 text-center shadow-2xl shadow-black/10 backdrop-blur-xl sm:p-12"
          >
            <motion.div
              className="mx-auto mb-6 flex h-20 w-20 rotate-6 items-center justify-center rounded-lg shadow-2xl shadow-[#9945FF]/30 solana-gradient sm:h-24 sm:w-24"
              animate={{ rotate: [6, 2, 6], y: [0, -4, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Sparkles className="h-10 w-10 -rotate-6 text-white sm:h-12 sm:w-12" />
            </motion.div>
            <h3 className="mb-3 text-2xl font-bold tracking-tight text-[var(--text-primary)]">
              Query ready portfolio view
            </h3>
            <p className="mx-auto max-w-md text-lg text-[var(--text-muted)]">
              Paste an address above and the dashboard will assemble the wallet picture.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
