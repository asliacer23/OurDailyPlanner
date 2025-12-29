/**
 * Currency formatting utility
 * Converts all monetary values to Philippine Peso (₱)
 */

export const formatPeso = (amount: number, includeDecimals = true): string => {
  if (typeof amount !== 'number') return '₱0.00';
  
  const formatted = includeDecimals
    ? amount.toFixed(2)
    : amount.toFixed(0);
  
  return `₱${formatted}`;
};

export const formatPesoCompact = (amount: number): string => {
  if (typeof amount !== 'number') return '₱0';
  
  if (Math.abs(amount) >= 1000000) {
    return `₱${(amount / 1000000).toFixed(1)}M`;
  } else if (Math.abs(amount) >= 1000) {
    return `₱${(amount / 1000).toFixed(1)}K`;
  }
  
  return formatPeso(amount, false);
};

export const parsePeso = (value: string): number => {
  // Remove peso symbol and commas, then convert to number
  return parseFloat(value.replace(/[₱,]/g, ''));
};

// Color coding for positive/negative amounts
export const getPesoColor = (amount: number): string => {
  if (amount > 0) return 'text-green-600 dark:text-green-400';
  if (amount < 0) return 'text-red-600 dark:text-red-400';
  return 'text-gray-600 dark:text-gray-400';
};

// Format with color
export const formatPesoWithColor = (amount: number): string => {
  const color = getPesoColor(amount);
  const formatted = formatPeso(amount);
  return `<span class="${color}">${formatted}</span>`;
};
