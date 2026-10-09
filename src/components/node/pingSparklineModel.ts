import type { PingOverviewBucket } from "@/types/komari";

export interface PingInspection {
  index: number;
  sticky: boolean;
  windowStart: number | null;
  windowEnd: number | null;
  count: number;
}

export function createPingInspection(buckets: PingOverviewBucket[], index: number, sticky: boolean): PingInspection {
  return { index, sticky, windowStart: buckets[0]?.startAt ?? null,
    windowEnd: buckets.at(-1)?.endAt ?? null, count: buckets.length };
}

export function currentPingInspection(buckets: PingOverviewBucket[], inspection: PingInspection | null) {
  if (!inspection || inspection.count !== buckets.length || !buckets.length
    || inspection.windowStart !== (buckets[0].startAt ?? null)
    || inspection.windowEnd !== (buckets.at(-1)?.endAt ?? null)) return null;
  return inspection;
}

export function pingSparklineIndex(offsetX: number, width: number, count: number) {
  if (count <= 0 || width <= 0) return null;
  return Math.max(0, Math.min(count - 1, Math.floor(offsetX / width * count)));
}

export function buildPingSparklinePoints(buckets: PingOverviewBucket[], width: number, height: number) {
  let min = Infinity;
  let max = -Infinity;
  const values = buckets.map((bucket) => {
    const value = bucket.value;
    if (bucket.total <= 0 || value == null || !Number.isFinite(value) || value < 0) return null;
    min = Math.min(min, value);
    max = Math.max(max, value);
    return value;
  });
  if (max === -Infinity) min = max = 0;
  const padding = Math.max(5, (max - min) * 0.15);
  const floor = Math.max(0, min - padding);
  const ceiling = max + padding;
  const inset = Math.min(3, Math.max(0, height / 6));
  const plotHeight = Math.max(0, height - inset * 2 - 2);
  return values.map((value, index) => ({
    x: (index + 0.5) / values.length * width,
    y: value == null ? null : inset + (1 - (value - floor) / (ceiling - floor)) * plotHeight,
  }));
}
