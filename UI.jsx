export const C = {
  bg: '#0a0f1e', card: '#111827', card2: '#1e293b', border: '#1e293b',
  purple: '#6366f1', green: '#10b981', amber: '#f59e0b', red: '#ef4444',
  blue: '#38bdf8', text: '#f1f5f9', muted: '#64748b', sub: '#94a3b8',
}

export function Card({ children, style = {} }) {
  return <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 18, ...style }}>{children}</div>
}

export function CardTitle({ children, color = C.sub, style = {} }) {
  return <div style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 14, textTransform: 'uppercase', letterSpacing: 1, ...style }}>{children}</div>
}

export function KPICard({ icon, label, value, sub, color = C.purple, style = {} }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 14, borderLeft: `3px solid ${color}`, ...style }}>
      <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>{icon} {label}</div>
      <div style={{ fontSize: 20, fontWeight: 800, color, lineHeight: 1.2 }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: '#334155', marginTop: 4 }}>{sub}</div>}
    </div>
  )
}

export function Btn({ children, onClick, color = C.purple, disabled = false, small = false, style = {} }) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ background: disabled ? '#1e293b' : color, border: 'none', borderRadius: 9, color: disabled ? C.muted : '#fff', padding: small ? '7px 12px' : '10px 16px', fontSize: small ? 12 : 13, fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 5, opacity: disabled ? 0.5 : 1, ...style }}>
      {children}
    </button>
  )
}

export function Badge({ text, color = C.purple }) {
  return <span style={{ background: color + '22', color, border: `1px solid ${color}44`, borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>{text}</span>
}

export function StatusBadge({ status }) {
  const map = { pending: [C.amber, 'ລໍຖ້າ'], paid: [C.green, 'ຊຳລະແລ້ວ'], shipped: [C.purple, 'ສົ່ງແລ້ວ'], cancelled: [C.red, 'ຍົກເລີກ'], packed: [C.blue, 'ແພັກແລ້ວ'] }
  const [color, label] = map[status] || [C.muted, status]
  return <Badge text={label} color={color} />
}

export function Input({ label, value, onChange, type = 'text', placeholder = '', style = {} }) {
  const isNum = type === 'number'
  const displayVal = (value === null || value === undefined) ? '' : value
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {label && <label style={{ fontSize: 11, color: C.muted, fontWeight: 600 }}>{label}</label>}
      <input
        type={isNum ? 'text' : type}
        inputMode={isNum ? 'numeric' : undefined}
        value={displayVal}
        onChange={onChange}
        onFocus={isNum ? e => e.target.select() : undefined}
        placeholder={placeholder}
        style={{ background: '#0a0f1e', border: `1px solid ${C.border}`, borderRadius: 9, color: C.text, padding: '10px 12px', fontSize: 13, outline: 'none', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box', ...style }}
      />
    </div>
  )
}

export function Select({ label, value, onChange, options }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {label && <label style={{ fontSize: 11, color: C.muted, fontWeight: 600 }}>{label}</label>}
      <select value={value} onChange={onChange}
        style={{ background: '#0a0f1e', border: `1px solid ${C.border}`, borderRadius: 9, color: C.text, padding: '10px 12px', fontSize: 13, outline: 'none', fontFamily: 'inherit', width: '100%' }}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}

export function Table({ headers, rows }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr style={{ background: '#0a0f1e' }}>
            {headers.map((h, i) => <th key={i} style={{ padding: '9px 12px', textAlign: 'left', color: C.muted, fontWeight: 700, whiteSpace: 'nowrap' }}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ borderTop: `1px solid ${C.border}` }}>
              {row.map((cell, j) => <td key={j} style={{ padding: '10px 12px', color: C.sub, verticalAlign: 'middle' }}>{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && <div style={{ textAlign: 'center', padding: 28, color: '#334155' }}>ບໍ່ມີຂໍ້ມູນ</div>}
    </div>
  )
}

export function MiniBar({ data, color = C.purple }) {
  const max = Math.max(...data.map(d => d.v), 1)
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 64 }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
          <div style={{ width: '100%', background: color, borderRadius: '3px 3px 0 0', height: `${(d.v / max) * 52}px`, minHeight: d.v > 0 ? 3 : 0, opacity: 0.85 }} />
          <span style={{ fontSize: 9, color: C.muted }}>{d.l}</span>
        </div>
      ))}
    </div>
  )
}

export function Notify({ msg, type }) {
  if (!msg) return null
  const colors = { success: C.green, error: C.red, info: C.purple }
  return (
    <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, background: colors[type] || C.green, color: '#fff', padding: '13px 20px', borderRadius: 12, boxShadow: '0 8px 30px rgba(0,0,0,0.4)', fontSize: 13, fontWeight: 600, maxWidth: 300, animation: 'slideIn 0.3s ease' }}>
      {msg}
      <style>{`@keyframes slideIn { from { transform: translateX(100px); opacity:0 } to { transform: translateX(0); opacity:1 } }`}</style>
    </div>
  )
}

export function Modal({ title, children, onClose }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
      <div style={{ background: C.card2, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24, width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ color: C.text, fontSize: 16, fontWeight: 700 }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 18 }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}
