import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, expect, it, vi } from "vitest";
import { PingChart } from "../PingChart";
import type { PingRecord } from "@/types/komari";

const state = vi.hoisted(() => ({ isError: false, isLoading: false, isFetching: false }));
const fixture = vi.hoisted(() => ({ records: [] as PingRecord[], tasks: [] as { id: number; name: string }[] }));
vi.mock("@/hooks/useRecords", () => ({ usePingRecords: () => ({
  data: fixture, ...state, refetch: vi.fn(),
}) }));
vi.mock("@/hooks/usePreferences", () => ({ usePreferences: () => ({ resolvedAppearance: "light" }) }));
vi.mock("../chartShared", async (original) => ({
  ...await original<typeof import("../chartShared")>(),
  useResponsiveChartSize: () => ({ w: 800, h: 240, ref: { current: null } }),
}));

beforeEach(() => { state.isError = state.isLoading = state.isFetching = false; fixture.records = []; fixture.tasks = []; });

it("renders the floating overview and labelled metrics without changing the detail layout", () => {
  fixture.tasks = [{ id: 1, name: "电信" }];
  fixture.records = [{ task_id: 1, client: "node", time: new Date().toISOString(), value: 42, count: 10, loss: 0 }];
  const html = renderToStaticMarkup(<PingChart uuid="node" hours={1} networkDialog rangeControls={<button>6小时</button>} />);
  expect(html).toContain('aria-label="探测任务概览"');
  expect(html).toContain('class="network-ping-task-card"');
  expect(html).toContain('class="network-ping-trend-card"');
  expect(html).toContain("平均延迟");
  expect(html).toContain("可用率");
  expect(html).toContain("当前延迟</small>");
  expect(html).toContain("抖动</small>");
  expect(html).toContain("网络趋势");
  expect(html).toContain("查看 电信 探测任务信息");
  expect(html).toContain("6小时");
  const detail = renderToStaticMarkup(<PingChart uuid="node" hours={1} detailPage />);
  expect(detail).not.toContain("network-ping-overview");
  expect(detail).toContain("探测明细");
});

it.each(["empty", "error", "loading"])("keeps network range selection available: %s", (mode) => {
  state.isError = mode === "error";
  state.isLoading = mode === "loading";
  const html = renderToStaticMarkup(<PingChart uuid="node" hours={1} networkDialog
    rangeControls={<button>6小时</button>} />);
  expect(html).toContain("6小时");
  expect(html).toContain("network-ping-panel");
  expect(html).toContain("network-ping-trend-card");
  if (mode === "empty") expect(html).toContain("刷新</button>");
  if (mode === "error") expect(html).toContain("重试</button>");
  if (mode === "loading") expect(html).toContain('aria-busy="true"');
});

it("disables empty-state refresh while a request is in flight", () => {
  state.isFetching = true;
  const html = renderToStaticMarkup(<PingChart uuid="node" hours={1} networkDialog />);
  expect(html).toContain('disabled=""');
  expect(html).toContain("刷新中</button>");
});

it.each(["empty", "error", "loading"])("keeps detail-page sections and range controls available: %s", (mode) => {
  state.isError = mode === "error";
  state.isLoading = mode === "loading";
  const html = renderToStaticMarkup(<PingChart uuid="node" hours={1} detailPage rangeControls={<button>6小时</button>} />);
  expect(html).toContain("探测任务");
  expect(html).toContain("网络趋势");
  expect(html).toContain("6小时");
  expect(html).toContain("选择任务");
  expect(html).not.toContain("探测明细");
});
