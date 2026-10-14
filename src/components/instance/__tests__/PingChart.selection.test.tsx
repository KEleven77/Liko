import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, expect, it, vi } from "vitest";
import { PingChart } from "../PingChart";

// Exercise the component's selection effects across renders without a chart DOM.
const harness = vi.hoisted(() => ({
  hidden: new Set<number>(),
  loading: false,
  error: false,
  taskIds: [1, 2, 3],
  effects: [] as { run: () => void; deps?: readonly unknown[] }[],
  previousDeps: [] as (readonly unknown[] | undefined)[],
}));
vi.mock("react", async (original) => {
  const react = await original<typeof import("react")>();
  return { ...react,
    useState: (initial: unknown) => initial instanceof Set
      ? [harness.hidden, (next: Set<number> | ((previous: Set<number>) => Set<number>)) => {
        harness.hidden = typeof next === "function" ? next(harness.hidden) : next;
      }]
      : react.useState(initial),
    useEffect: (run: () => void, deps?: readonly unknown[]) => harness.effects.push({ run, deps }),
  };
});
vi.mock("uplot-react", () => ({ default: () => null }));
vi.mock("@/hooks/useRecords", () => ({ usePingRecords: () => ({
  data: harness.loading || harness.error ? undefined : {
    tasks: harness.taskIds.map((id) => ({ id, name: `线路 ${id}` })),
    records: harness.taskIds.map((id) => ({ task_id: id, client: "node", time: "2026-10-15T00:00:00Z", value: 42, count: 10, loss: 0 })),
  },
  isLoading: harness.loading, isError: harness.error, isFetching: harness.loading, refetch: vi.fn(),
}) }));
vi.mock("@/hooks/usePreferences", () => ({ usePreferences: () => ({ resolvedAppearance: "light" }) }));
vi.mock("../chartShared", async (original) => ({
  ...await original<typeof import("../chartShared")>(),
  useResponsiveChartSize: () => ({ w: 800, h: 240, ref: { current: null } }),
}));

function render(hours: number, uuid = "node") {
  harness.effects = [];
  const html = renderToStaticMarkup(<PingChart uuid={uuid} hours={hours} networkDialog />);
  harness.effects.forEach(({ run, deps }, index) => {
    const previous = harness.previousDeps[index];
    if (!deps || !previous || deps.length !== previous.length || deps.some((value, i) => !Object.is(value, previous[i]))) run();
  });
  harness.previousDeps = harness.effects.map(({ deps }) => deps);
  return html;
}

beforeEach(() => {
  harness.hidden = new Set(); harness.loading = harness.error = false;
  harness.taskIds = [1, 2, 3]; harness.effects = []; harness.previousDeps = [];
  render(1);
});

it("keeps the same selected tasks through uncached ranges, loading, errors and empty responses", () => {
  harness.hidden = new Set([2]);
  expect(render(1)).toContain("已选 2 / 3");
  harness.loading = true; render(6);
  expect([...harness.hidden]).toEqual([2]);
  harness.loading = false; harness.error = true; render(6);
  harness.error = false; harness.taskIds = []; render(6);
  harness.taskIds = [1, 2, 3];
  expect(render(6)).toContain("已选 2 / 3");
  expect(render(24)).toContain("已选 2 / 3");
  expect(render(1)).toContain("已选 2 / 3");
  expect([...harness.hidden]).toEqual([2]);
});

it("preserves all-deselected choices when changing the time range", () => {
  harness.hidden = new Set([1, 2, 3]);
  harness.loading = true; render(12);
  harness.loading = false;
  expect(render(12)).toContain("已选 0 / 3");
});

it("resets selection only when switching servers", () => {
  harness.hidden = new Set([2]);
  render(6, "other-node");
  expect(render(6, "other-node")).toContain("已选 3 / 3");
});
