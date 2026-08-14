export function formatNumber(val: number): string {
  if (isNaN(val)) return "0";
  return new Intl.NumberFormat("en-US").format(val);
}

export function formatPercent(val: number, decimals: number = 0): string {
  if (isNaN(val)) return "0%";
  return `${val.toFixed(decimals)}%`;
}
