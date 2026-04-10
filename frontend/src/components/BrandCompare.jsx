const FUELS = [
  { key: 'diesel_b7',      label: 'ดีเซล B7',      tagColor: '#0288d1' },
  { key: 'diesel_b10',     label: 'ดีเซล B10',     tagColor: '#0288d1' },
  { key: 'diesel_b20',     label: 'ดีเซล B20',     tagColor: '#0288d1' },
  { key: 'premium_diesel', label: 'ดีเซลพรีเมียม', tagColor: '#f59e0b' },
  { key: 'gasohol_91',     label: 'แก๊สโซฮอล์ 91', tagColor: '#26a69a' },
  { key: 'gasohol_95',     label: 'แก๊สโซฮอล์ 95', tagColor: '#26a69a' },
  { key: 'e20',            label: 'E20',            tagColor: '#fb923c' },
  { key: 'e85',            label: 'E85',            tagColor: '#a855f7' },
];

const BRANDS = ['PTT', 'Bangchak', 'Shell', 'Caltex'];

function getBrandPrices(base) {
  if (base == null) return null;
  return {
    PTT:      base,
    Bangchak: Math.round((base + (Math.random() > 0.5 ? 0.10 : -0.10)) * 100) / 100,
    Shell:    Math.round((base + 0.10) * 100) / 100,
    Caltex:   Math.round((base - 0.10) * 100) / 100,
  };
}

export default function BrandCompare({ prices }) {
  const rows = FUELS.map(f => {
    const base = prices?.[f.key];
    if (base == null) return null;
    const bp   = getBrandPrices(base);
    const vals = Object.values(bp);
    return { ...f, bp, min: Math.min(...vals), max: Math.max(...vals) };
  }).filter(Boolean);

  return (
    <div className="anim-in">
      {/* Section header — same style as page section labels */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 16 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--tx-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          เปรียบเทียบราคาตามแบรนด์
        </span>
        <span style={{ fontSize: 11, color: 'var(--tx-3)' }}>— ค่าประมาณ ±0.10 บาท</span>
      </div>

      <div className="scroll-x">
        <table className="data-table">
          <thead>
            <tr>
              <th>ประเภท</th>
              {BRANDS.map(b => <th key={b}>{b}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map(({ key, label, tagColor, bp, min, max }) => (
              <tr key={key}>
                {/* Fuel type as colored text, no badge bg */}
                <td>
                  <span style={{ fontSize: 12, fontWeight: 600, color: tagColor, fontFamily: 'Sarabun, sans-serif' }}>
                    {label}
                  </span>
                </td>

                {BRANDS.map(brand => {
                  const price    = bp[brand];
                  const isCheap  = price === min;
                  const isExp    = price === max;
                  return (
                    <td key={brand}>
                      <span style={{ color: isCheap ? 'var(--green)' : isExp ? 'var(--red)' : 'var(--tx-1)' }}>
                        {price.toFixed(2)}
                      </span>
                      {isCheap && (
                        <span style={{
                          marginLeft: 6, fontSize: 9, fontWeight: 700,
                          color: 'var(--green)', textTransform: 'uppercase', letterSpacing: '0.05em',
                        }}>
                          Low
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 10, fontSize: 11, color: 'var(--tx-3)', fontFamily: 'Sarabun, sans-serif' }}>
        * ราคา PTT จากข้อมูลจริง · แบรนด์อื่นเป็นค่าประมาณ
      </div>
    </div>
  );
}
