import { startTransition, useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Activity, ChevronLeft, LayoutGrid } from "lucide-react";
import "uplot/dist/uPlot.min.css";
import { InstanceOverview } from "@/components/instance/InstanceOverview";
import { InstanceSwitcher } from "@/components/instance/InstanceSwitcher";
import { Flag } from "@/components/ui/Flag";
import { PingChart } from "@/components/instance/PingChart";
import { LoadChart } from "@/components/instance/LoadChart";
import { Spinner } from "@/components/ui/Spinner";
import {
  buildLoadTimeRangeOptions,
  buildPingTimeRangeOptions,
} from "@/components/instance/chartShared";
import { usePublicConfig } from "@/hooks/usePublicConfig";
import { useNodeMeta, useNodeMetrics, useNodeStoreStatus } from "@/hooks/useNode";
import { useThemeSettings } from "@/hooks/useThemeSettings";

const DEFAULT_PING_HOURS = 4;
type TimeRangeOption = ReturnType<typeof buildLoadTimeRangeOptions>[number];

function RangeSelector({
  ranges,
  value,
  onChange,
  label = "图表时间范围",
}: {
  ranges: TimeRangeOption[];
  value: number;
  onChange: (value: number) => void;
  label?: string;
}) {
  return (
    <select className="instance-detail-range" aria-label={label} value={value} onChange={(event) => onChange(Number(event.target.value))}>
      {ranges.map((range) => (
        <option
          key={range.value}
          value={range.value}
        >
          {range.label}
        </option>
      ))}
    </select>
  );
}

export function Instance() {
  const { uuid } = useParams<{ uuid: string }>();
  const { data: config } = usePublicConfig();
  const themeSettings = useThemeSettings();
  const meta = useNodeMeta(uuid ?? "");
  const metrics = useNodeMetrics(uuid ?? "");
  const storeStatus = useNodeStoreStatus(Boolean(uuid));
  const [chartType, setChartType] = useState<"load" | "ping">("load");
  const [loadHours, setLoadHours] = useState(0);
  const [trafficHours, setTrafficHours] = useState(1);
  const [pingHours, setPingHours] = useState(DEFAULT_PING_HOURS);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [uuid]);

  const metricRetentionHours =
    config?.metric_retention_days && config.metric_retention_days > 0
      ? config.metric_retention_days * 24
      : null;

  const loadRanges = useMemo(
    () => buildLoadTimeRangeOptions(metricRetentionHours ?? config?.record_preserve_time),
    [config?.record_preserve_time, metricRetentionHours],
  );
  const pingRanges = useMemo(
    () => buildPingTimeRangeOptions(metricRetentionHours ?? config?.ping_record_preserve_time),
    [config?.ping_record_preserve_time, metricRetentionHours],
  );
  const showPingChart = themeSettings.isReady && themeSettings.showPingChart;

  useEffect(() => {
    if (!loadRanges.some((range) => range.value === trafficHours)) {
      setTrafficHours(loadRanges[0]?.value ?? 0);
    }
  }, [trafficHours, loadRanges]);

  useEffect(() => {
    if (!loadRanges.some((range) => range.value === loadHours)) {
      setLoadHours(loadRanges[0]?.value ?? 0);
    }
  }, [loadHours, loadRanges]);

  useEffect(() => {
    if (!pingRanges.some((range) => range.value === pingHours)) {
      setPingHours(
        pingRanges.find((range) => range.value === DEFAULT_PING_HOURS)?.value ??
          pingRanges[0]?.value ??
          DEFAULT_PING_HOURS,
      );
    }
  }, [pingHours, pingRanges]);

  useEffect(() => {
    if (!showPingChart && chartType === "ping") {
      setChartType("load");
    }
  }, [chartType, showPingChart]);

  if (!uuid) return null;

  if (!meta) {
    const message = storeStatus.hydrated
      ? "找不到这个实例，它可能已被删除或链接无效。"
      : storeStatus.nodeInfoError
        ? "节点列表加载失败，系统正在自动重试。"
        : null;
    return (
      <div className="flex flex-col gap-5 py-2">
        <Link to="/" className="instance-page-back">
          <ChevronLeft size={14} />
          返回
        </Link>
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-center">
          {message ? (
            <>
              <div className="text-[15px] font-semibold text-(--text-primary)">
                {storeStatus.hydrated ? "实例不存在" : "暂时无法加载实例"}
              </div>
              <p className="text-[13px] text-(--text-secondary)">{message}</p>
            </>
          ) : (
            <Spinner size={24} label="正在加载实例" />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="instance-detail-page">
      <header className="instance-detail-header">
      <Link
        to="/"
        className="instance-page-back"
      >
        <ChevronLeft size={14} />
        <span className="sr-only">返回首页</span>
      </Link>
      <Flag region={meta.region} size={24} />
      <div className="instance-detail-heading"><h1>{meta.name}</h1><span>{meta.os || "—"} · {meta.arch || "—"}{meta.bandwidth ? ` · ${meta.bandwidth}` : ""}</span></div>
      <InstanceSwitcher currentUuid={uuid} />
      <span className={`instance-detail-status${metrics?.online ? " is-online" : ""}`}>{metrics ? metrics.online ? "在线" : "离线" : "加载中"}</span>
      </header>
      <div className="instance-chart-controls">
        <div className="instance-segmented instance-detail-tabs" role="group" aria-label="服务器详情视图">
          <button
            type="button"
            data-active={chartType === "load" ? "true" : "false"}
            aria-pressed={chartType === "load"}
            onClick={() => {
              startTransition(() => setChartType("load"));
            }}
          >
            <LayoutGrid size={18} aria-hidden />资源详情
          </button>
          {showPingChart && (
            <button
              type="button"
              data-active={chartType === "ping" ? "true" : "false"}
              aria-pressed={chartType === "ping"}
              onClick={() => {
                startTransition(() => setChartType("ping"));
              }}
            >
              <Activity size={18} aria-hidden />网络监测
            </button>
          )}
        </div>
      </div>
      <div className="instance-chart-stage">
        <div
          className="instance-chart-view"
          hidden={chartType !== "load"}
          aria-hidden={chartType !== "load"}
        >
          <InstanceOverview uuid={uuid} hours={trafficHours} active={chartType === "load"} rangeControls={<RangeSelector ranges={loadRanges} value={trafficHours} label="实时流量时间范围" onChange={(value) => startTransition(() => setTrafficHours(value))} />} />
          <LoadChart uuid={uuid} hours={loadHours} active={chartType === "load"} resourceOnly rangeControls={<RangeSelector ranges={loadRanges} value={loadHours} label="历史趋势时间范围" onChange={(value) => startTransition(() => setLoadHours(value))} />} />
        </div>
        <div
          className="instance-chart-view"
          hidden={chartType !== "ping"}
          aria-hidden={chartType !== "ping"}
        >
          {showPingChart ? (
            <PingChart
              uuid={uuid}
              hours={pingHours}
              active={chartType === "ping"}
              detailPage
              rangeControls={<RangeSelector ranges={pingRanges} value={pingHours} label="网络监测时间范围" onChange={(value) => startTransition(() => setPingHours(value))} />}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
