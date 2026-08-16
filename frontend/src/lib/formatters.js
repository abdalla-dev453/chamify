export function formatKes(amount) {
  const value = Number(amount ?? 0);
  return new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES" }).format(value);
}

export function formatDate(isoString) {
  if (!isoString) return "—";
  return new Intl.DateTimeFormat("en-KE", { dateStyle: "medium" }).format(new Date(isoString));
}