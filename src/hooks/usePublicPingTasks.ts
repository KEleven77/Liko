import { useQuery } from "@tanstack/react-query";
import { loadPublicPingTasks } from "@/services/api";

export function usePublicPingTasks(enabled: boolean) {
  return useQuery({
    queryKey: ["public-ping-tasks"],
    queryFn: loadPublicPingTasks,
    enabled,
    staleTime: 60_000,
    refetchInterval: 60_000,
  });
}
