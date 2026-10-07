import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NodeInfoSchema } from "@/types/komari";

const mocks = vi.hoisted(() => ({ nodes: vi.fn(), status: vi.fn() }));
vi.mock("@/services/api", () => ({
  getNodes: mocks.nodes,
  getNodesLatestStatus: mocks.status,
}));

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}

describe("parallel node bootstrap", () => {
  let release: (() => void) | undefined;
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers();
    mocks.nodes.mockReset();
    mocks.status.mockReset();
    vi.stubGlobal("window", {
      setTimeout, clearTimeout, setInterval, clearInterval,
      addEventListener: vi.fn(), removeEventListener: vi.fn(),
    });
  });
  afterEach(async () => {
    release?.();
    release = undefined;
    await vi.advanceTimersByTimeAsync(0);
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("starts statuses before metadata completes and retains early results", async () => {
    const nodes = deferred<ReturnType<typeof NodeInfoSchema.parse>[]>();
    mocks.nodes.mockReturnValue(nodes.promise);
    mocks.status.mockResolvedValue({
      "node-a": { online: true, cpu: 37 },
      "unknown-node": { online: true, cpu: 99 },
    });
    const store = await import("@/services/wsStore");
    release = store.retainStore();
    expect(mocks.status).toHaveBeenCalledTimes(1);
    expect(mocks.status.mock.calls[0][0]).toBeUndefined();
    await vi.advanceTimersByTimeAsync(0);
    expect(store.getNodeMetricsSnapshot("node-a")).toBeUndefined();
    nodes.resolve([NodeInfoSchema.parse({ uuid: "node-a" })]);
    await vi.advanceTimersByTimeAsync(0);
    expect(store.getNodeMetricsSnapshot("node-a")).toMatchObject({ cpuPct: 37, online: true });
    expect(store.getNodeMetricsSnapshot("unknown-node")).toBeUndefined();
    await vi.advanceTimersByTimeAsync(2000);
    expect(mocks.status.mock.calls[1][0]).toEqual(["node-a"]);
  });

  it("finishes bootstrap within the slower request rather than adding both delays", async () => {
    mocks.nodes.mockImplementation(() => new Promise((resolve) => {
      setTimeout(() => resolve([NodeInfoSchema.parse({ uuid: "node-a" })]), 150);
    }));
    mocks.status.mockImplementation(() => new Promise((resolve) => {
      setTimeout(() => resolve({ "node-a": { online: true, cpu: 25 } }), 250);
    }));
    const store = await import("@/services/wsStore");
    release = store.retainStore();
    await vi.advanceTimersByTimeAsync(249);
    expect(store.getNodeMetricsSnapshot("node-a")?.cpuPct).toBe(0);
    await vi.advanceTimersByTimeAsync(1);
    expect(store.getNodeMetricsSnapshot("node-a")?.cpuPct).toBe(25);
    expect(mocks.status).toHaveBeenCalledTimes(1);
  });

  it("does not expose early statuses when metadata fails", async () => {
    mocks.nodes.mockRejectedValue(new Error("metadata unavailable"));
    mocks.status.mockResolvedValue({ "node-a": { online: true, cpu: 99 } });
    const store = await import("@/services/wsStore");
    release = store.retainStore();
    await vi.advanceTimersByTimeAsync(0);
    expect(store.getNodeMetricsSnapshot("node-a")).toBeUndefined();
    expect(store.getStoreStatusSnapshot()).toMatchObject({ hydrated: false, nodeInfoError: true });
    expect(mocks.status.mock.calls[0][1].signal.aborted).toBe(true);
  });

  it("aborts both bootstrap requests when the last consumer leaves", async () => {
    mocks.nodes.mockReturnValue(new Promise(() => {}));
    mocks.status.mockReturnValue(new Promise(() => {}));
    const store = await import("@/services/wsStore");
    release = store.retainStore();
    const nodeSignal = mocks.nodes.mock.calls[0][0].signal as AbortSignal;
    const statusSignal = mocks.status.mock.calls[0][1].signal as AbortSignal;
    release();
    await vi.advanceTimersByTimeAsync(0);
    expect(nodeSignal.aborted).toBe(true);
    expect(statusSignal.aborted).toBe(true);
  });
});
