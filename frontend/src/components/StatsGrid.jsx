import { TrendingUp, TrendingDown, Minus, Target, Tag, Gem } from 'lucide-react';

const FUEL_NAMES = {
  diesel_b7: 'ดีเซล B7', diesel_b10: 'ดีเซล B10', diesel_b20: 'ดีเซล B20',
  gasohol_91: 'แก๊สโซฮอล์ 91', gasohol_95: 'แก๊สโซฮอล์ 95',
  e20: 'E20', e85: 'E85', premium_diesel: 'ดีเซลพรีเมียม',
};

export default function StatsGrid({ prices, predictions }) {
  if (!prices || !predictions) return null;

  const fuel   = Object.entries(prices).filter(([k]) => k !== 'source');
  const pred   = Object.entries(predictions);
  const up     = pred.filter(([, v]) => v?.direction === 'UP').length;
  const down   = pred.filter(([, v]) => v?.direction === 'DOWN').length;
  const stable = pred.filter(([, v]) => v?.direction === 'STABLE').length;
  const avgConf = pred.length
    ? Math.round(pred.reduce((s, [, v]) => s + (v?.confidence || 0), 0) / pred.length)
    : 0;
  const cheapest = fuel.reduce((a, b) => b[1] < a[1] ? b : a, fuel[0]);
  const mostExp  = fuel.reduce((a, b) => b[1] > a[1] ? b : a, fuel[0]);

  const stats = [
    { label: 'ราคาขึ้น',       value: up,                                valueColor: 'var(--green)',  sub: 'ชนิด' },
    { label: 'ราคาลง',         value: down,                              valueColor: 'var(--red)',    sub: 'ชนิด' },
    { label: 'ทรงตัว',         value: stable,                            valueColor: 'var(--amber)',  sub: 'ชนิด' },
    { label: 'AI Confidence', value: `${avgConf}%`,                      valueColor: 'var(--blue)',   sub: 'เฉลี่ย' },
    ...(cheapest ? [{ label: 'ถูกที่สุด', value: `${Number(cheapest[1]).toFixed(2)}`, valueColor: 'var(--green)', sub: FUEL_NAMES[cheapest[0]] || cheapest[0], suffix: ' ฿' }] : []),
    ...(mostExp  ? [{ label: 'แพงที่สุด', value: `${Number(mostExp[1]).toFixed(2)}`,  valueColor: 'var(--red)',   sub: FUEL_NAMES[mostExp[0]] || mostExp[0],   suffix: ' ฿' }] : []),
  ];

  return (
    /* Borderless stat row — separated only by vertical dividers */
    <div style={{ display: 'flex', overflowX: 'auto', gap: 0 }} className="anim-in">
      {stats.map((s, i) => (
        <div key={i} style={{ flex: '0 0 auto', display: 'flex', alignItems: 'stretch' }}>
          {i > 0 && <div className="divider-v" style={{ margin: '0 24px' }} />}
          <StatItem {...s} />
        </div>
      ))}
    </div>
  );
}

function StatItem({ label, value, valueColor, sub, suffix = '' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '2px 0', minWidth: 80 }}>
      <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--tx-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </span>
      <span style={{ fontSize: 24, fontWeight: 700, color: valueColor, fontVariantNumeric: 'tabular-nums', lineHeight: 1.1 }}>
        {value}{suffix}
      </span>
      <span style={{ fontSize: 11, color: 'var(--tx-3)', fontFamily: 'Sarabun, sans-serif' }}>
        {sub}
      </span>
    </div>
  );
}
