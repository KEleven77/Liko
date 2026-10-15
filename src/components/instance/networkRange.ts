export function parseNetworkHours(text: string, max = 168): number | null {
  if (!text.trim()) return null;
  const value = Number(text);
  return Number.isInteger(value) && value >= 1 && value <= max ? value : null;
}
