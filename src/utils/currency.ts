export function formatCurrency(amount: number, currency: string = "INR", locale: string = "en-IN"): string {
  if (isNaN(amount)) return "0";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency,
    maximumFractionDigits: 0,
  }).format(amount);
}
