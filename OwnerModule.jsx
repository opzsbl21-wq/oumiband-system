import { useState } from 'react'
import { Card, CardTitle, KPICard, Btn, MiniBar, C } from './UI.jsx'
import { fmtTHB, TOTAL_DEBT, TAX_RATE, DEBT_RATE, INITIAL_COUNTRY_RATES, calcCommission } from './store.js'

export default function OwnerModule({ state, dispatch, user, notify }) {
  const { orders, products, expenses, auditLog, rates, priceRates } = state
  const [tab, setTab] = useState('dashboard')
  const [kip, setKip] = useState(rates.thbToKip)
  const [editRates, setEditRates] = useState(priceRates.map(r => ({ ...r })))

  const paidOrders = orders.filter(o => o.status === 'paid')
  const totalRev = paidOrders.reduce((s, o) => s + o.total, 0)
  const totalIncOther = (state.incomes || []).reduce((s, i) => s + (i.currency === 'KIP' ? i.amount / rates.thbToKip : i.amount), 0)
  const totalRevenue = totalRev + totalIncOther
  const totalTax = totalRevenue * TAX_RATE
  const totalDebt = totalRevenue * DEBT_RATE
  const totalExp = expenses.reduce((s, e) => s + (e.currency === 'KIP' ? e.amount / rates.thbToKip : e.amount), 0)
  const totalCost = paidOrders.reduce((s, o) => { const p2 = products?.find(p => p.id === o.productId); return s + (p2 ? p2.cost_per_unit * o.quantity : 0) }, 0)
  const netProfit = totalRevenue - totalTax - totalDebt - totalExp - totalCost
  const totalDebtPaid = totalRevenue * DEBT_RATE
  const debtProgress = Math.min(100, (totalDebtPaid / TOTAL_DEBT) * 100)

  const todayStr = new Date().toISOString().split('T')[0]
  const last7 = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - (6 - i)); return d.toISOString().split('T')[0] })
  const dailyData = last7.map(date => {
    const rev = paidOrders.filter(o => o.verified_at?.startsWith(date)).reduce((s, o) => s + o.total, 0)
    const exp = expenses.filter(e => e.expense_date === date).reduce((s, e) => s + (e.currency === 'KIP' ? e.amount / rates.thbToKip : e.amount), 0)
    const cnt = paidOrders.filter(o => o.verified_at?.startsWith(date)).length
    return { date, rev, exp, profit: rev * (1 - TAX_RATE - DEBT_RATE) - exp, count: cnt }
  })
  const todayData = dailyData.find(d => d.date === todayStr) || { rev: 0, exp: 0, profit: 0, count: 0 }

  const agentMap = {}
  orders.filter(o => o.status === 'paid' && o.customer_type !== 'ລູກຄ້າປີກ').forEach(o => { agentMap[o.customerName] = (agentMap[o.customerName] || 0) + o.total })
  const topAgents = Object.entries(agentMap).sort((a, b) => b[1] - a[1]).slice(0, 5)
  const pendingExp = expenses.filter(e => !e.approved)

  const subTabs = [
    { id: 'dashboard', label: '👑 Dashboard' }, { id: 'daily', label: '📅 ລາຍວັນ' },
    { id: 'costs', label: '💸 ຕົ້ນທຶນ' }, { id: 'agents', label: '🏆 ຕົວແທນ' },
    { id: 'settings', label: '⚙ ຕັ້ງຄ່າ' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <h2 style={{ color: C.red, fontSize: 18, fontWeight: 800 }}>👑 Dashboard ເຈົ້າຂອງ</h2>
        <Btn onClick={() => { const r = orders.map(o => `${o.id},${o.customerName},${o.quantity},${o.total},${o.status}`); const b = new Blob(['\uFEFF' + ['ID,ຊື່,ຈຳນວນ,ຍອດ,ສະຖານະ', ...r].join('\n')], { type: 'text/csv;charset=utf-8' }); const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = `full-report-${Date.now()}.csv`; a.click() }} color={C.card2} small style={{ border: `1px solid ${C.border}`, color: C.sub }}>⬇ Export</Btn>
      </div>

      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', background: C.card, padding: 6, borderRadius: 12 }}>
        {subTabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ background: tab === t.id ? C.red + '22' : 'transparent', border: `1px solid ${tab === t.id ? C.red : 'transparent'}`, borderRadius: 8, padding: '6px 12px', fontSize: 11, color: tab === t.id ? C.red : C.muted, cursor: 'pointer', fontFamily: 'inherit', fontWeight: tab === t.id ? 700 : 400 }}>
            {t.label}
          </button>
        ))}
      </div>

      {pendingExp.length > 0 && (
        <div style={{ background: C.amber + '11', border: `1px solid ${C.amber}44`, borderRadius: 10, padding: '10px 14px', fontSize: 12, color: C.amber, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>⚠ ມີ {pendingExp.length} ລາຍຈ່າຍລໍການອະນຸມັດ</span>
          <Btn small onClick={() => setTab('settings')} color={C.amber}>ເບິ່ງ</Btn>
        </div>
      )}

      {tab === 'dashboard' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
            <KPICard icon="📈" label="ຍອດຂາຍລວມ" value={fmtTHB(totalRevenue)} sub={`${(totalRevenue * rates.thbToKip).toLocaleString()} ກີບ`} color={C.green} />
            <KPICard icon="💰" label="ກຳໄລສຸດທິ" value={fmtTHB(netProfit)} sub={netProfit >= 0 ? '✅ ກຳໄລ' : '⚠ ຂາດທຶນ'} color={netProfit >= 0 ? C.purple : C.red} />
            <KPICard icon="🧾" label="VAT 7%" value={fmtTHB(totalTax)} color={C.amber} />
            <KPICard icon="📦" label="ອໍເດີ" value={orders.length} sub={`${paidOrders.length} ຊຳລະແລ້ວ`} color={C.blue} />
          </div>
          <Card style={{ borderLeft: `3px solid ${C.green}` }}>
            <CardTitle color={C.green}>☀ ລາຍຮັບວັນນີ້ — {todayStr}</CardTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {[['💚 ລາຍຮັບ', fmtTHB(todayData.rev), C.green], ['💰 ກຳໄລ', fmtTHB(todayData.profit), todayData.profit >= 0 ? C.green : C.red], ['📦 ອໍເດີ', `${todayData.count} ໃບ`, C.blue]].map(([l, v, c]) => (
                <div key={l} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: C.muted }}>{l}</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: c, marginTop: 2 }}>{v}</div>
                </div>
              ))}
            </div>
          </Card>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Card>
              <CardTitle>📊 ລາຍຮັບ 7 ວັນ</CardTitle>
              <MiniBar data={dailyData.map(d => ({ l: d.date.slice(8), v: d.rev }))} color={C.purple} />
            </Card>
            <Card>
              <CardTitle>🏦 ໜີ້ {(debtProgress).toFixed(1)}%</CardTitle>
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 6 }}>ຊຳລະ {fmtTHB(totalDebtPaid)} / {fmtTHB(TOTAL_DEBT)}</div>
              <div style={{ background: '#0a0f1e', borderRadius: 100, height: 12, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${debtProgress}%`, background: `linear-gradient(90deg, ${C.green}, ${C.purple})`, borderRadius: 100 }} />
              </div>
              <div style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>ຍັງ {fmtTHB(Math.max(0, TOTAL_DEBT - totalDebtPaid))}</div>
            </Card>
          </div>
        </>
      )}

      {tab === 'daily' && (
        <Card>
          <CardTitle color={C.green}>📅 ລາຍຮັບ-ກຳໄລ 7 ວັນ</CardTitle>
          {dailyData.slice().reverse().map(d => (
            <div key={d.date} style={{ background: '#0a0f1e', borderRadius: 10, padding: 12, marginBottom: 8, border: d.date === todayStr ? `1px solid ${C.green}44` : `1px solid transparent` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: d.date === todayStr ? C.green : C.text }}>{d.date} {d.date === todayStr ? '☀ ວັນນີ້' : ''}</span>
                <span style={{ fontSize: 11, color: C.muted }}>{d.count} ອໍເດີ</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4, fontSize: 11 }}>
                <div><div style={{ color: C.muted }}>ລາຍຮັບ</div><div style={{ color: C.green, fontWeight: 700 }}>{fmtTHB(d.rev)}</div></div>
                <div><div style={{ color: C.muted }}>ລາຍຈ່າຍ</div><div style={{ color: C.red, fontWeight: 700 }}>{fmtTHB(d.exp)}</div></div>
                <div><div style={{ color: C.muted }}>ກຳໄລ</div><div style={{ color: d.profit >= 0 ? C.green : C.red, fontWeight: 700 }}>{fmtTHB(d.profit)}</div></div>
              </div>
            </div>
          ))}
        </Card>
      )}

      {tab === 'costs' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
            <KPICard icon="🏭" label="ຕົ້ນທຶນ" value={fmtTHB(totalCost)} color={C.blue} />
            <KPICard icon="💸" label="ລາຍຈ່າຍ" value={fmtTHB(totalExp)} color={C.red} />
            <KPICard icon="🧾" label="VAT+ໜີ້" value={fmtTHB(totalTax + totalDebt)} color={C.amber} />
            <KPICard icon="📊" label="Margin" value={`${totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0}%`} color={C.purple} />
          </div>
          <Card>
            <CardTitle>📊 P&L ສະຫຼຸບ</CardTitle>
            {[['+ ຍອດຂາຍ', totalRevenue, C.green], ['- ຕົ້ນທຶນ', totalCost, C.blue], ['- VAT 7%', totalTax, C.amber], ['- ໜີ້ 15%', totalDebt, C.purple], ['- ລາຍຈ່າຍ', totalExp, C.red], ['= ກຳໄລ', netProfit, netProfit >= 0 ? C.green : C.red]].map(([l, v, c]) => (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 12px', background: '#0a0f1e', borderRadius: 8, marginBottom: 6, fontWeight: l.startsWith('=') ? 700 : 400 }}>
                <span style={{ fontSize: 13, color: C.muted }}>{l}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: c }}>{fmtTHB(v)}</span>
              </div>
            ))}
          </Card>
        </>
      )}

      {tab === 'agents' && (
        <Card>
          <CardTitle color={C.amber}>🏆 Leaderboard ຕົວແທນ</CardTitle>
          {topAgents.length === 0 ? <div style={{ textAlign: 'center', color: '#334155', padding: 24 }}>ຍັງບໍ່ມີ</div> : topAgents.map(([name, total], i) => (
            <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: '#0a0f1e', borderRadius: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 20, width: 28, textAlign: 'center' }}>{['🥇', '🥈', '🥉', '4️⃣', '5️⃣'][i]}</span>
              <span style={{ flex: 1, color: C.text, fontWeight: 600 }}>{name}</span>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: C.green, fontWeight: 800 }}>{fmtTHB(total)}</div>
                <div style={{ fontSize: 10, color: C.purple }}>Commission: {fmtTHB(calcCommission(total))}</div>
              </div>
            </div>
          ))}
        </Card>
      )}

      {tab === 'settings' && (
        <>
          <Card>
            <CardTitle>💱 ອັດຕາແລກປ່ຽນ</CardTitle>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 10 }}>1 ບາດ (THB) = ? ກີບ</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <input type="number" value={kip} onChange={e => setKip(e.target.value)} style={{ flex: 1, background: '#0a0f1e', border: `1px solid ${C.border}`, borderRadius: 9, color: C.text, padding: '10px 12px', fontSize: 14, outline: 'none', fontFamily: 'inherit' }} />
              <Btn onClick={() => { dispatch({ type: 'SET_RATE', thbToKip: +kip }); notify(`1 THB = ${kip} ກີບ ✅`) }} color={C.purple}>ບັນທຶກ</Btn>
            </div>
          </Card>
          <Card>
            <CardTitle>💰 ແກ້ໄຂລາຄາຂາຍ (THB + KIP)</CardTitle>
            {editRates.map((r, i) => (
              <div key={r.id} style={{ background: '#0a0f1e', borderRadius: 10, padding: 12, marginBottom: 10 }}>
                <div style={{ fontSize: 12, color: C.muted, marginBottom: 8, fontWeight: 700 }}>{r.customer_type} ({r.min_qty}–{r.max_qty === 9999 ? '∞' : r.max_qty} ຊິ້ນ)</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div>
                    <label style={{ fontSize: 11, color: C.muted }}>ລາຄາ THB (฿)</label>
                    <input type="number" value={r.price_thb || r.price_per_unit} onChange={e => setEditRates(p => p.map((pr, pi) => pi === i ? { ...pr, price_thb: +e.target.value, price_per_unit: +e.target.value } : pr))}
                      style={{ width: '100%', background: '#111827', border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, padding: '8px', fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: C.muted }}>ລາຄາ KIP (ກີບ)</label>
                    <input type="number" value={r.price_kip || Math.round((r.price_thb || r.price_per_unit || 0) * rates.thbToKip)} onChange={e => setEditRates(p => p.map((pr, pi) => pi === i ? { ...pr, price_kip: +e.target.value } : pr))}
                      style={{ width: '100%', background: '#111827', border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, padding: '8px', fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                  </div>
                </div>
              </div>
            ))}
            <Btn onClick={() => { dispatch({ type: 'SET_PRICE_RATES', rates: editRates }); notify('ອັບເດດລາຄາສຳເລັດ ✅') }} color={C.green}>✓ ບັນທຶກລາຄາ</Btn>
          </Card>
          {pendingExp.length > 0 && (
            <Card>
              <CardTitle color={C.amber}>⏳ ອະນຸມັດລາຍຈ່າຍ</CardTitle>
              {pendingExp.map(e => (
                <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0a0f1e', borderRadius: 10, padding: '10px 14px', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
                  <div><div style={{ color: C.text, fontWeight: 600 }}>{e.description}</div><div style={{ fontSize: 11, color: C.muted }}>{e.category} · {e.expense_date}</div></div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ color: C.red, fontWeight: 700 }}>{e.currency === 'KIP' ? `${e.amount.toLocaleString()} ກີບ` : fmtTHB(e.amount)}</span>
                    <Btn small onClick={() => { dispatch({ type: 'APPROVE_EXPENSE', id: e.id, user: user.name }); notify('ອະນຸມັດ ✅') }} color={C.green}>✓</Btn>
                  </div>
                </div>
              ))}
            </Card>
          )}
          <Card>
            <CardTitle>🔍 Audit Log</CardTitle>
            <div style={{ maxHeight: 220, overflowY: 'auto' }}>
              {auditLog.length === 0 && <div style={{ textAlign: 'center', color: '#334155', padding: 16 }}>ຍັງບໍ່ມີ</div>}
              {auditLog.map(log => (
                <div key={log.id} style={{ display: 'flex', gap: 8, padding: '6px 0', borderBottom: `1px solid ${C.border}`, fontSize: 11 }}>
                  <span style={{ color: C.muted, whiteSpace: 'nowrap', minWidth: 80 }}>{log.time}</span>
                  <span style={{ background: '#1e293b', color: C.sub, padding: '1px 6px', borderRadius: 5, whiteSpace: 'nowrap' }}>{log.user}</span>
                  <span style={{ color: '#475569' }}>{log.action}: {log.detail}</span>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  )
}
