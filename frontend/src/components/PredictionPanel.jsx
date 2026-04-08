const DIR = {
  UP: { icon: '📈', label: 'ราคาจะ ขึ้น', cls: 'up' },
  DOWN: { icon: '📉', label: 'ราคาจะ ลง', cls: 'down' },
  STABLE: { icon: '➡️', label: 'ราคา ทรงตัว', cls: 'stable' },
};

export default function PredictionPanel({ fuelName, analysis, summary, loading }) {
  if (loading) {
    return (
      <div className="prediction-panel">
        <div className="prediction-header">
          <div className="prediction-title">🤖 AI วิเคราะห์</div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
          <div className="spinner" />
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="prediction-panel">
        <div className="prediction-header">
          <div className="prediction-title">🤖 AI วิเคราะห์</div>
        </div>
        <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px 0', fontFamily: 'Sarabun, sans-serif' }}>
          เลือกประเภทน้ำมันเพื่อดูการวิเคราะห์
        </div>
      </div>
    );
  }

  const { direction = 'STABLE', confidence = 0, currentPrice = 0, predictedPrice = 0, statPredictedPrice, aiModel, change = 0, changePercent = 0, signals = [], rsiValue, sma7, sma30 } = analysis;
  const d = DIR[direction] || DIR.STABLE;
  const hasCompare = typeof statPredictedPrice === 'number' && typeof predictedPrice === 'number' && !!aiModel;
  const predictedAI = hasCompare ? predictedPrice : null;
  const predictedAlgo = hasCompare ? statPredictedPrice : predictedPrice;
  const diff = hasCompare ? (predictedAlgo - predictedAI) : null;

  return (
    <div className="prediction-panel fade-up">
      <div className="prediction-header">
        <div className="prediction-title">🤖 AI วิเคราะห์</div>
        <div className="prediction-fuel-badge">{fuelName}</div>
      </div>

      {/* Direction */}
      <div className={`prediction-direction ${d.cls}`}>
        <div className="pred-icon">{d.icon}</div>
        <div className="pred-label">{d.label}</div>
        <div className={`pred-price ${d.cls}`}>
          {predictedPrice.toFixed(2)} ฿
        </div>
        <div className="pred-change">
          ปัจจุบัน {currentPrice.toFixed(2)} ฿ →{' '}
          <strong style={{ color: change >= 0 ? 'var(--emerald)' : 'var(--rose)' }}>
            {change >= 0 ? '+' : ''}{change.toFixed(2)} ฿ ({changePercent >= 0 ? '+' : ''}{changePercent.toFixed(2)}%)
          </strong>
        </div>
        <div className="pred-change" style={{ fontSize: 11 }}>ภายใน 7 วันข้างหน้า</div>
        {hasCompare && (
          <div className="pred-change" style={{ fontSize: 11 }}>
            สูตร: <strong>{predictedAlgo.toFixed(2)} ฿</strong>
            {' '}| ต่างจาก AI ({aiModel}) {diff >= 0 ? '+' : ''}{diff.toFixed(2)} ฿
          </div>
        )}
      </div>

      {/* Confidence */}
      <div className="confidence-meter">
        <div className="confidence-label">
          <span>ความมั่นใจ AI</span>
          <span style={{ color: d.cls === 'up' ? 'var(--emerald)' : d.cls === 'down' ? 'var(--rose)' : 'var(--amber)' }}>
            {confidence}%
          </span>
        </div>
        <div className="confidence-bar">
          <div className={`confidence-fill ${d.cls}`} style={{ width: `${confidence}%` }} />
        </div>
      </div>

      {/* Indicators */}
      {(rsiValue != null || sma7 != null) && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {rsiValue != null && (
            <div className="stat-card" style={{ padding: '12px', gap: 4 }}>
              <div className="stat-label">RSI</div>
              <div className="stat-value" style={{
                fontSize: 18,
                color: rsiValue > 70 ? 'var(--rose)' : rsiValue < 30 ? 'var(--emerald)' : 'var(--text-primary)'
              }}>
                {rsiValue.toFixed(1)}
              </div>
              <div className="stat-sub">{rsiValue > 70 ? 'Overbought' : rsiValue < 30 ? 'Oversold' : 'Neutral'}</div>
            </div>
          )}
          {sma7 != null && (
            <div className="stat-card" style={{ padding: '12px', gap: 4 }}>
              <div className="stat-label">SMA 7 วัน</div>
              <div className="stat-value" style={{ fontSize: 18 }}>{sma7.toFixed(2)}</div>
              <div className="stat-sub">฿/ลิตร</div>
            </div>
          )}
        </div>
      )}

      {/* Signals */}
      <div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
          สัญญาณที่ตรวจพบ
        </div>
        <div className="signals-list">
          {signals.slice(0, 5).map((s, i) => (
            <div key={i} className="signal-item">{s}</div>
          ))}
        </div>
      </div>

      {/* Gemini / AI Summary */}
      {summary && (
        <div className="gemini-box">
          <div className="gemini-header">
            <span>✨</span>
            <span>AI สรุปการวิเคราะห์</span>
          </div>
          <div className="gemini-text">{summary}</div>
        </div>
      )}
    </div>
  );
}
