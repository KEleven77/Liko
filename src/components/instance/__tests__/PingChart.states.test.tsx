import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, expect, it, vi } from "vitest";
import { PingChart } from "../PingChart";

const state = vi.hoisted(() => ({ isError: false, isLoading: false, isFetching: false }));
vi.mock("@/hooks/useRecords", () => ({ usePingRecords: () => ({
  data: { records: [], tasks: [] }, ...state, refetch: vi.fn(),
}) }));
vi.mock("@/hooks/usePreferences", () => ({ usePreferences: () => ({ resolvedAppearance: "light" }) }));
vi.mock("../chartShared", async (original) => ({
  ...await original<typeof import("../chartShared")>(),
  useResponsiveChartSize: () => ({ w: 800, h: 240, ref: { current: null } }),
}));

beforeEach(() => { state.isError = state.isLoading = state.isFetching = false; });

it.each(["empty", "error", "loading"])("keeps network range selection available: %s", (mode) => {
  state.isError = mode === "error";
  state.isLoading = mode === "loading";
  const html = renderToStaticMarkup(<PingChart uuid="node" hours={1} networkDialog
    rangeControls={<button>6小时</button>} />);
  expect(html).toContain("6小时");
  expect(html).toContain("network-ping-panel");
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
