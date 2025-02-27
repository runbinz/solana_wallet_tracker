'use client';

import { useState } from 'react';
import type { Portfolio as PortfolioType } from '../types/portfolio';
import WalletInput from './WalletInput';

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
    <div className="space-y-6">
      <WalletInput onSubmit={fetchPortfolio} isLoading={isLoading} />

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {isLoading && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      )}
      
      {portfolio && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold">Total Portfolio Value</h2>
            <p className="text-3xl font-bold">${portfolio.total_value.toFixed(2)}</p>
          </div>
          
          <div className="space-y-4">
            {portfolio.tokens.map((token) => (
              <div key={token.token_mint} className="border-b pb-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold">{token.symbol}</p>
                    <p className="text-sm text-gray-600">
                      Balance: {token.balance.toFixed(4)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">${token.value.toFixed(2)}</p>
                    <p className="text-sm text-gray-500">
                      ${token.current_price.toFixed(2)}/token
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}