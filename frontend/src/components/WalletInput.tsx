'use client';

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
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        name="address"
        placeholder="Enter Solana wallet address"
        className="flex-1 p-2 border rounded"
        required
      />
      <button
        type="submit"
        disabled={isLoading}
        className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:bg-purple-400"
      >
        {isLoading ? 'Loading...' : 'View Portfolio'}
      </button>
    </form>
  );
}