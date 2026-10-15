import { describe, expect, it } from "vitest";
import {
  buildLoadTimeRangeOptions,
  buildPingTimeRangeOptions,
} from "@/components/instance/chartShared";

describe("detail chart time ranges", () => {
  it("includes all common Ping ranges up to a week even with 90 days retained", () => {
    expect(buildPingTimeRangeOptions(90 * 24)).toEqual([
      { label: "1 小时", value: 1 },
      { label: "4 小时", value: 4 },
      { label: "6 小时", value: 6 },
      { label: "12 小时", value: 12 },
      { label: "1 天", value: 24 },
      { label: "7 天", value: 168 },
    ]);
  });

  it("respects short and nonstandard Ping retention windows", () => {
    expect(buildPingTimeRangeOptions(3)).toEqual([
      { label: "1 小时", value: 1 }, { label: "3 小时", value: 3 },
    ]);
    expect(buildPingTimeRangeOptions(12).map((range) => range.value)).toEqual([1, 4, 6, 12]);
    expect(buildPingTimeRangeOptions(undefined).map((range) => range.value)).toEqual([1, 4, 6, 12, 24, 168]);
  });

  it("keeps load history capped at 30 days even with 90 days retained", () => {
    expect(buildLoadTimeRangeOptions(90 * 24)).toEqual([
      { label: "实时", value: 0 },
      { label: "1 小时", value: 1 },
      { label: "4 小时", value: 4 },
      { label: "6 小时", value: 6 },
      { label: "12 小时", value: 12 },
      { label: "1 天", value: 24 },
      { label: "7 天", value: 168 },
      { label: "30 天", value: 720 },
    ]);
  });

  it("filters resource ranges by retention while preserving realtime", () => {
    expect(buildLoadTimeRangeOptions(12).map((range) => range.value)).toEqual([0, 1, 4, 6, 12]);
    expect(buildLoadTimeRangeOptions(10).map((range) => range.value)).toEqual([0, 1, 4, 6, 10]);
  });
});
