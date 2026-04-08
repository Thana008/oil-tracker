import { useState, useEffect, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Legend,
} from 'recharts';
import { fetchHistory } from '../api/client';

const FUEL_LABELS = {
  diesel_b7: 'ดีเซล B7', diesel_b10: 'ดีเซล B10', diesel_b20: 'ดีเซล B20',
  gasohol_91: 'แก๊สโซฮอล์ 91', gasohol_95: 'แก๊สโซฮอล์ 95',
  e20: 'E20', e85: 'E85', premium_diesel: 'ดีเซลพรีเมียม',
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#111b2e', border: '1px solid #1e2d47', borderRadius: 10,
      padding: '10px 14px', fontSize: 12,
    }}>
      <div style={{ color: '#7b92b5', marginBottom: 6 }}>{label}</div>
      {payload.map((p) => (
        <div key={p.name} style={{ color: p.color, marginBottom: 2 }}>
          {p.name}: {p.value != null ? `${Number(p.value).toFixed(2)} ฿` : '—'}
        </div>
      ))}
    </div>
  );
};

export default function PriceChart({ selectedFuel, prediction }) {
  const [data, setData] = useState([]);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(false);
  const [showSMA, setShowSMA] = useState(false);
  const [showForecastAI, setShowForecastAI] = useState(true);
  const [showForecastAlgo, setShowForecastAlgo] = useState(true);

  useEffect(() => {
    if (!selectedFuel) return;
    setLoading(true);
    fetchHistory(selectedFuel, days)
      .then(res => setData(res.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedFuel, days]);

  const predictedPrice = prediction?.predictedPrice;
  const statPredictedPrice = prediction?.statPredictedPrice;
  const direction = prediction?.direction || 'STABLE';
  const change = typeof prediction?.change === 'number' ? prediction.change : null;
  const changePercent = typeof prediction?.changePercent === 'number' ? prediction.changePercent : null;
  const aiModel = prediction?.aiModel;

  const hasCompare = typeof statPredictedPrice === 'number' && typeof predictedPrice === 'number' && !!aiModel;
  const predictedAI = hasCompare ? predictedPrice : null;
  const predictedAlgo = hasCompare ? statPredictedPrice : predictedPrice;

  const formatDate = (d) => {
    const dt = new Date(d);
    return `${dt.getDate()}/${dt.getMonth() + 1}`;
  };

  const chartData = useMemo(() => {
    const base = Array.isArray(data) ? [...data] : [];
    if (!base.length) return base;
    if (typeof predictedAlgo !== 'number' && typeof predictedAI !== 'number') return base;

    const lastReal = base[base.length - 1];
    if (lastReal && typeof lastReal.price === 'number') {
      if (typeof predictedAlgo === 'number') lastReal.predictedAlgo = lastReal.price;
      if (typeof predictedAI === 'number') lastReal.predictedAI = lastReal.price;
    }

    const lastDate = new Date(lastReal.date);
    lastDate.setDate(lastDate.getDate() + 7);
    base.push({
      date: lastDate.toISOString().split('T')[0],
      price: null,
      sma7: null,
      sma30: null,
      predictedAlgo: typeof predictedAlgo === 'number' ? predictedAlgo : null,
      predictedAI: typeof predictedAI === 'number' ? predictedAI : null,
    });

    return base;
  }, [data, predictedAI, predictedAlgo]);

  const lastRealDate = data?.length ? data[data.length - 1].date : null;
  const predictionDate = chartData?.length && (typeof predictedAlgo === 'number' || typeof predictedAI === 'number')
    ? chartData[chartData.length - 1].date
    : null;
  const lastRealPrice = data?.length ? data[data.length - 1].price : null;

  const jumpInfo = useMemo(() => {
    if (!Array.isArray(data) || data.length < 2) return null;
    const a = data[data.length - 2]?.price;
    const b = data[data.length - 1]?.price;
    if (typeof a !== 'number' || typeof b !== 'number' || a === 0) return null;
    const delta = b - a;
    const pct = (delta / a) * 100;
    if (Math.abs(pct) < 3 && Math.abs(delta) < 1) return null;
    return { delta, pct };
  }, [data]);

  const dirBadge = direction === 'UP'
    ? { label: 'แนวโน้มขึ้น', cls: 'up' }
    : direction === 'DOWN'
      ? { label: 'แนวโน้มลง', cls: 'down' }
      : { label: 'ทรงตัว', cls: 'stable' };

  return (
    <div className="chart-panel">
      <div className="chart-panel-header">
        <div>
          <div className="chart-panel-title">
            📊 กราฟราคา {FUEL_LABELS[selectedFuel] || selectedFuel}
          </div>
          <div className="chart-help">
            เส้นฟ้า = ราคาจริง • คาดการณ์สูตร/AI = จุด/เส้นล่วงหน้า (+7 วัน){showSMA ? ' • เส้นขีดคือค่าเฉลี่ย (SMA)' : ''}
          </div>
          <div className="chart-meta">
            <span className={`chart-badge ${dirBadge.cls}`}>{dirBadge.label}</span>
            {typeof lastRealPrice === 'number' && (
              <span className="chart-meta-item">
                ล่าสุด <strong>{lastRealPrice.toFixed(2)}</strong> ฿
              </span>
            )}
            {typeof predictedAlgo === 'number' && (
              <span className="chart-meta-item">
                สูตร <strong>{predictedAlgo.toFixed(2)}</strong> ฿
              </span>
            )}
            {typeof predictedAI === 'number' && (
              <span className="chart-meta-item">
                AI <strong>{predictedAI.toFixed(2)}</strong> ฿
              </span>
            )}
            {typeof change === 'number' && typeof changePercent === 'number' && (
              <span className={`chart-meta-item ${change >= 0 ? 'up' : 'down'}`}>
                {change >= 0 ? '+' : ''}{change.toFixed(2)} ฿ ({changePercent >= 0 ? '+' : ''}{changePercent.toFixed(2)}%)
              </span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="chart-legend">
            <span className="legend-item"><span className="legend-dot" style={{ background: '#38bdf8' }} /> ราคา</span>
            {showSMA && <span className="legend-item"><span className="legend-dot" style={{ background: '#f59e0b' }} /> SMA7</span>}
            {showSMA && <span className="legend-item"><span className="legend-dot" style={{ background: '#fb923c' }} /> SMA30</span>}
            {typeof predictedAlgo === 'number' && showForecastAlgo && <span className="legend-item"><span className="legend-dot" style={{ background: '#22c55e' }} /> คาดการณ์สูตร</span>}
            {typeof predictedAI === 'number' && showForecastAI && <span className="legend-item"><span className="legend-dot" style={{ background: '#a78bfa' }} /> คาดการณ์ AI</span>}
          </div>
          <div className="chart-toggles">
            <button className={`chart-chip ${showSMA ? 'active' : ''}`} onClick={() => setShowSMA(v => !v)} type="button">
              {showSMA ? 'ซ่อน SMA' : 'แสดง SMA'}
            </button>
            {typeof predictedAlgo === 'number' && (
              <button className={`chart-chip ${showForecastAlgo ? 'active' : ''}`} onClick={() => setShowForecastAlgo(v => !v)} type="button">
                {showForecastAlgo ? 'ซ่อนสูตร' : 'แสดงสูตร'}
              </button>
            )}
            {typeof predictedAI === 'number' && (
              <button className={`chart-chip ${showForecastAI ? 'active' : ''}`} onClick={() => setShowForecastAI(v => !v)} type="button">
                {showForecastAI ? 'ซ่อน AI' : 'แสดง AI'}
              </button>
            )}
          </div>
          <div className="chart-tabs">
            {[7, 14, 30, 60, 90].map(d => (
              <button key={d} className={`chart-tab ${days === d ? 'active' : ''}`} onClick={() => setDays(d)}>
                {d}ว
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
          กำลังโหลดข้อมูล...
        </div>
      ) : chartData.length === 0 ? (
        <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
          ยังไม่มีข้อมูลกราฟ
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e2d47" />
            <XAxis
              dataKey="date" tickFormatter={formatDate}
              tick={{ fill: '#4a607e', fontSize: 11 }} axisLine={false} tickLine={false}
              interval={Math.floor(chartData.length / 6)}
            />
            <YAxis
              tick={{ fill: '#4a607e', fontSize: 11 }} axisLine={false} tickLine={false}
              domain={['auto', 'auto']} tickFormatter={v => v.toFixed(1)}
            />
            <Tooltip content={<CustomTooltip />} />
            {lastRealDate && (
              <ReferenceLine
                x={lastRealDate}
                stroke="rgba(123,146,181,0.5)"
                strokeDasharray="4 4"
                ifOverflow="extendDomain"
                label={{ value: 'ล่าสุด', position: 'insideTopRight', fill: '#7b92b5', fontSize: 11 }}
              />
            )}
            {predictionDate && (showForecastAlgo || showForecastAI) && (
              <ReferenceLine
                x={predictionDate}
                stroke="rgba(167,139,250,0.6)"
                strokeDasharray="4 4"
                ifOverflow="extendDomain"
                label={{ value: '+7 วัน', position: 'insideTopRight', fill: '#a78bfa', fontSize: 11 }}
              />
            )}
            <Line
              type="monotone" dataKey="price" name="ราคา" stroke="#38bdf8"
              strokeWidth={2} dot={false} connectNulls={false}
            />
            {showSMA && (
              <Line
                type="monotone" dataKey="sma7" name="SMA7" stroke="#f59e0b"
                strokeWidth={1.5} dot={false} strokeDasharray="4 2" connectNulls
              />
            )}
            {showSMA && (
              <Line
                type="monotone" dataKey="sma30" name="SMA30" stroke="#fb923c"
                strokeWidth={1.5} dot={false} strokeDasharray="6 3" connectNulls
              />
            )}
            {typeof predictedAlgo === 'number' && showForecastAlgo && (
              <Line
                type="monotone" dataKey="predictedAlgo" name="คาดการณ์สูตร" stroke="#22c55e"
                strokeWidth={2} dot={{ fill: '#22c55e', r: 4 }} strokeDasharray="5 3" connectNulls
              />
            )}
            {typeof predictedAI === 'number' && showForecastAI && (
              <Line
                type="monotone" dataKey="predictedAI" name="คาดการณ์ AI" stroke="#a78bfa"
                strokeWidth={2} dot={{ fill: '#a78bfa', r: 5 }} strokeDasharray="5 3" connectNulls
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      )}

      {jumpInfo && (
        <div className="chart-note">
          มีการเปลี่ยนแปลงราคาในวันล่าสุด {jumpInfo.delta >= 0 ? '+' : ''}{jumpInfo.delta.toFixed(2)} ฿ ({jumpInfo.pct >= 0 ? '+' : ''}{jumpInfo.pct.toFixed(1)}%)
        </div>
      )}
    </div>
  );
}
