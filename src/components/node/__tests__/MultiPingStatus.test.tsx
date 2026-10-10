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

function render(lines = [line]) {
  return renderToStaticMarkup(<MultiPingStatus uuid="node" name="Node" lines={lines} />);
}

describe("homepage ping display", () => {
  beforeEach(() => { settings.homepagePingDisplayMode = "sparkline"; });

  it("keeps table columns and values unchanged when switching graphics", () => {
    const html = render();
    const summary = html.indexOf('class="multi-ping-sparkline-summary"');
    const curve = html.indexOf('aria-label="中国电信 每时段延迟"');
    const loss = html.indexOf('class="multi-ping-sparkline-loss');
    expect(summary).toBeGreaterThan(-1);
    expect(curve).toBeGreaterThan(summary);
    expect(loss).toBeGreaterThan(curve);
    expect(html).toContain('中国电信 丢包 0.0%，查看网络详情');
    expect(html.match(/role="slider"/g)).toHaveLength(1);
    settings.homepagePingDisplayMode = "bars";
    const bars = render();
    for (const markup of [html, bars]) {
      expect(markup).toContain('class="multi-ping-table-latency"');
      expect(markup).toContain('23.00<small>ms</small>');
      expect(markup).toContain('中国电信 丢包 0.0%，查看网络详情');
      expect(markup).toContain('multi-ping-status is-compact is-sparkline is-table');
    }
    expect(bars).not.toContain('role="slider"');
    expect(bars).toContain('class="multi-ping-table-history"');
  });

  it("renders only one history chart per task in bars mode", () => {
    settings.homepagePingDisplayMode = "bars";
    const html = render();
    expect(html).not.toContain('role="slider"');
    expect(html.match(/class="health-bar-row"/g)).toHaveLength(1);
    expect(html).not.toContain('class="multi-ping-metric-head"');
    expect(html).toContain('aria-haspopup="dialog"');
  });

  it("renders every configured task instead of limiting sparkline to three", () => {
    const html = render([1, 2, 3, 4].map((taskId) => ({ ...line, taskId })));
    expect(html.match(/role="slider"/g)).toHaveLength(4);
  });

  it("keeps table cards limited to six tasks in both display modes", () => {
    const lines = Array.from({ length: 10 }, (_, index) => ({ ...line, taskId: index + 1 }));
    for (const mode of ["bars", "sparkline"]) {
      settings.homepagePingDisplayMode = mode;
      expect(render(lines).match(/class="multi-ping-sparkline-row"/g)).toHaveLength(6);
    }
  });

  it("leaves unconfigured task areas empty", () => {
    const html = render([]);
    expect(html).not.toContain('class="multi-ping-sparkline-row"');
    expect(html).not.toContain('role="slider"');
    expect(html).not.toContain('class="health-bar-row"');
  });

  it("keeps load errors distinct from valid zero latency and loss", () => {
    expect(render([{ ...line, lastValue: 0 }])).toContain('0.00<small>ms</small>');
    for (const [loadState, label] of [["pending", "加载中"], ["error", "加载失败"]] as const) {
      expect(render([{ ...line, loadState, lastValue: null, loss: null }])).toContain(label);
    }
    const stale = render([{ ...line, loadState: "error" }]);
    expect(stale).toContain('23.00<small>ms</small>');
    expect(stale).toContain('刷新失败，显示上次数据');
  });
});
