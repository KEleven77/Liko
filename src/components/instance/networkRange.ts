export function parseNetworkHours(text: string, max = 168): number | null {
  if (!text.trim()) return null;
  const value = Number(text);
  return Number.isInteger(value) && value >= 1 && value <= max ? value : null;
}

export function clampHistoryHours(value: number, ranges: { value: number }[]): number {
  if (!ranges.length) return 1;
  const min = Math.min(...ranges.map((range) => range.value));
  const max = Math.max(...ranges.map((range) => range.value));
  return Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : min;
}
