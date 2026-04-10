import { useState, useEffect, useMemo } from 'react';
import {
  AreaChart, Area, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
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
  UP:     { Icon: TrendingUp,   color: 'var(--green)', label: 'ขึ้น' },
  DOWN:   { Icon: TrendingDown, color: 'var(--red)',   label: 'ลง' },
  STABLE: { Icon: Minus,        color: 'var(--amber)', label: 'ทรงตัว' },
};

/* ── Tooltip ─────────────────────────────────────── */
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const d = new Date(label);
  const dateStr = `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  return (
    <div className="tv-tooltip">
      <div style={{ color: 'var(--tx-3)', marginBottom: 6, fontSize: 11 }}>{dateStr}</div>
      {payload.filter(p => p.value != null && p.dataKey !== 'price_area').map(p => (
        <div key={p.dataKey} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
          <span style={{ width: 8, height: 2, background: p.color, display: 'inline-block' }} />
          <span style={{ color: 'var(--tx-2)', flex: 1, fontSize: 12 }}>{p.name}</span>
          <span style={{ color: p.color, fontWeight: 600, fontVariantNumeric: 'tabular-nums', fontSize: 12 }}>
            {Number(p.value).toFixed(2)} ฿
          </span>
        </div>
      ))}
    </div>
  );
};

/* ── Day button ──────────────────────────────────── */
function DayBtn({ d, active, onClick }) {
  return (
    <button
      onClick={() => onClick(d)}
      style={{
        padding: '3px 10px', fontSize: 12, fontWeight: active ? 600 : 400,
        color: active ? 'var(--blue)' : 'var(--tx-3)',
        background: active ? 'var(--blue-dim)' : 'transparent',
        border: 'none', borderRadius: 3, cursor: 'pointer',
        transition: 'all 0.15s',
      }}
    >
      {d}d
    </button>
  );
}

/* ── Toggle ──────────────────────────────────────── */
function Toggle({ active, label, color, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 5,
        padding: '3px 8px', fontSize: 11, fontWeight: 500,
        color: active ? color : 'var(--tx-3)',
        background: 'transparent', border: 'none', cursor: 'pointer',
        opacity: active ? 1 : 0.5, transition: 'opacity 0.15s',
      }}
    >
      <span style={{ width: 12, height: 2, background: color, display: 'inline-block', borderRadius: 1 }} />
      {label}
    </button>
  );
}

/* ── Main ────────────────────────────────────────── */
export default function PriceChart({ selectedFuel, prediction }) {
  const [data, setData]             = useState([]);
  const [days, setDays]             = useState(30);
  const [loading, setLoading]       = useState(false);
  const [showSMA, setShowSMA]       = useState(false);
  const [showAlgo, setShowAlgo]     = useState(true);
  const [showAI, setShowAI]         = useState(true);

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
  const aiModel    = prediction?.aiModel;
  const hasCompare = typeof statPrice === 'number' && typeof predPrice === 'number' && !!aiModel;
  const predictedAI   = hasCompare ? predPrice : null;
  const predictedAlgo = hasCompare ? statPrice : predPrice;

  const fmtDate = (d) => { const t = new Date(d); return `${t.getDate()}/${t.getMonth() + 1}`; };

  const chartData = useMemo(() => {
    const base = Array.isArray(data) ? [...data] : [];
    if (!base.length) return base;
    // Add area clone for the AreaChart fill
    base.forEach(r => { r.price_area = r.price; });
    if (typeof predictedAlgo !== 'number' && typeof predictedAI !== 'number') return base;
    const last = base[base.length - 1];
    if (last?.price != null) {
      if (typeof predictedAlgo === 'number') last.predictedAlgo = last.price;
      if (typeof predictedAI   === 'number') last.predictedAI   = last.price;
    }
    const nd = new Date(last.date); nd.setDate(nd.getDate() + 7);
    base.push({
      date: nd.toISOString().split('T')[0],
      price: null, price_area: null, sma7: null, sma30: null,
      predictedAlgo: typeof predictedAlgo === 'number' ? predictedAlgo : null,
      predictedAI:   typeof predictedAI   === 'number' ? predictedAI   : null,
    });
    return base;
  }, [data, predictedAI, predictedAlgo]);

  const lastReal  = data?.length ? data[data.length - 1] : null;
  const predDate  = chartData?.length && (typeof predictedAlgo === 'number' || typeof predictedAI === 'number')
    ? chartData[chartData.length - 1].date : null;

  const dm = DIR[direction] || DIR.STABLE;

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }} className="anim-in">

      {/* ── Chart header ── */}
      <div style={{ marginBottom: 16 }}>
        {/* Title row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--tx-1)' }}>
              {FUEL_LABELS[selectedFuel] || selectedFuel}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <dm.Icon style={{ width: 13, height: 13, color: dm.color }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: dm.color }}>{dm.label}</span>
            </div>
          </div>

          {/* Day range */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {[7, 14, 30, 60, 90].map(d => <DayBtn key={d} d={d} active={days === d} onClick={setDays} />)}
          </div>
        </div>

        {/* Meta row */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16, marginTop: 6 }}>
          {lastReal?.price != null && (
            <span style={{ fontSize: 12, color: 'var(--tx-2)' }}>
              ล่าสุด{' '}
              <strong style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--line-price)' }}>
                {lastReal.price.toFixed(2)} ฿
              </strong>
            </span>
          )}
          {typeof predictedAlgo === 'number' && (
            <span style={{ fontSize: 12, color: 'var(--tx-2)' }}>
              คาดการณ์{' '}
              <strong style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--line-algo)' }}>
                {predictedAlgo.toFixed(2)} ฿
              </strong>
            </span>
          )}
          {typeof change === 'number' && typeof changePct === 'number' && (
            <span style={{ fontSize: 12, fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: change >= 0 ? 'var(--green)' : 'var(--red)' }}>
              {change >= 0 ? '+' : ''}{change.toFixed(2)} ฿ ({changePct >= 0 ? '+' : ''}{changePct.toFixed(2)}%)
            </span>
          )}

          {/* Line toggles */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 'auto' }}>
            <Toggle active={showSMA}  label="SMA"     color="var(--line-sma7)"  onClick={() => setShowSMA(v => !v)} />
            {typeof predictedAlgo === 'number' && (
              <Toggle active={showAlgo} label="Formula" color="var(--line-algo)"  onClick={() => setShowAlgo(v => !v)} />
            )}
            {typeof predictedAI === 'number' && (
              <Toggle active={showAI}   label="AI"      color="var(--line-ai)"    onClick={() => setShowAI(v => !v)} />
            )}
          </div>
        </div>
      </div>

      {/* ── Chart body ── */}
      {loading ? (
        <div style={{ height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--tx-3)', fontSize: 13 }}>
          Loading…
        </div>
      ) : chartData.length === 0 ? (
        <div style={{ height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--tx-3)', fontSize: 13 }}>
          ยังไม่มีข้อมูล
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={chartData} margin={{ top: 4, right: 0, bottom: 4, left: -8 }}>
            <defs>
              <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#2962ff" stopOpacity={0.12} />
                <stop offset="95%" stopColor="#2962ff" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="0"
              stroke="var(--divider)"
              vertical={false}
            />
            <XAxis
              dataKey="date" tickFormatter={fmtDate}
              tick={{ fill: '#9da8b7', fontSize: 10, fontFamily: 'Inter' }}
              axisLine={false} tickLine={false}
              interval={Math.max(1, Math.floor(chartData.length / 6))} dy={4}
            />
            <YAxis
              tick={{ fill: '#9da8b7', fontSize: 10, fontFamily: 'Inter' }}
              axisLine={false} tickLine={false}
              domain={['auto', 'auto']}
              tickFormatter={v => v.toFixed(0)}
              width={34}
            />
            <Tooltip content={<ChartTooltip />} />

            {lastReal?.date && (
              <ReferenceLine
                x={lastReal.date}
                stroke="var(--divider-hi)"
                strokeDasharray="4 4"
                label={{ value: 'ล่าสุด', position: 'insideTopRight', fill: 'var(--tx-3)', fontSize: 9 }}
              />
            )}
            {predDate && (showAlgo || showAI) && (
              <ReferenceLine
                x={predDate}
                stroke="var(--line-algo)"
                strokeDasharray="4 4"
                strokeOpacity={0.4}
                label={{ value: '+7d', position: 'insideTopRight', fill: 'var(--line-algo)', fontSize: 9 }}
              />
            )}

            {/* Area fill for price */}
            <Area
              type="monotone" dataKey="price_area"
              stroke="none" fill="url(#priceGrad)"
              dot={false} connectNulls={false} legendType="none"
              isAnimationActive={false}
            />

            {/* Price line */}
            <Line
              type="monotone" dataKey="price" name="ราคาจริง"
              stroke="var(--line-price)" strokeWidth={1.5}
              dot={false} connectNulls={false}
              isAnimationActive={false}
            />

            {/* SMA */}
            {showSMA && (
              <Line type="monotone" dataKey="sma7"  name="SMA 7"  stroke="var(--line-sma7)"  strokeWidth={1} dot={false} strokeDasharray="3 2" connectNulls />
            )}
            {showSMA && (
              <Line type="monotone" dataKey="sma30" name="SMA 30" stroke="var(--line-sma30)" strokeWidth={1} dot={false} strokeDasharray="5 3" connectNulls />
            )}

            {/* Forecasts */}
            {typeof predictedAlgo === 'number' && showAlgo && (
              <Line type="monotone" dataKey="predictedAlgo" name="คาดการณ์สูตร"
                stroke="var(--line-algo)" strokeWidth={1.5}
                dot={{ r: 3, fill: 'var(--line-algo)', strokeWidth: 0 }}
                strokeDasharray="5 3" connectNulls />
            )}
            {typeof predictedAI === 'number' && showAI && (
              <Line type="monotone" dataKey="predictedAI" name="คาดการณ์ AI"
                stroke="var(--line-ai)" strokeWidth={1.5}
                dot={{ r: 4, fill: 'var(--line-ai)', strokeWidth: 0 }}
                strokeDasharray="5 3" connectNulls />
            )}
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
