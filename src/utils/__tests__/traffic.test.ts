import { describe, expect, it } from "vitest";
import { computeTrafficUsed, formatTrafficResetLabel, resolveTrafficUsage, trafficTypeLabel } from "@/utils/traffic";
import { NodeInfoSchema } from "@/types/komari";

describe("formatTrafficResetLabel", () => {
  const now = Date.parse("2026-10-09T00:00:00Z");
  it("uses the backend instant and rounds partial days up", () => {
    expect(formatTrafficResetLabel("2026-10-12T00:00:00Z", now)).toBe("3天后重置");
    expect(formatTrafficResetLabel("2026-10-10T08:00:00+08:00", now)).toBe("1天后重置");
    expect(formatTrafficResetLabel("2026-10-09T00:01:00Z", now)).toBe("1天后重置");
  });
  it("does not invent a reset for missing, invalid or stale backend data", () => {
    for (const value of [undefined, null, "", "invalid", "2026-10-12", "2026-10-12T00:00:00", "2026-10-09T00:00:00Z", "2026-10-08T00:00:00Z"]) {
      expect(formatTrafficResetLabel(value, now)).toBe("");
    }
    expect(formatTrafficResetLabel("2026-10-12T00:00:00Z", NaN)).toBe("");
  });
  it("preserves the backend reset timestamp through node parsing", () => {
    const node = NodeInfoSchema.parse({ uuid: "test", traffic_reset_at: "2026-10-12T00:00:00Z" });
    expect(formatTrafficResetLabel(node.traffic_reset_at, now)).toBe("3天后重置");
    expect(NodeInfoSchema.parse({ uuid: "test", traffic_reset_at: 42 }).traffic_reset_at).toBeUndefined();
  });
});

describe("computeTrafficUsed", () => {
  it("reduces up/down per type", () => {
    expect(computeTrafficUsed("sum", 30, 70)).toBe(100);
    expect(computeTrafficUsed("up", 30, 70)).toBe(30);
    expect(computeTrafficUsed("down", 30, 70)).toBe(70);
    expect(computeTrafficUsed("max", 30, 70)).toBe(70);
    expect(computeTrafficUsed("min", 30, 70)).toBe(30);
  });

  it("defaults to max for empty/unknown (backend gorm default)", () => {
    expect(computeTrafficUsed("", 30, 70)).toBe(70);
    expect(computeTrafficUsed(undefined, 80, 20)).toBe(80);
    expect(computeTrafficUsed(null, 80, 20)).toBe(80);
    expect(computeTrafficUsed("weird", 80, 20)).toBe(80);
  });

  it("is case- and whitespace-insensitive", () => {
    expect(computeTrafficUsed(" SUM ", 30, 70)).toBe(100);
    expect(computeTrafficUsed("Up", 30, 70)).toBe(30);
  });

  it("guards NaN/negative inputs to 0", () => {
    expect(computeTrafficUsed("sum", Number.NaN, 70)).toBe(70);
    expect(computeTrafficUsed("sum", -5, 70)).toBe(70);
    expect(computeTrafficUsed("min", -5, 70)).toBe(0);
  });
});

describe("resolveTrafficUsage", () => {
  it("derives used/remaining/fraction from a limit", () => {
    const usage = resolveTrafficUsage("sum", 30, 70, 200);
    expect(usage.used).toBe(100);
    expect(usage.limit).toBe(200);
    expect(usage.unlimited).toBe(false);
    expect(usage.remaining).toBe(100);
    expect(usage.fraction).toBe(0.5);
  });

  it("reduces by type before measuring against the limit", () => {
    expect(resolveTrafficUsage("max", 30, 70, 200).used).toBe(70);
    expect(resolveTrafficUsage("up", 30, 70, 200).used).toBe(30);
  });

  it("treats limit <= 0 as unlimited", () => {
    const usage = resolveTrafficUsage("sum", 30, 70, 0);
    expect(usage.unlimited).toBe(true);
    expect(usage.remaining).toBe(0);
    expect(usage.fraction).toBe(0);
  });

  it("clamps fraction and remaining when over the limit", () => {
    const usage = resolveTrafficUsage("sum", 150, 100, 200);
    expect(usage.used).toBe(250);
    expect(usage.fraction).toBe(1);
    expect(usage.remaining).toBe(0);
  });
});

describe("trafficTypeLabel", () => {
  it("labels each known type", () => {
    expect(trafficTypeLabel("up")).toBe("仅上行");
    expect(trafficTypeLabel("down")).toBe("仅下行");
    expect(trafficTypeLabel("sum")).toBe("上行+下行");
    expect(trafficTypeLabel("min")).toBe("上下取小");
    expect(trafficTypeLabel("max")).toBe("上下取大");
  });

  it("falls back to max label for empty/unknown", () => {
    expect(trafficTypeLabel("")).toBe("上下取大");
    expect(trafficTypeLabel(undefined)).toBe("上下取大");
  });
});
