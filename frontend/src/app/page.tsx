import Portfolio from '../components/Portfolio';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm p-4 mb-8">
        <h1 className="text-xl font-bold">Solana Portfolio Tracker</h1>
      </nav>
      <div className="container mx-auto px-4">
        <Portfolio />
      </div>
    </main>
  );
}