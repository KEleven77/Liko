import { renderToStaticMarkup } from "react-dom/server";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, expect, it, vi } from "vitest";
import { pingRecordQueryOptions, usePingRecords } from "../useRecords";
import { getPingRecords } from "@/services/api";
import type { PingRecordsResponse } from "@/types/komari";

vi.mock("@/services/api", () => ({ getPingRecords: vi.fn(), getLoadRecords: vi.fn(), getPingOverviewStats: vi.fn() }));
const data = { count: 1, records: [{ client: "node", task_id: 7, value: 20, time: "2026-10-07T00:00:00Z", count: 10, loss: 20 }],
  tasks: [{ id: 7, name: "Telecom", clients: ["node"], interval: 60, loss: 20, target: "", type: "icmp" }],
} as PingRecordsResponse;
beforeEach(() => { vi.clearAllMocks(); vi.mocked(getPingRecords).mockResolvedValue(data); });

it("deduplicates dialog prefetch and chart fetch, then reuses fresh cached data", async () => {
  const client = new QueryClient();
  const options = pingRecordQueryOptions("node", 1, true);
  try {
    await Promise.all([client.prefetchQuery(options), client.fetchQuery(options)]);
    await client.fetchQuery(options);
    expect(getPingRecords).toHaveBeenCalledTimes(1);
    expect(getPingRecords).toHaveBeenCalledWith("node", 1, expect.objectContaining({ includeStats: false }));
    expect(client.getQueryData(pingRecordQueryOptions("node", 6, true).queryKey)).toBeUndefined();
    expect(client.getQueryData(pingRecordQueryOptions("other", 1, true).queryKey)).toBeUndefined();
    expect(client.getQueryData(pingRecordQueryOptions("node", 1).queryKey)).toBeUndefined();
  } finally { client.clear(); }
});

function renderQuery(client: QueryClient) {
  let result: ReturnType<typeof usePingRecords> | undefined;
  function Probe() { result = usePingRecords("node", 1, true, true); return null; }
  renderToStaticMarkup(<QueryClientProvider client={client}><Probe /></QueryClientProvider>);
  return result!;
}

it("renders available records without waiting for optional statistics", () => {
  const client = new QueryClient();
  try {
    client.setQueryData(pingRecordQueryOptions("node", 1, true).queryKey, data);
    const result = renderQuery(client);
    expect(result.isLoading).toBe(false);
    expect(result.data).toBe(data);
  } finally { client.clear(); }
});

it("enriches cached records and reconciles loss from weighted sample counts", () => {
  const client = new QueryClient();
  try {
    client.setQueryData(pingRecordQueryOptions("node", 1, true).queryKey, data);
    client.setQueryData(["records", "ping-stats", "node", 1, [7]], [{ client: "node", taskId: 7, total: 99, valid: 99, loss: 0, p50: 20, p99: 35 }]);
    const result = renderQuery(client);
    expect(result.isLoading).toBe(false);
    expect(result.data?.records).toBe(data.records);
    expect(result.data?.stats?.[0]).toMatchObject({ total: 10, valid: 8, loss: 20, p99: 35 });
  } finally { client.clear(); }
});
