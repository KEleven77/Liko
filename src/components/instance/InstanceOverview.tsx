import { ArrowDown, ArrowUp } from "lucide-react";
import { lazy, Suspense, useEffect, useMemo, useState, type ReactNode } from "react";
import { useNodeMeta, useNodeMetrics } from "@/hooks/useNode";
import { useMinuteClock } from "@/hooks/useClock";
import { formatBytes, formatUptimeDays } from "@/utils/format";
import { formatTrafficResetLabel, resolveTrafficUsage } from "@/utils/traffic";
import { InstancePanel } from "./InstancePanel";
import { useLoadRecords } from "@/hooks/useRecords";
import { downsampleAligned } from "./chartData";
import { toChartSeconds } from "./chartShared";

const TrafficRateChart = lazy(() => import("@/components/traffic/TrafficRateChart").then((module) => ({ default: module.TrafficRateChart })));

export function InstanceOverview({ uuid, hours, active, rangeControls }: { uuid: string; hours: number; active: boolean; rangeControls: ReactNode }) {
  const meta = useNodeMeta(uuid);
  const metrics = useNodeMetrics(uuid, active);
  const now = useMinuteClock();
  const history = useLoadRecords(uuid, hours === 0 ? 1 : hours, active);
  const [live, setLive] = useState<{ uuid: string; points: { timeMs: number; up: number; down: number }[] }>({ uuid, points: [] });
  useEffect(() => {
    if (!active || hours > 1 || !metrics?.online || !metrics.updatedAt) return;
    const point = { timeMs: metrics.updatedAt, up: metrics.netUp, down: metrics.netDown };
    setLive((previous) => {
      const points = previous.uuid === uuid ? previous.points : [];
      if (points.at(-1)?.timeMs === point.timeMs) return previous;
      return { uuid, points: [...points, point].slice(-360) };
    });
  }, [active, hours, uuid, metrics?.online, metrics?.updatedAt, metrics?.netUp, metrics?.netDown]);
  const samples = useMemo(() => {
    const cutoff = Date.now() - (hours === 0 ? 1 : hours) * 3600_000;
    const records = (history.data?.records ?? []).map((record) => ({ timeMs: toChartSeconds(record.time) * 1000, up: record.net_out ?? 0, down: record.net_in ?? 0 })).filter((point) => Number.isFinite(point.timeMs) && point.timeMs >= cutoff).sort((a, b) => a.timeMs - b.timeMs);
    if (hours <= 1 && live.uuid === uuid) {
      const lastHistoryTime = records.at(-1)?.timeMs ?? 0;
      records.push(...live.points.filter((point) => point.timeMs >= cutoff && point.timeMs > lastHistoryTime));
    }
    const reduced = downsampleAligned(records.map((point) => point.timeMs), [records.map((point) => point.up), records.map((point) => point.down)], 360, true);
    return reduced.times.map((timeMs, index) => ({ timeMs, up: reduced.perTask[0][index] ?? 0, down: reduced.perTask[1][index] ?? 0 }));
  }, [history.data, hours, live, uuid]);
  if (!meta || !metrics) return null;
  const traffic = resolveTrafficUsage(meta.traffic_limit_type, metrics.trafficUp, metrics.trafficDown, meta.traffic_limit);
  const uptime = formatUptimeDays(metrics.uptime);
  const resources = [
    { name: "CPU", value: metrics.cpuPct, detail: `${meta.cpu_cores} 核 · ${meta.cpu_name || "—"}`, color: "var(--progress-cpu)" },
    { name: "内存", value: metrics.ramPct, detail: `${formatBytes(metrics.ramUsed)} / ${formatBytes(metrics.ramTotal)}`, color: "var(--progress-memory)" },
    { name: "Swap", value: metrics.swapTotal > 0 ? metrics.swapUsed / metrics.swapTotal * 100 : 0, detail: metrics.swapTotal > 0 ? `${formatBytes(metrics.swapUsed)} / ${formatBytes(metrics.swapTotal)}` : "未启用", color: "var(--status-warning)" },
    { name: "磁盘", value: metrics.diskPct, detail: `${formatBytes(metrics.diskUsed)} / ${formatBytes(metrics.diskTotal)}`, color: "var(--progress-disk)" },
  ];
  return (
    <div className="instance-detail-overview">
      <InstancePanel title={metrics.online ? "实时流量" : "最近上报流量"} className="instance-detail-live" aside={rangeControls} description={metrics.online ? "网络上传与下载速率" : "节点离线，显示最近一次上报数据。"}>
        <div className="instance-detail-rates">
          {[{ name: "上传", Icon: ArrowUp, rate: metrics.netUp, total: metrics.trafficUp, color: "var(--progress-cpu)" },
            { name: "下载", Icon: ArrowDown, rate: metrics.netDown, total: metrics.trafficDown, color: "var(--status-success)" }].map(({ name, Icon, rate, total, color }) => (
            <div key={name}>
              <span style={{ color }}><Icon size={14} />{name}</span>
              <strong>{formatBytes(rate)}<small>/s</small></strong>
              <small>累计 {formatBytes(total)}</small>
            </div>
          ))}
        </div>
        {samples.length ? <Suspense fallback={<div className="instance-empty">加载流量曲线…</div>}><TrafficRateChart samples={samples} hours={hours === 0 ? 1 : hours} /></Suspense>
          : <div className="instance-empty" aria-busy={history.isPending}>{history.isPending ? "加载流量曲线…" : history.isError ? "流量历史加载失败" : "暂无流量历史"}</div>}
      </InstancePanel>
      <InstancePanel title="流量用量" description="当前计费周期" className="instance-detail-usage">
        <div className="instance-detail-quota">
          <div className="instance-detail-section-title"><span>流量用量</span><span>{traffic.unlimited ? "不限量" : `${(traffic.fraction * 100).toFixed(1)}%`}</span></div>
          <strong>{formatBytes(traffic.used)} <small>/ {traffic.unlimited ? "∞" : formatBytes(traffic.limit)}</small></strong>
          <div className="instance-progress-track" aria-hidden><span className="instance-progress-fill" style={{ width: `${traffic.unlimited ? 0 : traffic.fraction * 100}%` }} /></div>
          <div className="instance-detail-quota-note"><span>{traffic.unlimited ? "不限量" : `剩余 ${formatBytes(Math.max(0, traffic.limit - traffic.used))}`}</span><span>{formatTrafficResetLabel(meta.traffic_reset_at, now)}</span></div>
        </div>
      </InstancePanel>
      <div className="instance-detail-side">
      <InstancePanel title="资源用量" description="当前设备资源占用">
        {resources.map(({ name, value, detail, color }) => (
          <div className="instance-detail-resource" key={name}>
            <div className="instance-detail-section-title"><span>{name}</span><strong>{value.toFixed(1)}%</strong></div>
            <div className="instance-progress-track" aria-hidden><span className="instance-progress-fill" style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: color }} /></div>
            <small>{detail}</small>
          </div>
        ))}
        <div className="instance-detail-resource"><div className="instance-detail-section-title"><span>负载</span><strong>{metrics.load1.toFixed(2)}</strong></div></div>
      </InstancePanel>
      <InstancePanel title="系统信息" description="设备配置与运行状态">
        <div className="instance-detail-system-grid">
          {[
            ["运行时长", `${uptime.value}${uptime.unit}`], ["进程", String(metrics.process)],
            ["TCP", String(metrics.connectionsTcp)], ["UDP", String(metrics.connectionsUdp)],
            ["负载", `${metrics.load1.toFixed(2)} / ${metrics.load5.toFixed(2)} / ${metrics.load15.toFixed(2)}`],
            ["最近更新", metrics.updatedAt > 0 ? new Date(metrics.updatedAt).toLocaleTimeString("zh-CN") : "—"],
            ["操作系统", meta.os || "—"], ["架构", meta.arch || "—"],
            ["虚拟化", meta.virtualization || "—"], ["显卡", meta.gpu_name || "—"],
          ].map(([label, value]) => <div className="instance-detail-system-item" key={label}><span>{label}</span><strong>{value}</strong></div>)}
        </div>
      </InstancePanel>
      </div>
    </div>
  );
}
