import { useMemo } from "react";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { getLoadRecords, getPingRecords, getPingOverviewStats } from "@/services/api";
import { reconcilePingMetricStats } from "@/utils/pingMetrics";

const RECORD_QUERY_OPTIONS = {
  staleTime: 300_000,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
} as const;

export function useLoadRecords(uuid: string, hours = 6, enabled = true) {
  return useQuery({
    queryKey: ["records", "load", uuid, hours],
    queryFn: ({ signal }) => getLoadRecords(uuid, hours, { signal }),
    ...RECORD_QUERY_OPTIONS,
    enabled: Boolean(uuid) && enabled,
  });
}

export function pingRecordQueryOptions(uuid: string, hours: number, progressive = false) {
  return queryOptions({
    queryKey: progressive ? ["records", "ping", uuid, hours, "progressive"] : ["records", "ping", uuid, hours],
    queryFn: ({ signal }) => getPingRecords(uuid, hours, { signal, includeStats: !progressive }),
    ...RECORD_QUERY_OPTIONS,
  });
}

export function usePingRecords(uuid: string, hours = 6, enabled = true, progressive = false) {
  const records = useQuery({
    ...pingRecordQueryOptions(uuid, hours, progressive),
    enabled: Boolean(uuid) && enabled,
  });
  const taskIds = useMemo(() => [...new Set(records.data?.tasks.map((task) => task.id) ?? [])].sort((a, b) => a - b), [records.data]);
  const stats = useQuery({
    queryKey: ["records", "ping-stats", uuid, hours, taskIds],
    queryFn: ({ signal }) => getPingOverviewStats(hours, taskIds, { entityIds: [uuid], signal, timeout: 8_000 }),
    ...RECORD_QUERY_OPTIONS,
    retry: false,
    enabled: progressive && Boolean(uuid) && enabled && taskIds.length > 0 && Boolean(records.data),
  });
  const data = useMemo(() => {
    if (!records.data || !progressive || !stats.data?.length) return records.data;
    return { ...records.data, stats: reconcilePingMetricStats(stats.data, records.data.records) };
  }, [records.data, progressive, stats.data]);

  return { ...records, data, refetch: async () => {
    // Optional statistics never block the primary chart's refresh state.
    if (progressive && taskIds.length > 0) void stats.refetch();
    return records.refetch();
  } };
}
