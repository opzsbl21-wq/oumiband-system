import { useState } from 'react'
import { Card, CardTitle, KPICard, Btn, MiniBar, C } from './UI.jsx'
import { fmtTHB, fmtDate, TOTAL_DEBT, TAX_RATE, DEBT_RATE } from './store.js'

export default function OwnerModule({ state, dispatch, user, notify }) {
  const { orders, products, expenses, auditLog, rates } = state
  const [showRateEdit, setShowRateEdit] = useState(false)
  const [kip, setKip] = useState(rates.thbToKip)

  const paidOrders = orders.filter(o => o.status === 'paid')
  const totalRev = paidOrders.reduce((s, o) => s + o.total, 0)
  const totalDebtPaid = totalRev * DEBT_RATE
  const totalTax = totalRev * TAX_RATE
  const totalExp = expenses.reduce((s, e) => s + (e.currency === 'KIP' ? e.amount / rates.thbToKip : e.amount), 0)
  const netProfit = totalRev - totalTax - totalDebtPaid - totalExp
  const debtRemaining = Math.max(0, TOTAL_DEBT - totalDebtPaid)
  const debtProgress = Math.min(100, (totalDebtPaid / TOTAL_DEBT) * 100)

  // Agent ranking
  const agentMap = {}
  orders.filter(o => o.customer_type !== 'ລູກຄ້າປີກ').forEach(o => {
    agentMap[o.customerName] = (agentMap[o.customerName] || 0) + o.total
  })
  const topAgents = Object.entries(agentMap).sort((a, b) => b[1] - a[1]).slice(0, 5)

  // Monthly chart data (mock + real)
  const months = ['ມ.ກ', 'ກ.ພ', 'ມີ.ນ', 'ເມ', 'ພ.ພ', 'ມິ.ຖ']
  const mockData = [42000, 38000, 55000, 61000, 48000, totalRev || 0]
  const chartData = months.map((l, i) => ({ l, v: mockData[i] }))

  // Order status summary
  const statusCount = { pending: 0, packed: 0, shipped: 0, paid: 0 }
  orders.forEach(o => { statusCount[o.status] = (statusCount[o.status] || 0) + 1 })

  const approveExpense = (id) => {
    dispatch({ type: 'APPROVE_EXPENSE', id, user: user.name })
    notify('ອະນຸມັດລາຍຈ່າຍສຳເລັດ ✅')
  }

  const exportAll = () => {
    const rows = orders.map(o => `${o.id},${o.customerName},${o.address},${o.quantity},${o.total},${o.customer_type},${o.status},${fmtDate(o.created_at)}`)
    const blob = new Blob(['\uFEFF' + ['ID,ຊື່,ທີ່ຢູ່,ຈຳນວນ,ຍອດ,ປະເພດ,ສະຖານະ,ວັນທີ', ...rows].join('\n')], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `oumiband-fullreport-${Date.now()}.csv`; a.click()
  }

  const saveRate = () => {
    dispatch({ type: 'SET_RATE', thbToKip: +kip })
    setShowRateEdit(false)
    notify(`ອັດຕາແລກປ່ຽນ: 1 ບາດ = ${kip} ກີບ ✅`)
  }

  const pendingExpenses = expenses.filter(e => !e.approved)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <h2 style={{ color: C.red, fontSize: 18, fontWeight: 800 }}>👑 Dashboard ເຈົ້າຂອງ</h2>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Btn onClick={() => setShowRateEdit(true)} color={C.card2} small style={{ border: `1px solid ${C.border}`, color: C.sub }}>💱 ອັດຕາ</Btn>
          <Btn onClick={exportAll} color={C.card2} small style={{ border: `1px solid ${C.border}`, color: C.sub }}>⬇ Export ທັງໝົດ</Btn>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
        <KPICard icon="📈" label="ຍອດຂາຍ" value={fmtTHB(totalRev)} sub={`${(totalRev * rates.thbToKip).toLocaleString()} ກີບ`} color={C.green} />
        <KPICard icon="💰" label="ກຳໄລສຸດທິ" value={fmtTHB(netProfit)} sub={netProfit >= 0 ? '✅ ກຳໄລ' : '⚠ ຂາດທຶນ'} color={netProfit >= 0 ? C.purple : C.red} />
        <KPICard icon="🧾" label="ພາສີ 7%" value={fmtTHB(totalTax)} sub="ຊຳລະໃຫ້ລັດ" color={C.amber} />
        <KPICard icon="📦" label="ອໍເດີທັງໝົດ" value={orders.length} sub={`${paidOrders.length} ຊຳລະແລ້ວ`} color={C.blue} />
      </div>

      {/* Revenue Chart + Order Status */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Card>
          <CardTitle>📊 ລາຍຮັບ 6 ເດືອນ (ບາດ)</CardTitle>
          <MiniBar data={chartData} color={C.purple} />
        </Card>
        <Card>
          <CardTitle>📋 ສະຖານະ Order</CardTitle>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[['ລໍຖ້າ', statusCount.pending, C.amber], ['ສົ່ງແລ້ວ', statusCount.shipped, C.blue], ['ຊຳລະແລ້ວ', statusCount.paid, C.green], ['ທັງໝົດ', orders.length, C.purple]].map(([l, v, c]) => (
              <div key={l} style={{ background: '#0a0f1e', borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: c }}>{v}</div>
                <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{l}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Debt Tracker */}
      <Card>
        <CardTitle color={C.red}>🏦 ສະຖານະໜີ້ 4,000,000 ບາດ</CardTitle>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: C.muted, marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
          <span>ຊຳລະໄປ: <span style={{ color: C.green, fontWeight: 700 }}>{fmtTHB(totalDebtPaid)}</span></span>
          <span>ເຫຼືອ: <span style={{ color: C.red, fontWeight: 700 }}>{fmtTHB(debtRemaining)}</span></span>
        </div>
        <div style={{ background: '#0a0f1e', borderRadius: 100, height: 16, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${debtProgress}%`, background: `linear-gradient(90deg, ${C.green}, ${C.purple})`, borderRadius: 100, transition: 'width 0.6s', minWidth: debtProgress > 0 ? 8 : 0 }} />
        </div>
        <div style={{ textAlign: 'center', fontSize: 11, color: C.muted, marginTop: 6 }}>{debtProgress.toFixed(2)}% ຊຳລະໄປແລ້ວ</div>
      </Card>

      {/* Top Agents */}
      <Card>
        <CardTitle>🏆 ຕົວແທນຂາຍດີ (Leaderboard)</CardTitle>
        {topAgents.length === 0 ? <div style={{ textAlign: 'center', color: '#334155', padding: 20 }}>ຍັງບໍ່ມີຂໍ້ມູນຕົວແທນ</div> : topAgents.map(([name, total], i) => (
          <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: '#0a0f1e', borderRadius: 10, marginBottom: 8 }}>
            <span style={{ fontSize: 20, width: 28, textAlign: 'center' }}>{['🥇', '🥈', '🥉', '4️⃣', '5️⃣'][i]}</span>
            <span style={{ flex: 1, color: C.text, fontWeight: 600 }}>{name}</span>
            <span style={{ color: C.green, fontWeight: 800 }}>{fmtTHB(total)}</span>
          </div>
        ))}
      </Card>

      {/* Pending Approvals */}
      {pendingExpenses.length > 0 && (
        <Card>
          <CardTitle color={C.amber}>⏳ ລາຍຈ່າຍລໍການອະນຸມັດ ({pendingExpenses.length})</CardTitle>
          {pendingExpenses.map(e => (
            <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0a0f1e', borderRadius: 10, padding: '10px 14px', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
              <div>
                <div style={{ color: C.text, fontWeight: 600 }}>{e.description}</div>
                <div style={{ fontSize: 11, color: C.muted }}>{e.category} · {e.expense_date}</div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ color: C.red, fontWeight: 700 }}>{e.currency === 'KIP' ? `${e.amount.toLocaleString()} ກີບ` : fmtTHB(e.amount)}</span>
                <Btn small onClick={() => approveExpense(e.id)} color={C.green}>✓ ອະນຸມັດ</Btn>
              </div>
            </div>
          ))}
        </Card>
      )}

      {/* Audit Log */}
      <Card>
        <CardTitle>🔍 Audit Log ({auditLog.length})</CardTitle>
        <div style={{ maxHeight: 280, overflowY: 'auto' }}>
          {auditLog.length === 0 && <div style={{ textAlign: 'center', color: '#334155', padding: 16 }}>ຍັງບໍ່ມີ</div>}
          {auditLog.map(log => (
            <div key={log.id} style={{ display: 'flex', gap: 10, padding: '7px 0', borderBottom: `1px solid ${C.border}`, fontSize: 11, alignItems: 'flex-start' }}>
              <span style={{ color: C.muted, whiteSpace: 'nowrap', minWidth: 90 }}>{log.time}</span>
              <span style={{ background: '#1e293b', color: C.sub, padding: '1px 7px', borderRadius: 5, whiteSpace: 'nowrap' }}>{log.user}</span>
              <span style={{ color: C.sub }}>{log.action}: <span style={{ color: '#475569' }}>{log.detail}</span></span>
            </div>
          ))}
        </div>
      </Card>

      {/* Rate Modal */}
      {showRateEdit && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div style={{ background: '#1e293b', border: `1px solid ${C.border}`, borderRadius: 16, padding: 24, width: '100%', maxWidth: 360 }}>
            <h3 style={{ color: C.text, marginBottom: 20 }}>💱 ຕັ້ງຄ່າອັດຕາແລກປ່ຽນ</h3>
            <div style={{ color: C.muted, fontSize: 13, marginBottom: 12 }}>1 ບາດ (THB) = ? ກີບ (LAK)</div>
            <input type="number" value={kip} onChange={e => setKip(e.target.value)}
              style={{ background: '#0a0f1e', border: `1px solid ${C.border}`, borderRadius: 9, color: C.text, padding: '12px 14px', fontSize: 16, outline: 'none', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' }} />
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <Btn onClick={() => setShowRateEdit(false)} color={C.card2} style={{ border: `1px solid ${C.border}`, color: C.sub, flex: 1, justifyContent: 'center' }}>ຍົກເລີກ</Btn>
              <Btn onClick={saveRate} color={C.purple} style={{ flex: 1, justifyContent: 'center' }}>ບັນທຶກ</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
