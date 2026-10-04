import { useCallback, useMemo } from "react";
import { CanvasStrip, fillRoundedRect, safeCanvasColor } from "./CanvasStrip";
import {
  getBarGeometry,
  getBarSlot,
  healthBarInteractionModel,
  healthBarSlotModel,
} from "./nodeCardShared";
import type { PingOverviewBucket } from "@/types/komari";

interface LatencyBarsProps {
  buckets: PingOverviewBucket[];
  redrawKey?: string;
  height?: number;
  showLoss?: boolean;
  onHoverIndex?: (index: number | null) => void;
}

export function LatencyBars({ buckets, redrawKey, height = 16, showLoss = false, onHoverIndex }: LatencyBarsProps) {
  const bars = useMemo(
    () => {
      // CSS 色变化时需要重新解析预计算的 canvas 色值。
      void redrawKey;
      return buckets.map((bucket) => {
        const slot = healthBarSlotModel(bucket, "latency");
        const lossFraction = showLoss && bucket.total > 0 && bucket.loss != null
          ? Math.min(1, Math.max(0, bucket.loss / 100))
          : 0;
        return {
          ...slot,
          heightFraction: lossFraction > 0 ? 0.84 : slot.heightFraction,
          alpha: lossFraction > 0 ? 0.94 : slot.alpha,
          tone: safeCanvasColor(slot.color),
          lossTone: safeCanvasColor("var(--status-error)"),
          lossFraction,
        };
      });
    },
    [buckets, redrawKey, showLoss],
  );

  const getHoverIndex = useCallback(
    (offsetX: number, width: number) => getBarSlot(offsetX, width, bars.length),
    [bars],
  );

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, height: number, interaction: { hoverIndex: number | null; hoverProgress: number }) => {
      const { gap, barWidth } = getBarGeometry(width, bars.length);

      bars.forEach(({ heightFraction, alpha, tone, lossTone, lossFraction }, index) => {
        const visual = healthBarInteractionModel(
          { active: true, heightFraction, color: tone, alpha },
          interaction.hoverIndex === index,
          interaction.hoverProgress,
        );
        const barHeight = height * visual.heightFraction;
        const x = index * (barWidth + gap);
        const y = height - barHeight;

        ctx.globalAlpha = visual.alpha;
        ctx.fillStyle = tone;
        fillRoundedRect(ctx, x, y, barWidth, barHeight, 2);
        if (lossFraction > 0) {
          const lossHeight = Math.min(barHeight, Math.max(1, barHeight * lossFraction));
          ctx.fillStyle = lossTone;
          fillRoundedRect(ctx, x, height - lossHeight, barWidth, lossHeight, Math.min(2, lossHeight / 2));
        }
      });

      ctx.globalAlpha = 1;
    },
    [bars],
  );

  return (
    <CanvasStrip
      className="health-bar-row"
      height={height}
      redrawKey={redrawKey}
      getHoverIndex={getHoverIndex}
      onHoverIndex={onHoverIndex}
      draw={draw}
    />
  );
}
