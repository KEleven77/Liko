import { beforeEach, describe, expect, it, vi } from "vitest";

describe("card tag text colors", () => {
  beforeEach(() => vi.resetModules());

  it("gives identical text the same hue", async () => {
    const { tagHue } = await import("../tagColor");
    expect(tagHue("高带宽")).toBe(tagHue(" 高带宽 "));
    expect(tagHue("café")).toBe(tagHue("cafe\u0301"));
  });

  it("distinguishes the preview tags", async () => {
    const { tagHue } = await import("../tagColor");
    const tags = ["边缘", "高带宽", "欧洲", "BGP", "优选", "中转", "缓存", "极速", "亚太", "三网优化", "核心", "美西", "数据库", "临期"];
    const hues = tags.map(tagHue);
    expect(new Set(hues).size).toBe(tags.length);
    expect(hues.every((hue) => hue >= 0 && hue < 360)).toBe(true);
  });

  it("separates nearby original hues and keeps assignments after more tags", async () => {
    const { tagHue } = await import("../tagColor");
    const labels = ["边缘", "高带宽", "欧洲", "BGP", "优选"];
    const hues = labels.map(tagHue);
    for (let index = 0; index < hues.length; index++) {
      for (const other of hues.slice(index + 1)) {
        const difference = Math.abs(hues[index] - other);
        expect(Math.min(difference, 360 - difference)).toBeGreaterThanOrEqual(40);
      }
    }
    ["缓存", "极速", "亚太"].forEach(tagHue);
    expect(labels.map(tagHue)).toEqual(hues);
  });
});
