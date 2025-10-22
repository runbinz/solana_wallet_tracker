'use client';

import { Search, Loader2 } from 'lucide-react';

interface WalletInputProps {
  onSubmit: (address: string) => void;
  isLoading: boolean;
}

export default function WalletInput({ onSubmit, isLoading }: WalletInputProps) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const address = formData.get('address') as string;
    onSubmit(address);
  };

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 shadow-2xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Enter Wallet Address</h2>
        <p className="text-gray-300">Track your Solana portfolio in real time</p>
      </div>
      
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <input
            type="text"
            name="address"
            placeholder="Enter Solana wallet address (e.g., 7xKX...)"
            className="w-full p-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#9945FF] focus:border-transparent transition-all"
            required
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="solana-gradient text-white px-8 py-4 rounded-xl font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl hover:shadow-[#9945FF]/50 flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Loading...
            </>
          ) : (
            <>
              <Search className="w-5 h-5" />
              View Portfolio
            </>
          )}
        </button>
      </form>
    </div>
  );
}