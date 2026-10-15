import { useEffect, useId, useState } from "react";
import { parseNetworkHours } from "./networkRange";

interface NetworkRangeSelectorProps {
  ranges: { label: string; value: number }[];
  value: number;
  onChange: (value: number) => void;
  label?: string;
}

export function NetworkRangeSelector({ ranges, value, onChange, label = "网络监测时间范围" }: NetworkRangeSelectorProps) {
  const visibleRanges = ranges.filter((range) => range.value <= 24);
  const hasPreset = visibleRanges.some((range) => range.value === value);
  const [custom, setCustom] = useState(!hasPreset);
  const [draft, setDraft] = useState(String(value || 1));
  const [error, setError] = useState(false);
  const errorId = useId();
  const max = Math.max(1, ...ranges.map((range) => range.value));
  useEffect(() => {
    setDraft(String(value || 1));
    setError(false);
    if (!hasPreset) setCustom(true);
    if (value === 0) setCustom(false);
  }, [value, max, hasPreset]);

  const commit = () => {
    const hours = parseNetworkHours(draft, max);
    setError(hours === null);
    if (hours !== null && hours !== value) onChange(hours);
  };
  return (
    <div className="instance-custom-range-controls">
      <div className="instance-detail-range-group instance-network-ranges" role="group" aria-label={label}>
        {visibleRanges.map((range) => (
          <button type="button" key={range.value} aria-pressed={!custom && value === range.value}
            onClick={() => { setCustom(false); setError(false); onChange(range.value); }}>
            {range.label}
          </button>
        ))}
        <button type="button" title={`支持 1-${max} 小时`} aria-pressed={custom} onClick={() => { setCustom(true); setDraft(String(value || 1)); setError(false); }}>自定义</button>
      </div>
      {custom && <label className="node-network-custom-range">
        <span>最近</span>
        <input type="number" min={1} max={max} step={1} value={draft} aria-label={`${label}自定义小时`} title={`支持 1-${max} 小时`}
          aria-invalid={error} aria-describedby={error ? errorId : undefined}
          onChange={(event) => { setDraft(event.target.value); setError(false); }} onBlur={commit}
          onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); commit(); } }} />
        <span>小时</span>
      </label>}
      {custom && error && <span id={errorId} className="node-network-range-error" role="alert">请输入 1-{max} 的整数</span>}
    </div>
  );
}
