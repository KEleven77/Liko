interface NetworkRangeSelectorProps {
  ranges: { label: string; value: number }[];
  value: number;
  onChange: (value: number) => void;
  label?: string;
}

export function NetworkRangeSelector({ ranges, value, onChange, label = "网络监测时间范围" }: NetworkRangeSelectorProps) {
  const [custom, setCustom] = useState(value > 24);
  const [draft, setDraft] = useState(String(value || 1));
  const [error, setError] = useState(false);
  const errorId = useId();
  const max = Math.max(1, ...ranges.map((range) => range.value));
  const commit = () => {
    const hours = Number(draft);
    const valid = Number.isInteger(hours) && hours >= 1 && hours <= max;
    setError(!valid);
    if (valid) onChange(hours);
  };
  return (
    <div className="instance-custom-range-controls">
    <div className="instance-detail-range-group instance-network-ranges" role="group" aria-label={label}>
      {ranges.filter((range) => range.value <= 24).map((range) => (
        <button type="button" key={range.value} aria-pressed={!custom && value === range.value}
          onClick={() => { setCustom(false); setError(false); onChange(range.value); }}>
          {range.label}
        </button>
      ))}
      <button type="button" aria-pressed={custom} onClick={() => { setCustom(true); setDraft(String(value || 1)); setError(false); }}>自定义</button>
    </div>
    {custom && <label className="node-network-custom-range">小时
      <input type="number" min={1} max={max} step={1} value={draft} aria-label={`${label}自定义小时`}
        aria-invalid={error} aria-describedby={error ? errorId : undefined}
        onChange={(event) => { setDraft(event.target.value); setError(false); }} onBlur={commit}
        onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); commit(); } }} />
      {error && <span id={errorId} role="alert">请输入 1-{max} 的整数</span>}
    </label>}
    </div>
  );
}
import { useId, useState } from "react";

