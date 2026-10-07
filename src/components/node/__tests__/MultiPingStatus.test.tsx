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
  return renderToStaticMarkup(<MultiPingStatus uuid="node" name="Node" lines={lines} density="compact" />);
}

describe("homepage ping display", () => {
  beforeEach(() => { settings.homepagePingDisplayMode = "sparkline"; });

  it("puts latency on the left, its sparkline in the center, and loss on the right", () => {
    const html = render();
    const summary = html.indexOf('class="multi-ping-sparkline-summary"');
    const curve = html.indexOf('aria-label="中国电信 每时段延迟"');
    const loss = html.indexOf('class="multi-ping-sparkline-loss');
    expect(summary).toBeGreaterThan(-1);
    expect(curve).toBeGreaterThan(summary);
    expect(loss).toBeGreaterThan(curve);
    expect(html).toContain('中国电信 丢包 0.0%，查看网络详情');
    expect(html.match(/role="slider"/g)).toHaveLength(1);
    expect(html).not.toContain('role="button"');
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
});
