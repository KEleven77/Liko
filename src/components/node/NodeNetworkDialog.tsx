import { lazy, Suspense, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import { InstanceChartLoading } from "@/components/instance/InstancePanel";
import { pingRecordQueryOptions } from "@/hooks/useRecords";

const PingChart = lazy(() => import("@/components/instance/PingChart").then((module) => ({ default: module.PingChart })));

export function parseNetworkHours(text: string): number | null {
  if (!text.trim()) return null;
  const value = Number(text);
  return Number.isInteger(value) && value >= 1 && value <= 168 ? value : null;
}

export function NodeNetworkDialog({ uuid, name, onClose }: { uuid: string; name: string; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const queryClient = useQueryClient();
  const [hours, setHours] = useState(1);
  const [custom, setCustom] = useState(false);
  const [hoursText, setHoursText] = useState("1");
  const [rangeError, setRangeError] = useState(false);
  const rangeErrorId = useId();
  const commitHours = () => {
    const value = parseNetworkHours(hoursText);
    setRangeError(value == null);
    if (value != null) setHours(value);
  };
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  // Start data loading alongside the lazy chart module, using the same query cache.
  useEffect(() => {
    if (uuid) void queryClient.prefetchQuery(pingRecordQueryOptions(uuid, hours, true));
  }, [queryClient, uuid, hours]);
  const rangeControls = <div className="node-network-range-controls">
    <div className="node-network-ranges" role="group" aria-label="网络历史时间范围">
      {[1, 6, 12, 24].map((value) => <button type="button" key={value} aria-pressed={!custom && hours === value}
        onClick={() => { setCustom(false); setHours(value); setHoursText(String(value)); setRangeError(false); }}>
        {value === 24 ? "1天" : `${value}小时`}
      </button>)}
      <button type="button" aria-pressed={custom} onClick={() => setCustom(true)}>自定义</button>
    </div>
    {custom && <label className="node-network-custom-range">小时
      <input type="number" min={1} max={168} step={1} value={hoursText} aria-label="小时" aria-invalid={rangeError}
        aria-describedby={rangeError ? rangeErrorId : undefined}
        onChange={(event) => { setHoursText(event.target.value); setRangeError(false); }}
        onBlur={commitHours} onKeyDown={(event) => {
          if (event.key === "Enter") { event.preventDefault(); commitHours(); }
        }} />
      {rangeError && <span id={rangeErrorId} className="node-network-range-error" role="alert">请输入 1-168 的整数</span>}
    </label>}
  </div>;
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
