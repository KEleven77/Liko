import { describe, expect, it } from "vitest";
import { tagHue } from "../tagColor";

describe("card tag text colors", () => {
  it("gives identical text the same hue", () => {
    expect(tagHue("高带宽")).toBe(tagHue(" 高带宽 "));
    expect(tagHue("café")).toBe(tagHue("cafe\u0301"));
  });

  it("distinguishes the preview tags", () => {
    const tags = ["边缘", "高带宽", "欧洲", "BGP", "优选", "中转", "缓存", "极速", "亚太", "三网优化", "核心", "美西", "数据库", "临期"];
    const hues = tags.map(tagHue);
    expect(new Set(hues).size).toBe(tags.length);
    expect(hues.every((hue) => hue >= 0 && hue < 360)).toBe(true);
  });
});
