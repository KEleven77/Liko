import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { PingChart } from "@/components/instance/PingChart";
import "uplot/dist/uPlot.min.css";

export function NodeNetworkDialog({ uuid, name, onClose }: { uuid: string; name: string; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [hours, setHours] = useState(1);
  const [custom, setCustom] = useState(false);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return createPortal(
    <dialog ref={ref} className="node-network-dialog" aria-label={`${name} 网络`} onCancel={onClose}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const rect = event.currentTarget.getBoundingClientRect();
        if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onClose();
      }}>
      <header className="node-network-dialog-header">
        <div><h2>{name} 延迟 / 丢包</h2><p>探测任务延迟、丢包率与波动统计</p></div>
        <button type="button" className="node-network-close" aria-label="关闭网络卡片" title="关闭" onClick={onClose}><X size={18} /></button>
      </header>
      <PingChart uuid={uuid} hours={hours} networkDialog rangeControls={
        <div className="node-network-range-controls">
          <div className="node-network-ranges" role="group" aria-label="网络历史时间范围">
            {[1, 6, 12, 24].map((value) => <button type="button" key={value} aria-pressed={!custom && hours === value} onClick={() => { setCustom(false); setHours(value); }}>{value === 24 ? "1天" : `${value}小时`}</button>)}
            <button type="button" aria-pressed={custom} onClick={() => setCustom(true)}>自定义</button>
          </div>
          {custom && <label className="node-network-custom-range">小时 <input type="number" min={1} max={168} value={hours} onChange={(event) => { const value = Number(event.target.value); if (Number.isFinite(value) && value >= 1 && value <= 168) setHours(value); }} /></label>}
        </div>
      } />
    </dialog>, document.body,
  );
}
