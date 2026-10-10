import { memo } from "react";
import type { CSSProperties, ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowDown, ArrowUp, Cpu, Gauge, HardDrive, MemoryStick, ListFilter, Network } from "lucide-react";
import { clsx } from "clsx";
import { Flag } from "@/components/ui/Flag";
import { useNodeCardModel } from "@/hooks/useNodeCardModel";
import { useThemeSettings } from "@/hooks/useThemeSettings";
import { formatBytes } from "@/utils/format";
import { MultiPingStatus } from "./MultiPingStatus";
import { NodeTodayTrafficPopover } from "./NodeTodayTrafficPopover";
import { formatCompactExpire, formatCompactPercent, formatCompactUptime } from "./nodeCardShared";
import type { NodeInfo, NodeMetrics } from "@/types/komari";

type CompactNode = NodeInfo & NodeMetrics;

function clamp01(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function CompactGauge({
  icon,
  label,
  value,
  detail,
  color,
  fraction,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  detail?: string;
  color: string;
  fraction: number;
}) {
  // 单元素分段条:填充用一个 hard-stop 渐变到 fraction 处,再叠一个重复 mask 打出
  // 18 个段间空隙。替代了 18 个逐段 <span>(每卡 ×4 个 gauge)—— 那些 span 在每个
  // 屏外卡片上每 tick 的 reconcile + 样式重算曾是渲染开销大头。
  const style = {
    "--compact-gauge-color": color,
    "--compact-gauge-fill": `${clamp01(fraction) * 100}%`,
  } as CSSProperties;

  return (
    <div
      className="compact-node-gauge"
      style={style}
      title={detail ? `${label} ${value} · ${detail}` : `${label} ${value}`}
    >
      <div className="compact-node-gauge-head">
        <span className="compact-node-gauge-label">
          {icon}
          <span>{label}</span>
        </span>
        <strong className="tabular">{value}</strong>
      </div>
      <div className="compact-node-gauge-track" aria-hidden />
    </div>
  );
}

const CompactNodeVitals = memo(function CompactNodeVitals({
  node,
  loadFraction,
}: {
  node: CompactNode;
  loadFraction: number;
}) {
  return (
    <div className="compact-node-vitals">
      <CompactGauge
        icon={<Cpu size={12} />}
        label="CPU"
        value={formatCompactPercent(node.cpuPct)}
        detail={`${node.cpu_cores || 0} 核`}
        fraction={node.cpuPct / 100}
        color="var(--progress-cpu)"
      />
      <CompactGauge
        icon={<MemoryStick size={12} />}
        label="内存"
        value={formatCompactPercent(node.ramPct)}
        detail={`${formatBytes(node.ramUsed)} / ${formatBytes(node.ramTotal)}`}
        fraction={node.ramPct / 100}
        color="var(--progress-memory)"
      />
      <CompactGauge
        icon={<HardDrive size={12} />}
        label="磁盘"
        value={formatCompactPercent(node.diskPct)}
        detail={`${formatBytes(node.diskUsed)} / ${formatBytes(node.diskTotal)}`}
        fraction={node.diskPct / 100}
        color="var(--progress-disk)"
      />
      <CompactGauge
        icon={<Gauge size={12} />}
        label="负载"
        value={node.load1.toFixed(2)}
        detail={`${node.load5.toFixed(2)} / ${node.load15.toFixed(2)}`}
        fraction={loadFraction}
        color="var(--progress-load)"
      />
    </div>
  );
});

export const CompactNodeCard = memo(function CompactNodeCard({
  uuid,
  size = "compact",
  showTodayTraffic = true,
}: {
  uuid: string;
  size?: "compact" | "large" | "mini";
  showTodayTraffic?: boolean;
}) {
  const model = useNodeCardModel(uuid, {
    pingBucketCount: 20,
    includeMultiPing: true,
    multiPingLimit: size === "mini" ? 1 : 6,
  });
  const themeSettings = useThemeSettings();
  const navigate = useNavigate();
  const openDetails = (event: React.MouseEvent<HTMLElement>) => {
    if (event.defaultPrevented || !(event.target instanceof Element)) return;
    if (event.target.closest('a, button, input, select, textarea, [role="button"], [role="dialog"], [data-card-interactive]')) return;
    if (window.getSelection()?.toString()) return;
    navigate(`/instance/${encodeURIComponent(uuid)}`);
  };

  if (!model.node) {
    return <div className="compact-node-card animate-pulse" aria-busy />;
  }

  const {
    node,
    traffic,
    trafficResetLabel,
    homepagePingLines,
    compactFooterTags: footerTags,
    compactRenewalPrice,
    remainingValue,
    isPriceVisible,
    expire,
    expireColor,
    upRate,
    downRate,
    isOffline,
    loadFraction,
    osName,
  } = model;
  const isLarge = size === "large";
  const isMini = size === "mini";
  const showTrafficTotal = themeSettings.isReady && (size !== "compact" || themeSettings.compactShowTrafficTotal);
  const showBilling = themeSettings.isReady && (size !== "compact" || themeSettings.compactShowBilling);
  const showUptime = themeSettings.isReady && (size !== "compact" || themeSettings.compactShowUptime);
  // 开关关闭或节点离线时,完全跳过格式化工作。
  const uptimeLabel = showUptime && !isOffline ? formatCompactUptime(node.uptime) : "";

  const previewTags = [
    ...(node.group ? [{ label: node.group, color: "gray" }] : []),
    ...footerTags.filter((tag) => tag.label !== node.group),
  ].slice(0, 6);
  return (
    <article className={clsx("compact-node-card preview-node-v1", isLarge && "server-card is-large-layout", isMini && "mini-node-card is-mini-layout", isOffline && "is-offline")} onClick={openDetails}>
      <header className="preview-node-header">
        <Flag region={node.region} size={isMini ? 20 : 24} />
        <div className="preview-node-heading">
          <Link to={`/instance/${encodeURIComponent(node.uuid)}`} className="compact-node-title" title={node.name}>{node.name}</Link>
          <span>{osName} · {node.arch || "—"}</span>
        </div>
        <span className={clsx("preview-node-status", isOffline && "is-offline")}>{isOffline ? "离线" : uptimeLabel || "在线"}</span>
      </header>
      <div className="preview-node-rates">
        {[{ label: "上传", icon: <ArrowUp size={14} />, rate: upRate, total: node.trafficUp, tone: "var(--progress-cpu)" },
          { label: "下载", icon: <ArrowDown size={14} />, rate: downRate, total: node.trafficDown, tone: "var(--status-success)" }].map(({label, icon, rate, total, tone}) => (
          <div className="preview-node-rate" key={label} style={{"--rate-tone": tone} as CSSProperties}>
            <span className="preview-node-rate-label">{icon}{label}</span>
            <strong className="tabular">{rate.value}<small>{rate.unit}</small></strong>
            {showTrafficTotal && <span className="preview-node-muted">累计 {formatBytes(total)}</span>}
          </div>
        ))}
      </div>
      <CompactNodeVitals node={node} loadFraction={loadFraction} />
      {isLarge && themeSettings.isReady && themeSettings.showConnections && <div className="preview-node-section-head preview-node-connections"><span><Network size={14} /> TCP {node.connectionsTcp.toLocaleString()}</span><span>UDP {node.connectionsUdp.toLocaleString()}</span></div>}
      <section className="preview-node-network">
        <div className="preview-node-section-head"><strong>网络质量</strong><span>最近 1 小时</span></div>
        <div className="preview-node-network-labels"><span>线路</span><span aria-hidden="true" /><span>延迟</span><span>丢包率</span></div>
        <MultiPingStatus uuid={node.uuid} name={node.name} lines={homepagePingLines} />
      </section>
      <section className="preview-node-traffic" style={{"--compact-gauge-color": traffic.color, "--compact-gauge-fill": `${clamp01(traffic.fraction) * 100}%`} as CSSProperties}>
        <div className="preview-node-section-head"><strong className="tabular">{traffic.detail}</strong><span className="tabular">{(traffic.fraction * 100).toFixed(2)}%</span></div>
        <div className="compact-node-gauge-track" aria-hidden="true" />
        <div className="preview-node-section-head preview-node-muted"><span className="preview-node-traffic-label">已用流量{size !== "compact" && showTodayTraffic && <NodeTodayTrafficPopover uuid={uuid} />}</span>{trafficResetLabel && <span>{trafficResetLabel}</span>}</div>
      </section>
      <footer className="preview-node-footer">
        <div className="preview-node-footer-summary">
        {showBilling && <div className="preview-node-cost">
          {isPriceVisible && <strong className="tabular">{compactRenewalPrice || "免费"}</strong>}
          <div><span style={{color: expireColor}}>{formatCompactExpire(expire)}</span>{isPriceVisible && remainingValue !== null && <span className="tabular">剩余 {remainingValue}</span>}</div>
        </div>}
        {node.bandwidth?.trim() && <span className="preview-node-bandwidth" title={`带宽 ${node.bandwidth}`}><ListFilter size={15} aria-hidden="true" /><span>{node.bandwidth}</span></span>}
        </div>
        {previewTags.length > 0 && <div className="preview-node-tags">{previewTags.map((tag,index) => <span key={`${tag.label}-${index}`} className="compact-node-tag" data-tag={tag.color}>{tag.label}</span>)}</div>}
      </footer>
    </article>
  );
});
