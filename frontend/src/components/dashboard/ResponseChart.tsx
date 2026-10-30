'use client';

import { useId, useMemo, useState } from 'react';
import { AreaClosed, LinePath } from '@visx/shape';
import { curveMonotoneX } from '@visx/curve';
import { scaleLinear } from '@visx/scale';
import { ParentSize } from '@visx/responsive';

export type ResponsePoint = { date: string; count: number; label: string };

type ChartProps = { data: ResponsePoint[]; periodLabel: string; bucket?: 'day' | 'month' };

function Plot({ data, width, periodLabel, bucket = 'day' }: ChartProps & { width: number }) {
  const id = useId().replace(/:/g, '');
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const height = 232;
  const left = 9;
  const right = 9;
  const top = 26;
  const baseline = 172;
  const railY = 195;
  const labelY = 222;
  const plotWidth = Math.max(1, width - left - right);
  const maximum = Math.max(0, ...data.map(point => point.count));
  const minimum = Math.min(...data.map(point => point.count));
  const peakIndex = maximum > minimum ? data.findIndex(point => point.count === maximum) : -1;
  const peak = peakIndex >= 0 ? data[peakIndex] : undefined;
  const x = useMemo(() => scaleLinear({ domain: [0, Math.max(1, data.length - 1)], range: [left, left + plotWidth] }), [data.length, plotWidth]);
  const y = useMemo(() => scaleLinear({ domain: [0, Math.max(1, maximum)], range: [baseline, top], nice: true }), [maximum]);
  const tickCount = width < 500 ? 3 : 5;
  const ticks = [...new Set(Array.from({ length: Math.min(tickCount, data.length) }, (_, index) => Math.round(index * (data.length - 1) / Math.max(1, Math.min(tickCount, data.length) - 1))))];
  const active = activeIndex === null ? undefined : data[activeIndex];
  const activeX = activeIndex === null ? 0 : x(activeIndex);
  const labelWidth = active ? active.label.length * 6 + 20 : 0;
  const labelLeft = Math.max(0, Math.min(width - labelWidth, activeX - labelWidth / 2));

  function inspectPointer(event: React.PointerEvent<SVGRectElement>) {
    const rect = event.currentTarget.ownerSVGElement?.getBoundingClientRect();
    if (rect) setActiveIndex(Math.max(0, Math.min(data.length - 1, Math.round(x.invert(event.clientX - rect.left)))));
  }

  return <>
    <div className="visx-response-chart" role="group" tabIndex={0} aria-label={`Responses for ${periodLabel}. Each point is a ${bucket} total. Use left and right arrow keys to explore; Home and End jump to the first and last point.`} onBlur={() => setActiveIndex(null)} onKeyDown={event => {
      if (event.key === 'Escape') { setActiveIndex(null); return; }
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      setActiveIndex(previous => event.key === 'Home' ? 0 : event.key === 'End' ? data.length - 1 : previous === null ? event.key === 'ArrowRight' ? 0 : data.length - 1 : Math.max(0, Math.min(data.length - 1, previous + (event.key === 'ArrowRight' ? 1 : -1))));
    }}>
      <svg width={width} height={height} aria-hidden="true" onPointerLeave={() => setActiveIndex(null)}>
        <defs><linearGradient id={`response-area-${id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--response-line)" stopOpacity={.075} /><stop offset="100%" stopColor="var(--response-line)" stopOpacity={0} /></linearGradient></defs>

        <text x={left} y={12} fill="var(--response-label)" fontSize={9}>{y.domain()[1]} responses</text>
        {ticks.map(index => <line key={`guide-${index}`} x1={x(index)} x2={x(index)} y1={top} y2={railY} stroke="var(--response-grid)" strokeDasharray="2 5" strokeOpacity={.55} />)}
        <line x1={left} x2={width - right} y1={baseline} y2={baseline} stroke="var(--response-grid)" strokeOpacity={.4} />

        <AreaClosed<ResponsePoint> data={data} curve={curveMonotoneX} x={(_, index) => x(index)} y={point => y(point.count)} yScale={y} fill={`url(#response-area-${id})`} />
        <LinePath<ResponsePoint> data={data} curve={curveMonotoneX} x={(_, index) => x(index)} y={point => y(point.count)} stroke="var(--response-line)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        {data.length === 1 && <circle cx={x(0)} cy={y(data[0].count)} r={3} fill="var(--response-line)" />}

        {data.map((point, index) => <circle key={point.date} cx={x(index)} cy={railY} r={1.8} fill="var(--response-tick)" />)}
        {peak && <rect className="response-peak-marker" x={x(peakIndex) - 4} y={railY - 23} width={8} height={27} rx={4} fill="var(--response-peak)" />}
        {ticks.map(index => (!active || Math.abs(x(index) - activeX) > labelWidth / 2 + 25) && <text key={index} x={x(index)} y={labelY} textAnchor={index === 0 ? 'start' : index === data.length - 1 ? 'end' : 'middle'} fill="var(--response-label)" fontSize={9}>{data[index]?.label}</text>)}

        {active && activeIndex !== null && <g>
          <line x1={activeX} x2={activeX} y1={top - 6} y2={railY + 6} stroke="var(--response-cursor)" strokeWidth={1} />
          <circle cx={activeX} cy={top - 6} r={3} fill="var(--card)" stroke="var(--response-cursor)" />
          <circle cx={activeX} cy={y(active.count)} r={4} fill="var(--card)" stroke="var(--response-line)" strokeWidth={2} />
          <rect x={labelLeft} y={labelY - 13} width={labelWidth} height={21} rx={10} fill="var(--response-selected-bg)" />
          <text x={labelLeft + labelWidth / 2} y={labelY + 1} textAnchor="middle" fill="var(--response-selected-text)" fontSize={9}>{active.label}</text>
        </g>}
        <rect className="response-chart-hit-area" x={left} y={top} width={plotWidth} height={height - top} fill="transparent" onPointerMove={inspectPointer} onPointerDown={inspectPointer} />
      </svg>

      {active && activeIndex !== null && <div className="response-chart-tooltip" style={{ left: Math.min(Math.max(0, activeX - 68), Math.max(0, width - 145)), top: y(active.count) < 80 ? y(active.count) + 17 : y(active.count) - 63 }}><span>{active.label}</span><strong>{active.count} {active.count === 1 ? 'response' : 'responses'}</strong>{activeIndex === peakIndex && <small>Period high</small>}</div>}
      <span className="sr-only" aria-live="polite">{active ? `${active.label}: ${active.count} responses${activeIndex === peakIndex ? ', period high' : ''}` : ''}</span>
    </div>
    <div className="response-chart-summary">{peak ? <span className="response-peak-summary"><i /><span>Peak {bucket}<strong>{peak.label}</strong><span>{peak.count} {peak.count === 1 ? 'response' : 'responses'}</span></span></span> : maximum > 0 ? <span>Steady at {maximum} {maximum === 1 ? 'response' : 'responses'} per {bucket}</span> : <span>No responses in this period.</span>}<span className="response-chart-granularity">{bucket === 'month' ? 'Monthly' : 'Daily'} totals</span></div>
  </>;
}

export function ResponseChart({ data, periodLabel, bucket = 'day' }: ChartProps) {
  if (!data.length) return <p className="analytics-empty">No responses in this period.</p>;
  return <div className="response-chart-container"><ParentSize debounceTime={20}>{({ width }) => width > 0 ? <Plot key={periodLabel} data={data} width={width} periodLabel={periodLabel} bucket={bucket} /> : null}</ParentSize></div>;
}
