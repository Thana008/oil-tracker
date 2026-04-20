import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const DIR = {
  UP:     { Icon: TrendingUp,   label: 'ขึ้น',    color: 'var(--green)' },
  DOWN:   { Icon: TrendingDown, label: 'ลง',      color: 'var(--red)' },
  STABLE: { Icon: Minus,        label: 'ทรงตัว', color: 'var(--amber)' },
};

export default function PriceCard({ fuelType, fuelName, currentPrice, prediction, selected, onClick, horizonDays = 7 }) {
  const dir       = prediction?.direction || 'STABLE';
  const { Icon, label, color } = DIR[dir];
  const hasPrice  = typeof currentPrice === 'number' && !Number.isNaN(currentPrice);
  const confidence= hasPrice ? (prediction?.confidence ?? 0) : 0;
  const change    = hasPrice ? (prediction?.change ?? 0) : 0;

  return (
    <div
      role="button"
      tabIndex={0}
      id={`card-${fuelType}`}
      onClick={() => onClick(fuelType)}
      className="anim-in"
      style={{
        cursor: 'pointer',
        padding: '14px 16px',
        border: selected
          ? `1px solid var(--blue)`
          : '1px solid var(--divider)',
        borderTop: selected
          ? `2px solid var(--blue)`
          : `2px solid ${color}`,
        background: selected ? 'var(--blue-dim)' : 'var(--bg)',
        transition: 'background 0.15s, border-color 0.15s, box-shadow 0.15s',
        userSelect: 'none',
        boxShadow: selected ? '0 1px 6px rgba(41,98,255,0.10)' : '0 1px 3px rgba(0,0,0,0.04)',
      }}
      onMouseEnter={e => { if (!selected) e.currentTarget.style.background = 'var(--bg-hover)'; }}
      onMouseLeave={e => { if (!selected) e.currentTarget.style.background = 'var(--bg)'; }}
    >
      {/* Fuel label + direction */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{
          fontSize: 11, fontWeight: 500, color: 'var(--tx-3)',
          fontFamily: 'Sarabun, sans-serif', textTransform: 'uppercase', letterSpacing: '0.04em',
        }}>
          {fuelName}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 3, color }}>
          <Icon style={{ width: 11, height: 11 }} />
          <span style={{ fontSize: 10, fontWeight: 600 }}>{label}</span>
        </div>
      </div>

      {/* Price */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
        <span style={{
          fontSize: 20, fontWeight: 700, fontVariantNumeric: 'tabular-nums',
          color: hasPrice ? 'var(--tx-1)' : 'var(--tx-3)', lineHeight: 1,
        }}>
          {hasPrice ? currentPrice.toFixed(2) : '—'}
        </span>
        <span style={{ fontSize: 11, color: 'var(--tx-3)' }}>฿/ล.</span>
      </div>

      {/* Change */}
      <div style={{ fontSize: 11, color: hasPrice && change !== 0 ? color : 'var(--tx-3)', marginBottom: 8, fontVariantNumeric: 'tabular-nums' }}>
        {!hasPrice ? 'ไม่มีข้อมูล'
          : change !== 0 ? `${change > 0 ? '+' : ''}${change.toFixed(2)} ฿ (${horizonDays}d)`
          : 'ทรงตัว'}
      </div>

      {/* Confidence bar — paper-thin */}
      <div>
        <div style={{ height: 2, background: 'var(--divider)', borderRadius: 1, overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 1,
            background: color,
            width: `${confidence}%`,
            opacity: 0.6,
            transition: 'width 0.6s ease',
          }} />
        </div>
        <div style={{ fontSize: 10, color: 'var(--tx-3)', marginTop: 3, fontVariantNumeric: 'tabular-nums' }}>
          {hasPrice ? `${confidence}% confidence` : '—'}
        </div>
      </div>
    </div>
  );
}
