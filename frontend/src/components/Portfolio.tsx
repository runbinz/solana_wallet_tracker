'use client';

import { useState } from 'react';
import type { Portfolio as PortfolioType } from '../types/portfolio';
import WalletInput from './WalletInput';
import { AlertCircle, TrendingUp, Briefcase, Sparkles } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

export default function Portfolio() {
  const [portfolio, setPortfolio] = useState<PortfolioType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPortfolio = async (address: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/portfolio/${address}`);
      if (!response.ok) {
        throw new Error(await response.text() || 'Failed to fetch portfolio');
      }
      const data = await response.json();
      setPortfolio(data);
    } catch (error) {
      console.error('Error:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch portfolio data');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <WalletInput onSubmit={fetchPortfolio} isLoading={isLoading} />

      {error && (
        <div className="bg-red-500/20 backdrop-blur-md border border-red-500/50 text-white px-6 py-4 rounded-xl flex items-center gap-3 animate-in slide-in-from-top">
          <AlertCircle className="w-6 h-6 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {isLoading && (
        <div className="flex flex-col items-center justify-center py-16 space-y-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#9945FF]/30"></div>
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-t-[#14F195] absolute top-0 left-0"></div>
          </div>
          <p className="text-white text-lg font-medium">Loading your portfolio...</p>
        </div>
      )}
      
      {portfolio && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom duration-500">
          {/* Total Value Card */}
          <div className="solana-gradient rounded-2xl p-[2px] shadow-2xl">
            <div className="bg-[#1a1a2e] rounded-2xl p-8">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-medium text-gray-300">Total Portfolio Value</h2>
                <div className="flex items-center gap-2 text-[#14F195] text-sm">
                  <TrendingUp className="w-4 h-4" />
                  <span>Live</span>
                </div>
              </div>
              <p className="text-5xl font-bold solana-gradient-text mb-2">
                ${portfolio.total_value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-gray-400">
                {portfolio.tokens.length} {portfolio.tokens.length === 1 ? 'token' : 'tokens'} in your wallet
              </p>
            </div>
          </div>
          
          {/* Tokens Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {portfolio.tokens.map((token, index) => (
              <div 
                key={token.token_mint} 
                className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-[#9945FF]/20 group"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 solana-gradient rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                      {token.symbol.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-white text-lg">{token.symbol}</p>
                      <p className="text-sm text-gray-400">
                        {token.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                      </p>
                    </div>
                  </div>
                  <div className="bg-[#9945FF]/20 px-3 py-1 rounded-full border border-[#9945FF]/30">
                    <p className="text-xs text-[#9945FF]">Token</p>
                  </div>
                </div>
                
                <div className="border-t border-white/10 pt-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Value</span>
                    <span className="font-bold text-white text-lg">
                      ${token.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Price per token</span>
                    <span className="text-gray-300">
                      ${token.current_price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                    </span>
                  </div>
                </div>

                {/* Hover effect indicator */}
                <div className="mt-4 h-1 solana-gradient rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
              </div>
            ))}
          </div>

          {/* Empty state for no tokens */}
          {portfolio.tokens.length === 0 && (
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-12 border border-white/20 text-center">
              <div className="w-20 h-20 bg-[#9945FF]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Briefcase className="w-10 h-10 text-[#9945FF]" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">No tokens found</h3>
              <p className="text-gray-400">This wallet doesn&apos;t contain any tokens yet.</p>
            </div>
          )}
        </div>
      )}

      {/* Welcome state when no portfolio is loaded */}
      {!portfolio && !isLoading && !error && (
        <div className="bg-white/5 backdrop-blur-md rounded-2xl p-12 border border-white/10 text-center">
          <div className="w-24 h-24 solana-gradient rounded-2xl flex items-center justify-center mx-auto mb-6 transform rotate-6 shadow-2xl shadow-[#9945FF]/30">
            <Sparkles className="w-12 h-12 text-white transform -rotate-6" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-3">Welcome to Solana Portfolio Tracker</h3>
          <p className="text-gray-300 text-lg max-w-md mx-auto">
            Enter your Solana wallet address above to view your portfolio value and token holdings in real-time.
          </p>
        </div>
      )}
    </div>
  );
}