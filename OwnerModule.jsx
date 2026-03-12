import { useState } from 'react'
import { Card, CardTitle, KPICard, Btn, Input, MiniBar, C } from './UI.jsx'
import { fmtTHB, fmtDate, todayStr, TOTAL_DEBT, TAX_RATE, DEBT_RATE, calcCommission } from './store.js'

// Number input that: selects all on focus, allows full delete, saves as number on blur
function NumInput({ label, value, onChange, placeholder = '' }) {
  const [local, setLocal] = useState(null) // null = use prop value
  const display = local !== null ? local : (value === 0 ? '' : String(value || ''))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {label && <label style={{ fontSize: 11, color: C.muted, fontWeight: 600 }}>{label}</label>}
      <input
        type="text"
        inputMode="numeric"
        value={display}
        placeholder={placeholder || '0'}
        onChange={e => {
          const raw = e.target.value.replace(/[^0-9.]/g, '')
          setLocal(raw)
          onChange(raw === '' ? 0 : parseFloat(raw) || 0)
        }}
        onFocus={e => {
          setLocal(value === 0 ? '' : String(value || ''))
          setTimeout(() => e.target.select(), 0)
        }}
        onBlur={() => setLocal(null)}
        style={{ background: '#0a0f1e', border: `1px solid ${C.border}`, borderRadius: 9, color: C.text, padding: '10px 12px', fontSize: 14, outline: 'none', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' }}
      />
    </div>
  )
}

export default function OwnerModule({ state, dispatch, user, notify }) {
  const { orders, products, expenses, incomes, auditLog, rates, priceRates, countryRates } = state
  const [showKIPEdit, setShowKIPEdit] = useState(false)
  const [kipLocal, setKipLocal] = useState('')
  const [editRate, setEditRate] = useState(null)

  const paidOrders = orders.filter(o => o.status === 'paid')
  const totalRevOrder = paidOrders.reduce((s, o) => s + o.total, 0)
  const totalIncOther = (incomes || []).reduce((s, i) => s + (i.currency === 'KIP' ? i.amount / rates.thbToKip : i.amount), 0)
  const totalRevenue = totalRevOrder + totalIncOther
  const totalTax = totalRevenue * TAX_RATE
  const totalDebtAmt = totalRevenue * DEBT_RATE
  const totalExp = expenses.reduce((s, e) => s + (e.currency === 'KIP' ? e.amount / rates.thbToKip : e.amount), 0)
  const totalCost = paidOrders.reduce((s, o) => {
    const prod = products.find(p => p.id === o.productId)
    return s + (prod ? (prod.cost_per_unit || 0) * o.quantity : 0)
  }, 0)
  const netProfit = totalRevenue - totalTax - totalDebtAmt - totalExp - totalCost
  const debtPaid = totalRevenue * DEBT_RATE
  const debtRemaining = Math.max(0, TOTAL_DEBT - debtPaid)
  const debtPct = Math.min(100, (debtPaid / TOTAL_DEBT) * 100)

  const today = todayStr()
  const getDateRev = d => paidOrders.filter(o => o.verified_at?.startsWith(d)).reduce((s, o) => s + o.total, 0)
  const getDateExp = d => expenses.filter(e => e.expense_date === d).reduce((s, e) => s + (e.currency === 'KIP' ? e.amount / rates.thbToKip : e.amount), 0)
  const getDateCost = d => paidOrders.filter(o => o.verified_at?.startsWith(d)).reduce((s, o) => {
    const prod = products.find(p => p.id === o.productId)
    return s + (prod ? (prod.cost_per_unit || 0) * o.quantity : 0)
  }, 0)

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i))
    const ds = d.toISOString().split('T')[0]
    const rev = getDateRev(ds)
    const exp = getDateExp(ds)
    const cost = getDateCost(ds)
    const profit = rev * (1 - TAX_RATE - DEBT_RATE) - exp - cost
    return { date: ds, label: `${d.getDate()}/${d.getMonth() + 1}`, rev, exp, profit }
  })
  const todayData = last7[6]

  const agentMap = {}
  orders.filter(o => o.status === 'paid' && o.customer_type !== 'ລູກຄ້າປີກ').forEach(o => {
    agentMap[o.customerName] = (agentMap[o.customerName] || 0) + o.total
  })
  const topAgents = Object.entries(agentMap).sort((a, b) => b[1] - a[1]).slice(0, 5)
  const pendingExpenses = expenses.filter(e => !e.approved)

  const openEditRate = (r) => setEditRate({ ...r })

  const saveRate = () => {
    dispatch({ type: 'UPDATE_PRICE_RATE', rate: editRate, user: user.name })
    setEditRate(null)
    notify('ອັບເດດລາຄາສຳເລັດ ✅')
  }

  const saveKIP = () => {
    const val = parseFloat(kipLocal) || rates.thbToKip
    dispatch({ type: 'SET_RATE', thbToKip: val })
    setShowKIPEdit(false)
    notify(`1 ບາດ = ${val.toLocaleString()} ກີບ ✅`)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <h2 style={{ color: C.red, fontSize: 18, fontWeight: 800 }}>👑 Dashboard ເຈົ້າຂອງ</h2>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Btn small onClick={() => { setKipLocal(String(rates.thbToKip)); setShowKIPEdit(true) }} color={C.card2} style={{ border: `1px solid ${C.border}`, color: C.sub }}>💱 KIP Rate</Btn>
          <Btn small onClick={() => openEditRate(priceRates[0])} color={C.card2} style={{ border: `1px solid ${C.border}`, color: C.sub }}>✏ ແກ້ລາຄາ</Btn>
          <Btn small onClick={() => {
            const d = [...orders.map(o => `Order,${o.customerName},${o.total},${o.status}`), ...expenses.map(e => `Expense,${e.description},${e.amount},${e.currency}`)]
            const b = new Blob(['\uFEFF' + ['Type,Detail,Amount,Currency', ...d].join('\n')], { type: 'text/csv;charset=utf-8' })
            const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = `report-${today}.csv`; a.click()
          }} color={C.card2} style={{ border: `1px solid ${C.border}`, color: C.sub }}>⬇ Export</Btn>
        </div>
      </div>

      {/* Today Highlight */}
      <div style={{ background: 'linear-gradient(135deg, #1e1b4b, #0c2340)', borderRadius: 16, padding: 20, border: `1px solid ${C.purple}33` }}>
        <div style={{ fontSize: 12, color: C.muted, marginBottom: 10 }}>📅 ວັນນີ້ — {today}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 10 }}>
          {[
            ['💚 ລາຍຮັບ', todayData?.rev || 0, C.green],
            ['🏭 ຕົ້ນທຶນ', getDateCost(today), C.blue],
            ['💸 ລາຍຈ່າຍ', todayData?.exp || 0, C.red],
            ['💰 ກຳໄລ', todayData?.profit || 0, (todayData?.profit || 0) >= 0 ? C.green : C.red]
          ].map(([l, v, c]) => (
            <div key={l} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: C.muted }}>{l}</div>
              <div style={{ fontSize: 17, fontWeight: 800, color: c }}>{fmtTHB(v)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
        <KPICard icon="📈" label="ຍອດຂາຍ" value={fmtTHB(totalRevenue)} sub={`${Math.round(totalRevenue * rates.thbToKip).toLocaleString()} ກີບ`} color={C.green} />
        <KPICard icon="🏭" label="ຕົ້ນທຶນ" value={fmtTHB(totalCost)} color={C.blue} />
        <KPICard icon="💰" label="ກຳໄລ" value={fmtTHB(netProfit)} sub={netProfit >= 0 ? '✅' : '⚠ ຂາດທຶນ'} color={netProfit >= 0 ? C.purple : C.red} />
        <KPICard icon="🧾" label="VAT 7%" value={fmtTHB(totalTax)} color={C.amber} />
        <KPICard icon="📦" label="Order" value={orders.length} sub={`${paidOrders.length} ຊຳລະ`} color={C.blue} />
        <KPICard icon="💸" label="ລາຍຈ່າຍ" value={fmtTHB(totalExp)} color={C.red} />
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Card><CardTitle>📊 ລາຍຮັບ 7 ວັນ</CardTitle><MiniBar data={last7.map(d => ({ l: d.label, v: Math.max(0, d.rev) }))} color={C.green} /></Card>
        <Card><CardTitle>💰 ກຳໄລ 7 ວັນ</CardTitle><MiniBar data={last7.map(d => ({ l: d.label, v: Math.max(0, d.profit) }))} color={C.purple} /></Card>
      </div>

      {/* Daily Table */}
      <Card>
        <CardTitle>📅 ສະຫຼຸບ 7 ວັນ</CardTitle>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead><tr style={{ background: '#0a0f1e' }}>
              {['ວັນທີ', 'ລາຍຮັບ', 'ຕົ້ນທຶນ', 'ລາຍຈ່າຍ', 'VAT', 'ກຳໄລ'].map(h => (
                <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: C.muted }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {last7.slice().reverse().map(d => (
                <tr key={d.date} style={{ borderTop: `1px solid ${C.border}`, background: d.date === today ? C.purple + '0a' : 'transparent' }}>
                  <td style={{ padding: '8px 10px', color: d.date === today ? C.purple : C.sub, fontWeight: d.date === today ? 700 : 400 }}>{d.label}{d.date === today ? ' 🔴' : ''}</td>
                  <td style={{ padding: '8px 10px', color: C.green }}>{d.rev > 0 ? fmtTHB(d.rev) : '-'}</td>
                  <td style={{ padding: '8px 10px', color: C.blue }}>{getDateCost(d.date) > 0 ? fmtTHB(getDateCost(d.date)) : '-'}</td>
                  <td style={{ padding: '8px 10px', color: C.red }}>{d.exp > 0 ? fmtTHB(d.exp) : '-'}</td>
                  <td style={{ padding: '8px 10px', color: C.amber }}>{d.rev > 0 ? fmtTHB(d.rev * TAX_RATE) : '-'}</td>
                  <td style={{ padding: '8px 10px', color: d.profit >= 0 ? C.green : C.red, fontWeight: 700 }}>{d.profit !== 0 ? fmtTHB(d.profit) : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Debt Tracker */}
      <Card>
        <CardTitle color={C.red}>🏦 ໜີ້ 4,000,000 ບາດ</CardTitle>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: C.muted, marginBottom: 8 }}>
          <span>ຊຳລະ: <span style={{ color: C.green, fontWeight: 700 }}>{fmtTHB(debtPaid)}</span></span>
          <span>ເຫຼືອ: <span style={{ color: C.red, fontWeight: 700 }}>{fmtTHB(debtRemaining)}</span></span>
        </div>
        <div style={{ background: '#0a0f1e', borderRadius: 100, height: 16, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${debtPct}%`, background: `linear-gradient(90deg, ${C.green}, ${C.purple})`, borderRadius: 100, minWidth: debtPct > 0 ? 8 : 0 }} />
        </div>
        <div style={{ textAlign: 'center', fontSize: 11, color: C.muted, marginTop: 6 }}>{debtPct.toFixed(2)}%</div>
      </Card>

      {/* Top Agents */}
      {topAgents.length > 0 && (
        <Card>
          <CardTitle>🏆 ຕົວແທນ Leaderboard</CardTitle>
          {topAgents.map(([name, total], i) => (
            <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: '#0a0f1e', borderRadius: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 18, width: 26 }}>{['🥇', '🥈', '🥉', '4️⃣', '5️⃣'][i]}</span>
              <span style={{ flex: 1, color: C.text, fontWeight: 600 }}>{name}</span>
              <span style={{ color: C.muted, fontSize: 11 }}>Commission: {fmtTHB(calcCommission(total))}</span>
              <span style={{ color: C.green, fontWeight: 800 }}>{fmtTHB(total)}</span>
            </div>
          ))}
        </Card>
      )}

      {/* Pending Approvals */}
      {pendingExpenses.length > 0 && (
        <Card>
          <CardTitle color={C.amber}>⏳ ອະນຸມັດລາຍຈ່າຍ ({pendingExpenses.length})</CardTitle>
          {pendingExpenses.map(e => (
            <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0a0f1e', borderRadius: 10, padding: '10px 14px', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
              <div>
                <div style={{ color: C.text, fontWeight: 600 }}>{e.description}</div>
                <div style={{ fontSize: 11, color: C.muted }}>{e.category} · {e.expense_date}</div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ color: C.red, fontWeight: 700 }}>{e.currency === 'KIP' ? `${e.amount.toLocaleString()} ກີບ` : fmtTHB(e.amount)}</span>
                <Btn small onClick={() => { dispatch({ type: 'APPROVE_EXPENSE', id: e.id, user: user.name }); notify('ອະນຸມັດແລ້ວ ✅') }} color={C.green}>✓</Btn>
              </div>
            </div>
          ))}
        </Card>
      )}

      {/* Audit Log */}
      <Card>
        <CardTitle>🔍 Audit Log</CardTitle>
        <div style={{ maxHeight: 220, overflowY: 'auto' }}>
          {auditLog.length === 0
            ? <div style={{ textAlign: 'center', color: '#334155', padding: 16 }}>ຍັງບໍ່ມີ</div>
            : auditLog.map(log => (
              <div key={log.id} style={{ display: 'flex', gap: 8, padding: '6px 0', borderBottom: `1px solid ${C.border}`, fontSize: 11 }}>
                <span style={{ color: C.muted, whiteSpace: 'nowrap', minWidth: 80 }}>{log.time}</span>
                <span style={{ background: '#1e293b', color: C.sub, padding: '1px 6px', borderRadius: 5, whiteSpace: 'nowrap' }}>{log.user}</span>
                <span style={{ color: '#475569' }}>{log.action}: {log.detail}</span>
              </div>
            ))
          }
        </div>
      </Card>

      {/* KIP Rate Modal */}
      {showKIPEdit && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div style={{ background: '#1e293b', border: `1px solid ${C.border}`, borderRadius: 16, padding: 24, width: '100%', maxWidth: 320 }}>
            <h3 style={{ color: C.text, marginBottom: 6 }}>💱 ອັດຕາ KIP</h3>
            <p style={{ color: C.muted, fontSize: 12, marginBottom: 16 }}>1 ບາດ (THB) = ? ກີບ (KIP)</p>
            <input
              type="text" inputMode="numeric"
              value={kipLocal}
              onChange={e => setKipLocal(e.target.value.replace(/[^0-9.]/g, ''))}
              onFocus={e => setTimeout(() => e.target.select(), 0)}
              placeholder="1320"
              style={{ background: '#0a0f1e', border: `1px solid ${C.border}`, borderRadius: 9, color: C.text, padding: '12px 14px', fontSize: 16, outline: 'none', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' }}
            />
            <div style={{ fontSize: 12, color: C.muted, marginTop: 8 }}>ປັດຈຸບັນ: 1 ฿ = {rates.thbToKip.toLocaleString()} ກີບ</div>
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <Btn onClick={() => setShowKIPEdit(false)} color={C.card2} style={{ border: `1px solid ${C.border}`, color: C.sub, flex: 1, justifyContent: 'center' }}>ຍົກເລີກ</Btn>
              <Btn onClick={saveKIP} color={C.purple} style={{ flex: 1, justifyContent: 'center' }}>ບັນທຶກ</Btn>
            </div>
          </div>
        </div>
      )}

      {/* Price Rate Edit Modal */}
      {editRate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div style={{ background: '#1e293b', border: `1px solid ${C.border}`, borderRadius: 16, padding: 24, width: '100%', maxWidth: 500 }}>
            <h3 style={{ color: C.text, marginBottom: 16 }}>✏ ແກ້ໄຂລາຄາ</h3>

            {/* Rate selector tabs */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              {priceRates.map((r, i) => {
                const colors = [C.purple, C.green, C.amber]
                return (
                  <button key={r.id} onClick={() => openEditRate(r)}
                    style={{ flex: 1, padding: '10px 8px', background: editRate.id === r.id ? colors[i] + '22' : '#0a0f1e', border: `2px solid ${editRate.id === r.id ? colors[i] : C.border}`, borderRadius: 10, color: editRate.id === r.id ? colors[i] : C.muted, cursor: 'pointer', fontSize: 11, fontWeight: 700, fontFamily: 'inherit', lineHeight: 1.3 }}>
                    {r.customer_type}<br/>
                    <span style={{ fontSize: 13, color: C.text }}>฿{r.price_thb}</span>
                  </button>
                )
              })}
            </div>

            {/* Current editing */}
            <div style={{ background: '#0a0f1e', borderRadius: 10, padding: 12, marginBottom: 16, fontSize: 12, color: C.muted }}>
              ກຳລັງແກ້: <span style={{ color: C.text, fontWeight: 700 }}>{editRate.customer_type}</span>
              <span style={{ marginLeft: 12 }}>{editRate.min_qty}–{editRate.max_qty === 9999 ? '∞' : editRate.max_qty} ຊິ້ນ</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <NumInput label="ລາຄາ THB (฿)" value={editRate.price_thb} onChange={v => setEditRate(p => ({ ...p, price_thb: v }))} placeholder="350" />
              <NumInput label="ລາຄາ KIP (ກີບ)" value={editRate.price_kip} onChange={v => setEditRate(p => ({ ...p, price_kip: v }))} placeholder="241500" />
              <NumInput label="ຈຳນວນຕ່ຳສຸດ" value={editRate.min_qty} onChange={v => setEditRate(p => ({ ...p, min_qty: v }))} placeholder="1" />
              <NumInput label="ຈຳນວນສູງສຸດ" value={editRate.max_qty} onChange={v => setEditRate(p => ({ ...p, max_qty: v }))} placeholder="9999" />
            </div>

            {/* Preview */}
            <div style={{ background: '#0a0f1e', borderRadius: 10, padding: 12, marginTop: 14, fontSize: 12 }}>
              <span style={{ color: C.muted }}>Preview: </span>
              <span style={{ color: C.green, fontWeight: 700 }}>฿{editRate.price_thb} = {Number(editRate.price_kip).toLocaleString()} ກີບ</span>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <Btn onClick={() => setEditRate(null)} color={C.card2} style={{ border: `1px solid ${C.border}`, color: C.sub, flex: 1, justifyContent: 'center' }}>ຍົກເລີກ</Btn>
              <Btn onClick={saveRate} color={C.green} style={{ flex: 1, justifyContent: 'center' }}>💾 ບັນທຶກ</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
