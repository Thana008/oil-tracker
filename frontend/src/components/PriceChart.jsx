import { useState, useEffect, useMemo } from 'react';
import {
  LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { fetchHistory } from '../api/client';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const FUEL_LABELS = {
  diesel_b7: 'ดีเซล B7', diesel_b10: 'ดีเซล B10', diesel_b20: 'ดีเซล B20',
  gasohol_91: 'แก๊สโซฮอล์ 91', gasohol_95: 'แก๊สโซฮอล์ 95',
  e20: 'E20', e85: 'E85', premium_diesel: 'ดีเซลพรีเมียม',
};

const DIR = {
  UP:     { Icon: TrendingUp,   color: '#26a69a', label: 'ขึ้น' },
  DOWN:   { Icon: TrendingDown, color: '#ef5350', label: 'ลง' },
  STABLE: { Icon: Minus,        color: '#f59e0b', label: 'ทรงตัว' },
};

/* ── Tooltip ─────────────────────────────────── */
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#fff',
      border: '1px solid #e0e0e0',
      borderRadius: 8,
      padding: '10px 14px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
      fontFamily: 'Inter, Sarabun, sans-serif',
      fontSize: 12,
    }}>
      <div style={{ color: '#999', marginBottom: 6, fontSize: 11, fontWeight: 600 }}>{label}</div>
      {payload.filter(p => p.value != null).map(p => (
        <div key={p.dataKey} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
          <span style={{
            width: 10, height: 10, borderRadius: '50%',
            background: p.color, display: 'inline-block',
            border: '2px solid #fff', boxShadow: `0 0 0 1px ${p.color}`,
          }} />
          <span style={{ color: '#666', flex: 1 }}>{p.name}</span>
          <span style={{ color: p.color, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
            {Number(p.value).toFixed(2)} ฿
          </span>
        </div>
      ))}
    </div>
  );
};

/* ── Legend ───────────────────────────────────── */
const CustomLegend = () => (
  <div style={{
    display: 'flex', justifyContent: 'center', gap: 24, flexWrap: 'wrap',
    marginTop: 16, fontSize: 13, fontFamily: 'Sarabun, Inter, sans-serif',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ display: 'inline-block', width: 24, height: 3, background: '#26a69a', borderRadius: 2 }} />
      <span style={{ color: '#26a69a', fontWeight: 600 }}>ราคาจริง</span>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ display: 'inline-block', width: 24, height: 2, background: '#8b5cf6', borderRadius: 2 }} />
      <span style={{ color: '#8b5cf6', fontWeight: 600 }}>SMA 7d</span>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ display: 'inline-block', width: 24, height: 2, background: '#3b82f6', borderRadius: 2 }} />
      <span style={{ color: '#3b82f6', fontWeight: 600 }}>SMA 30d</span>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ display: 'inline-block', width: 24, height: 3, background: '#c8893e', borderRadius: 2, backgroundImage: 'repeating-linear-gradient(90deg, #c8893e 0, #c8893e 4px, transparent 4px, transparent 8px)' }} />
      <span style={{ color: '#c8893e', fontWeight: 600 }}>พยากรณ์ (AI)</span>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ display: 'inline-block', width: 24, height: 3, background: '#9ca3af', borderRadius: 2, backgroundImage: 'repeating-linear-gradient(90deg, #9ca3af 0, #9ca3af 4px, transparent 4px, transparent 8px)' }} />
      <span style={{ color: '#9ca3af', fontWeight: 600 }}>พยากรณ์ (สูตรสถิติ)</span>
    </div>
  </div>
);

/* ── Day button ──────────────────────────────── */
function DayBtn({ d, active, onClick }) {
  return (
    <button
      onClick={() => onClick(d)}
      style={{
        padding: '4px 12px', fontSize: 12, fontWeight: active ? 700 : 400,
        color: active ? '#fff' : '#999',
        background: active ? '#26a69a' : 'transparent',
        border: active ? 'none' : '1px solid #e0e0e0',
        borderRadius: 6, cursor: 'pointer',
        transition: 'all 0.2s',
      }}
    >
      {d}d
    </button>
  );
}

/* ── Custom dot for lines ────────────────────── */
const ActualDot = (props) => {
  const { cx, cy, payload } = props;
  if (payload?.actual == null || !cx || !cy) return null;
  return (
    <circle cx={cx} cy={cy} r={5} fill="#26a69a" stroke="#fff" strokeWidth={2.5} />
  );
};

const ForecastAiDot = (props) => {
  const { cx, cy, payload } = props;
  if (payload?.forecast_ai == null || !cx || !cy) return null;
  return (
    <circle cx={cx} cy={cy} r={5} fill="#c8893e" stroke="#fff" strokeWidth={2.5} />
  );
};

