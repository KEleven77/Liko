import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent } from "react";
import type { PingOverviewBucket } from "@/types/komari";
import { CanvasStrip, safeCanvasColor } from "./CanvasStrip";
import { HealthBucketTooltip } from "./HealthBucketTooltip";
import { formatCombinedPingBucketTooltip } from "./pingBucketText";
import { buildPingSparklinePoints, pingSparklineIndex, createPingInspection, currentPingInspection, type PingInspection } from "./pingSparklineModel";

const SPARKLINE_HEIGHT = 26;

export const PingSparkline = memo(function PingSparkline({ buckets, name, color, redrawKey }: {
  buckets: PingOverviewBucket[];
  name: string;
  color: string;
  redrawKey: string;
}) {
  const [inspect, setInspect] = useState<PingInspection | null>(null);
  // Rolling buckets change their time bounds; never silently inspect another period.
  const activeInspection = currentPingInspection(buckets, inspect);
  const host = useRef<HTMLSpanElement>(null);
  const paintedWidth = useRef(0);
  // Normalize once per data update; resize and inspection reuse the same points.
  const geometry = useMemo(() => {
    const points = buildPingSparklinePoints(buckets, 1, SPARKLINE_HEIGHT);
    return {
      points,
      hasSamples: points.some((point) => point.y != null),
      isolated: points.filter((point, index) => point.y != null
        && points[index - 1]?.y == null && points[index + 1]?.y == null),
      lossMarks: buckets.flatMap((bucket, index) => bucket.total > 0 && bucket.loss != null && bucket.loss > 0
        ? [{ x: points[index].x, alpha: Math.max(0.35, Math.min(1, bucket.loss / 100)) }] : []),
    };
  }, [buckets]);
  const palette = useMemo(() => {
    void redrawKey;
    return {
      line: safeCanvasColor(color),
      loss: safeCanvasColor("var(--status-error)"),
      empty: safeCanvasColor("var(--hairline)"),
      marker: safeCanvasColor("var(--text-tertiary)"),
    };
  }, [color, redrawKey]);
  const activeIndex = activeInspection?.index ?? null;
  const bucket = activeIndex == null ? null : buckets[activeIndex];
  const tooltip = bucket ? formatCombinedPingBucketTooltip(bucket) : null;

  useEffect(() => {
    if (!activeInspection?.sticky) return;
    const clearOutside = (event: globalThis.PointerEvent) => {
      if (event.target instanceof Node && !host.current?.contains(event.target)) setInspect(null);
    };
    document.addEventListener("pointerdown", clearOutside, true);
    return () => document.removeEventListener("pointerdown", clearOutside, true);
  }, [activeInspection?.sticky]);

  const inspectPointer = (event: PointerEvent<HTMLSpanElement>, sticky: boolean) => {
    let width = paintedWidth.current;
    let offsetX = event.nativeEvent.offsetX;
    // Canvas and tooltip do not receive pointer events; offsetX is host-relative.
    if (width <= 0) {
      const rect = event.currentTarget.getBoundingClientRect();
      width = rect.width;
      offsetX = event.clientX - rect.left;
    }
    const index = pingSparklineIndex(offsetX, width, buckets.length);
    if (index == null) return;
    setInspect((current) => {
      const active = currentPingInspection(buckets, current);
      return active?.index === index && active.sticky === sticky
        ? current : createPingInspection(buckets, index, sticky);
    });
  };

  const draw = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    paintedWidth.current = width;
    const { points, isolated, lossMarks, hasSamples } = geometry;
    const tone = palette.line;
    ctx.strokeStyle = tone;
    ctx.fillStyle = tone;
    ctx.lineWidth = 1.8;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.beginPath();
    let connected = false;
    points.forEach(({ x, y }) => {
      if (y == null) { connected = false; return; }
      if (connected) ctx.lineTo(x * width, y);
      else ctx.moveTo(x * width, y);
      connected = true;
    });
    ctx.stroke();
    // Isolated valid samples remain visible without bridging missing periods.
    isolated.forEach(({ x, y }) => {
      ctx.beginPath();
      ctx.arc(x * width, y!, 1.5, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.fillStyle = palette.loss;
    lossMarks.forEach(({ x, alpha }) => {
      ctx.globalAlpha = alpha;
      ctx.fillRect(x * width - 1, height - 2, 2, 2);
    });
    ctx.fillStyle = tone;
    ctx.globalAlpha = 1;
    if (!hasSamples) {
      ctx.strokeStyle = palette.empty;
      ctx.setLineDash([2, 3]);
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    if (activeIndex != null && points[activeIndex]) {
      const point = points[activeIndex];
      ctx.strokeStyle = palette.marker;
      ctx.globalAlpha = 0.5;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(point.x * width, 1);
      ctx.lineTo(point.x * width, height - 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
      if (point.y != null) {
        ctx.beginPath();
        ctx.arc(point.x * width, point.y, 2.4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }, [geometry, palette, activeIndex]);

  return (
    <span
      ref={host}
      className="ping-sparkline"
      role="slider"
      tabIndex={buckets.length ? 0 : -1}
      aria-label={`${name} 每时段延迟`}
      aria-valuemin={0}
      aria-valuemax={Math.max(0, buckets.length - 1)}
      aria-valuenow={activeIndex ?? Math.max(0, buckets.length - 1)}
      aria-valuetext={tooltip ?? "延迟历史"}
      onPointerMove={(event) => {
        if (event.pointerType === "mouse" && !activeInspection?.sticky) inspectPointer(event, false);
      }}
      onPointerDown={(event) => inspectPointer(event, true)}
      onPointerLeave={() => setInspect((current) => currentPingInspection(buckets, current)?.sticky ? current : null)}
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => {
        if (event.key === "Escape") { event.stopPropagation(); setInspect(null); return; }
        if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key) || !buckets.length) return;
        event.preventDefault();
        event.stopPropagation();
        const index = event.key === "Home" ? 0 : event.key === "End" ? buckets.length - 1
          : Math.min(buckets.length - 1, Math.max(0,
            (activeIndex ?? buckets.length - 1) + (event.key === "ArrowLeft" ? -1 : 1)));
        setInspect(createPingInspection(buckets, index, true));
      }}
      onBlur={() => setInspect(null)}
    >
      <CanvasStrip className="ping-sparkline-canvas" height={SPARKLINE_HEIGHT} redrawKey={redrawKey} draw={draw} />
      <HealthBucketTooltip text={tooltip} index={activeIndex} count={buckets.length} />
    </span>
  );
});
