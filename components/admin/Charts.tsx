import React, { useMemo } from 'react';

type Series = {
  name: string;
  color: string;
  values: number[];
};

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

export const StackedBarChart: React.FC<{
  labels: string[];
  series: Series[];
  height?: number;
  width?: number;
  valuePrefix?: string;
  valueSuffix?: string;
}> = ({ labels, series, height = 160, width = 520, valuePrefix = '', valueSuffix = '' }) => {
  const safeLabels = labels || [];
  const safeSeries = series || [];
  const count = safeLabels.length;

  const { maxTotal, totals } = useMemo(() => {
    const totals = Array.from({ length: count }, (_, idx) =>
      safeSeries.reduce((sum, s) => sum + (Number(s.values?.[idx]) || 0), 0)
    );
    const maxTotal = Math.max(1, ...totals);
    return { maxTotal, totals };
  }, [count, safeSeries]);

  const padding = { top: 14, right: 12, bottom: 26, left: 12 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;
  const gap = 6;
  const barW = count > 0 ? Math.max(4, innerW / count - gap) : 0;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label="Stacked bar chart">
      {/* grid */}
      {[0.25, 0.5, 0.75, 1].map((t) => {
        const y = padding.top + innerH * (1 - t);
        return (
          <line
            key={t}
            x1={padding.left}
            x2={width - padding.right}
            y1={y}
            y2={y}
            stroke="rgba(148,163,184,0.35)"
            strokeDasharray="4 6"
          />
        );
      })}

      {/* bars */}
      {safeLabels.map((label, idx) => {
        const x = padding.left + idx * (barW + gap);
        let cursor = 0;
        const total = totals[idx] || 0;
        const fmt = (n: number) => `${valuePrefix}${n.toFixed(1)}${valueSuffix}`;
        const titleParts = safeSeries.map((s) => `${s.name}: ${fmt(Number(s.values?.[idx]) || 0)}`);
        const title = `${label}  •  Total: ${fmt(total)}  •  ${titleParts.join('  |  ')}`;

        return (
          <g key={label}>
            <title>{title}</title>
            {safeSeries.map((s) => {
              const v = Number(s.values?.[idx]) || 0;
              const h = (v / maxTotal) * innerH;
              const y = padding.top + innerH - cursor - h;
              cursor += h;
              return (
                <rect
                  key={`${label}-${s.name}`}
                  x={x}
                  y={y}
                  width={barW}
                  height={clamp(h, 0, innerH)}
                  fill={s.color}
                  rx={4}
                />
              );
            })}
          </g>
        );
      })}

      {/* x labels (every other to reduce clutter) */}
      {safeLabels.map((label, idx) => {
        if (count > 10 && idx % 2 === 1) return null;
        const x = padding.left + idx * (barW + gap) + barW / 2;
        return (
          <text
            key={`lbl-${label}`}
            x={x}
            y={height - 8}
            textAnchor="middle"
            fontSize="10"
            fill="rgba(100,116,139,0.9)"
          >
            {label}
          </text>
        );
      })}
    </svg>
  );
};

export const LineChart: React.FC<{
  labels: string[];
  values: number[];
  stroke?: string;
  height?: number;
  width?: number;
  valuePrefix?: string;
}> = ({ labels, values, stroke = '#0ea5e9', height = 160, width = 520, valuePrefix = '' }) => {
  const count = labels.length;
  const padding = { top: 14, right: 12, bottom: 26, left: 12 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;
  const maxV = Math.max(1, ...values.map((v) => Number(v) || 0));
  const minV = Math.min(0, ...values.map((v) => Number(v) || 0));
  const span = Math.max(1e-6, maxV - minV);

  const points = values
    .map((v, idx) => {
      const x = padding.left + (idx / Math.max(1, count - 1)) * innerW;
      const y = padding.top + innerH - ((Number(v) || 0) - minV) / span * innerH;
      return { x, y, v: Number(v) || 0, label: labels[idx] };
    })
    .map((p) => `${p.x},${p.y}`)
    .join(' ');

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label="Line chart">
      {[0.25, 0.5, 0.75, 1].map((t) => {
        const y = padding.top + innerH * (1 - t);
        return (
          <line
            key={t}
            x1={padding.left}
            x2={width - padding.right}
            y1={y}
            y2={y}
            stroke="rgba(148,163,184,0.35)"
            strokeDasharray="4 6"
          />
        );
      })}
      <polyline
        fill="none"
        stroke={stroke}
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
      {values.map((v, idx) => {
        const x = padding.left + (idx / Math.max(1, count - 1)) * innerW;
        const y = padding.top + innerH - ((Number(v) || 0) - minV) / span * innerH;
        return (
          <circle key={`dot-${idx}`} cx={x} cy={y} r="3" fill={stroke}>
            <title>{`${labels[idx]}  •  ${valuePrefix}${(Number(v) || 0).toFixed(2)}`}</title>
          </circle>
        );
      })}

      {labels.map((label, idx) => {
        if (count > 10 && idx % 2 === 1) return null;
        const x = padding.left + (idx / Math.max(1, count - 1)) * innerW;
        return (
          <text
            key={`lbl-${label}`}
            x={x}
            y={height - 8}
            textAnchor="middle"
            fontSize="10"
            fill="rgba(100,116,139,0.9)"
          >
            {label}
          </text>
        );
      })}
    </svg>
  );
};
