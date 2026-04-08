import { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import PriceCard from './components/PriceCard';
import PriceChart from './components/PriceChart';
import PredictionPanel from './components/PredictionPanel';
import BrandCompare from './components/BrandCompare';
import StatsGrid from './components/StatsGrid';
import { fetchCurrentPrices, fetchPredictions, fetchFuelPrediction } from './api/client';

const FUELS = [
  { key: 'diesel_b7', name: 'ดีเซล B7' },
  { key: 'diesel_b10', name: 'ดีเซล B10' },
  { key: 'diesel_b20', name: 'ดีเซล B20' },
  { key: 'gasohol_91', name: 'แก๊สโซฮอล์ 91' },
  { key: 'gasohol_95', name: 'แก๊สโซฮอล์ 95' },
  { key: 'e20', name: 'E20' },
  { key: 'e85', name: 'E85' },
  { key: 'premium_diesel', name: 'ดีเซลพรีเมียม' },
];

export default function App() {
  const [priceData, setPriceData] = useState(null);
  const [predictions, setPredictions] = useState(null);
  const [selectedFuel, setSelectedFuel] = useState('diesel_b7');
  const [detailAnalysis, setDetailAnalysis] = useState(null);
  const [detailSummary, setDetailSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [priceRes, predRes] = await Promise.all([
        fetchCurrentPrices(),
        fetchPredictions(),
      ]);
      setPriceData(priceRes);
      setPredictions(predRes.analysis);
    } catch (err) {
      setError('ไม่สามารถเชื่อมต่อ Backend ได้ กรุณาตรวจสอบว่า Backend รันอยู่ที่ port 5001');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadDetail = useCallback(async (fuel) => {
    setDetailLoading(true);
    setDetailAnalysis(null);
    setDetailSummary(null);
    try {
      const res = await fetchFuelPrediction(fuel);
      setDetailAnalysis(res.analysis);
      setDetailSummary(res.summary);
    } catch (err) {
      console.error(err);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (selectedFuel) loadDetail(selectedFuel);
  }, [selectedFuel, loadDetail]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(loadData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadData]);

  const handleFuelSelect = (fuel) => {
    setSelectedFuel(fuel);
  };

  if (loading && !priceData) {
    return (
      <div className="app">
        <Header brent={null} lastUpdated={null} onRefresh={loadData} loading={loading} />
        <div className="container">
          <div className="loading-screen">
            <div className="spinner" />
            <div className="loading-text">กำลังโหลดราคาน้ำมัน...</div>
          </div>
        </div>
      </div>
    );
  }

  const prices = priceData?.prices || {};
  const brent = priceData?.brent;
  const lastUpdated = priceData?.timestamp;

  return (
    <div className="app">
      <Header brent={brent} lastUpdated={lastUpdated} onRefresh={loadData} loading={loading} />

      <main className="main">
        <div className="container">
          <div className="grid-main">

            {error && <div className="error-box">⚠️ {error}</div>}

            {/* Stats */}
            <div>
              <div className="section-heading">📊 ภาพรวมตลาด</div>
              <StatsGrid prices={prices} predictions={predictions} />
            </div>

            {/* Price Cards */}
            <div>
              <div className="section-heading">⛽ ราคาน้ำมันวันนี้ — คลิกเพื่อดูกราฟ</div>
              <div className="price-cards-grid">
                {FUELS.map(({ key, name }) => (
                  <PriceCard
                    key={key}
                    fuelType={key}
                    fuelName={name}
                    currentPrice={prices[key]}
                    prediction={predictions?.[key]}
                    selected={selectedFuel === key}
                    onClick={handleFuelSelect}
                  />
                ))}
              </div>
            </div>

            {/* Chart + Prediction */}
            <div className="grid-2col">
              <PriceChart
                selectedFuel={selectedFuel}
                prediction={detailAnalysis || predictions?.[selectedFuel]}
              />
              <PredictionPanel
                fuelName={FUELS.find(f => f.key === selectedFuel)?.name || selectedFuel}
                analysis={detailAnalysis || predictions?.[selectedFuel]}
                summary={detailSummary}
                loading={detailLoading}
              />
            </div>

            {/* Brand Compare */}
            <BrandCompare prices={prices} />

          </div>
        </div>
      </main>
    </div>
  );
}
