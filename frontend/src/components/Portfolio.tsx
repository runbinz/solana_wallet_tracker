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

/* Purple-themed palette — monochromatic with value variation */
const PALETTE = [
  '#9945FF', // purple (primary)
  '#7C3AED', // violet
  '#8B5CF6', // violet-500
  '#A78BFA', // lavender
  '#6D28D9', // deep violet
  '#C4B5FD', // light lavender
  '#818CF8', // indigo
  '#DDD6FE', // pale violet
];

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

function relativeTime(unixSeconds: number): string {
  const diff = Math.floor(Date.now() / 1000) - unixSeconds;
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={`animate-shimmer rounded-md bg-[var(--surface-soft)] ${className ?? ''}`}
    />
  );
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
        {/* ── Error ── */}
        {error && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-3 rounded-md border border-red-500/30 bg-red-500/10 px-6 py-4 text-[var(--text-primary)] backdrop-blur-xl"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-red-500/15">
              <AlertCircle className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <p className="text-sm font-semibold">Something went wrong</p>
              <p className="text-sm text-[var(--text-secondary)]">{error}</p>
            </div>
          </motion.div>
        )}

        {/* ── Skeleton Loading ── */}
        {isLoading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-6"
          >
            <SkeletonBlock className="h-40 w-full" />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              <SkeletonBlock className="h-40" />
              <SkeletonBlock className="h-40" />
              <SkeletonBlock className="h-40" />
            </div>
            <SkeletonBlock className="h-48 w-full" />
          </motion.div>
        )}

        {/* ── Portfolio Data ── */}
        {portfolio && !isLoading && (
          <motion.div
            key="portfolio"
            initial={{ opacity: 0, y: 26 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-6"
          >
            {/* ── Summary Card ── */}
            <motion.div
              className="relative overflow-hidden rounded-md shadow-card"
              whileHover={{ y: -2 }}
              transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            >
              {/* Gradient border top */}
              <div className="h-1 w-full solana-gradient" />

              <div className="glass rounded-b-md p-6 sm:p-8">
                <div className="mb-3 flex items-center justify-between gap-4">
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                    Total Portfolio Value
                  </h2>
                  <div className="flex items-center gap-2 rounded-sm border border-purple-500/20 bg-purple-500/10 px-3 py-1.5 text-xs font-medium text-accent-purple">
                    <TrendingUp className="h-3.5 w-3.5" />
                    <span>Live</span>
                  </div>
                </div>

                <p className="mb-1 text-4xl font-extrabold tracking-tight solana-gradient-text sm:text-5xl lg:text-6xl">
                  ${fmtUsd(portfolio.total_value)}
                </p>
                <p className="text-sm text-[var(--text-secondary)]">
                  {portfolio.tokens.length} {portfolio.tokens.length === 1 ? 'asset' : 'assets'} tracked
                </p>

                {/* ── Allocation Bar ── */}
                {segments.length > 0 && (
                  <div className="mt-8">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                      Allocation
                    </p>
                    <div className="flex h-2 w-full gap-0.5 overflow-hidden rounded-sm">
                      {segments.map((s) => (
                        <motion.div
                          key={s.mint}
                          initial={{ flexGrow: 0, opacity: 0 }}
                          animate={{ flexGrow: Math.max(s.pct, 0.5), opacity: 1 }}
                          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                          style={{
                            flexShrink: 1,
                            flexBasis: 0,
                            minWidth: 3,
                            backgroundColor: s.color,
                            borderRadius: '2px',
                          }}
                          title={`${s.label} — ${s.pct.toFixed(1)}%`}
                        />
                      ))}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-[var(--text-secondary)]">
                      {segments.map((s) => (
                        <span key={s.mint} className="flex items-center gap-1.5">
                          <span
                            className="h-2 w-2 rounded-sm shadow-sm"
                            style={{ backgroundColor: s.color }}
                          />
                          <span className="font-medium">{s.label}</span>
                          <span className="text-[var(--text-muted)]">{s.pct.toFixed(1)}%</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            {/* ── Token Cards ── */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {portfolio.tokens.map((token, index) => {
                const change = pctChangeDisplay(token.price_change_24h);
                const changePositive = (token.price_change_24h ?? 0) >= 0;
                const accentColor = PALETTE[index % PALETTE.length];
                return (
                  <motion.div
                    key={token.token_mint}
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: index * 0.04,
                      duration: 0.45,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    whileHover={{ y: -3 }}
                    className="group relative overflow-hidden rounded-md glass shadow-card transition-all duration-300 hover:shadow-xl"
                  >
                    {/* Left accent stripe */}
                    <div
                      className="absolute inset-y-0 left-0 w-1 transition-all duration-300 group-hover:w-1.5"
                      style={{ backgroundColor: accentColor }}
                    />

                    <div className="p-5 pl-5 sm:p-6 sm:pl-6">
                      {/* Header: logo + name | change badge */}
                      <div className="mb-4 flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          {token.logo_uri ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={token.logo_uri}
                              alt=""
                              className="h-11 w-11 rounded-md border-2 object-cover shadow-md"
                              style={{ borderColor: `${accentColor}40` }}
                              width={44}
                              height={44}
                            />
                          ) : (
                            <div
                              className="flex h-11 w-11 items-center justify-center rounded-md text-sm font-bold text-white shadow-md"
                              style={{
                                background: `linear-gradient(135deg, ${accentColor}, ${accentColor}99)`,
                              }}
                            >
                              {token.symbol.charAt(0)}
                            </div>
                          )}
                          <div>
                            <p className="text-base font-bold text-[var(--text-primary)]">
                              {token.symbol}
                            </p>
                            {token.name && (
                              <p className="text-xs text-[var(--text-muted)] leading-tight">
                                {token.name}
                              </p>
                            )}
                          </div>
                        </div>

                        {change && (
                          <span
                            className={`shrink-0 rounded-sm border px-2.5 py-1 text-xs font-semibold ${
                              changePositive
                                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                                : 'border-rose-500/30 bg-rose-500/10 text-rose-400'
                            }`}
                          >
                            {change}
                          </span>
                        )}
                      </div>

                      {/* Mint address */}
                      <div className="mb-4 flex flex-wrap items-center gap-1.5">
                        <code className="rounded-sm bg-[var(--surface-soft)] px-2 py-1 font-mono text-xs text-[var(--text-muted)]">
                          {shortMint(token.token_mint)}
                        </code>
                        <button
                          type="button"
                          onClick={() => void copyMint(token.token_mint)}
                          className="inline-flex items-center gap-1 rounded-sm px-2 py-1 text-xs text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-soft)] hover:text-[var(--text-primary)]"
                          aria-label="Copy mint address"
                        >
                          {copiedMint === token.token_mint ? (
                            <Check className="h-3 w-3 text-emerald-400" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button>
                        <a
                          href={`https://solscan.io/token/${token.token_mint}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-sm px-2 py-1 text-xs text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-soft)] hover:text-[var(--text-primary)]"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>

                      {/* Stats */}
                      <div className="space-y-2.5 border-t border-[var(--nav-border)] pt-4">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                            Value
                          </span>
                          <span className="text-lg font-bold text-[var(--text-primary)]">
                            ${fmtUsd(token.value)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                            Price
                          </span>
                          <span className="text-sm text-[var(--text-primary)]">
                            ${fmtUsd(token.current_price)}
                            {token.price_source && (
                              <span className="ml-1.5 text-xs text-[var(--text-muted)]">
                                ({token.price_source})
                              </span>
                            )}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                            Balance
                          </span>
                          <span className="text-sm font-mono text-[var(--text-secondary)]">
                            {token.balance.toLocaleString('en-US', {
                              minimumFractionDigits: 0,
                              maximumFractionDigits: Math.min(8, Math.max(2, token.decimals ?? 4)),
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* ── Empty tokens ── */}
            {portfolio.tokens.length === 0 && (
              <div className="rounded-md glass p-12 text-center shadow-card">
                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-md bg-accent-purple/15">
                  <Briefcase className="h-10 w-10 text-accent-purple" />
                </div>
                <h3 className="mb-2 text-xl font-bold text-[var(--text-primary)]">No tokens found</h3>
                <p className="text-[var(--text-secondary)]">
                  This wallet doesn&apos;t contain any tokens yet.
                </p>
              </div>
            )}

            {/* ── Activity Feed ── */}
            <div className="overflow-hidden rounded-md glass shadow-card">
              {/* Header */}
              <div className="border-b border-[var(--nav-border)] px-6 py-4">
                <div className="flex items-center gap-2.5 text-[var(--text-primary)]">
                  <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-accent-purple/15">
                    <Activity className="h-4 w-4 text-accent-purple" />
                  </div>
                  <h3 className="text-base font-semibold">Recent Activity</h3>
                </div>
              </div>

              <div className="p-5 sm:p-6">
                {activityError && (
                  <p className="text-sm text-rose-400">{activityError}</p>
                )}
                {activityLoading && !activity && (
                  <div className="space-y-3">
                    <SkeletonBlock className="h-14" />
                    <SkeletonBlock className="h-14" />
                    <SkeletonBlock className="h-14" />
                  </div>
                )}
                {activity && activity.items.length === 0 && (
                  <p className="py-4 text-center text-sm text-[var(--text-muted)]">
                    No recent signatures for this address.
                  </p>
                )}
                {activity && activity.items.length > 0 && (
                  <ul className="space-y-2">
                    {activity.items.map((item, index) => (
                      <motion.li
                        key={item.signature}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.02, duration: 0.3 }}
                        className="group flex items-stretch overflow-hidden rounded-sm border border-[var(--nav-border)] bg-[var(--surface-soft)] transition-colors hover:bg-[var(--surface-strong)]"
                      >
                        {/* Status bar */}
                        <div
                          className={`w-1 shrink-0 ${
                            item.success ? 'bg-emerald-500' : 'bg-rose-500'
                          }`}
                        />

                        <div className="flex flex-1 flex-wrap items-center justify-between gap-2 px-4 py-3">
                          <div className="min-w-0 flex-1">
                            <a
                              href={item.solscan_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-mono text-xs text-accent-purple transition-colors hover:text-accent-violet hover:underline"
                            >
                              {shortMint(item.signature)}
                            </a>
                            <div className="mt-0.5 flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                              <span>slot {item.slot}</span>
                              {item.block_time != null && (
                                <>
                                  <span className="opacity-40">·</span>
                                  <span>{relativeTime(item.block_time)}</span>
                                </>
                              )}
                            </div>
                          </div>

                          <span
                            className={`shrink-0 rounded-sm px-2.5 py-1 text-xs font-medium ${
                              item.success
                                ? 'bg-emerald-500/10 text-emerald-400'
                                : 'bg-rose-500/10 text-rose-400'
                            }`}
                          >
                            {item.success ? 'Success' : 'Failed'}
                          </span>
                        </div>
                      </motion.li>
                    ))}
                  </ul>
                )}

                {activity?.next_before && activity.items.length > 0 && (
                  <motion.button
                    type="button"
                    disabled={activityLoading}
                    onClick={() =>
                      void fetchActivity(portfolio.wallet_address, activity.next_before)
                    }
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-md border border-[var(--nav-border)] bg-[var(--surface-soft)] py-3 text-sm font-medium text-[var(--text-secondary)] transition-all hover:bg-[var(--surface-strong)] hover:text-[var(--text-primary)] disabled:opacity-50"
                  >
                    {activityLoading ? 'Loading…' : 'Load more'}
                    <ChevronDown className="h-4 w-4" />
                  </motion.button>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Empty State (no wallet queried) ── */}
        {!portfolio && !isLoading && !error && (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="rounded-md glass p-8 text-center shadow-card sm:p-14"
          >
            <div className="mx-auto mb-6 flex h-20 w-20 animate-float items-center justify-center rounded-md shadow-2xl solana-gradient sm:h-24 sm:w-24 glow-purple">
              <Sparkles className="h-10 w-10 text-white sm:h-12 sm:w-12" />
            </div>
            <h3 className="mb-3 text-2xl font-extrabold tracking-tight text-gradient-heading sm:text-3xl">
              Ready to explore
            </h3>
            <p className="mx-auto max-w-md text-base text-[var(--text-secondary)] leading-relaxed">
              Paste a wallet address above and the dashboard will
              assemble a complete portfolio picture.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
