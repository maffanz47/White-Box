/**
 * Format paisa amount to PKR string with commas
 * e.g., 500000 paisa → "₨ 5,000.00"
 */
export function formatPKR(paisa: number): string {
  const rupees = paisa / 100;
  return `₨ ${rupees.toLocaleString('en-PK', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

/**
 * Format large numbers with abbreviations
 * e.g., 1500000 → "1.5M", 25000 → "25K"
 */
export function formatCompact(num: number): string {
  if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)}B`;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
}

/**
 * Truncate hash for display
 * e.g., "a1b2c3d4e5f6..." → "a1b2c3...e5f6"
 */
export function truncateHash(hash: string, chars: number = 6): string {
  if (hash.length <= chars * 2) return hash;
  return `${hash.slice(0, chars)}...${hash.slice(-chars)}`;
}

/**
 * Sector display names
 */
export const SECTOR_LABELS: Record<string, string> = {
  health: 'Health',
  education: 'Education',
  disaster_relief: 'Disaster Relief',
  infrastructure: 'Infrastructure',
  food_security: 'Food Security',
};

/**
 * Sector colors for charts
 */
export const SECTOR_COLORS: Record<string, string> = {
  health: '#10b981',
  education: '#6366f1',
  disaster_relief: '#ef4444',
  infrastructure: '#f59e0b',
  food_security: '#8b5cf6',
};

/**
 * Category display names for expenses
 */
export const CATEGORY_LABELS: Record<string, string> = {
  direct_aid: 'Direct Aid',
  logistics: 'Logistics',
  admin: 'Admin',
  vendor_payment: 'Vendor Payment',
  salary: 'Salary',
};

/**
 * Channel display names
 */
export const CHANNEL_LABELS: Record<string, string> = {
  raast: 'Raast P2M',
  '1link': '1Link',
  manual: 'Manual',
  bank_transfer: 'Bank Transfer',
};

/**
 * Time ago formatter
 */
export function timeAgo(date: string | Date): string {
  const now = new Date();
  const then = new Date(date);
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
