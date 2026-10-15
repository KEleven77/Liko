import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import { InstanceChartLoading } from "@/components/instance/InstancePanel";
import { pingRecordQueryOptions } from "@/hooks/useRecords";
import { buildPingTimeRangeOptions } from "@/components/instance/chartShared";
import { NetworkRangeSelector } from "@/components/instance/NetworkRangeSelector";
import { usePublicConfig } from "@/hooks/usePublicConfig";

const PingChart = lazy(() => import("@/components/instance/PingChart").then((module) => ({ default: module.PingChart })));

export function NodeNetworkDialog({ uuid, name, onClose }: { uuid: string; name: string; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const queryClient = useQueryClient();
  const { data: config } = usePublicConfig();
  const [hours, setHours] = useState(1);

  const pingRetentionHours = useMemo(() => {
    if (config?.metric_retention_days && config.metric_retention_days > 0) {
      return config.metric_retention_days * 24;
    }
    return config?.ping_record_preserve_time ?? null;
  }, [config]);

  const ranges = useMemo(
    () => buildPingTimeRangeOptions(pingRetentionHours),
    [pingRetentionHours],
  );

  // Clamp selected hours whenever retention info arrives and rules out the current selection.
  useEffect(() => {
    if (!ranges.length) return;
    const max = Math.max(...ranges.map((r) => r.value));
    if (hours > max) setHours(ranges[0]?.value ?? 1);
  }, [hours, ranges]);

  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);

  // Start data loading alongside the lazy chart module, using the same query cache.
  useEffect(() => {
    if (uuid) void queryClient.prefetchQuery(pingRecordQueryOptions(uuid, hours, true));
  }, [queryClient, uuid, hours]);

  const rangeControls = (
    <NetworkRangeSelector
      ranges={ranges}
      value={hours}
      onChange={setHours}
      label="网络历史时间范围"
    />
  );

  return createPortal(
    <dialog ref={ref} className="node-network-dialog" aria-label={`${name} 网络`} onCancel={onClose}
      onClick={(event) => {
        event.stopPropagation();
        if (event.target !== event.currentTarget) return;
        const rect = event.currentTarget.getBoundingClientRect();
        if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) {
          event.preventDefault();
          onClose();
        }
      }}>
      <header className="node-network-dialog-header">
        <div><h2>{name} 延迟 / 丢包</h2><p>探测任务延迟、丢包率与波动统计</p></div>
        <button type="button" className="node-network-close" aria-label="关闭网络卡片" title="关闭" onClick={onClose}><X size={18} /></button>
      </header>
      <Suspense fallback={<>{rangeControls}<InstanceChartLoading title="Ping 图表" /></>}>
        <PingChart uuid={uuid} hours={hours} networkDialog rangeControls={rangeControls} />
      </Suspense>
    </dialog>, document.body,
  );
}
