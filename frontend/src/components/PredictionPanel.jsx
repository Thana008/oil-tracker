import { Brain, TrendingUp, TrendingDown, Minus, Activity, Sparkles } from 'lucide-react';

/* ── Emoji strip ──────────────────────────────────── */
function strip(str = '') {
  return str
    .replace(/[\u{1F000}-\u{1FFFF}]/gu, '')
    .replace(/[\u{2600}-\u{27FF}]/gu, '')
    .replace(/[\u{2B00}-\u{2BFF}]/gu, '')
    .replace(/[\u{FE00}-\u{FEFF}]/gu, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/* ── Signal classification ────────────────────────── */
function classify(raw) {
  const text = strip(raw);
  if (!text) return null;
  let tone = 'neutral';
  if (/bullish|ขาขึ้น|momentum.*up|sma7.*>|macd.*bull|ema.*up|\+\d/i.test(raw)) tone = 'up';
  else if (/bearish|ขาลง|downtrend|sma30.*>.*sma7|macd.*bear|-\d/i.test(raw)) tone = 'down';
  else if (/overbought|oversold|เสี่ยง|ระวัง|warning|rsi.*[><]/i.test(raw)) tone = 'warn';
  return { tone, text };
}

const TONE_COLOR = {
  up:      'var(--green)',
  down:    'var(--red)',
  warn:    'var(--amber)',
  neutral: 'var(--tx-3)',
};

const DIR = {
  UP:     { Icon: TrendingUp,   color: 'var(--green)', label: 'ราคาจะขึ้น' },
  DOWN:   { Icon: TrendingDown, color: 'var(--red)',   label: 'ราคาจะลง' },
  STABLE: { Icon: Minus,        color: 'var(--amber)', label: 'ราคาทรงตัว' },
};

/* ═══════════════════════════════════════════════════
   PredictionPanel
═══════════════════════════════════════════════════ */
export default function PredictionPanel({ fuelName, analysis, summary, loading, horizonDays = 7 }) {
  return (
    <aside style={{
      display: 'flex', flexDirection: 'column',
      borderLeft: '1px solid var(--divider)',
      paddingLeft: 28,
      minWidth: 0,
    }} className="anim-in">

      {/* Panel title */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Brain style={{ width: 14, height: 14, color: 'var(--blue)' }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--tx-1)' }}>AI วิเคราะห์</span>
        </div>
        {fuelName && (
          <span style={{ fontSize: 11, color: 'var(--tx-3)', fontFamily: 'Sarabun, sans-serif' }}>
            {fuelName}
          </span>
        )}
      </div>

      {loading && <Spinner />}
      {!loading && !analysis && <Empty />}
      {!loading && analysis && <Body analysis={analysis} summary={summary} horizonDays={horizonDays} />}
    </aside>
  );
}

/* ── Body ──────────────────────────────────────────── */
function Body({ analysis, summary, horizonDays = 7 }) {
  const {
    direction = 'STABLE', confidence = 0,
    currentPrice = 0, predictedPrice = 0,
    statPredictedPrice, aiModel,
    change = 0, changePercent = 0,
    signals = [], rsiValue, sma7,
  } = analysis;

  const d = DIR[direction] || DIR.STABLE;
  const hasCompare = typeof statPredictedPrice === 'number' && typeof predictedPrice === 'number' && !!aiModel;
  const predictedAlgo = hasCompare ? statPredictedPrice : predictedPrice;
  const diff = hasCompare ? predictedAlgo - predictedPrice : null;

  const cleanSignals = signals.slice(0, 6).map(classify).filter(Boolean);
  const cleanSummary = strip(summary || '');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, flex: 1 }}>

      {/* 1 ── Predicted price */}
      <Section>
        <Label>{d.label}</Label>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, margin: '6px 0 4px' }}>
          <d.Icon style={{ width: 16, height: 16, color: d.color, flexShrink: 0, alignSelf: 'center' }} />
          <span style={{
            fontSize: 36, fontWeight: 800, fontVariantNumeric: 'tabular-nums',
            color: d.color, lineHeight: 1, letterSpacing: '-0.02em',
          }}>
            {predictedPrice.toFixed(2)}
          </span>
          <span style={{ fontSize: 13, color: 'var(--tx-3)' }}>฿</span>
        </div>

        <div style={{ fontSize: 12, color: 'var(--tx-2)', lineHeight: 1.6, fontVariantNumeric: 'tabular-nums' }}>
          ปัจจุบัน{' '}
          <span style={{ color: 'var(--tx-1)', fontWeight: 600 }}>{currentPrice.toFixed(2)} ฿</span>
          {'  →  '}
          <span style={{ color: change >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 600 }}>
            {change >= 0 ? '+' : ''}{change.toFixed(2)} ฿ ({changePercent >= 0 ? '+' : ''}{changePercent.toFixed(2)}%)
          </span>
        </div>
        <div style={{ fontSize: 11, color: 'var(--tx-3)', marginTop: 2 }}>ภายใน {horizonDays} วันข้างหน้า</div>

        {hasCompare && diff !== null && (
          <div style={{ fontSize: 11, color: 'var(--tx-3)', marginTop: 6, paddingTop: 6, borderTop: '1px solid var(--divider)', fontVariantNumeric: 'tabular-nums' }}>
            สูตรคำนวณ{' '}
            <span style={{ color: 'var(--line-algo)', fontWeight: 600 }}>{predictedAlgo.toFixed(2)} ฿</span>
            {'  '}
            <span>({diff >= 0 ? '+' : ''}{diff.toFixed(2)} ฿ vs AI)</span>
          </div>
        )}
      </Section>

      {/* 2 ── Confidence */}
      <Section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <Label>AI Confidence</Label>
          <span style={{ fontSize: 13, fontWeight: 700, color: d.color, fontVariantNumeric: 'tabular-nums' }}>
            {confidence}%
          </span>
        </div>
        <div style={{ height: 3, background: 'var(--divider)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${confidence}%`,
            background: d.color,
            borderRadius: 2,
            transition: 'width 0.7s ease',
          }} />
        </div>
      </Section>

      {/* 3 ── RSI + SMA (2-col) */}
      {(rsiValue != null || sma7 != null) && (
        <Section>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {rsiValue != null && (
              <div>
                <Label>RSI</Label>
                <div style={{
                  fontSize: 22, fontWeight: 700, fontVariantNumeric: 'tabular-nums',
                  color: rsiValue > 70 ? 'var(--red)' : rsiValue < 30 ? 'var(--green)' : 'var(--tx-1)',
                  marginTop: 4, marginBottom: 2,
                }}>
                  {rsiValue.toFixed(1)}
                </div>
                <div style={{ fontSize: 10, color: 'var(--tx-3)' }}>
                  {rsiValue > 70 ? 'Overbought' : rsiValue < 30 ? 'Oversold' : 'Neutral'}
                </div>
              </div>
            )}
            {sma7 != null && (
              <div>
                <Label>SMA 7d</Label>
                <div style={{ fontSize: 22, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: 'var(--tx-1)', marginTop: 4, marginBottom: 2 }}>
                  {sma7.toFixed(2)}
                </div>
                <div style={{ fontSize: 10, color: 'var(--tx-3)' }}>฿/ลิตร</div>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* 4 ── Signals */}
      {cleanSignals.length > 0 && (
        <Section>
          <Label style={{ marginBottom: 10 }}>สัญญาณที่ตรวจพบ</Label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginTop: 8 }}>
            {cleanSignals.map(({ tone, text }, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
                <span style={{
                  width: 7, height: 7, borderRadius: '50%',
                  background: TONE_COLOR[tone],
                  flexShrink: 0, marginTop: 4,
                }} />
                <span style={{
                  fontSize: 12, color: 'var(--tx-2)', lineHeight: 1.5,
                  fontFamily: 'Sarabun, sans-serif',
                }}>
                  {text}
                </span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* 5 ── AI Summary */}
      {cleanSummary && (
        <div style={{
          padding: '12px 14px',
          background: 'var(--bg-muted)',
          borderTop: '1px solid var(--divider)',
          borderLeft: '2px solid var(--blue)',
          marginTop: 'auto',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <Sparkles style={{ width: 12, height: 12, color: 'var(--blue)' }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--blue)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              AI สรุป
            </span>
          </div>
          <p style={{ fontSize: 12, color: 'var(--tx-2)', lineHeight: 1.65, fontFamily: 'Sarabun, sans-serif' }}>
            {cleanSummary}
          </p>
        </div>
      )}
    </div>
  );
}

/* ── Helpers ───────────────────────────────────────── */
function Section({ children }) {
  return (
    <div style={{ padding: '16px 0', borderBottom: '1px solid var(--divider)' }}>
      {children}
    </div>
  );
}

function Label({ children, style }) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 600, color: 'var(--tx-3)',
      textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block',
      ...style,
    }}>
      {children}
    </span>
  );
}

function Spinner() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 0' }}>
      <div className="spin" style={{
        width: 24, height: 24, borderRadius: '50%',
        border: '2px solid var(--divider)',
        borderTopColor: 'var(--blue)',
      }} />
    </div>
  );
}

function Empty() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 0', color: 'var(--tx-3)', fontSize: 13, fontFamily: 'Sarabun, sans-serif' }}>
      เลือกประเภทน้ำมันเพื่อดูการวิเคราะห์
    </div>
  );
}
