export interface ActivityItem {
  signature: string;
  slot: number;
  block_time?: number;
  success: boolean;
  error_summary?: string;
  memo?: string;
  solscan_url: string;
  confirmation_status?: string;
}

export interface ActivityResponse {
  wallet_address: string;
  items: ActivityItem[];
  next_before?: string;
}
