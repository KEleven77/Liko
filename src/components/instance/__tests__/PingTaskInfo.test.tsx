import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { PingTaskInfo } from "../PingTaskInfo";

const stats = { min: 33, max: 191, avg: 56, latest: 68, p50: 55, p99: 185,
  volatility: 2.6, interval: 60, type: "tcp", stddev: 21, total: 59, valid: 55 };

it("exposes separate accessible buttons for task information and dismissal", () => {
  const html = renderToStaticMarkup(<PingTaskInfo label="中国电信" stats={stats} />);
  expect(html).toContain('aria-label="查看 中国电信 探测任务信息"');
  expect(html.toLowerCase()).toContain('popovertarget=');
  expect(html).toContain('popover="auto"');
  expect(html).toContain('role="dialog"');
  expect(html.toLowerCase()).toContain('popovertargetaction="hide"');
  expect(html).toContain('<dt>间隔</dt><dd>60s</dd>');
});

it("renders six paired rows in reference order with aligned labels and values", () => {
  const html = renderToStaticMarkup(<PingTaskInfo label="中国电信" stats={stats} />);
  const labels = [...html.matchAll(/<dt>(.*?)<\/dt>/g)].map((match) => match[1]);
  expect(labels).toEqual(["最小", "最大", "平均", "最新", "P50", "P99", "波动率", "间隔", "类型", "标准差", "总数", "有效"]);
  for (const value of ["33 ms", "191 ms", "2.60", "TCP", "21.0", "59", "55"]) {
    expect(html).toContain(`<dd>${value}</dd>`);
  }
});

it("shows a placeholder for missing latency and deviation rather than zero", () => {
  const html = renderToStaticMarkup(<PingTaskInfo label="空任务" stats={{ ...stats, min: null, stddev: null }} />);
  expect(html).toContain('<dt>最小</dt><dd>—</dd>');
  expect(html).toContain('<dt>标准差</dt><dd>—</dd>');
});
