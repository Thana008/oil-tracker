import { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import PriceCard from './components/PriceCard';
import PriceChart from './components/PriceChart';
import PredictionPanel from './components/PredictionPanel';
import BrandCompare from './components/BrandCompare';
import StatsGrid from './components/StatsGrid';
import { fetchCurrentPrices, fetchPredictions, fetchFuelPrediction } from './api/client';
import { AlertTriangle } from 'lucide-react';

const FUELS = [
  { key: 'diesel_b7',      name: 'ดีเซล B7' },
  { key: 'diesel_b10',     name: 'ดีเซล B10' },
  { key: 'diesel_b20',     name: 'ดีเซล B20' },
  { key: 'gasohol_91',     name: 'แก๊สโซฮอล์ 91' },
  { key: 'gasohol_95',     name: 'แก๊สโซฮอล์ 95' },
  { key: 'e20',            name: 'E20' },
  { key: 'e85',            name: 'E85' },
  { key: 'premium_diesel', name: 'ดีเซลพรีเมียม' },
];

export default function App() {
  const [priceData,      setPriceData]      = useState(null);
  const [predictions,    setPredictions]    = useState(null);
  const [selectedFuel,   setSelectedFuel]   = useState('diesel_b7');
  const [detailAnalysis, setDetailAnalysis] = useState(null);
  const [detailSummary,  setDetailSummary]  = useState(null);
  const [loading,        setLoading]        = useState(true);
  const [detailLoading,  setDetailLoading]  = useState(false);
  const [error,          setError]          = useState(null);
  const [horizonDays,    setHorizonDays]    = useState(7);

  const loadData = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [prRes, predRes] = await Promise.all([fetchCurrentPrices(), fetchPredictions(horizonDays)]);
      setPriceData(prRes);
      setPredictions(predRes.analysis);
    } catch (e) {
      setError('ไม่สามารถเชื่อมต่อ Backend ได้ · กรุณาตรวจสอบว่า Backend รันอยู่ที่ port 5001');
      console.error(e);
    } finally { setLoading(false); }
  }, [horizonDays]);

  const loadDetail = useCallback(async (fuel) => {
    setDetailLoading(true); setDetailAnalysis(null); setDetailSummary(null);
    try {
      const r = await fetchFuelPrediction(fuel, horizonDays);
      setDetailAnalysis(r.analysis);
      setDetailSummary(r.summary);
    } catch (e) { console.error(e); }
    finally { setDetailLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => { if (selectedFuel) loadDetail(selectedFuel); }, [selectedFuel, loadDetail, horizonDays]);
  useEffect(() => {
    const t = setInterval(loadData, 5 * 60 * 1000);
    return () => clearInterval(t);
  }, [loadData]);

  /* ── Initial loader ── */
  if (loading && !priceData) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
        <Header brent={null} lastUpdated={null} onRefresh={loadData} loading />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 12 }}>
          <div className="spin" style={{ width: 20, height: 20, border: '2px solid var(--divider)', borderTopColor: 'var(--blue)', borderRadius: '50%' }} />
          <span style={{ fontSize: 13, color: 'var(--tx-3)', fontFamily: 'Sarabun, sans-serif' }}>กำลังโหลด...</span>
        </div>
      </div>
    );
  }

  const prices      = priceData?.prices || {};
  const brent       = priceData?.brent;
  const lastUpdated = priceData?.timestamp;
  const selName     = FUELS.find(f => f.key === selectedFuel)?.name || selectedFuel;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Header brent={brent} lastUpdated={lastUpdated} onRefresh={loadData} loading={loading} />

      <main className="page-wrap" style={{ paddingTop: 32, paddingBottom: 64 }}>

        {/* Error */}
        {error && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
            background: 'var(--red-dim)', borderLeft: '3px solid var(--red)',
            marginBottom: 24, fontSize: 13, color: 'var(--red)',
          }}>
            <AlertTriangle style={{ width: 14, height: 14, flexShrink: 0 }} />
            <span style={{ fontFamily: 'Sarabun, sans-serif' }}>{error}</span>
          </div>
        )}

        {/* ══ SECTION 1: Market stats ══ */}
        <section style={{ marginBottom: 36 }}>
          <SectionLabel>ภาพรวมตลาด</SectionLabel>
          <StatsGrid prices={prices} predictions={predictions} />
        </section>

        <div className="divider" style={{ marginBottom: 36 }} />

        {/* ══ SECTION 2: Chart + AI panel (2-col) ══ */}
        <section style={{ marginBottom: 36 }}>
          <SectionLabel>วิเคราะห์แนวโน้ม</SectionLabel>

          {/* Horizon selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <span style={{ fontSize: 11, color: 'var(--tx-3)', fontFamily: 'Sarabun, sans-serif' }}>พยากรณ์ล่วงหน้า</span>
            {[3, 7, 14, 21, 30].map(d => (
              <button
                key={d}
                onClick={() => setHorizonDays(d)}
                style={{
                  padding: '4px 10px',
                  fontSize: 11,
                  fontWeight: horizonDays === d ? 700 : 500,
                  color: horizonDays === d ? 'var(--bg)' : 'var(--tx-2)',
                  background: horizonDays === d ? 'var(--blue)' : 'var(--card)',
                  border: `1px solid ${horizonDays === d ? 'var(--blue)' : 'var(--divider)'}`,
                  borderRadius: 4,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                {d} วัน
              </button>
            ))}
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0,1fr) 300px',
            gap: 0,
          }} className="chart-grid">
            {/* Left — fuel list + chart stacked */}
            <div style={{ minWidth: 0 }}>
              {/* Fuel price list — horizontal scroll on mobile, 4-col grid on desktop */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))',
                gap: 8,
                marginBottom: 28,
              }}>
                {FUELS.map(({ key, name }) => (
                  <PriceCard
                    key={key}
                    fuelType={key}
                    fuelName={name}
                    currentPrice={prices[key]}
                    prediction={predictions?.[key]}
                    selected={selectedFuel === key}
                    onClick={setSelectedFuel}
                    horizonDays={horizonDays}
                  />
                ))}
              </div>

              {/* Chart */}
              <PriceChart
                selectedFuel={selectedFuel}
                prediction={detailAnalysis || predictions?.[selectedFuel]}
                horizonDays={horizonDays}
              />
            </div>

            {/* Right — AI panel */}
            <PredictionPanel
              fuelName={selName}
              analysis={detailAnalysis || predictions?.[selectedFuel]}
              summary={detailSummary}
              loading={detailLoading}
              horizonDays={horizonDays}
            />
          </div>
        </section>

        <div className="divider" style={{ marginBottom: 36 }} />

        {/* ══ SECTION 3: Brand table ══ */}
        <section>
          <BrandCompare prices={prices} />
        </section>

      </main>

      {/* Responsive overrides */}
      <style>{`
        @media (max-width: 900px) {
          .chart-grid {
            grid-template-columns: 1fr !important;
          }
          .chart-grid > aside {
            border-left: none !important;
            padding-left: 0 !important;
            border-top: 1px solid var(--divider);
            padding-top: 24px;
            margin-top: 24px;
          }
        }
      `}</style>
    </div>
  );
}

/* ── Section label — tiny muted uppercase ── */
function SectionLabel({ children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <span style={{
        fontSize: 10, fontWeight: 700, color: 'var(--tx-3)',
        textTransform: 'uppercase', letterSpacing: '0.12em',
      }}>
        {children}
      </span>
    </div>
  );
}
