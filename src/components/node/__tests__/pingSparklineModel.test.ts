import { describe, expect, it } from "vitest";
import type { PingOverviewBucket } from "@/types/komari";
import { buildPingSparklinePoints, pingSparklineIndex, createPingInspection, currentPingInspection } from "../pingSparklineModel";
import { formatCombinedPingBucketTooltip } from "../pingBucketText";

function bucket(value: number | null, total = 1): PingOverviewBucket {
  return { index: 0, value, total, lost: value == null ? total : 0,
    loss: value == null ? 100 : 0, startAt: null, endAt: null };
}

describe("ping sparkline periods", () => {
  it("preserves the trend in the unchanged compact indicator strip height", () => {
    const points = buildPingSparklinePoints([bucket(10), bucket(30), bucket(50)], 100, 6);
    expect(points[0].y).toBeGreaterThan(points[1].y!);
    expect(points[1].y).toBeGreaterThan(points[2].y!);
    points.forEach((point) => {
      expect(point.y).toBeGreaterThanOrEqual(0);
      expect(point.y).toBeLessThan(6);
    });
  });
  it("clears pinned inspection when the rolling window advances", () => {
    const buckets = [{ ...bucket(20), startAt: 0, endAt: 180_000 }];
    const inspection = createPingInspection(buckets, 0, true);
    expect(currentPingInspection(buckets, inspection)).toBe(inspection);
    const advanced = [{ ...buckets[0], startAt: 60_000, endAt: 240_000 }];
    expect(currentPingInspection(advanced, inspection)).toBeNull();
  });

  it("keeps inspection during same-window data updates but clears it on resize of the bucket count", () => {
    const buckets = [bucket(20), bucket(30)];
    const inspection = createPingInspection(buckets, 1, true);
    expect(currentPingInspection([bucket(25), bucket(35)], inspection)).toBe(inspection);
    expect(currentPingInspection([bucket(25)], inspection)).toBeNull();
    expect(currentPingInspection([], inspection)).toBeNull();
  });
  it("keeps normalized geometry equivalent after resizing", () => {
    const buckets = [bucket(20), bucket(null), bucket(40), bucket(30)];
    const normalized = buildPingSparklinePoints(buckets, 1, 26);
    for (const width of [100, 220, 400]) {
      const actual = buildPingSparklinePoints(buckets, width, 26);
      actual.forEach((point, index) => {
        expect(normalized[index].x * width).toBeCloseTo(point.x);
        expect(normalized[index].y).toBe(point.y);
      });
    }
  });
  it("aligns samples and inspected periods to the same bucket centers", () => {
    const points = buildPingSparklinePoints([bucket(10), bucket(20), bucket(30)], 90, 26);
    expect(points.map((point) => point.x)).toEqual([15, 45, 75]);
    points.forEach((point, index) => expect(pingSparklineIndex(point.x, 90, 3)).toBe(index));
    expect(points[0].y).toBeGreaterThan(points[1].y!);
    expect(points[1].y).toBeGreaterThan(points[2].y!);
  });

  it("preserves gaps and does not turn loss or missing data into zero latency", () => {
    const points = buildPingSparklinePoints([
      bucket(0), bucket(null), bucket(50, 0), bucket(-1), bucket(Number.NaN), bucket(25),
    ], 120, 26);
    expect(points[0].y).not.toBeNull();
    expect(points.slice(1, 5).map((point) => point.y)).toEqual([null, null, null, null]);
    expect(points[5].y).not.toBeNull();
    expect(formatCombinedPingBucketTooltip(bucket(null))).toContain("失败");
    expect(formatCombinedPingBucketTooltip(bucket(null, 0))).toContain("无样本");
  });

  it("keeps constant and single-point series finite and within the plot", () => {
    for (const values of [[0], [50], [50, 50, 50]]) {
      const points = buildPingSparklinePoints(values.map((value) => bucket(value)), 100, 26);
      points.forEach((point) => {
        expect(Number.isFinite(point.y)).toBe(true);
        expect(point.y).toBeGreaterThanOrEqual(3);
        expect(point.y).toBeLessThanOrEqual(21);
      });
    }
    expect(buildPingSparklinePoints([], 100, 26)).toEqual([]);
  });

  it("clamps pointer positions and handles empty histories", () => {
    expect(pingSparklineIndex(-10, 100, 10)).toBe(0);
    expect(pingSparklineIndex(150, 100, 10)).toBe(9);
    expect(pingSparklineIndex(50, 100, 0)).toBeNull();
    expect(pingSparklineIndex(0, 0, 10)).toBeNull();
  });
});
