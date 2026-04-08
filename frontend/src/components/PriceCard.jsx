const ICONS = { UP: '📈', DOWN: '📉', STABLE: '➡️' };
const LABELS = { UP: 'ขึ้น', DOWN: 'ลง', STABLE: 'ทรงตัว' };
const DIR_CLASS = { UP: 'up', DOWN: 'down', STABLE: 'stable' };

export default function PriceCard({ fuelType, fuelName, currentPrice, prediction, selected, onClick }) {
  const dir = prediction?.direction || 'STABLE';
  const cls = DIR_CLASS[dir];
  const hasPrice = typeof currentPrice === 'number' && !Number.isNaN(currentPrice);
  const confidence = hasPrice ? (prediction?.confidence ?? 0) : 0;
  const change = hasPrice ? (prediction?.change ?? 0) : 0;

  return (
    <div
      className={`price-card ${cls} ${selected ? 'selected' : ''} fade-up`}
      onClick={() => onClick(fuelType)}
      role="button"
      tabIndex={0}
      id={`card-${fuelType}`}
    >
      <div className="pc-header">
        <div className="pc-name">{fuelName}</div>
        <div className={`pc-badge ${cls}`}>
          {ICONS[dir]} {LABELS[dir]}
        </div>
      </div>

      <div className="pc-price">
        {hasPrice ? currentPrice.toFixed(2) : '—'}
        <span className="unit">฿/ล.</span>
      </div>

      <div className={`pc-change ${cls}`}>
        {!hasPrice ? (
          <span style={{ color: 'var(--text-muted)' }}>ยังไม่มีข้อมูลราคาวันนี้</span>
        ) : change !== 0 ? (
          <>
            {change > 0 ? '▲' : '▼'} {Math.abs(change).toFixed(2)} ฿ (7 วัน)
          </>
        ) : (
          <span style={{ color: 'var(--text-muted)' }}>ทรงตัว</span>
        )}
      </div>

      <div className="pc-confidence">
        <div className="pc-confidence-bar">
          <div
            className={`pc-confidence-fill ${cls}`}
            style={{ width: `${confidence}%` }}
          />
        </div>
        <div className="pc-confidence-label">{hasPrice ? `ความมั่นใจ AI: ${confidence}%` : 'ความมั่นใจ AI: —'}</div>
      </div>
    </div>
  );
}
