import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");
const surface = read("../surface.css");
const home = read("../home.css");

describe("motion performance contracts", () => {
  it("animates the stable chart wrapper without clipping recreated plots", () => {
    expect(surface).toMatch(/\.instance-uplot-wrap\s*\{\s*animation: chart-reveal/);
    expect(surface).not.toContain("clip-path: inset(");
    expect(surface).not.toMatch(/\.instance-uplot-wrap \.uplot\s*\{\s*animation:/);
  });

  it("moves chart tooltips through transforms instead of layout properties", () => {
    const parts = read("../../components/instance/ChartParts.tsx");
    expect(parts).toContain("translate3d(${tooltip.left}px, ${tooltip.top}px, 0)");
    expect(surface).toContain("transform 80ms");
    expect(surface).not.toMatch(/(?:left|top) 110ms/);
  });

  it("keeps hover repaint frames out of React state updates", () => {
    const canvas = read("../../components/node/CanvasStrip.tsx");
    expect(canvas).not.toContain("setInteraction");
    expect(canvas).toContain("paintRef.current?.()");
    expect(canvas).toContain("draw(ctx, width, height, interactionRef.current)");
  });

  it("avoids catch-all transitions and shadow animation on bandwidth indicators", () => {
    expect(home).not.toMatch(/transition:\s*all\b/);
    for (const match of home.matchAll(/@keyframes bandwidth-pulse-\d \{([\s\S]*?)\n\}/g)) {
      expect(match[1]).not.toContain("box-shadow");
      expect(match[1]).toContain("transform: scale(");
    }
  });

  it("respects reduced motion across controls, dialogs and pseudo-elements", () => {
    const index = read("../index.css");
    expect(index).toMatch(/prefers-reduced-motion: reduce[\s\S]*\*::after/);
    expect(index).toContain("animation: none !important");
    expect(index).toContain("transition: none !important");
  });
});
