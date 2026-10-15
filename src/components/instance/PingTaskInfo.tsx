import { useId, useRef } from "react";
import { Info, X } from "lucide-react";

export interface PingTaskInfoStats {
  min: number | null;
  max: number | null;
  avg: number | null;
  latest: number | null;
  p50: number | null;
  p99: number | null;
  volatility: number | null;
  interval: number;
  type: string;
  stddev: number | null;
  total: number;
  valid: number;
}

export function PingTaskInfo({ label, stats }: { label: string; stats: PingTaskInfoStats }) {
  const id = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const nativePopover = typeof HTMLElement === "undefined" || "showPopover" in HTMLElement.prototype;
  const latency = (value: number | null) => value != null && Number.isFinite(value) ? `${Math.round(value)} ms` : "—";
  const decimal = (value: number | null, digits: number) => value != null && Number.isFinite(value) ? value.toFixed(digits) : "—";
  const fields = [
    ["最小", latency(stats.min)], ["最大", latency(stats.max)],
    ["平均", latency(stats.avg)], ["最新", latency(stats.latest)],
    ["P50", latency(stats.p50)], ["P99", latency(stats.p99)],
    ["波动率", decimal(stats.volatility, 2)], ["间隔", `${stats.interval}s`],
    ["类型", stats.type?.toUpperCase() || "—"], ["标准差", decimal(stats.stddev, 1)],
    ["总数", stats.total], ["有效", stats.valid],
  ] as const;
  const content = <>
    <header><strong>探测任务信息</strong><button type="button" popoverTarget={nativePopover ? id : undefined}
      popoverTargetAction={nativePopover ? "hide" : undefined} onClick={() => dialogRef.current?.close()}
      aria-label="关闭任务信息"><X size={16} aria-hidden /></button></header>
    <dl className="network-ping-task-info-grid tabular">
      {fields.map(([name, value]) => <div key={name}><dt>{name}</dt><dd>{value}</dd></div>)}
    </dl>
  </>;
  return <>
    <button type="button" className="network-ping-task-info" popoverTarget={nativePopover ? id : undefined}
      onClick={() => { if (!nativePopover) dialogRef.current?.showModal(); }}
      aria-label={`查看 ${label} 探测任务信息`} aria-haspopup="dialog" title="查看任务信息">
      <Info size={14} aria-hidden />
    </button>
    {nativePopover ? <div id={id} popover="auto" role="dialog" aria-label={`${label} 探测任务信息`}
      className="network-ping-task-info-popover">
      {content}
    </div> : <dialog id={id} ref={dialogRef} className="network-ping-task-info-popover"
      aria-label={`${label} 探测任务信息`} onCancel={(event) => event.stopPropagation()}
      onClick={(event) => {
        event.stopPropagation();
        if (event.target !== event.currentTarget) return;
        const rect = event.currentTarget.getBoundingClientRect();
        if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialogRef.current?.close();
      }}>{content}</dialog>}
  </>;
}
