import { useState, useEffect } from 'react';

export default function Header({ brent, lastUpdated, onRefresh, loading }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const formatTime = (d) =>
    d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const formatUpdated = (iso) => {
    if (!iso) return 'ยังไม่ได้อัพเดต';
    const d = new Date(iso);
    return d.toLocaleString('th-TH', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' });
  };

  return (
    <header className="header">
      <div className="container">
        <div className="header-inner">
          <div className="header-brand">
            <div className="header-logo">⛽</div>
            <div>
              <div className="header-title">Thai Oil AI</div>
              <div className="header-subtitle">ราคาน้ำมันไทย + AI วิเคราะห์</div>
            </div>
          </div>

          <div className="header-right">
            {brent && (
              <div className="header-brent">
                <span className="brent-label">Brent</span>
                <span className="brent-price">${brent.toFixed(2)}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>/bbl</span>
              </div>
            )}
            <div className="source-badge">
              <div className="live-dot" />
              {formatUpdated(lastUpdated)}
            </div>
            <div className="header-time">{formatTime(time)}</div>
            <button className={`btn-refresh ${loading ? 'loading' : ''}`} onClick={onRefresh} disabled={loading}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                <path d="M21 3v5h-5" />
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                <path d="M8 16H3v5" />
              </svg>
              {loading ? 'กำลังโหลด...' : 'รีเฟรช'}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
