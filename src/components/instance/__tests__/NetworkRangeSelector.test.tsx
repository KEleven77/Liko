import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { NetworkRangeSelector } from "../NetworkRangeSelector";
import { buildLoadTimeRangeOptions, buildPingTimeRangeOptions } from "../chartShared";

it("shows every available network range directly and highlights exactly the selected range", () => {
  const ranges = buildPingTimeRangeOptions(168);
  for (const range of ranges.filter((range) => range.value <= 24)) {
    const html = renderToStaticMarkup(<NetworkRangeSelector ranges={ranges} value={range.value} onChange={() => {}} />);
    expect(html.match(/<button /g)).toHaveLength(6);
    expect(html.match(/aria-pressed="true"/g)).toHaveLength(1);
    expect(html).toContain(`aria-pressed="true">${range.label}</button>`);
    expect(html).not.toContain("更多");
    expect(html).not.toContain("<select");
  }
});

it("only renders backend-supported presets plus custom", () => {
  const html = renderToStaticMarkup(<NetworkRangeSelector ranges={buildPingTimeRangeOptions(12)} value={1} onChange={() => {}} />);
  expect(html.match(/<button /g)).toHaveLength(5);
  expect(html).toContain("自定义</button>");
  expect(html).not.toContain("1 天</button>");
});

it("shows resource ranges including realtime with a chart-specific accessible name", () => {
  for (const label of ["实时流量时间范围", "历史趋势时间范围"]) {
    const html = renderToStaticMarkup(<NetworkRangeSelector ranges={buildLoadTimeRangeOptions(720)} value={12} onChange={() => {}} label={label} />);
    expect(html).toContain(`aria-label="${label}"`);
    expect(html.match(/<button /g)).toHaveLength(7);
    expect(html).toContain("实时</button>");
    expect(html).toContain('aria-pressed="true">12 小时</button>');
    expect(html).toContain("自定义</button>");
    expect(html).not.toContain("30 天</button>");
    expect(html).not.toContain("7 天</button>");
  }
});

it("supports a custom duration bounded by backend retention", () => {
  const html = renderToStaticMarkup(<NetworkRangeSelector ranges={buildLoadTimeRangeOptions(720)} value={48} onChange={() => {}} />);
  expect(html).toContain('aria-pressed="true">自定义</button>');
  expect(html).toContain('max="720"');
  expect(html).toContain('value="48"');
});
