const FUELS = [
  { key: 'diesel_b7', label: 'ดีเซล B7', tag: 'diesel' },
  { key: 'diesel_b10', label: 'ดีเซล B10', tag: 'diesel' },
  { key: 'diesel_b20', label: 'ดีเซล B20', tag: 'diesel' },
  { key: 'premium_diesel', label: 'ดีเซลพรีเมียม', tag: 'premium' },
  { key: 'gasohol_91', label: 'แก๊สโซฮอล์ 91', tag: 'gasohol' },
  { key: 'gasohol_95', label: 'แก๊สโซฮอล์ 95', tag: 'gasohol' },
  { key: 'e20', label: 'E20', tag: 'e20' },
  { key: 'e85', label: 'E85', tag: 'e85' },
];

// Simulate slight brand differences (±0.10~0.20 THB)
function getBrandPrices(basePrice) {
  if (!basePrice) return {};
  return {
    PTT: basePrice,
    Bangchak: Math.round((basePrice + (Math.random() > 0.5 ? 0.1 : -0.1)) * 100) / 100,
    Shell: Math.round((basePrice + 0.1) * 100) / 100,
    Caltex: Math.round((basePrice - 0.1) * 100) / 100,
  };
}

export default function BrandCompare({ prices }) {
  return (
    <div className="brand-compare fade-up">
      <div className="section-heading">
        🏪 เปรียบราคาตามแบรนด์
      </div>
      <table className="compare-table">
        <thead>
          <tr>
            <th>ประเภทน้ำมัน</th>
            <th>PTT</th>
            <th>Bangchak</th>
            <th>Shell</th>
            <th>Caltex</th>
          </tr>
        </thead>
        <tbody>
          {FUELS.map(({ key, label, tag }) => {
            const base = prices?.[key];
            if (!base) return null;
            const brandPrices = getBrandPrices(base);
            const vals = Object.values(brandPrices);
            const minVal = Math.min(...vals);
            const maxVal = Math.max(...vals);

            return (
              <tr key={key}>
                <td><span className={`fuel-tag ${tag}`}>{label}</span></td>
                {Object.entries(brandPrices).map(([brand, price]) => (
                  <td key={brand} className={`price-cell ${price === minVal ? 'cheapest' : price === maxVal ? 'most-expensive' : ''}`}>
                    {price.toFixed(2)} ฿
                    {price === minVal && <span style={{ marginLeft: 4, fontSize: 10 }}>✓ ถูกสุด</span>}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
      <div style={{ marginTop: 12, fontSize: 11, color: 'var(--text-muted)', fontFamily: 'Sarabun, sans-serif' }}>
        * ราคา PTT จากข้อมูลจริง แบรนด์อื่นเป็นค่าประมาณ ±0.10 บาท
      </div>
    </div>
  );
}
