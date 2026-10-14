import { useId } from "react";
import { Info, X } from "lucide-react";

export function PingTaskInfo({ label, text }: { label: string; text: string }) {
  const id = useId();
  return <>
    <button type="button" className="network-ping-task-info" popoverTarget={id}
      aria-label={`查看 ${label} 探测任务信息`} aria-haspopup="dialog" title="查看任务信息">
      <Info size={14} aria-hidden />
    </button>
    <div id={id} popover="auto" role="dialog" aria-label={`${label} 探测任务信息`}
      className="network-ping-task-info-popover">
      <header><strong>探测任务信息</strong><button type="button" popoverTarget={id}
        popoverTargetAction="hide" aria-label="关闭任务信息"><X size={16} aria-hidden /></button></header>
      <p>{text}</p>
    </div>
  </>;
}
