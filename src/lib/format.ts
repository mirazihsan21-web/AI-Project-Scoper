const EN_DASH = "–";

export function formatMoney(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}

export function formatMoneyRange(low: number, high: number, currency: string): string {
  return low === high ? formatMoney(low, currency) : `${formatMoney(low, currency)}${EN_DASH}${formatMoney(high, currency)}`;
}

export function formatWeeks(low: number, high: number): string {
  if (low === high) return `${low} ${low === 1 ? "week" : "weeks"}`;
  return `${low}${EN_DASH}${high} weeks`;
}
