import { memo, useCallback, useState } from "react";
import { clsx } from "clsx";
import { useMetricColorsVersion } from "@/hooks/useMetricColors";
import { usePreferences } from "@/hooks/usePreferences";
import { useThemeSettings } from "@/hooks/useThemeSettings";
import type { HomepagePingDisplayLine } from "@/types/komari";
import { latencyHeatColor, lossHeatColor } from "@/utils/metricTone";
import { HealthBucketTooltip } from "./HealthBucketTooltip";
import { LatencyBars } from "./LatencyBars";
import { QualityBars } from "./QualityBars";
import { formatCombinedPingBucketTooltip } from "./pingBucketText";
import { NodeNetworkDialog } from "./NodeNetworkDialog";
import { PingSparkline } from "./PingSparkline";

type MultiPingStatusDensity = "large" | "compact";

const PingLineRow = memo(function PingLineRow({
  line,
  density,
  redrawKey,
  onOpen,
}: {
  line: HomepagePingDisplayLine;
  density: MultiPingStatusDensity;
  redrawKey: string;
  onOpen: () => void;
}) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [hoveredMetric, setHoveredMetric] = useState<"latency" | "loss" | null>(null);
  const isLoading = line.loadState === "pending";
  const isError = line.loadState === "error";
  const emptyLabel = isLoading ? "加载中" : isError ? "加载失败" : "无样本";
  const hoveredBucket = hoveredIndex == null ? null : line.buckets[hoveredIndex];
  const tooltip = hoveredBucket ? formatCombinedPingBucketTooltip(hoveredBucket) : null;
  const latencyLabel = line.lastValue == null ? emptyLabel : `${Math.round(line.lastValue)} ms`;
  const lossLabel = line.loss == null ? emptyLabel : `${line.loss.toFixed(1)}%`;
  const staleError = isError && (line.lastValue != null || line.loss != null);

  return (
    <div
      className="multi-ping-metric-row"
      role="button"
      tabIndex={0}
      aria-label={`查看 ${line.taskName} 所属服务器的网络详情`}
      aria-haspopup="dialog"
      onClick={(event) => { event.stopPropagation(); onOpen(); }}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          event.stopPropagation();
          onOpen();
        }
      }}
      data-load-state={line.loadState ?? "ready"}
      title={`${line.taskName} · 延迟 ${latencyLabel} · 丢包 ${lossLabel}${staleError ? " · 刷新失败，显示上次数据" : ""}`}
    >
      <div className="multi-ping-metric-head">
        <span className="multi-ping-latency-head">
          <span className="multi-ping-name" title={line.taskName}>{line.taskName}</span>
          <strong
            className="multi-ping-value tabular"
            aria-label={`延迟 ${latencyLabel}`}
            style={{ color: line.lastValue == null ? "var(--text-tertiary)" : latencyHeatColor(line.lastValue) }}
          >
            {line.lastValue == null ? emptyLabel : Math.round(line.lastValue)}
            {line.lastValue != null && <small>ms</small>}
          </strong>
        </span>
        <span className="multi-ping-loss-head">
          <span
            className="multi-ping-loss tabular"
            aria-label={`丢包 ${lossLabel}`}
            style={{ color: line.loss == null ? "var(--text-tertiary)" : lossHeatColor(line.loss) }}
          >
            <small>丢包</small> {lossLabel}
          </span>
        </span>
      </div>
      <span className="multi-ping-buckets">
        <span className="multi-ping-history-line" title="延迟历史">
          <LatencyBars
            buckets={line.buckets}
            redrawKey={redrawKey}
            height={density === "compact" ? 6 : 7}
            onHoverIndex={(index) => {
              setHoveredMetric(index == null ? null : "latency");
              setHoveredIndex(index);
            }}
          />
          <HealthBucketTooltip text={hoveredMetric === "latency" ? tooltip : null} index={hoveredIndex} count={line.buckets.length} />
        </span>
        <span className="multi-ping-history-separator" aria-hidden="true">|</span>
        <span className="multi-ping-history-line" title="丢包率历史">
          <QualityBars
            buckets={line.buckets}
            redrawKey={redrawKey}
            height={density === "compact" ? 6 : 7}
            onHoverIndex={(index) => {
              setHoveredMetric(index == null ? null : "loss");
              setHoveredIndex(index);
            }}
          />
          <HealthBucketTooltip text={hoveredMetric === "loss" ? tooltip : null} index={hoveredIndex} count={line.buckets.length} />
        </span>
      </span>
    </div>
  );
});

const SparklineRow = memo(function SparklineRow({ line, redrawKey, onOpen }: {
  line: HomepagePingDisplayLine;
  redrawKey: string;
  onOpen: () => void;
}) {
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
        <strong className="multi-ping-value tabular" style={{ color: latencyColor }}>
          {line.lastValue == null ? emptyLabel : Math.round(line.lastValue)}
          {line.lastValue != null && <small>ms</small>}
        </strong>
      </button>
      <PingSparkline buckets={line.buckets} name={line.taskName} color={latencyColor} redrawKey={redrawKey} />
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
  density,
  className,
}: {
  uuid: string;
  name: string;
  lines: HomepagePingDisplayLine[];
  density: MultiPingStatusDensity;
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
      className={clsx("multi-ping-status", `is-${density}`, homepagePingDisplayMode === "sparkline" && "is-sparkline", className)}
      role="group"
      aria-label="自定义线路延迟与丢包"
    >
      {lines.map((line) => (
        homepagePingDisplayMode === "sparkline"
          ? <SparklineRow key={line.taskId} line={line} redrawKey={redrawKey} onOpen={openNetwork} />
          : <PingLineRow key={line.taskId} line={line} density={density} redrawKey={redrawKey} onOpen={openNetwork} />
      ))}
    </div>
    {networkOpen && <NodeNetworkDialog uuid={uuid} name={name} onClose={closeNetwork} />}
    </>
  );
});
