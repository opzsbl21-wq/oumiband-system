import { useState } from 'react'
import { Card, CardTitle, Btn, Input, Select, Table, StatusBadge, Badge, C } from './UI.jsx'
import { genId, calcOrder, getAutoType, fmtTHB, fmtDate } from '../store.js'

export default function AdminModule({ state, dispatch, user, notify }) {
  const { orders, products, priceRates, rates } = state
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ customerName: '', address: '', phone: '', productId: '1', quantity: 1, notes: '' })

  const f = v => setForm(p => ({ ...p, ...v }))
  const rate = getAutoType(+form.quantity, priceRates)
  const total = +form.quantity * (rate?.price_per_unit || 0)
  const { tax_amount, debt_amount, net_amount } = calcOrder(total)
  const product = products.find(p => p.id === +form.productId)

  const submit = () => {
    if (!form.customerName.trim() || !form.address.trim()) return notify('ກະລຸນາປ້ອນຊື່ ແລະ ທີ່ຢູ່', 'error')
    if (!product || product.stock < +form.quantity) return notify('Stock ບໍ່ພຽງພໍ!', 'error')
    const order = {
      id: genId(), ...form, productId: +form.productId, quantity: +form.quantity,
      price_per_unit: rate.price_per_unit, total, tax_amount, debt_amount, net_amount,
      customer_type: rate.customer_type, status: 'pending', pack_status: 'pending',
      tracking_number: '', created_at: new Date().toISOString(), created_by: user.name,
    }
    dispatch({ type: 'ADD_ORDER', order })
    notify('ສ້າງອໍເດີສຳເລັດ! ສົ່ງຫາ Packer ແລ້ວ ✅')
    setForm({ customerName: '', address: '', phone: '', productId: '1', quantity: 1, notes: '' })
    setShowForm(false)
  }

  const exportCSV = () => {
    const header = ['ID,ຊື່ລູກຄ້າ,ທີ່ຢູ່,ເບີໂທ,ຈຳນວນ,ຍອດ(THB),ປະເພດ,ສະຖານະ,ວັນທີ']
    const rows = orders.map(o => `${o.id},${o.customerName},${o.address},${o.phone || '-'},${o.quantity},${o.total},${o.customer_type},${o.status},${fmtDate(o.created_at)}`)
    const blob = new Blob(['\uFEFF' + [...header, ...rows].join('\n')], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `oumiband-orders-${Date.now()}.csv`; a.click()
  }

  const tableRows = orders.map(o => [
    <span style={{ fontSize: 11, color: C.muted }}>{o.id.slice(-6)}</span>,
    <div><div style={{ color: C.text, fontWeight: 600 }}>{o.customerName}</div><div style={{ fontSize: 10, color: C.muted }}>{o.phone}</div></div>,
    <span style={{ fontSize: 11 }}>{o.address}</span>,
    o.quantity,
    <span style={{ color: C.purple, fontWeight: 700 }}>{fmtTHB(o.total)}</span>,
    <Badge text={o.customer_type} color={o.customer_type === 'ລູກຄ້າປີກ' ? C.purple : o.customer_type === 'ຕົວແທນ' ? C.green : C.amber} />,
    <StatusBadge status={o.status} />,
    <StatusBadge status={o.pack_status} />,
  ])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <h2 style={{ color: C.purple, fontSize: 18, fontWeight: 800 }}>📋 ສ່ວນຂອງແອດມິນ</h2>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Btn onClick={exportCSV} color={C.card2} small style={{ border: `1px solid ${C.border}`, color: C.sub }}>⬇ CSV</Btn>
          <Btn onClick={() => setShowForm(!showForm)} color={C.purple}>＋ ສ້າງອໍເດີ</Btn>
        </div>
      </div>

      {/* Price Rate Table */}
      <Card>
        <CardTitle>💰 ຕາຕະລາງລາຄາ (ແຈ້ງລູກຄ້າ)</CardTitle>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {priceRates.map((r, i) => {
            const colors = [C.purple, C.green, C.amber]
            return (
              <div key={r.id} style={{ background: '#0a0f1e', borderRadius: 10, padding: 14, border: `1px solid ${colors[i]}44` }}>
                <div style={{ fontSize: 11, color: colors[i], fontWeight: 700, marginBottom: 6 }}>{r.customer_type}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: C.text }}>฿{r.price_per_unit}</div>
                <div style={{ fontSize: 10, color: C.muted, marginTop: 3 }}>{r.min_qty}–{r.max_qty === 9999 ? '∞' : r.max_qty} ຊິ້ນ</div>
                <div style={{ fontSize: 10, color: '#334155', marginTop: 2 }}>{(r.price_per_unit * rates.thbToKip).toLocaleString()} ກີບ</div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Order Form */}
      {showForm && (
        <Card>
          <CardTitle>➕ ສ້າງອໍເດີໃໝ່</CardTitle>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
            <Input label="ຊື່ລູກຄ້າ *" value={form.customerName} onChange={e => f({ customerName: e.target.value })} placeholder="ຊື່..." />
            <Input label="ເບີໂທ" value={form.phone} onChange={e => f({ phone: e.target.value })} placeholder="020..." />
            <div style={{ gridColumn: 'span 2' }}>
              <Input label="ທີ່ຢູ່ / ທີ່ຈັດສົ່ງ *" value={form.address} onChange={e => f({ address: e.target.value })} placeholder="ທີ່ຢູ່ລະອຽດ..." />
            </div>
            <Select label="ສິນຄ້າ" value={form.productId} onChange={e => f({ productId: e.target.value })}
              options={products.map(p => ({ value: p.id, label: `${p.name} (Stock: ${p.stock})` }))} />
            <Input label="ຈຳນວນ" type="number" value={form.quantity} onChange={e => f({ quantity: Math.max(1, +e.target.value) })} />
            <Input label="ໝາຍເຫດ" value={form.notes} onChange={e => f({ notes: e.target.value })} placeholder="ໝາຍເຫດ..." />
          </div>

          {/* Summary */}
          <div style={{ background: '#0a0f1e', borderRadius: 12, padding: 16, marginTop: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12, color: C.muted, marginBottom: 10 }}>
              <div>ປະເພດ (Auto): <span style={{ color: C.green, fontWeight: 700 }}>{rate?.customer_type}</span></div>
              <div>ລາຄາ/ຊິ້ນ: <span style={{ color: C.text }}>{fmtTHB(rate?.price_per_unit)}</span></div>
              <div>ພາສີ 7%: <span style={{ color: C.amber }}>{fmtTHB(tax_amount)}</span></div>
              <div>ກອງທຶນໜີ້ 15%: <span style={{ color: C.red }}>{fmtTHB(debt_amount)}</span></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: `1px solid ${C.border}`, paddingTop: 10, alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 12, color: C.muted }}>ຍອດລວມ</div>
                <div style={{ fontSize: 26, fontWeight: 800, color: C.purple }}>{fmtTHB(total)}</div>
                <div style={{ fontSize: 11, color: '#334155' }}>{(total * rates.thbToKip).toLocaleString()} ກີບ</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 12, color: C.muted }}>ໄດ້ຮັບຈິງ (Net)</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: C.green }}>{fmtTHB(net_amount)}</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
            <Btn onClick={() => setShowForm(false)} color={C.card2} style={{ border: `1px solid ${C.border}`, color: C.sub, flex: 1 }}>ຍົກເລີກ</Btn>
            <Btn onClick={submit} color={C.purple} style={{ flex: 2 }}>✓ ຢືນຢັນ ແລະ ສົ່ງຫາ Packer</Btn>
          </div>
        </Card>
      )}

      {/* Orders Table */}
      <Card>
        <CardTitle>📦 ລາຍການອໍເດີທັງໝົດ ({orders.length})</CardTitle>
        <Table
          headers={['ID', 'ລູກຄ້າ', 'ທີ່ຢູ່', 'ຈຳນວນ', 'ຍອດ', 'ປະເພດ', 'ການຊຳລະ', 'ການສົ່ງ']}
          rows={tableRows}
        />
      </Card>
    </div>
  )
}
