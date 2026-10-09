import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { convertCurrency, getExchangeRates } from "@/utils/cost";
import { useFakePingFallback } from "@/hooks/useFakePing";
import { useHourlyClock, useMinuteClock } from "@/hooks/useClock";
import { useNodeCardSnapshots } from "@/hooks/useNode";
import {
  buildPingBuckets,
  useNodePingOverview,
  useNodePingOverviewLines,
  usePingBuckets,
} from "@/hooks/usePingOverview";
import { useThemeSettings } from "@/hooks/useThemeSettings";
import { usePriceVisibility } from "@/hooks/usePriceVisibility";
import type { HomepagePingDisplayLine, HomepagePingLine } from "@/types/komari";
import { formatCompactRenewalPrice, formatRenewalPrice, formatRemainingValue, resolveCurrencySymbol } from "@/utils/billing";
import { getExpireTextColor } from "@/utils/expireStatus";
import {
  formatBytes,
  formatByteRate,
  formatExpireDays,
  formatUptimeDays,
  joinDisplayParts,
  parseTags,
} from "@/utils/format";
import {
  latencyHeatColor,
  lossHeatColor,
  trafficUsageColor,
} from "@/utils/metricTone";
import { formatTrafficResetLabel, resolveTrafficUsage, trafficTypeLabel, type TrafficDisplay } from "@/utils/traffic";
import { resolveOsInfo } from "@/components/ui/OsLogo";
import {
  hasHomepagePingTaskBinding,
  isHomepageMultiPingConfigured,
} from "@/utils/pingTasks";

const EMPTY_PING_TASK_IDS: number[] = [];

interface NodeCardModelOptions {
  pingBucketCount?: number;
  includeMultiPing?: boolean;
  multiPingLimit?: number;
}

export function shouldRenderHomepagePingBars(
  hasRealHomepagePingBinding: boolean,
  pingIsAssigned: boolean,
) {
  return hasRealHomepagePingBinding || pingIsAssigned;
}

