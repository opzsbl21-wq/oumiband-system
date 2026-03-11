import { useState } from 'react'
import { Card, CardTitle, KPICard, Btn, Input, Select, Table, C } from './UI.jsx'
import { genId, fmtTHB, fmtDate, TAX_RATE, DEBT_RATE } from '../store.js'

export default function FinanceModule({ state, dispatch, user, notify }) {
  const { orders, expenses, rates } = state
  const [showExp, setShowExp] = useState(false)
  const [exp, setExp] = useState({ description: '', amount: '', currency: 'THB', category: 'Fixed', expense_date: new Date().toISOString().split('T')[0] })

  const paidOrders = orders.filter(o => o.status === 'paid')
  const unpaidOrders = orders.filter(o => o.status === 'pending' && o.pack_status === 'shipped')
  const totalRev = paidOrders.reduce((s, o) => s + o.total, 0)
  const totalTax = totalRev * TAX_RATE
  const totalDebt = totalRev * DEBT_RATE
  const totalExp = expenses.reduce((s, e) => s + (e.currency === 'KIP' ? e.amount / rates.thbToKip : e.amount), 0)
  const netProfit = totalRev - totalTax - totalDebt - totalExp

  const verify = (id) => {
    dispatch({ type: 'VERIFY_PAYMENT', id, user: user.name })
    notify('ຢືນຢັນການຊຳລະສຳເລັດ ✅')
  }

  const addExpense = () => {
    if (!exp.description || !exp.amount) return notify('ກະລຸນາປ້ອນຂໍ້ມູນ', 'error')
    dispatch({ type: 'ADD_EXPENSE', expense: { ...exp, id: genId(), amount: +exp.amount, approved: false } })
    notify('ບັນທຶກລາຍຈ່າຍສຳເລັດ')
    setExp({ description: '', amount: '', currency: 'THB', category: 'Fixed', expense_date: new Date().toISOString().split('T')[0] })
    setShowExp(false)
  }

  const exportReport = () => {
    const lines = [
      'OuMi Band — ລາຍງານການເງິນ',
      `ວັນທີ: ${new Date().toLocaleDateString('lo-LA')}`,
      '',
      `ຍອດຂາຍລວມ,${fmtTHB(totalRev)}`,
      `ພາສີ VAT 7%,${fmtTHB(totalTax)}`,
      `ກອງທຶນໜີ້ 15%,${fmtTHB(totalDebt)}`,
      `ລາຍຈ່າຍ,${fmtTHB(totalExp)}`,
      `ກຳໄລສຸດທິ,${fmtTHB(netProfit)}`,
      '',
      'ລາຍຈ່າຍ,',
      ...expenses.map(e => `${e.description},${e.amount} ${e.currency}`)
    ]
    const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `finance-report-${Date.now()}.csv`; a.click()
  }

  const expRows = expenses.map(e => [
    e.expense_date, e.description,
    <span style={{ fontSize: 11, background: '#1e293b', color: C.sub, padding: '2px 7px', borderRadius: 5 }}>{e.category}</span>,
    <span style={{ color: C.red }}>{e.currency === 'KIP' ? `${e.amount.toLocaleString()} ກີບ` : fmtTHB(e.amount)}</span>,
    e.approved ? <span style={{ color: C.green, fontSize: 11 }}>✓ ອະນຸມັດ</span> : <span style={{ color: C.amber, fontSize: 11 }}>ລໍ Owner</span>
  ])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <h2 style={{ color: C.amber, fontSize: 18, fontWeight: 800 }}>💼 ສ່ວນຂອງບັນຊີ</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn onClick={exportReport} color={C.card2} small style={{ border: `1px solid ${C.border}`, color: C.sub }}>⬇ Export</Btn>
          <Btn onClick={() => setShowExp(!showExp)} color={C.amber}>＋ ບັນທຶກລາຍຈ່າຍ</Btn>
        </div>
      </div>

      {/* KPI Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
        <KPICard icon="📈" label="ຍອດຂາຍລວມ" value={fmtTHB(totalRev)} sub={`${(totalRev * rates.thbToKip).toLocaleString()} ກີບ`} color={C.green} />
        <KPICard icon="🧾" label="ພາສີ VAT 7%" value={fmtTHB(totalTax)} sub="ຕ້ອງຊຳລະ" color={C.amber} />
        <KPICard icon="🏦" label="ກອງທຶນໜີ້ 15%" value={fmtTHB(totalDebt)} sub="ຫັກເພື່ອໜີ້" color={C.purple} />
        <KPICard icon="💰" label="ກຳໄລສຸດທິ" value={fmtTHB(netProfit)} sub={netProfit >= 0 ? '✅ ກຳໄລ' : '⚠ ຂາດທຶນ'} color={netProfit >= 0 ? C.green : C.red} />
      </div>

      {/* Expense Form */}
      {showExp && (
        <Card>
          <CardTitle>➕ ບັນທຶກລາຍຈ່າຍ</CardTitle>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
            <div style={{ gridColumn: 'span 2' }}>
              <Input label="ລາຍລະອຽດ *" value={exp.description} onChange={e => setExp(p => ({ ...p, description: e.target.value }))} placeholder="ລາຍລະອຽດ..." />
            </div>
            <Input label="ຈຳນວນ *" type="number" value={exp.amount} onChange={e => setExp(p => ({ ...p, amount: e.target.value }))} />
            <Select label="ສະກຸນ" value={exp.currency} onChange={e => setExp(p => ({ ...p, currency: e.target.value }))} options={[{ value: 'THB', label: 'ບາດ (THB)' }, { value: 'KIP', label: 'ກີບ (KIP)' }]} />
            <Select label="ໝວດ" value={exp.category} onChange={e => setExp(p => ({ ...p, category: e.target.value }))} options={['Fixed', 'Salary', 'Utility', 'Marketing', 'Other'].map(v => ({ value: v, label: v }))} />
            <Input label="ວັນທີ" type="date" value={exp.expense_date} onChange={e => setExp(p => ({ ...p, expense_date: e.target.value }))} />
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
            <Btn onClick={() => setShowExp(false)} color={C.card2} style={{ border: `1px solid ${C.border}`, color: C.sub }}>ຍົກເລີກ</Btn>
            <Btn onClick={addExpense} color={C.amber}>ບັນທຶກ</Btn>
          </div>
        </Card>
      )}

      {/* Payment Verification */}
      <Card>
        <CardTitle color={C.green}>✅ ຢືນຢັນການຊຳລະ ({unpaidOrders.length})</CardTitle>
        {unpaidOrders.length === 0 ? <div style={{ textAlign: 'center', color: '#334155', padding: 16 }}>ທຸກລາຍການຢືນຢັນແລ້ວ</div> : unpaidOrders.map(o => (
          <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0a0f1e', borderRadius: 10, padding: '12px 14px', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
            <div>
              <div style={{ fontWeight: 700, color: C.text }}>{o.customerName}</div>
              <div style={{ fontSize: 12, color: C.muted }}>{fmtDate(o.created_at)} · Tracking: {o.tracking_number}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ color: C.green, fontWeight: 800, fontSize: 16 }}>{fmtTHB(o.total)}</span>
              <Btn small onClick={() => verify(o.id)} color={C.green}>✓ ຢືນຢັນ</Btn>
            </div>
          </div>
        ))}
      </Card>

      {/* Expenses Table */}
      <Card>
        <CardTitle>📊 ລາຍຈ່າຍທັງໝົດ (ລວມ: {fmtTHB(totalExp)})</CardTitle>
        <Table headers={['ວັນທີ', 'ລາຍລະອຽດ', 'ໝວດ', 'ຈຳນວນ', 'ສະຖານະ']} rows={expRows} />
      </Card>
    </div>
  )
}
