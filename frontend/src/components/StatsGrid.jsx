export default function StatsGrid({ prices, predictions }) {
  if (!prices || !predictions) return null;

  const fuelEntries = Object.entries(prices).filter(([k]) => k !== 'source');
  const predEntries = Object.entries(predictions);

  const upCount = predEntries.filter(([, v]) => v?.direction === 'UP').length;
  const downCount = predEntries.filter(([, v]) => v?.direction === 'DOWN').length;
  const stableCount = predEntries.filter(([, v]) => v?.direction === 'STABLE').length;
  const avgConfidence = predEntries.length
    ? Math.round(predEntries.reduce((sum, [, v]) => sum + (v?.confidence || 0), 0) / predEntries.length)
    : 0;

  const cheapest = fuelEntries.reduce((a, b) => (b[1] < a[1] ? b : a), fuelEntries[0]);
  const mostExpensive = fuelEntries.reduce((a, b) => (b[1] > a[1] ? b : a), fuelEntries[0]);

  const FUEL_NAMES = {
    diesel_b7: 'ดีเซล B7', diesel_b10: 'ดีเซล B10', diesel_b20: 'ดีเซล B20',
    gasohol_91: 'แก๊สโซฮอล์ 91', gasohol_95: 'แก๊สโซฮอล์ 95',
    e20: 'E20', e85: 'E85', premium_diesel: 'ดีเซลพรีเมียม',
  };

  return (
    <div className="stats-grid fade-up">
      <div className="stat-card">
        <div className="stat-icon">📈</div>
        <div className="stat-label">แนวโน้มขึ้น</div>
        <div className="stat-value" style={{ color: 'var(--emerald)' }}>{upCount}</div>
        <div className="stat-sub">ประเภทน้ำมัน</div>
      </div>
      <div className="stat-card">
        <div className="stat-icon">📉</div>
        <div className="stat-label">แนวโน้มลง</div>
        <div className="stat-value" style={{ color: 'var(--rose)' }}>{downCount}</div>
        <div className="stat-sub">ประเภทน้ำมัน</div>
      </div>
      <div className="stat-card">
        <div className="stat-icon">➡️</div>
        <div className="stat-label">ทรงตัว</div>
        <div className="stat-value" style={{ color: 'var(--amber)' }}>{stableCount}</div>
        <div className="stat-sub">ประเภทน้ำมัน</div>
      </div>
      <div className="stat-card">
        <div className="stat-icon">🎯</div>
        <div className="stat-label">ความมั่นใจเฉลี่ย</div>
        <div className="stat-value" style={{ color: 'var(--sky)' }}>{avgConfidence}%</div>
        <div className="stat-sub">AI Confidence</div>
      </div>
      {cheapest && (
        <div className="stat-card">
          <div className="stat-icon">🏷️</div>
          <div className="stat-label">ถูกที่สุด</div>
          <div className="stat-value" style={{ color: 'var(--emerald)', fontSize: 18 }}>
            {Number(cheapest[1]).toFixed(2)} ฿
          </div>
          <div className="stat-sub">{FUEL_NAMES[cheapest[0]] || cheapest[0]}</div>
        </div>
      )}
      {mostExpensive && (
        <div className="stat-card">
          <div className="stat-icon">💎</div>
          <div className="stat-label">แพงที่สุด</div>
          <div className="stat-value" style={{ color: 'var(--rose)', fontSize: 18 }}>
            {Number(mostExpensive[1]).toFixed(2)} ฿
          </div>
          <div className="stat-sub">{FUEL_NAMES[mostExpensive[0]] || mostExpensive[0]}</div>
        </div>
      )}
    </div>
  );
}
