import { useState, useEffect } from 'react';
import { Fuel, RefreshCw } from 'lucide-react';

export default function Header({ brent, lastUpdated, onRefresh, loading }) {
  const [live, setLive] = useState(true);
  useEffect(() => {
    const t = setInterval(() => setLive(v => !v), 1800);
    return () => clearInterval(t);
  }, []);

  const fmt = (iso) => {
    if (!iso) return null;
    return new Date(iso).toLocaleString('th-TH', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' });
  };

  return (
    <header style={{
      background: 'var(--bg)',
      borderBottom: '1px solid var(--divider)',
      position: 'sticky', top: 0, zIndex: 50,
    }}>
      <div className="page-wrap">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 48, gap: 24 }}>

          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <Fuel style={{ width: 16, height: 16, color: 'var(--blue)' }} />
            <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--tx-1)', letterSpacing: '-0.01em' }}>
              Thai Oil AI
            </span>
            <span className="hidden sm:inline" style={{ color: 'var(--tx-3)', fontSize: 12 }}>
              / Price Intelligence
            </span>
          </div>

          {/* Right cluster */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>

            {/* Brent */}
            {brent != null && (
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--tx-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  BRENT
                </span>
                <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--tx-1)', fontVariantNumeric: 'tabular-nums' }}>
                  ${brent.toFixed(2)}
                </span>
                <span style={{ fontSize: 11, color: 'var(--tx-3)' }}>/bbl</span>
              </div>
            )}

            {/* Live dot + timestamp */}
            <div className="hidden md:flex" style={{ alignItems: 'center', gap: 6 }}>
              <span style={{
                width: 6, height: 6, borderRadius: '50%', background: 'var(--green)',
                opacity: live ? 1 : 0.3, transition: 'opacity 0.4s',
              }} />
              {lastUpdated && (
                <span style={{ fontSize: 11, color: 'var(--tx-3)', fontVariantNumeric: 'tabular-nums' }}>
                  {fmt(lastUpdated)}
                </span>
              )}
            </div>

            {/* Refresh */}
            <button
              onClick={onRefresh}
              disabled={loading}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '5px 12px', borderRadius: 4,
                background: 'var(--blue)', color: '#fff',
                border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: 12, fontWeight: 600, opacity: loading ? 0.6 : 1,
                transition: 'opacity 0.15s',
              }}
            >
              <RefreshCw style={{ width: 12, height: 12 }} className={loading ? 'spin' : ''} />
              <span className="hidden sm:inline">{loading ? 'Loading…' : 'Refresh'}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
