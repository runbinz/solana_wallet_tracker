import Portfolio from '../components/Portfolio';
import { Wallet } from 'lucide-react';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] relative overflow-hidden">
      {/* Animated background elements*/}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#9945FF] rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-[#14F195] rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#00D18C] rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Navigation */}
      <nav className="relative bg-white/10 backdrop-blur-md border-b border-white/20 p-6 mb-8">
        <div className="container mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 solana-gradient rounded-lg flex items-center justify-center transform rotate-6 shadow-lg">
              <Wallet className="w-6 h-6 text-white transform -rotate-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Solana Portfolio Tracker</h1>
              <p className="text-gray-300 text-sm">Track your SOL and tokens in real time</p>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-4 pb-12 relative">
        <Portfolio />
      </div>
    </main>
  );
}