import { useState } from 'react'
import { Card, CardTitle, Btn, Input, Select, Table, StatusBadge, Badge, C } from './UI.jsx'
import { genId, calcOrder, getAutoType, fmtTHB, fmtDate } from './store.js'

export default function AdminModule({ state, dispatch, user, notify }) {
  const { orders, products, priceRates, countryRates, rates } = state
  const [showForm, setShowForm] = useState(false)
  const [showRates, setShowRates] = useState(false)
  const [editRate, setEditRate] = useState(null)
  const [form, setForm] = useState({ customerName: '', address: '', phone: '', productId: '1', quantity: 1, currency: 'THB', notes: '' })
  const f = v => setForm(p => ({ ...p, ...v }))

  const selectedCR = countryRates.find(r => r.currency === form.currency) || countryRates[0]
  const rate = getAutoType(+form.quantity, priceRates)
  const totalTHB = +form.quantity * (rate?.price_thb || 0)
  const { tax_amount, debt_amount, net_amount } = calcOrder(totalTHB)
  const product = products.find(p => p.id === +form.productId)

  const submit = () => {
    if (!form.customerName.trim() || !form.address.trim()) return notify('ກະລຸນາປ້ອນຊື່ ແລະ ທີ່ຢູ່', 'error')
    if (!product || product.stock < +form.quantity) return notify('Stock ບໍ່ພຽງພໍ!', 'error')
    const order = { id: genId(), ...form, productId: +form.productId, quantity: +form.quantity, price_per_unit: rate.price_thb, total: totalTHB, tax_amount, debt_amount, net_amount, customer_type: rate.customer_type, status: 'pending', pack_status: 'pending', tracking_number: '', created_at: new Date().toISOString(), created_by: user.name }
    dispatch({ type: 'ADD_ORDER', order })
    notify('ສ້າງອໍເດີສຳເລັດ! ✅')
    setForm({ customerName: '', address: '', phone: '', productId: '1', quantity: 1, currency: 'THB', notes: '' })
    setShowForm(false)
  }

  const saveRate = () => {
    dispatch({ type: 'UPDATE_PRICE_RATE', rate: editRate })
    setEditRate(null)
    notify('ອັບເດດລາຄາສຳເລັດ ✅')
  }

  const exportCSV = () => {
    const rows = orders.map(o => `${o.id},${o.customerName},${o.address},${o.phone||'-'},${o.quantity},${o.total},${o.customer_type},${o.status}`)
    const blob = new Blob(['\uFEFF' + ['ID,ຊື່,ທີ່ຢູ່,ເບີໂທ,ຈຳນວນ,ຍອດ,ປະເພດ,ສະຖານະ', ...rows].join('\n')], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `orders-${Date.now()}.csv`; a.click()
  }

  const tableRows = orders.map(o => [
    <span style={{ fontSize: 11, color: C.muted }}>{o.id.slice(-6)}</span>,
    <div><div style={{ color: C.text, fontWeight: 600 }}>{o.customerName}</div><div style={{ fontSize: 10, color: C.muted }}>{o.phone}</div></div>,
    <span style={{ fontSize: 11 }}>{o.address.slice(0, 22)}{o.address.length > 22 ? '...' : ''}</span>,
    o.quantity,
    <span style={{ color: C.purple, fontWeight: 700 }}>{fmtTHB(o.total)}</span>,
    <Badge text={o.customer_type} color={o.customer_type === 'ລູກຄ້າປີກ' ? C.purple : o.customer_type === 'ຕົວແທນ' ? C.green : C.amber} />,
    <StatusBadge status={o.status} />,
    <StatusBadge status={o.pack_status} />,
  ])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <h2 style={{ color: C.purple, fontSize: 18, fontWeight: 800 }}>📋 ສ່ວນຂອງ Admin</h2>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Btn onClick={exportCSV} color={C.card2} small style={{ border: `1px solid ${C.border}`, color: C.sub }}>⬇ CSV</Btn>
          <Btn onClick={() => setShowRates(!showRates)} color={C.card2} small style={{ border: `1px solid ${C.border}`, color: C.sub }}>🌍 ອັດຕາ</Btn>
          <Btn onClick={() => setShowForm(!showForm)} color={C.purple}>＋ ສ້າງອໍເດີ</Btn>
        </div>
      </div>

      {/* Price Rate Cards */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.sub, textTransform: 'uppercase', letterSpacing: 1 }}>💰 ຕາຕະລາງລາຄາ</div>
          {user.role === 'owner' && <Btn small onClick={() => setEditRate({ ...priceRates[0] })} color={C.card2} style={{ border: `1px solid ${C.border}`, color: C.sub }}>✏ ແກ້ໄຂ</Btn>}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {priceRates.map((r, i) => {
            const colors = [C.purple, C.green, C.amber]
            return (
              <div key={r.id} style={{ background: '#0a0f1e', borderRadius: 10, padding: 14, border: `1px solid ${colors[i]}44` }}>
                <div style={{ fontSize: 11, color: colors[i], fontWeight: 700, marginBottom: 4 }}>{r.customer_type}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: C.text }}>฿{r.price_thb}</div>
                <div style={{ fontSize: 11, color: C.muted }}>{(r.price_kip||0).toLocaleString()} ກີບ</div>
                <div style={{ fontSize: 10, color: '#334155', marginTop: 2 }}>{r.min_qty}–{r.max_qty === 9999 ? '∞' : r.max_qty} ຊິ້ນ</div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Country Rates */}
      {showRates && (
        <Card>
          <CardTitle>🌍 ອັດຕາແລກປ່ຽນ</CardTitle>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 8 }}>
            {countryRates.map(cr => (
              <div key={cr.id} style={{ background: '#0a0f1e', borderRadius: 10, padding: 12 }}>
                <div style={{ fontSize: 20 }}>{cr.flag}</div>
                <div style={{ fontSize: 12, color: C.text, fontWeight: 700 }}>{cr.currency}</div>
                <div style={{ fontSize: 11, color: C.purple, fontWeight: 700, marginTop: 4 }}>
                  ฿350 = {cr.currency === 'THB' ? '350' : cr.currency === 'KIP' ? (350 * rates.thbToKip).toLocaleString() : (350 / cr.rate_to_thb).toFixed(2)} {cr.symbol}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Order Form */}
      {showForm && (
        <Card>
          <CardTitle>➕ ສ້າງອໍເດີໃໝ່</CardTitle>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
            <Input label="ຊື່ລູກຄ້າ *" value={form.customerName} onChange={e => f({ customerName: e.target.value })} placeholder="ຊື່..." />
            <Input label="ເບີໂທ" value={form.phone} onChange={e => f({ phone: e.target.value })} placeholder="020..." />
            <div style={{ gridColumn: 'span 2' }}><Input label="ທີ່ຢູ່ *" value={form.address} onChange={e => f({ address: e.target.value })} placeholder="ທີ່ຢູ່ລະອຽດ..." /></div>
            <Select label="ສິນຄ້າ" value={form.productId} onChange={e => f({ productId: e.target.value })} options={products.map(p => ({ value: p.id, label: `${p.name} (${p.stock})` }))} />
            <Input label="ຈຳນວນ" type="number" value={form.quantity} onChange={e => f({ quantity: Math.max(1, +e.target.value) })} />
            <Select label="ສະກຸນ" value={form.currency} onChange={e => f({ currency: e.target.value })} options={countryRates.map(r => ({ value: r.currency, label: `${r.flag} ${r.currency}` }))} />
            <Input label="ໝາຍເຫດ" value={form.notes} onChange={e => f({ notes: e.target.value })} placeholder="ໝາຍເຫດ..." />
          </div>

          <div style={{ background: '#0a0f1e', borderRadius: 12, padding: 16, marginTop: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12, color: C.muted, marginBottom: 10 }}>
              <div>ປະເພດ: <span style={{ color: C.green, fontWeight: 700 }}>{rate?.customer_type}</span></div>
              <div>ລາຄາ: <span style={{ color: C.text }}>฿{rate?.price_thb} / {(rate?.price_kip||0).toLocaleString()} ກີບ</span></div>
              <div>VAT 7%: <span style={{ color: C.amber }}>฿{tax_amount.toLocaleString()}</span></div>
              <div>ໜີ້ 15%: <span style={{ color: C.red }}>฿{debt_amount.toLocaleString()}</span></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: `1px solid ${C.border}`, paddingTop: 10, flexWrap: 'wrap', gap: 10 }}>
              <div>
                <div style={{ fontSize: 11, color: C.muted }}>ຍອດ (THB)</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: C.purple }}>{fmtTHB(totalTHB)}</div>
                {form.currency === 'KIP' && <div style={{ fontSize: 12, color: C.blue }}>{(totalTHB * rates.thbToKip).toLocaleString()} ກີບ</div>}
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: C.muted }}>Net</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: C.green }}>{fmtTHB(net_amount)}</div>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
            <Btn onClick={() => setShowForm(false)} color={C.card2} style={{ border: `1px solid ${C.border}`, color: C.sub, flex: 1 }}>ຍົກເລີກ</Btn>
            <Btn onClick={submit} color={C.purple} style={{ flex: 2 }}>✓ ຢືນຢັນ → Packer</Btn>
          </div>
        </Card>
      )}

      {/* Edit Rate Modal */}
      {editRate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div style={{ background: '#1e293b', border: `1px solid ${C.border}`, borderRadius: 16, padding: 24, width: '100%', maxWidth: 480 }}>
            <h3 style={{ color: C.text, marginBottom: 16 }}>✏ ແກ້ໄຂລາຄາ</h3>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {priceRates.map(r => (
                <button key={r.id} onClick={() => setEditRate({ ...r })}
                  style={{ flex: 1, padding: '8px', background: editRate.id === r.id ? C.purple + '22' : '#0a0f1e', border: `1px solid ${editRate.id === r.id ? C.purple : C.border}`, borderRadius: 8, color: C.text, cursor: 'pointer', fontSize: 11, fontFamily: 'inherit' }}>
                  {r.customer_type}
                </button>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Input label="ລາຄາ THB (฿)" type="number" value={editRate.price_thb} onChange={e => setEditRate(p => ({ ...p, price_thb: +e.target.value }))} />
              <Input label="ລາຄາ KIP (ກີບ)" type="number" value={editRate.price_kip} onChange={e => setEditRate(p => ({ ...p, price_kip: +e.target.value }))} />
              <Input label="ຈຳນວນຕ່ຳສຸດ" type="number" value={editRate.min_qty} onChange={e => setEditRate(p => ({ ...p, min_qty: +e.target.value }))} />
              <Input label="ຈຳນວນສູງສຸດ" type="number" value={editRate.max_qty} onChange={e => setEditRate(p => ({ ...p, max_qty: +e.target.value }))} />
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <Btn onClick={() => setEditRate(null)} color={C.card2} style={{ border: `1px solid ${C.border}`, color: C.sub, flex: 1, justifyContent: 'center' }}>ຍົກເລີກ</Btn>
              <Btn onClick={saveRate} color={C.purple} style={{ flex: 1, justifyContent: 'center' }}>💾 ບັນທຶກ</Btn>
            </div>
          </div>
        </div>
      )}

      <Card>
        <CardTitle>📦 ລາຍການ Order ({orders.length})</CardTitle>
        <Table headers={['ID', 'ລູກຄ້າ', 'ທີ່ຢູ່', 'ຈຳນວນ', 'ຍອດ', 'ປະເພດ', 'ຊຳລະ', 'ສົ່ງ']} rows={tableRows} />
      </Card>
    </div>
  )
}
