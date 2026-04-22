export interface TokenHolding {
  token_mint: string;
  symbol: string;
  name?: string;
  logo_uri?: string;
  decimals: number;
  balance: number;
  current_price: number;
  value: number;
  price_source?: string;
  last_price_at?: string;
  price_change_24h?: number;
}

export interface Portfolio {
  wallet_address: string;
  tokens: TokenHolding[];
  total_value: number;
}
