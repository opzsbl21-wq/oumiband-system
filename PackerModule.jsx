import { useState } from 'react'
import { Card, CardTitle, Btn, C } from './UI.jsx'
import { fmtTHB, fmtDate, todayStr } from './store.js'

export default function PackerModule({ state, dispatch, user, notify }) {
  const { orders, products } = state
  const [tracking, setTracking] = useState({})
  const [viewOrder, setViewOrder] = useState(null)

  const pending = orders.filter(o => o.pack_status === 'pending')
  const packed = orders.filter(o => o.pack_status === 'packed')
  const shipped = orders.filter(o => o.pack_status === 'shipped')
  const today = todayStr()
  const todayShipped = orders.filter(o => o.shipped_at?.startsWith(today))
  const todayRevenue = todayShipped.reduce((s, o) => s + o.total, 0)

  const doPack = (order) => {
    const prod = products.find(p => p.id === order.productId)
    if (!prod || prod.stock < order.quantity) return notify('Stock ບໍ່ພຽງພໍ!', 'error')
    dispatch({ type: 'PACK_ORDER', id: order.id, productId: order.productId, qty: order.quantity, user: user.name })
    notify(`ແພັກ "${order.customerName}" ✅`)
  }

  const doShip = (order) => {
    const t = tracking[order.id]?.trim()
    if (!t) return notify('ໃສ່ Tracking Number', 'error')
    dispatch({ type: 'SHIP_ORDER', id: order.id, tracking: t, user: user.name })
    setTracking(p => { const n = { ...p }; delete n[order.id]; return n })
    notify(`ສົ່ງ "${order.customerName}" 🚀`)
  }

  const printLabel = (o) => {
    const w = window.open('', '_blank', 'width=400,height=500')
    w.document.write(`<html><head><title>ໃບໜ້າຊອງ</title>
    <style>body{font-family:sans-serif;padding:24px;max-width:320px}h2{margin:0 0 12px}p{margin:6px 0;font-size:14px}.addr{font-size:18px;font-weight:bold;border:1px dashed #000;padding:8px;margin:10px 0}</style>
    </head><body>
    <h2>🎗️ OuMi Band</h2>
    <p><b>ຊື່:</b> ${o.customerName}</p>
    <div class="addr">📍 ${o.address}</div>
    <p><b>ເບີ:</b> ${o.phone||'-'} | <b>ຈຳນວນ:</b> ${o.quantity} ຊອງ | <b>ຍອດ:</b> ${fmtTHB(o.total)}</p>
    ${o.tracking_number?`<p><b>Tracking:</b> ${o.tracking_number}</p>`:''}
    </body></html>`)
    w.document.close()
    setTimeout(() => w.print(), 300)
  }

  const StatBox = ({ label, value, color, sub }) => (
    <div style={{ background: C.card, border: `1px solid ${color}44`, borderRadius: 12, padding: 14, borderLeft: `3px solid ${color}` }}>
      <div style={{ fontSize: 11, color: C.muted }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: C.muted }}>{sub}</div>}
    </div>
  )

  const OrderCard = ({ o, action }) => (
    <div style={{ background: '#0a0f1e', borderRadius: 12, padding: 14, marginBottom: 10, border: `1px solid ${C.border}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, color: C.text }}>{o.customerName}</div>
          <div style={{ fontSize: 12, color: C.muted }}>📍 {o.address}</div>
          <div style={{ fontSize: 12, color: C.muted }}>📞 {o.phone||'-'} · {o.quantity} ຊອງ · <span style={{ color: C.purple, fontWeight: 700 }}>{fmtTHB(o.total)}</span></div>
          {o.notes && <div style={{ fontSize: 11, color: C.amber }}>📝 {o.notes}</div>}
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <Btn small onClick={() => setViewOrder(o)} color={C.card2} style={{ border: `1px solid ${C.border}`, color: C.sub }}>👁</Btn>
          <Btn small onClick={() => printLabel(o)} color={C.card2} style={{ border: `1px solid ${C.border}`, color: C.sub }}>🖨</Btn>
          {action}
        </div>
      </div>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <h2 style={{ color: C.green, fontSize: 18, fontWeight: 800 }}>📦 ສ່ວນຂອງ Packer</h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 10 }}>
        <StatBox label="⏳ ຕ້ອງແພັກ" value={pending.length} color={C.amber} />
        <StatBox label="📦 ພ້ອມສົ່ງ" value={packed.length} color={C.blue} />
        <StatBox label="✅ ສົ່ງວັນນີ້" value={todayShipped.length} color={C.green} sub={fmtTHB(todayRevenue)} />
        <StatBox label="📊 ສົ່ງທັງໝົດ" value={shipped.length} color={C.purple} />
      </div>

      {/* Stock */}
      <Card>
        <CardTitle>🗃️ Stock ສິນຄ້າ</CardTitle>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 10 }}>
          {products.map(p => {
            const low = p.stock <= p.alert_threshold
            const pct = Math.min(100, (p.stock / Math.max(p.alert_threshold * 2, 1)) * 100)
            return (
              <div key={p.id} style={{ background: '#0a0f1e', borderRadius: 10, padding: 12, border: `1px solid ${low ? C.red : C.border}` }}>
                <div style={{ fontSize: 11, color: low ? C.red : C.muted, fontWeight: 600 }}>{low ? '⚠ ' : '📦 '}{p.name}</div>
                <div style={{ fontSize: 26, fontWeight: 800, color: low ? C.red : C.green }}>{p.stock.toLocaleString()}</div>
                <div style={{ fontSize: 10, color: C.muted }}>{p.unit} · ຕ່ຳສຸດ: {p.alert_threshold}</div>
                <div style={{ background: '#1e293b', borderRadius: 100, height: 6, marginTop: 6 }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: low ? C.red : C.green, borderRadius: 100 }} />
                </div>
                {low && <div style={{ fontSize: 10, color: C.red, marginTop: 4, fontWeight: 700 }}>🔴 ໃກ້ໝົດ!</div>}
              </div>
            )
          })}
        </div>
      </Card>

      {/* Pending */}
      <Card>
        <CardTitle color={C.amber}>⏳ ຕ້ອງແພັກ ({pending.length})</CardTitle>
        {pending.length === 0
          ? <div style={{ textAlign: 'center', color: '#334155', padding: 24 }}>ບໍ່ມີ Order ຄ້າງ ✅</div>
          : pending.map(o => <OrderCard key={o.id} o={o} action={<Btn small onClick={() => doPack(o)} color={C.green}>✓ ແພັກ</Btn>} />)
        }
      </Card>

      {/* Packed - need tracking */}
      <Card>
        <CardTitle color={C.blue}>📦 ໃສ່ Tracking ({packed.length})</CardTitle>
        {packed.length === 0
          ? <div style={{ textAlign: 'center', color: '#334155', padding: 16 }}>ບໍ່ມີ</div>
          : packed.map(o => (
            <div key={o.id} style={{ background: '#0a0f1e', borderRadius: 12, padding: 14, marginBottom: 10, border: `1px solid ${C.blue}33` }}>
              <div style={{ fontWeight: 700, color: C.text, marginBottom: 4 }}>{o.customerName} <span style={{ color: C.muted, fontWeight: 400, fontSize: 12 }}>— {o.quantity} ຊອງ · {fmtTHB(o.total)}</span></div>
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 10 }}>📍 {o.address}</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <input value={tracking[o.id] || ''} onChange={e => setTracking(p => ({ ...p, [o.id]: e.target.value }))}
                  placeholder="Tracking Number..."
                  style={{ flex: 1, minWidth: 150, background: '#111827', border: `1px solid ${C.border}`, borderRadius: 9, color: C.text, padding: '10px 12px', fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
                <Btn small onClick={() => printLabel(o)} color={C.card2} style={{ border: `1px solid ${C.border}`, color: C.sub }}>🖨</Btn>
                <Btn small onClick={() => doShip(o)} color={C.amber}>🚀 ສົ່ງ</Btn>
              </div>
            </div>
          ))
        }
      </Card>

      {/* Today shipped */}
      <Card>
        <CardTitle color={C.green}>✅ ສົ່ງວັນນີ້ ({todayShipped.length}) — {fmtTHB(todayRevenue)}</CardTitle>
        {todayShipped.length === 0
          ? <div style={{ textAlign: 'center', color: '#334155', padding: 16 }}>ຍັງບໍ່ມີ</div>
          : todayShipped.map(o => (
            <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${C.border}`, fontSize: 12, flexWrap: 'wrap', gap: 6 }}>
              <span style={{ color: C.text, fontWeight: 600 }}>{o.customerName}</span>
              <span style={{ color: C.muted, fontSize: 11 }}>📮 {o.tracking_number}</span>
              <span style={{ color: C.green, fontWeight: 700 }}>{fmtTHB(o.total)}</span>
            </div>
          ))
        }
      </Card>

      {/* History */}
      <Card>
        <CardTitle>📋 ປະຫວັດ ({shipped.length})</CardTitle>
        <div style={{ maxHeight: 220, overflowY: 'auto' }}>
          {shipped.slice(0, 50).map(o => (
            <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${C.border}`, fontSize: 11, flexWrap: 'wrap', gap: 4 }}>
              <span style={{ color: C.text }}>{o.customerName}</span>
              <span style={{ color: C.muted }}>📮 {o.tracking_number}</span>
              <span style={{ color: C.muted }}>{o.shipped_at ? new Date(o.shipped_at).toLocaleDateString('lo-LA') : '-'}</span>
              <span style={{ color: C.green, fontWeight: 700 }}>{fmtTHB(o.total)}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* View Modal */}
      {viewOrder && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div style={{ background: '#1e293b', border: `1px solid ${C.border}`, borderRadius: 16, padding: 24, width: '100%', maxWidth: 380 }}>
            <h3 style={{ color: C.text, marginBottom: 16 }}>📋 ຂໍ້ມູນ Order</h3>
            {[['ຊື່', viewOrder.customerName], ['ທີ່ຢູ່', viewOrder.address], ['ເບີ', viewOrder.phone||'-'], ['ສິນຄ້າ', viewOrder.quantity+' ຊອງ'], ['ຍອດ', fmtTHB(viewOrder.total)], ['ໝາຍເຫດ', viewOrder.notes||'-']].map(([k,v]) => (
              <div key={k} style={{ display: 'flex', padding: '8px 0', borderBottom: `1px solid ${C.border}`, fontSize: 13 }}>
                <span style={{ color: C.muted, width: 70, flexShrink: 0 }}>{k}</span>
                <span style={{ color: C.text }}>{v}</span>
              </div>
            ))}
            <Btn onClick={() => setViewOrder(null)} color={C.card2} style={{ border: `1px solid ${C.border}`, color: C.sub, width: '100%', justifyContent: 'center', marginTop: 16 }}>ປິດ</Btn>
          </div>
        </div>
      )}
    </div>
  )
}
