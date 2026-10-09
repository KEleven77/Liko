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
  let page: EventTarget & { visibilityState: string };
  let events: EventTarget;
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers();
    mocks.nodes.mockReset();
    mocks.status.mockReset();
    page = Object.assign(new EventTarget(), { visibilityState: "visible" });
    events = new EventTarget();
    vi.stubGlobal("document", page);
    vi.stubGlobal("window", {
      setTimeout, clearTimeout, setInterval, clearInterval,
      addEventListener: events.addEventListener.bind(events),
      removeEventListener: events.removeEventListener.bind(events),
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

  it("refreshes immediately on wake, keeps metrics and deduplicates wake events", async () => {
    mocks.nodes.mockResolvedValue([NodeInfoSchema.parse({ uuid: "node-a" })]);
    mocks.status.mockResolvedValue({ "node-a": { online: true, cpu: 25 } });
    const store = await import("@/services/wsStore");
    release = store.retainStore();
    await vi.advanceTimersByTimeAsync(0);
    page.visibilityState = "hidden";
    page.dispatchEvent(new Event("visibilitychange"));
    await vi.advanceTimersByTimeAsync(60_000);
    expect(mocks.status).toHaveBeenCalledTimes(1);
    expect(mocks.nodes).toHaveBeenCalledTimes(1);
    page.visibilityState = "visible";
    page.dispatchEvent(new Event("visibilitychange"));
    events.dispatchEvent(new Event("focus"));
    events.dispatchEvent(new Event("pageshow"));
    expect(mocks.nodes).toHaveBeenCalledTimes(2);
    expect(mocks.status).toHaveBeenCalledTimes(2);
    expect(store.getNodeMetricsSnapshot("node-a")?.cpuPct).toBe(25);
    await vi.advanceTimersByTimeAsync(0);
    release();
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(3000);
    events.dispatchEvent(new Event("focus"));
    expect(mocks.status).toHaveBeenCalledTimes(2);
  });

  it("replaces suspended requests without letting their completion unlock a new poll", async () => {
    const oldNodes = deferred<ReturnType<typeof NodeInfoSchema.parse>[]>();
    const oldStatus = deferred<Record<string, unknown>>();
    const newStatus = deferred<Record<string, unknown>>();
    mocks.nodes.mockReturnValueOnce(oldNodes.promise)
      .mockResolvedValue([NodeInfoSchema.parse({ uuid: "node-a" })]);
    mocks.status.mockReturnValueOnce(oldStatus.promise).mockReturnValue(newStatus.promise);
    const store = await import("@/services/wsStore");
    release = store.retainStore();
    const oldNodeSignal = mocks.nodes.mock.calls[0][0].signal as AbortSignal;
    const oldStatusSignal = mocks.status.mock.calls[0][1].signal as AbortSignal;
    page.visibilityState = "hidden";
    page.dispatchEvent(new Event("visibilitychange"));
    await vi.advanceTimersByTimeAsync(10_000);
    page.visibilityState = "visible";
    page.dispatchEvent(new Event("visibilitychange"));
    expect(oldNodeSignal.aborted).toBe(true);
    expect(oldStatusSignal.aborted).toBe(true);
    expect(mocks.status).toHaveBeenCalledTimes(2);
    oldNodes.resolve([NodeInfoSchema.parse({ uuid: "stale-node" })]);
    oldStatus.resolve({ "node-a": { online: true, cpu: 99 } });
    await vi.advanceTimersByTimeAsync(2000);
    expect(mocks.status).toHaveBeenCalledTimes(2);
    expect(store.getNodeMetricsSnapshot("stale-node")).toBeUndefined();
    newStatus.resolve({ "node-a": { online: true, cpu: 42 } });
    await vi.advanceTimersByTimeAsync(0);
    expect(store.getNodeMetricsSnapshot("node-a")?.cpuPct).toBe(42);
  });

  it("updates resumed metrics without waiting for slow metadata", async () => {
    const metadata = deferred<ReturnType<typeof NodeInfoSchema.parse>[]>();
    mocks.nodes.mockResolvedValueOnce([NodeInfoSchema.parse({ uuid: "node-a" })])
      .mockReturnValue(metadata.promise);
    mocks.status.mockResolvedValueOnce({ "node-a": { online: true, cpu: 25 } })
      .mockResolvedValue({ "node-a": { online: true, cpu: 42 } });
    const store = await import("@/services/wsStore");
    release = store.retainStore();
    await vi.advanceTimersByTimeAsync(0);
    page.visibilityState = "hidden";
    page.dispatchEvent(new Event("visibilitychange"));
    await vi.advanceTimersByTimeAsync(10_000);
    page.visibilityState = "visible";
    page.dispatchEvent(new Event("visibilitychange"));
    await vi.advanceTimersByTimeAsync(0);
    expect(store.getNodeMetricsSnapshot("node-a")?.cpuPct).toBe(42);
    expect(store.getStoreStatusSnapshot().hydrated).toBe(true);
    metadata.resolve([NodeInfoSchema.parse({ uuid: "node-a" })]);
    await vi.advanceTimersByTimeAsync(0);
  });
});
