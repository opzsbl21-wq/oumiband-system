import { useState, useRef } from 'react'
import { Card, CardTitle, KPICard, Btn, Input, Select, Table, C } from './UI.jsx'
import { genId, fmtTHB, fmtDate, todayStr, TAX_RATE, DEBT_RATE, calcCommission } from './store.js'

export default function FinanceModule({ state, dispatch, user, notify }) {
  const { orders, expenses, incomes, rates } = state
  const [tab, setTab] = useState('summary')
  const [showExp, setShowExp] = useState(false)
  const [showInc, setShowInc] = useState(false)
  const [expAttach, setExpAttach] = useState(null)
  const [incAttach, setIncAttach] = useState(null)
  const fileExpRef = useRef()
  const fileIncRef = useRef()
  const [exp, setExp] = useState({ description: '', amount: '', currency: 'THB', category: 'Fixed', expense_date: todayStr() })
  const [inc, setInc] = useState({ description: '', amount: '', currency: 'THB', category: 'Sales', income_date: todayStr() })

  const paidOrders = orders.filter(o => o.status === 'paid')
  const unpaidOrders = orders.filter(o => o.status === 'shipped')
  const totalRevOrder = paidOrders.reduce((s, o) => s + o.total, 0)
  const totalIncOther = (incomes || []).reduce((s, i) => s + (i.currency === 'KIP' ? i.amount / rates.thbToKip : i.amount), 0)
  const totalRevenue = totalRevOrder + totalIncOther
  const totalTax = totalRevenue * TAX_RATE
  const totalDebt = totalRevenue * DEBT_RATE
  const totalExp = expenses.reduce((s, e) => s + (e.currency === 'KIP' ? e.amount / rates.thbToKip : e.amount), 0)
  const totalCost = paidOrders.reduce((s, o) => {
    const prod = state.products?.find(p => p.id === o.productId)
    return s + (prod ? prod.cost_per_unit * o.quantity : 0)
  }, 0)
  const netProfit = totalRevenue - totalTax - totalDebt - totalExp - totalCost

  const today = todayStr()
  const todayRevenue = paidOrders.filter(o => o.verified_at?.startsWith(today)).reduce((s, o) => s + o.total, 0)
  const todayExp = expenses.filter(e => e.expense_date === today).reduce((s, e) => s + (e.currency === 'KIP' ? e.amount / rates.thbToKip : e.amount), 0)
  const todayProfit = todayRevenue * (1 - TAX_RATE - DEBT_RATE) - todayExp

  const agentSales = {}
  orders.filter(o => o.status === 'paid' && o.customer_type !== 'ລູກຄ້າປີກ').forEach(o => {
    agentSales[o.customerName] = (agentSales[o.customerName] || 0) + o.total
  })

  const handleFile = (ref, setter) => (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setter({ name: file.name, data: ev.target.result, type: file.type })
    reader.readAsDataURL(file)
  }

  const addExpense = () => {
    if (!exp.description || !exp.amount) return notify('ກະລຸນາປ້ອນຂໍ້ມູນ', 'error')
    dispatch({ type: 'ADD_EXPENSE', expense: { ...exp, id: genId(), amount: +exp.amount, approved: false, attachment: expAttach } })
    notify('ບັນທຶກລາຍຈ່າຍສຳເລັດ ✅')
    setExp({ description: '', amount: '', currency: 'THB', category: 'Fixed', expense_date: todayStr() })
    setExpAttach(null); setShowExp(false)
  }

  const addIncome = () => {
    if (!inc.description || !inc.amount) return notify('ບັນທຶກລາຍຮັບສຳເລັດ ✅')
    dispatch({ type: 'ADD_INCOME', income: { ...inc, id: genId(), amount: +inc.amount, attachment: incAttach } })
    notify('ບັນທຶກລາຍຮັບສຳເລັດ ✅')
    setInc({ description: '', amount: '', currency: 'THB', category: 'Sales', income_date: todayStr() })
    setIncAttach(null); setShowInc(false)
  }

  const AttachBox = ({ attach, setAttach, fileRef }) => (
    <div style={{ marginTop: 10 }}>
      <div style={{ fontSize: 11, color: C.muted, marginBottom: 6 }}>📎 ແນບໄຟລ໌ / ຮູບ</div>
      <input ref={fileRef} type="file" accept="image/*,application/pdf" onChange={handleFile(fileRef, setAttach)} style={{ display: 'none' }} />
      <div style={{ display: 'flex', gap: 8 }}>
        <Btn small onClick={() => { fileRef.current.removeAttribute('capture'); fileRef.current.click() }} color={C.card2} style={{ border: `1px solid ${C.border}`, color: C.sub }}>📁 ໄຟລ໌</Btn>
        <Btn small onClick={() => { fileRef.current.setAttribute('capture', 'environment'); fileRef.current.click() }} color={C.card2} style={{ border: `1px solid ${C.border}`, color: C.sub }}>📷 ຖ່າຍຮູບ</Btn>
      </div>
      {attach && (
        <div style={{ marginTop: 8, background: '#0a0f1e', borderRadius: 8, padding: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
          {attach.type?.startsWith('image') ? <img src={attach.data} style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 6 }} /> : <span style={{ fontSize: 24 }}>📄</span>}
          <span style={{ fontSize: 11, color: C.sub }}>{attach.name}</span>
          <button onClick={() => setAttach(null)} style={{ background: 'none', border: 'none', color: C.red, cursor: 'pointer', marginLeft: 'auto' }}>✕</button>
        </div>
      )}
    </div>
  )

  const subTabs = [
    { id: 'summary', label: '📊 ສະຫຼຸບ' }, { id: 'daily', label: '📅 ວັນນີ້' },
    { id: 'income', label: '💚 ລາຍຮັບ' }, { id: 'expense', label: '💸 ລາຍຈ່າຍ' },
    { id: 'tax', label: '🧾 ອາກອນ' }, { id: 'commission', label: '🏆 Commission' },
    { id: 'verify', label: '✅ ຢືນຢັນ' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <h2 style={{ color: C.amber, fontSize: 18, fontWeight: 800 }}>💼 ສ່ວນຂອງບັນຊີ</h2>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Btn small onClick={() => { const d=[...orders.map(o=>`Order,${o.customerName},${o.total},${o.status},${o.created_at}`),...expenses.map(e=>`Expense,${e.description},${e.amount},${e.currency},${e.expense_date}`)]; const b=new Blob(['\uFEFF'+['Type,Detail,Amount,Currency,Date',...d].join('\n')],{type:'text/csv;charset=utf-8'}); const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=`finance-${today}.csv`;a.click() }} color={C.card2} style={{ border: `1px solid ${C.border}`, color: C.sub }}>⬇ Export</Btn>
          <Btn small onClick={() => { setShowInc(!showInc); setShowExp(false) }} color={C.green}>＋ ລາຍຮັບ</Btn>
          <Btn small onClick={() => { setShowExp(!showExp); setShowInc(false) }} color={C.amber}>＋ ລາຍຈ່າຍ</Btn>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', background: C.card, padding: 6, borderRadius: 12 }}>
        {subTabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ background: tab === t.id ? C.amber + '22' : 'transparent', border: `1px solid ${tab === t.id ? C.amber : 'transparent'}`, borderRadius: 8, padding: '6px 10px', fontSize: 11, color: tab === t.id ? C.amber : C.muted, cursor: 'pointer', fontFamily: 'inherit', fontWeight: tab === t.id ? 700 : 400 }}>
            {t.label}
          </button>
        ))}
      </div>

      {showInc && (
        <Card>
          <CardTitle color={C.green}>➕ ບັນທຶກລາຍຮັບ</CardTitle>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
            <div style={{ gridColumn: 'span 2' }}><Input label="ລາຍລະອຽດ *" value={inc.description} onChange={e => setInc(p => ({ ...p, description: e.target.value }))} placeholder="ແຫຼ່ງລາຍຮັບ..." /></div>
            <Input label="ຈຳນວນ *" type="number" value={inc.amount} onChange={e => setInc(p => ({ ...p, amount: e.target.value }))} />
            <Select label="ສະກຸນ" value={inc.currency} onChange={e => setInc(p => ({ ...p, currency: e.target.value }))} options={[{ value: 'THB', label: '฿ ບາດ' }, { value: 'KIP', label: 'ກີບ' }]} />
            <Select label="ໝວດ" value={inc.category} onChange={e => setInc(p => ({ ...p, category: e.target.value }))} options={['Sales', 'Transfer', 'Commission', 'Other'].map(v => ({ value: v, label: v }))} />
            <Input label="ວັນທີ" type="date" value={inc.income_date} onChange={e => setInc(p => ({ ...p, income_date: e.target.value }))} />
          </div>
          <AttachBox attach={incAttach} setAttach={setIncAttach} fileRef={fileIncRef} />
          <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
            <Btn onClick={() => setShowInc(false)} color={C.card2} style={{ border: `1px solid ${C.border}`, color: C.sub }}>ຍົກເລີກ</Btn>
            <Btn onClick={addIncome} color={C.green}>ບັນທຶກ</Btn>
          </div>
        </Card>
      )}

      {showExp && (
        <Card>
          <CardTitle>➕ ບັນທຶກລາຍຈ່າຍ</CardTitle>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
            <div style={{ gridColumn: 'span 2' }}><Input label="ລາຍລະອຽດ *" value={exp.description} onChange={e => setExp(p => ({ ...p, description: e.target.value }))} placeholder="ລາຍລະອຽດ..." /></div>
            <Input label="ຈຳນວນ *" type="number" value={exp.amount} onChange={e => setExp(p => ({ ...p, amount: e.target.value }))} />
            <Select label="ສະກຸນ" value={exp.currency} onChange={e => setExp(p => ({ ...p, currency: e.target.value }))} options={[{ value: 'THB', label: '฿ ບາດ' }, { value: 'KIP', label: 'ກີບ' }]} />
            <Select label="ໝວດ" value={exp.category} onChange={e => setExp(p => ({ ...p, category: e.target.value }))} options={['Fixed', 'Salary', 'Utility', 'Marketing', 'Cost', 'Other'].map(v => ({ value: v, label: v }))} />
            <Input label="ວັນທີ" type="date" value={exp.expense_date} onChange={e => setExp(p => ({ ...p, expense_date: e.target.value }))} />
          </div>
          <AttachBox attach={expAttach} setAttach={setExpAttach} fileRef={fileExpRef} />
          <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
            <Btn onClick={() => setShowExp(false)} color={C.card2} style={{ border: `1px solid ${C.border}`, color: C.sub }}>ຍົກເລີກ</Btn>
            <Btn onClick={addExpense} color={C.amber}>ບັນທຶກ</Btn>
          </div>
        </Card>
      )}

      {tab === 'summary' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
          <KPICard icon="📈" label="ຍອດຂາຍລວມ" value={fmtTHB(totalRevenue)} sub={`${(totalRevenue * rates.thbToKip).toLocaleString()} ກີບ`} color={C.green} />
          <KPICard icon="🏭" label="ຕົ້ນທຶນ" value={fmtTHB(totalCost)} sub="ຕົ້ນທຶນສິນຄ້າ" color={C.blue} />
          <KPICard icon="🧾" label="VAT 7%" value={fmtTHB(totalTax)} sub="ຕ້ອງຊຳລະ" color={C.amber} />
          <KPICard icon="🏦" label="ໜີ້ 15%" value={fmtTHB(totalDebt)} sub="ຫັກໄວ້" color={C.purple} />
          <KPICard icon="💸" label="ລາຍຈ່າຍ" value={fmtTHB(totalExp)} sub="ລວມທັງໝົດ" color={C.red} />
          <KPICard icon="💰" label="ກຳໄລສຸດທິ" value={fmtTHB(netProfit)} sub={netProfit >= 0 ? '✅ ກຳໄລ' : '⚠ ຂາດທຶນ'} color={netProfit >= 0 ? C.green : C.red} />
        </div>
      )}

      {tab === 'daily' && (
        <Card>
          <CardTitle color={C.green}>📅 ສະຫຼຸບວັນນີ້ — {today}</CardTitle>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[['💚 ລາຍຮັບ', todayRevenue, C.green], ['💸 ລາຍຈ່າຍ', todayExp, C.red], ['🧾 VAT 7%', todayRevenue * TAX_RATE, C.amber], ['💰 ກຳໄລ', todayProfit, todayProfit >= 0 ? C.green : C.red]].map(([l, v, c]) => (
              <div key={l} style={{ background: '#0a0f1e', borderRadius: 10, padding: 14, borderLeft: `3px solid ${c}` }}>
                <div style={{ fontSize: 11, color: C.muted }}>{l}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: c, marginTop: 4 }}>{fmtTHB(v)}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {tab === 'income' && (
        <Card>
          <CardTitle color={C.green}>💚 ລາຍຮັບທັງໝົດ</CardTitle>
          <Table headers={['ວັນທີ', 'ລາຍລະອຽດ', 'ໝວດ', 'ຈຳນວນ', 'ໄຟລ໌']}
            rows={(incomes || []).map(i => [i.income_date, i.description,
              <span style={{ fontSize: 11, background: '#1e293b', color: C.sub, padding: '2px 7px', borderRadius: 5 }}>{i.category}</span>,
              <span style={{ color: C.green, fontWeight: 700 }}>{i.currency === 'KIP' ? `${i.amount.toLocaleString()} ກີບ` : fmtTHB(i.amount)}</span>,
              i.attachment?.type?.startsWith('image') ? <img src={i.attachment.data} style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 4, cursor: 'pointer' }} onClick={() => window.open(i.attachment.data)} /> : i.attachment ? '📄' : '-'
            ])} />
        </Card>
      )}

      {tab === 'expense' && (
        <Card>
          <CardTitle>💸 ລາຍຈ່າຍ (ລວມ: {fmtTHB(totalExp)})</CardTitle>
          <Table headers={['ວັນທີ', 'ລາຍລະອຽດ', 'ໝວດ', 'ຈຳນວນ', 'ໄຟລ໌', 'ສະຖານະ']}
            rows={expenses.map(e => [e.expense_date, e.description,
              <span style={{ fontSize: 11, background: '#1e293b', color: C.sub, padding: '2px 7px', borderRadius: 5 }}>{e.category}</span>,
              <span style={{ color: C.red }}>{e.currency === 'KIP' ? `${e.amount.toLocaleString()} ກີບ` : fmtTHB(e.amount)}</span>,
              e.attachment?.type?.startsWith('image') ? <img src={e.attachment.data} style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 4, cursor: 'pointer' }} onClick={() => window.open(e.attachment.data)} /> : e.attachment ? '📄' : '-',
              e.approved ? <span style={{ color: C.green, fontSize: 11 }}>✓ ອະນຸມັດ</span> : <span style={{ color: C.amber, fontSize: 11 }}>ລໍ Owner</span>
            ])} />
        </Card>
      )}

      {tab === 'tax' && (
        <Card>
          <CardTitle color={C.amber}>🧾 ສະຫຼຸບອາກອນ</CardTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[['ຍອດຂາຍທັງໝົດ', fmtTHB(totalRevenue), C.text], ['VAT 7% (ຕ້ອງຊຳລະ)', fmtTHB(totalTax), C.amber], ['ຍອດຫຼັງ VAT', fmtTHB(totalRevenue - totalTax), C.green], ['ກອງທຶນໜີ້ 15%', fmtTHB(totalDebt), C.purple], ['ລາຍຈ່າຍທຸລະກິດ', fmtTHB(totalExp), C.red], ['ກຳໄລສຸດທິ', fmtTHB(netProfit), netProfit >= 0 ? C.green : C.red]].map(([l, v, c]) => (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#0a0f1e', borderRadius: 8 }}>
                <span style={{ fontSize: 13, color: C.muted }}>{l}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: c }}>{v}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 14, background: C.amber + '11', border: `1px solid ${C.amber}33`, borderRadius: 10, padding: 14 }}>
            <div style={{ fontSize: 12, color: C.amber, fontWeight: 700 }}>📋 ສຳລັບສົ່ງອາກອນ: VAT {fmtTHB(totalTax)} → ກົດ Export ດ້ານເທິງ</div>
          </div>
        </Card>
      )}

      {tab === 'commission' && (
        <Card>
          <CardTitle color={C.purple}>🏆 Commission ຕົວແທນ</CardTitle>
          {Object.entries(agentSales).length === 0 ? <div style={{ textAlign: 'center', color: '#334155', padding: 24 }}>ຍັງບໍ່ມີຂໍ້ມູນ</div> : (
            <Table headers={['ຕົວແທນ', 'ຍອດຂາຍ', 'ລະດັບ', 'Rate', 'Commission']}
              rows={Object.entries(agentSales).sort((a, b) => b[1] - a[1]).map(([name, sales]) => {
                const tier = sales >= 100000 ? '🥇 ທອງ 12%' : sales >= 50000 ? '🥈 ເງິນ 8%' : '🥉 ທົ່ວໄປ 5%'
                const rate = sales >= 100000 ? '12%' : sales >= 50000 ? '8%' : '5%'
                return [<span style={{ color: C.text, fontWeight: 600 }}>{name}</span>, <span style={{ color: C.green }}>{fmtTHB(sales)}</span>, tier, rate, <span style={{ color: C.purple, fontWeight: 700 }}>{fmtTHB(calcCommission(sales))}</span>]
              })} />
          )}
        </Card>
      )}

      {tab === 'verify' && (
        <Card>
          <CardTitle color={C.green}>✅ ຢືນຢັນການຊຳລະ ({unpaidOrders.length})</CardTitle>
          {unpaidOrders.length === 0 ? <div style={{ textAlign: 'center', color: '#334155', padding: 20 }}>ທຸກລາຍການຢືນຢັນແລ້ວ</div> : unpaidOrders.map(o => (
            <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0a0f1e', borderRadius: 10, padding: '12px 14px', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
              <div>
                <div style={{ fontWeight: 700, color: C.text }}>{o.customerName}</div>
                <div style={{ fontSize: 11, color: C.muted }}>Tracking: {o.tracking_number}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ color: C.green, fontWeight: 800 }}>{fmtTHB(o.total)}</span>
                <Btn small onClick={() => { dispatch({ type: 'VERIFY_PAYMENT', id: o.id, user: user.name }); notify('ຢືນຢັນສຳເລັດ ✅') }} color={C.green}>✓ ຢືນຢັນ</Btn>
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  )
}