export function useNodeCardModel(
  uuid: string,
  {
    pingBucketCount,
    includeMultiPing = false,
    multiPingLimit,
  }: NodeCardModelOptions = {},
) {
  const { meta, metrics, trafficTrend } = useNodeCardSnapshots(uuid);
  const {
    showCardGroup,
    fakePingForUnbound,
    homepagePingBindings,
    homepagePingTaskIdsByClient,
    enableHomepageMultiPing,
    homepageMultiPingTaskIds,
    cardCurrency,
    costRateApiUrl,
  } = useThemeSettings();
  const { isPriceVisible } = usePriceVisibility();
  const rateQuery = useQuery({
    queryKey: ["cost-rates", costRateApiUrl],
    queryFn: ({ signal }) => getExchangeRates(costRateApiUrl, { signal }),
    enabled: isPriceVisible && cardCurrency !== "original" && !!meta && meta.price > 0,
    staleTime: 60 * 60 * 1000,
    retry: 1,
    notifyOnChangeProps: ["data"],
  });
  const rates = rateQuery.data?.rates;
  const multiPingConfigured =
    enableHomepageMultiPing &&
    isHomepageMultiPingConfigured(homepageMultiPingTaskIds);
  const hasNodePingOverride = Object.hasOwn(homepagePingTaskIdsByClient, uuid);
  const nodePingTaskIds = hasNodePingOverride
    ? homepagePingTaskIdsByClient[uuid] ?? EMPTY_PING_TASK_IDS
    : homepageMultiPingTaskIds;
  const nodeMultiPingConfigured = hasNodePingOverride
    ? nodePingTaskIds.length > 0
    : multiPingConfigured;
  const multiPingActive = includeMultiPing && nodeMultiPingConfigured;
  const singlePingOverview = useNodePingOverview(uuid, !nodeMultiPingConfigured);
  const realPingLines = useNodePingOverviewLines(uuid, nodeMultiPingConfigured);
  const primaryMultiPingLine = useMemo(() => {
    if (!nodeMultiPingConfigured || multiPingActive) return undefined;
    const primaryTaskId = nodePingTaskIds[0];
    return realPingLines.find((line) => line.taskId === primaryTaskId);
  }, [multiPingActive, nodeMultiPingConfigured, nodePingTaskIds, realPingLines]);

  const realPing = primaryMultiPingLine ?? singlePingOverview;

  const hasRealHomepagePingBinding = useMemo(
    () =>
      hasNodePingOverride
        ? nodePingTaskIds.length > 0
        : multiPingConfigured || hasHomepagePingTaskBinding(uuid, homepagePingBindings),
    [hasNodePingOverride, homepagePingBindings, multiPingConfigured, nodePingTaskIds.length, uuid],
  );
  const now = useHourlyClock();
  const ping = useFakePingFallback(
    uuid,
    realPing,
    metrics?.online === true,
    fakePingForUnbound && !multiPingActive && !hasNodePingOverride,
    homepagePingBindings,
  );
  // 状态跟随每条任务数据进入 Store,不再订阅全局 isRefreshing。这样后台轮询开始/结束
  // 时不会让所有节点卡片仅因一个布尔值变化而重渲染。
  const pingLoading =
    hasRealHomepagePingBinding && (ping.loadState ?? "pending") === "pending";
  const pingError =
    hasRealHomepagePingBinding && ping.loadState === "error";
  const shouldRenderPingBars = shouldRenderHomepagePingBars(
    hasRealHomepagePingBinding,
    ping.isAssigned,
  );
  const pingBuckets = usePingBuckets(
    ping,
    pingBucketCount,
    !multiPingActive,
  );
  // 与 usePingBuckets 同理:窗口按分钟前移,不依赖数据刷新才滑动。
  const bucketNow = useMinuteClock(multiPingActive);
  const homepagePingLines = useMemo<HomepagePingDisplayLine[]>(() => {
    if (
      !multiPingActive
    ) {
      return [];
    }
    const linesByTask = new Map(realPingLines.map((line) => [line.taskId, line]));
    const visibleTaskIds = multiPingLimit == null ? nodePingTaskIds : nodePingTaskIds.slice(0, multiPingLimit);
    return visibleTaskIds.map((taskId) => {
      const loaded = linesByTask.get(taskId);
      const line: HomepagePingLine =
        loaded ?? {
          taskId,
          taskName: `任务 #${taskId}`,
          client: uuid,
          isAssigned: true,
          loadState: "pending",
          lastValue: null,
          samples: [],
          max: 1,
          loss: null,
        };
      return {
        ...line,
        buckets: buildPingBuckets(line, pingBucketCount, bucketNow),
      };
    });
  }, [
    bucketNow,
    nodePingTaskIds,
    multiPingActive,
    multiPingLimit,
    pingBucketCount,
    realPingLines,
    uuid,
  ]);

  const metaModel = useMemo(() => {
    if (!meta) return null;
    const tags = parseTags(meta.tags);
    const group = showCardGroup ? meta.group : undefined;
    const subtitleParts = [group, meta.public_remark]
      .map((part) => part?.trim())
      .filter((part): part is string => Boolean(part));
    const subtitleLabels = new Set(subtitleParts.map((part) => part.toLowerCase()));
    const compactFooterTags = tags.filter(
      (tag) => !subtitleLabels.has(tag.label.trim().toLowerCase()),
    );
    const fallbackFooterTags =
      tags.length > 0
        ? tags
        : group
          ? [{ label: group, color: "gray" }]
          : [];
    const convertedPrice = cardCurrency !== "original" && meta.price > 0
      ? convertCurrency(meta.price, meta.currency, cardCurrency, rates ?? {})
      : null;
    const billingMeta = cardCurrency !== "original" && (convertedPrice !== null || meta.price === 0 || meta.price === -1)
      ? { ...meta, price: convertedPrice ?? meta.price, currency: resolveCurrencySymbol(cardCurrency) }
      : meta;
    return {
      tags,
      footerTags: fallbackFooterTags,
      compactFooterTags,
      subtitle: joinDisplayParts(subtitleParts),
      expire: formatExpireDays(meta.expired_at, now),
      trafficResetLabel: formatTrafficResetLabel(meta.traffic_reset_at, now),
      expireColor: getExpireTextColor(meta.expired_at, now),
      isPriceVisible,
      renewalPrice: isPriceVisible ? formatRenewalPrice(billingMeta) : null,
      compactRenewalPrice: isPriceVisible ? formatCompactRenewalPrice(billingMeta) : null,
      remainingValue: isPriceVisible ? formatRemainingValue(billingMeta, now) : null,
      osName: resolveOsInfo(meta.os).name,
      loadBaseline: meta.cpu_cores > 0 ? meta.cpu_cores : 4,
    };
  }, [cardCurrency, isPriceVisible, meta, now, rates, showCardGroup]);

  // ping 派生的颜色只在 ping item 变化时才变。
  const pingModel = useMemo(
    () => ({
      latencyColor: latencyHeatColor(ping.lastValue),
      lossColor: lossHeatColor(ping.loss),
      hasRealHomepagePingBinding,
      // 保留旧字段供外部模型消费者兼容；它表示真实配置状态。
      hasHomepagePingBinding: hasRealHomepagePingBinding,
      shouldRenderPingBars,
      pingLoading,
      pingError,
    }),
    [
      hasRealHomepagePingBinding,
      ping,
      pingError,
      pingLoading,
      shouldRenderPingBars,
    ],
  );

  return useMemo(() => {
    if (!meta || !metrics || !metaModel) {
      return {
        node: undefined,
        trafficTrend,
        ping,
        pingBuckets,
        homepagePingLines,
      };
    }

    const { loadBaseline } = metaModel;

    // 流量配额：按节点的 traffic_limit_type（与后端一致）把累计上/下行算成"已用"，
    // 在这里一次性算出剩余和使用占比，让两种卡片布局共用这套计算。
    const trafficUsage = resolveTrafficUsage(
      meta.traffic_limit_type,
      metrics.trafficUp,
      metrics.trafficDown,
      meta.traffic_limit,
    );
    const trafficUsedLabel = formatBytes(trafficUsage.used);
    // 不限量时渲染成 ∞，让剩余值和"已用/上限"那行与限量情况保持一致
    //（"剩余 ∞" + "2.73 GB / ∞"）。
    const trafficLimitLabel = trafficUsage.unlimited ? "∞" : formatBytes(trafficUsage.limit);
    const trafficColor = trafficUsage.unlimited
      ? "var(--status-success)"
      : trafficUsageColor(trafficUsage.fraction);
    const traffic: TrafficDisplay = {
      fraction: trafficUsage.fraction,
      color: trafficColor,
      remainingLabel: trafficUsage.unlimited ? "∞" : formatBytes(trafficUsage.remaining),
      detail: `${trafficUsedLabel} / ${trafficLimitLabel}`,
      typeLabel: trafficTypeLabel(meta.traffic_limit_type),
    };

    return {
      node: { ...meta, ...metrics },
      trafficTrend,
      ping,
      pingBuckets,
      homepagePingLines,
      traffic,
      ...metaModel,
      ...pingModel,
      uptime: formatUptimeDays(metrics.uptime),
      loadFraction: Math.max(0, Math.min(1, metrics.load1 / loadBaseline)),
      upRate: formatByteRate(metrics.netUp),
      downRate: formatByteRate(metrics.netDown),
      isOnline: metrics.online === true,
      isOffline: metrics.online === false,
    };
  }, [
    homepagePingLines,
    meta,
    metrics,
    metaModel,
    pingModel,
    ping,
    pingBuckets,
    trafficTrend,
  ]);
}
