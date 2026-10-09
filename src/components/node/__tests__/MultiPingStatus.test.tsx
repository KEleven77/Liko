import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { HomepagePingDisplayLine } from "@/types/komari";
import { MultiPingStatus } from "../MultiPingStatus";

const settings = vi.hoisted(() => ({ homepagePingDisplayMode: "sparkline" }));
vi.mock("@/hooks/useThemeSettings", () => ({ useThemeSettings: () => settings }));
vi.mock("@/hooks/usePreferences", () => ({ usePreferences: () => ({ resolvedAppearance: "light" }) }));
vi.mock("@/hooks/useMetricColors", () => ({ useMetricColorsVersion: () => 0 }));
vi.mock("../CanvasStrip", async (importOriginal) => ({
  ...await importOriginal<typeof import("../CanvasStrip")>(),
  safeCanvasColor: (color: string) => color,
}));

const line = {
  taskId: 1, taskName: "中国电信", lastValue: 23, loss: 0,
  buckets: [{ index: 0, value: 23, loss: 0, total: 1, lost: 0, startAt: null, endAt: null }],
} as HomepagePingDisplayLine;

function render(lines = [line], layout?: "table") {
  return renderToStaticMarkup(<MultiPingStatus uuid="node" name="Node" lines={lines} density="compact" layout={layout} />);
}

describe("homepage ping display", () => {
  beforeEach(() => { settings.homepagePingDisplayMode = "sparkline"; });

  it("replaces only latency history in the original dual metric layout", () => {
    const html = render();
    expect(html).toContain('class="multi-ping-metric-head"');
    expect(html).toContain('class="multi-ping-history-separator"');
    expect(html.match(/class="health-bar-row"/g)).toHaveLength(1);
    expect(html.match(/role="slider"/g)).toHaveLength(1);
    expect(html).toContain('style="height:6px"');
    expect(html).not.toContain('class="multi-ping-sparkline-row"');
    settings.homepagePingDisplayMode = "bars";
    const bars = render();
    const head = (markup: string) => markup.slice(markup.indexOf('<div class="multi-ping-metric-head"'), markup.indexOf('<span class="multi-ping-buckets"'));
    expect(head(html)).toBe(head(bars));
  });

  it("keeps table columns and values unchanged when switching graphics", () => {
    const html = render([line], "table");
    const summary = html.indexOf('class="multi-ping-sparkline-summary"');
    const curve = html.indexOf('aria-label="中国电信 每时段延迟"');
    const loss = html.indexOf('class="multi-ping-sparkline-loss');
    expect(summary).toBeGreaterThan(-1);
    expect(curve).toBeGreaterThan(summary);
    expect(loss).toBeGreaterThan(curve);
    expect(html).toContain('中国电信 丢包 0.0%，查看网络详情');
    expect(html.match(/role="slider"/g)).toHaveLength(1);
    settings.homepagePingDisplayMode = "bars";
    const bars = render([line], "table");
    for (const markup of [html, bars]) {
      expect(markup).toContain('class="multi-ping-table-latency"');
      expect(markup).toContain('23.00<small>ms</small>');
      expect(markup).toContain('中国电信 丢包 0.0%，查看网络详情');
      expect(markup).toContain('multi-ping-status is-compact is-sparkline is-table');
    }
    expect(bars).not.toContain('role="slider"');
    expect(bars).toContain('class="multi-ping-table-history"');
  });

  it("keeps the original bars layout when selected", () => {
    settings.homepagePingDisplayMode = "bars";
    const html = render();
    expect(html).not.toContain('role="slider"');
    expect(html.match(/class="health-bar-row"/g)).toHaveLength(2);
    expect(html).toContain('role="button"');
  });

  it("renders every configured task instead of limiting sparkline to three", () => {
    const html = render([1, 2, 3, 4].map((taskId) => ({ ...line, taskId })));
    expect(html.match(/role="slider"/g)).toHaveLength(4);
  });

  it("keeps table cards limited to six tasks in both display modes", () => {
    const lines = Array.from({ length: 10 }, (_, index) => ({ ...line, taskId: index + 1 }));
    for (const mode of ["bars", "sparkline"]) {
      settings.homepagePingDisplayMode = mode;
      expect(render(lines, "table").match(/class="multi-ping-sparkline-row"/g)).toHaveLength(6);
    }
  });
});
