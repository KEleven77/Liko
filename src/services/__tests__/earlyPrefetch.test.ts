import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { afterEach, describe, expect, it, vi } from "vitest";

const html = readFileSync(new URL("../../../index.html", import.meta.url), "utf8");
const script = html.match(/<script>([\s\S]*?)<\/script>/)![1];
const prefetchScript = script.slice(0, script.indexOf("\n        try {\n          const cachedTitle")) + "\n})();";

describe("HTML prefetch", () => {
  afterEach(() => { vi.useRealTimers(); });
  it("requests only consumed root API endpoints on detail pages", async () => {
    const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    const window = { location: { pathname: "/instance/node-a" }, __EARLY_DATA__: {} };
    runInNewContext(prefetchScript, { window, fetch, AbortController, setTimeout, clearTimeout });
    await Promise.all(Object.values(window.__EARLY_DATA__));
    expect(fetch.mock.calls.map(([path]) => path)).toEqual(["/api/public", "/api/me"]);
  });

  it("aborts stalled prefetch requests and clears timers", async () => {
    vi.useFakeTimers();
    const fetch = vi.fn((_path: string, options: RequestInit) => new Promise((_, reject) => {
      options.signal!.addEventListener("abort", () => reject(new Error("aborted")), { once: true });
    }));
    const window = { __EARLY_DATA__: {} };
    runInNewContext(prefetchScript, { window, fetch, AbortController, setTimeout, clearTimeout });
    await vi.advanceTimersByTimeAsync(8000);
    expect(await Promise.all(Object.values(window.__EARLY_DATA__))).toEqual([null, null]);
    expect(vi.getTimerCount()).toBe(0);
  });
});
