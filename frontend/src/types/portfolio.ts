export interface TokenHolding {
    token_mint: string;
    symbol: string;
    balance: number;
    current_price: number;
    value: number;
  }
  
export interface Portfolio {
    wallet_address: string;
    tokens: TokenHolding[];
    total_value: number;
}