const ForecastAlgoDot = (props) => {
  const { cx, cy, payload } = props;
  if (payload?.forecast_algo == null || !cx || !cy) return null;
  return (
    <circle cx={cx} cy={cy} r={5} fill="#9ca3af" stroke="#fff" strokeWidth={2.5} />
  );
};

/* ── Main ────────────────────────────────────── */
export default function PriceChart({ selectedFuel, prediction, horizonDays = 7 }) {
  const [data, setData]       = useState([]);
  const [days, setDays]       = useState(30);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedFuel) return;
    setLoading(true);
    fetchHistory(selectedFuel, days)
      .then(r => setData(r.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedFuel, days]);

  const predPrice  = prediction?.predictedPrice;
  const statPrice  = prediction?.statPredictedPrice;
  const direction  = prediction?.direction || 'STABLE';
  const change     = typeof prediction?.change === 'number' ? prediction.change : null;
  const changePct  = typeof prediction?.changePercent === 'number' ? prediction.changePercent : null;

  const chartData = useMemo(() => {
    const base = Array.isArray(data) ? [...data] : [];
    if (!base.length) return [];

    // Take last N records for the "actual" line
    const displayCount = Math.min(base.length, days);
    const sliced = base.slice(-displayCount);

    // Build chart points with D-labels
    const lastIdx = sliced.length - 1;
    const points = sliced.map((r, i) => ({
      label: `D${i - lastIdx}`,
      date: r.date,
      actual: r.price,
      sma7: r.sma7,
      sma30: r.sma30,
      forecast_ai: null,
      forecast_algo: null,
    }));

    const lastPrice = sliced[lastIdx]?.price;
    const aiTarget = typeof predPrice === 'number' ? predPrice : null;
    const algoTarget = typeof statPrice === 'number' ? statPrice : null;

    if (typeof lastPrice === 'number') {
      if (aiTarget !== null) points[points.length - 1].forecast_ai = lastPrice;
      if (algoTarget !== null) points[points.length - 1].forecast_algo = lastPrice;

      const forecastSteps = [];
      if (horizonDays > 1) {
        forecastSteps.push({ label: 'D+1', ratio: 1 / horizonDays });
      }
      const mid = Math.floor(horizonDays / 2);
      if (mid > 1 && mid < horizonDays) {
        forecastSteps.push({ label: `D+${mid}`, ratio: mid / horizonDays });
      }
      forecastSteps.push({ label: `D+${horizonDays}`, ratio: 1.0 });

      forecastSteps.forEach(({ label, ratio }) => {
        const nd = new Date(sliced[lastIdx].date);
        const daysOffset = parseInt(label.replace('D+', ''));
        nd.setDate(nd.getDate() + daysOffset);
        
        const pt = { label, date: nd.toISOString().split('T')[0], actual: null };
        if (aiTarget !== null) {
          const totalChangeAI = aiTarget - lastPrice;
          pt.forecast_ai = Math.round((lastPrice + totalChangeAI * ratio) * 100) / 100;
        }
        if (algoTarget !== null) {
          const totalChangeAlgo = algoTarget - lastPrice;
          pt.forecast_algo = Math.round((lastPrice + totalChangeAlgo * ratio) * 100) / 100;
        }
        points.push(pt);
      });
    }

    return points;
  }, [data, days, predPrice, statPrice, horizonDays]);

  const dm = DIR[direction] || DIR.STABLE;
  const lastActual = data?.length ? data[data.length - 1] : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }} className="anim-in">

      {/* ── Chart header ── */}
      <div style={{ marginBottom: 16 }}>
        {/* Title row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--tx-1)' }}>
              {FUEL_LABELS[selectedFuel] || selectedFuel}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <dm.Icon style={{ width: 14, height: 14, color: dm.color }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: dm.color }}>{dm.label}</span>
            </div>
          </div>

          {/* Day range */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {[7, 14, 30, 60, 90].map(d => <DayBtn key={d} d={d} active={days === d} onClick={setDays} />)}
          </div>
        </div>

        {/* Meta row */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16, marginTop: 8 }}>
          {lastActual?.price != null && (
            <span style={{ fontSize: 13, color: '#666' }}>
              ราคาล่าสุด{' '}
              <strong style={{ fontVariantNumeric: 'tabular-nums', color: '#26a69a', fontSize: 15 }}>
                {lastActual.price.toFixed(2)} ฿
              </strong>
            </span>
          )}
          {typeof predPrice === 'number' && (
            <span style={{ fontSize: 13, color: '#666' }}>
              คาดการณ์ {horizonDays} วัน{' '}
              <strong style={{ fontVariantNumeric: 'tabular-nums', color: '#c8893e', fontSize: 15 }}>
                {predPrice.toFixed(2)} ฿
              </strong>
            </span>
          )}
          {typeof change === 'number' && typeof changePct === 'number' && (
            <span style={{
              fontSize: 13, fontWeight: 700, fontVariantNumeric: 'tabular-nums',
              color: change >= 0 ? '#26a69a' : '#ef5350',
              background: change >= 0 ? 'rgba(38,166,154,0.1)' : 'rgba(239,83,80,0.1)',
              padding: '2px 8px', borderRadius: 4,
            }}>
              {change >= 0 ? '+' : ''}{change.toFixed(2)} ฿ ({changePct >= 0 ? '+' : ''}{changePct.toFixed(2)}%)
            </span>
          )}
        </div>
      </div>

      {/* ── Chart body ── */}
      {loading ? (
        <div style={{ height: 350, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', fontSize: 13 }}>
          <div className="spin" style={{ width: 18, height: 18, border: '2px solid #e0e0e0', borderTopColor: '#26a69a', borderRadius: '50%', marginRight: 10 }} />
          Loading…
        </div>
      ) : chartData.length === 0 ? (
        <div style={{ height: 350, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', fontSize: 13 }}>
          ยังไม่มีข้อมูล
        </div>
      ) : (
        <div>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={chartData} margin={{ top: 20, right: 30, bottom: 10, left: 0 }}>
              <CartesianGrid
                strokeDasharray="4 4"
                stroke="#f0f0f0"
                vertical={true}
              />
              <XAxis
                dataKey="label"
                tick={{ fill: '#999', fontSize: 12, fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
                axisLine={{ stroke: '#e0e0e0' }}
                tickLine={false}
                dy={8}
              />
              <YAxis
                tick={{ fill: '#b0b0b0', fontSize: 12, fontFamily: 'Inter, sans-serif' }}
                axisLine={false}
                tickLine={false}
                domain={['auto', 'auto']}
                tickFormatter={v => v.toFixed(0)}
                width={40}
              />
              <Tooltip content={<ChartTooltip />} />

              {/* Vertical dashed line at D+0 (boundary) */}
              <ReferenceLine
                x="D+0"
                stroke="#ccc"
                strokeDasharray="4 4"
                strokeWidth={1}
              />

              {/* ━━ Actual price line ━━ */}
              <Line
                type="monotone"
                dataKey="actual"
                name="ราคาจริง"
                stroke="#26a69a"
                strokeWidth={2.5}
                dot={<ActualDot />}
                activeDot={{ r: 7, fill: '#26a69a', stroke: '#fff', strokeWidth: 3 }}
                connectNulls={false}
                isAnimationActive={true}
                animationDuration={800}
              />

              {/* ━━ SMA Lines ━━ */}
              <Line
                type="monotone"
                dataKey="sma7"
                name="SMA 7d"
                stroke="#8b5cf6"
                strokeWidth={1.5}
                dot={false}
                activeDot={{ r: 5, fill: '#8b5cf6', stroke: '#fff', strokeWidth: 2 }}
                connectNulls={true}
                isAnimationActive={true}
                animationDuration={800}
              />
              <Line
                type="monotone"
                dataKey="sma30"
                name="SMA 30d"
                stroke="#3b82f6"
                strokeWidth={1.5}
                dot={false}
                activeDot={{ r: 5, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}
                connectNulls={true}
                isAnimationActive={true}
                animationDuration={800}
              />

              {/* ━━ Forecast AI line ━━ */}
              <Line
                type="monotone"
                dataKey="forecast_ai"
                name="พยากรณ์ (AI)"
                stroke="#c8893e"
                strokeWidth={2.5}
                strokeDasharray="8 5"
                dot={<ForecastAiDot />}
                activeDot={{ r: 7, fill: '#c8893e', stroke: '#fff', strokeWidth: 3 }}
                connectNulls={true}
                isAnimationActive={true}
                animationDuration={800}
              />

              {/* ━━ Forecast Algo line ━━ */}
              <Line
                type="monotone"
                dataKey="forecast_algo"
                name="พยากรณ์ (สูตรสถิติ)"
                stroke="#9ca3af"
                strokeWidth={2.5}
                strokeDasharray="5 5"
                dot={<ForecastAlgoDot />}
                activeDot={{ r: 7, fill: '#9ca3af', stroke: '#fff', strokeWidth: 3 }}
                connectNulls={true}
                isAnimationActive={true}
                animationDuration={800}
              />
            </LineChart>
          </ResponsiveContainer>

          {/* Custom Legend */}
          <CustomLegend />
        </div>
      )}
    </div>
  );
}
