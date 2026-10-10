import { memo, useCallback, useState } from "react";
import { clsx } from "clsx";
import { useMetricColorsVersion } from "@/hooks/useMetricColors";
import { usePreferences } from "@/hooks/usePreferences";
import { useThemeSettings } from "@/hooks/useThemeSettings";
import type { HomepagePingDisplayLine } from "@/types/komari";
import { latencyHeatColor, lossHeatColor } from "@/utils/metricTone";
import { HealthBucketTooltip } from "./HealthBucketTooltip";
import { LatencyBars } from "./LatencyBars";
import { formatCombinedPingBucketTooltip } from "./pingBucketText";
import { NodeNetworkDialog } from "./NodeNetworkDialog";
import { PingSparkline } from "./PingSparkline";

const TablePingRow = memo(function TablePingRow({ line, redrawKey, onOpen, sparkline }: {
  line: HomepagePingDisplayLine;
  redrawKey: string;
  onOpen: () => void;
  sparkline: boolean;
}) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const hoveredBucket = hoveredIndex == null ? null : line.buckets[hoveredIndex];
  const tooltip = hoveredBucket ? formatCombinedPingBucketTooltip(hoveredBucket) : null;
  const emptyLabel = line.loadState === "pending" ? "加载中"
    : line.loadState === "error" ? "加载失败" : "无样本";
  const latencyColor = line.lastValue == null ? "var(--text-tertiary)" : latencyHeatColor(line.lastValue);
  const stale = line.loadState === "error" && line.lastValue != null;
  const open = (event: React.MouseEvent<HTMLButtonElement>) => { event.stopPropagation(); onOpen(); };
  return (
    <div className="multi-ping-sparkline-row" data-load-state={line.loadState ?? "ready"}>
      <button
        type="button"
        className="multi-ping-sparkline-summary"
        onClick={open}
        aria-haspopup="dialog"
        aria-label={`查看 ${line.taskName} 所属服务器的网络详情`}
        title={`${line.taskName}${stale ? " · 刷新失败，显示上次数据" : ""}`}
      >
        <span className="multi-ping-name">{line.taskName}</span>
      </button>
      {!sparkline ? (
        <button type="button" className="multi-ping-table-history" onClick={open} aria-haspopup="dialog" aria-label={`${line.taskName} 延迟历史，查看网络详情`}>
          <LatencyBars buckets={line.buckets} redrawKey={redrawKey} height={6} onHoverIndex={setHoveredIndex} />
          <HealthBucketTooltip text={tooltip} index={hoveredIndex} count={line.buckets.length} />
        </button>
      ) : <PingSparkline buckets={line.buckets} name={line.taskName} color={latencyColor} redrawKey={redrawKey} onOpen={onOpen} />}
      <button type="button" className="multi-ping-table-latency" onClick={open} aria-haspopup="dialog" aria-label={`${line.taskName} 延迟，查看网络详情`}>
        <strong className="multi-ping-value tabular" style={{color: latencyColor}}>{line.lastValue == null ? emptyLabel : line.lastValue.toFixed(2)}{line.lastValue != null && <small>ms</small>}</strong>
      </button>
      <button
        type="button"
        className="multi-ping-sparkline-loss multi-ping-loss tabular"
        style={{ color: line.loss == null ? "var(--text-tertiary)" : lossHeatColor(line.loss) }}
        aria-label={`${line.taskName} 丢包 ${line.loss == null ? emptyLabel : `${line.loss.toFixed(1)}%`}，查看网络详情`}
        aria-haspopup="dialog"
        onClick={open}
      >
        <small>丢包</small> {line.loss == null ? emptyLabel : `${line.loss.toFixed(1)}%`}
      </button>
    </div>
  );
});

export const MultiPingStatus = memo(function MultiPingStatus({
  uuid,
  name,
  lines,
  className,
}: {
  uuid: string;
  name: string;
  lines: HomepagePingDisplayLine[];
  className?: string;
}) {
  const { resolvedAppearance } = usePreferences();
  const { homepagePingDisplayMode } = useThemeSettings();
  const colorsVersion = useMetricColorsVersion();
  const redrawKey = `${resolvedAppearance}:${colorsVersion}`;
  const [networkOpen, setNetworkOpen] = useState(false);
  const openNetwork = useCallback(() => setNetworkOpen(true), []);
  const closeNetwork = useCallback(() => setNetworkOpen(false), []);

  return (
    <>
    <div
      className={clsx("multi-ping-status is-compact is-sparkline is-table", className)}
      role="group"
      aria-label="自定义线路延迟与丢包"
      onClick={(event) => { event.stopPropagation(); openNetwork(); }}
    >
      {lines.slice(0, 6).map((line) => (
        <TablePingRow key={line.taskId} line={line} redrawKey={redrawKey} onOpen={openNetwork} sparkline={homepagePingDisplayMode === "sparkline"} />
      ))}
    </div>
    {networkOpen && <NodeNetworkDialog uuid={uuid} name={name} onClose={closeNetwork} />}
    </>
  );
});
