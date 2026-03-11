import { useState } from 'react'
import { Card, CardTitle, Btn, C } from './UI.jsx'
import { fmtTHB, fmtDate } from './store.js'

export default function PackerModule({ state, dispatch, user, notify }) {
  const { orders, products } = state
  const [tracking, setTracking] = useState({})
  const [viewOrder, setViewOrder] = useState(null)
  const [tab, setTab] = useState('queue')

  const pending = orders.filter(o => o.pack_status === 'pending')
  const packed = orders.filter(o => o.pack_status === 'packed')
  const shipped = orders.filter(o => o.pack_status === 'shipped')
  const today = new Date().toISOString().split('T')[0]
  const todayShipped = shipped.filter(o => o.shipped_at?.startsWith(today))
  const todayRevenue = todayShipped.reduce((s, o) => s + o.total, 0)

  const doPack = (order) => {
    const prod = products.find(p => p.id === order.productId)
    if (!prod || prod.stock < order.quantity) return notify('Stock ບໍ່ພຽງພໍ!', 'error')
    dispatch({ type: 'PACK_ORDER', id: order.id, productId: order.productId, qty: order.quantity, user: user.name })
    notify(`ແພັກ "${order.customerName}" ສຳເລັດ! Stock ຫັກ ${order.quantity} ✅`)
  }

  const doShip = (order) => {
    const t = tracking[order.id]?.trim()
    if (!t) return notify('ກະລຸນາໃສ່ Tracking Number', 'error')
    dispatch({ type: 'SHIP_ORDER', id: order.id, tracking: t, user: user.name })
    setTracking(p => { const n = { ...p }; delete n[order.id]; return n })
    notify(`ສົ່ງ "${order.customerName}" ສຳເລັດ! 🚀`)
  }

  const printLabel = (o) => {
    const w = window.open('', '_blank', 'width=400,height=500')
    w.document.write(`<html><head><title>ໃບໜ້າຊອງ</title><style>body{font-family:sans-serif;padding:24px;max-width:320px;border:2px solid #000}h2{margin:0 0 12px}p{margin:6px 0;font-size:14px}.big{font-size:18px;font-weight:bold;border:1px dashed #000;padding:8px;margin:10px 0}.footer{margin-top:16px;font-size:11px;color:#666;border-top:1px solid #ccc;padding-top:8px}</style></head><body><h2>🎗️ OuMi Band</h2><p><b>ຊື່:</b> ${o.customerName}</p><div class="big">📍 ${o.address}</div><p><b>ເບີ:</b> ${o.phone||'-'}</p><p><b>ຈຳນວນ:</b> ${o.quantity} ຊອງ</p><p><b>ຍອດ:</b> ${fmtTHB(o.total)}</p>${o.tracking_number?`<p><b>Tracking:</b> ${o.tracking_number}</p>`:''}<div class="footer">#${o.id.slice(-8)}</div></body></html>`)
    w.document.close(); setTimeout(() => w.print(), 300)
  }

  const subTabs = [
    { id: 'queue', label: `⏳ ຕ້ອງແພັກ (${pending.length})` },
    { id: 'ship', label: `📦 ພ້ອມສົ່ງ (${packed.length})` },
    { id: 'done', label: `✅ ສຳເລັດ (${shipped.length})` },
    { id: 'stock', label: '📊 Stock' },
    { id: 'daily', label: '📅 ວັນນີ້' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <h2 style={{ color: C.green, fontSize: 18, fontWeight: 800 }}>🏭 ສ່ວນຂອງ Packer</h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        {[[`${pending.length}`, 'ຕ້ອງແພັກ', C.amber],[`${packed.length}`,'ພ້ອມສົ່ງ',C.blue],[`${shipped.length}`,'ສົ່ງແລ້ວ',C.green],[`${todayShipped.length}`,'ວັນນີ້',C.purple]].map(([v,l,c])=>(
          <div key={l} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:12,textAlign:'center',borderTop:`2px solid ${c}`}}>
            <div style={{fontSize:22,fontWeight:800,color:c}}>{v}</div>
            <div style={{fontSize:10,color:C.muted,marginTop:2}}>{l}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', background: C.card, padding: 6, borderRadius: 12 }}>
        {subTabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ background: tab===t.id ? C.green+'22' : 'transparent', border: `1px solid ${tab===t.id ? C.green : 'transparent'}`, borderRadius: 8, padding: '6px 10px', fontSize: 11, color: tab===t.id ? C.green : C.muted, cursor: 'pointer', fontFamily: 'inherit', fontWeight: tab===t.id ? 700 : 400, whiteSpace: 'nowrap' }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'queue' && (
        <Card>
          <CardTitle color={C.amber}>⏳ ຕ້ອງແພັກ ({pending.length})</CardTitle>
          {pending.length === 0 && <div style={{textAlign:'center',color:'#334155',padding:24}}>ບໍ່ມີ Order ຄ້າງ ✅</div>}
          {pending.map(o => (
            <div key={o.id} style={{background:'#0a0f1e',borderRadius:12,padding:14,marginBottom:10,border:`1px solid ${C.border}`}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:8}}>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700,color:C.text,fontSize:15}}>{o.customerName}</div>
                  <div style={{fontSize:12,color:C.muted}}>📍 {o.address}</div>
                  <div style={{fontSize:12,color:C.muted}}>📞 {o.phone||'-'} | 🛍 {o.quantity} ຊອງ | <span style={{color:C.purple,fontWeight:700}}>{fmtTHB(o.total)}</span></div>
                  {o.notes && <div style={{fontSize:11,color:C.amber,marginTop:4}}>📝 {o.notes}</div>}
                </div>
                <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                  <Btn small onClick={() => setViewOrder(o)} color={C.card2} style={{border:`1px solid ${C.border}`,color:C.sub}}>👁</Btn>
                  <Btn small onClick={() => printLabel(o)} color={C.card2} style={{border:`1px solid ${C.border}`,color:C.sub}}>🖨</Btn>
                  <Btn small onClick={() => doPack(o)} color={C.green}>✓ ແພັກສຳເລັດ</Btn>
                </div>
              </div>
            </div>
          ))}
        </Card>
      )}

      {tab === 'ship' && (
        <Card>
          <CardTitle color={C.blue}>📦 ພ້ອມສົ່ງ ({packed.length})</CardTitle>
          {packed.length === 0 && <div style={{textAlign:'center',color:'#334155',padding:24}}>ບໍ່ມີລາຍການ</div>}
          {packed.map(o => (
            <div key={o.id} style={{background:'#0a0f1e',borderRadius:12,padding:14,marginBottom:10,border:`1px solid ${C.blue}33`}}>
              <div style={{fontWeight:700,color:C.text,marginBottom:4}}>{o.customerName} — {fmtTHB(o.total)}</div>
              <div style={{fontSize:12,color:C.muted,marginBottom:10}}>📍 {o.address} · {o.quantity} ຊອງ</div>
              <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
                <input value={tracking[o.id]||''} onChange={e=>setTracking(p=>({...p,[o.id]:e.target.value}))} placeholder="Tracking Number..."
                  style={{flex:1,minWidth:140,background:'#111827',border:`1px solid ${C.border}`,borderRadius:9,color:C.text,padding:'9px 12px',fontSize:13,outline:'none',fontFamily:'inherit'}}/>
                <Btn small onClick={()=>printLabel(o)} color={C.card2} style={{border:`1px solid ${C.border}`,color:C.sub}}>🖨</Btn>
                <Btn small onClick={()=>doShip(o)} color={C.amber}>🚀 ສົ່ງອອກ</Btn>
              </div>
            </div>
          ))}
        </Card>
      )}

      {tab === 'done' && (
        <Card>
          <CardTitle color={C.green}>✅ ສົ່ງສຳເລັດ ({shipped.length})</CardTitle>
          {shipped.length === 0 && <div style={{textAlign:'center',color:'#334155',padding:16}}>ຍັງບໍ່ມີ</div>}
          {shipped.map(o => (
            <div key={o.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0',borderBottom:`1px solid ${C.border}`,flexWrap:'wrap',gap:6}}>
              <div>
                <div style={{color:C.text,fontSize:13,fontWeight:600}}>{o.customerName}</div>
                <div style={{color:C.muted,fontSize:11}}>📦 {o.tracking_number} · {o.quantity} ຊອງ</div>
              </div>
              <div style={{textAlign:'right'}}>
                <div style={{color:C.green,fontWeight:700}}>{fmtTHB(o.total)}</div>
                <div style={{fontSize:10,color:o.status==='paid'?C.green:C.amber}}>{o.status==='paid'?'✓ ຊຳລະແລ້ວ':'⏳ ລໍຊຳລະ'}</div>
              </div>
            </div>
          ))}
        </Card>
      )}

      {tab === 'stock' && (
        <Card>
          <CardTitle>📊 ສະຖານະ Stock</CardTitle>
          {products.map(p => {
            const pct = Math.min(100, (p.stock / (p.alert_threshold * 3)) * 100)
            const isLow = p.stock <= p.alert_threshold
            return (
              <div key={p.id} style={{background:'#0a0f1e',borderRadius:12,padding:14,marginBottom:10}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
                  <div>
                    <div style={{fontWeight:700,color:C.text}}>{p.name}</div>
                    <div style={{fontSize:11,color:C.muted}}>Alert ເມື່ອ &lt; {p.alert_threshold} {p.unit}</div>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <div style={{fontSize:28,fontWeight:800,color:isLow?C.red:C.green}}>{p.stock.toLocaleString()}</div>
                    <div style={{fontSize:11,color:C.muted}}>{p.unit}</div>
                  </div>
                </div>
                <div style={{background:'#1e293b',borderRadius:100,height:8,overflow:'hidden'}}>
                  <div style={{height:'100%',width:`${pct}%`,background:isLow?C.red:C.green,borderRadius:100}}/>
                </div>
                {isLow && <div style={{fontSize:11,color:C.red,marginTop:6,fontWeight:700}}>⚠ Stock ໃກ້ໝົດ! ຕ້ອງສັ່ງເພີ່ມ</div>}
              </div>
            )
          })}
        </Card>
      )}

      {tab === 'daily' && (
        <Card>
          <CardTitle color={C.purple}>📅 ສະຫຼຸບວັນນີ້ ({today})</CardTitle>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:14}}>
            {[[`${todayShipped.length}`,'ກ່ອງທີ່ສົ່ງ',C.green],[fmtTHB(todayRevenue),'ຍອດລວມ',C.purple],[`${pending.length}`,'ຍັງຄ້າງ',C.amber],[`${packed.length}`,'ລໍ Tracking',C.blue]].map(([v,l,c])=>(
              <div key={l} style={{background:'#0a0f1e',borderRadius:10,padding:14,borderLeft:`3px solid ${c}`}}>
                <div style={{fontSize:11,color:C.muted}}>{l}</div>
                <div style={{fontSize:20,fontWeight:800,color:c,marginTop:4}}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{fontSize:12,color:C.muted,marginBottom:8,fontWeight:600}}>Order ທີ່ສົ່ງວັນນີ້:</div>
          {todayShipped.length === 0 ? <div style={{textAlign:'center',color:'#334155',padding:12}}>ຍັງບໍ່ມີ</div> : todayShipped.map(o=>(
            <div key={o.id} style={{display:'flex',justifyContent:'space-between',padding:'8px 12px',background:'#0a0f1e',borderRadius:8,marginBottom:6}}>
              <div>
                <div style={{color:C.text,fontSize:13}}>{o.customerName}</div>
                <div style={{color:C.muted,fontSize:11}}>📦 {o.tracking_number}</div>
              </div>
              <span style={{color:C.green,fontWeight:700}}>{fmtTHB(o.total)}</span>
            </div>
          ))}
        </Card>
      )}

      {viewOrder && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.75)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,padding:16}}>
          <div style={{background:'#1e293b',border:`1px solid ${C.border}`,borderRadius:16,padding:24,width:'100%',maxWidth:400}}>
            <h3 style={{color:C.text,marginBottom:16}}>📋 ຂໍ້ມູນ Order</h3>
            {[['ຊື່',viewOrder.customerName],['ທີ່ຢູ່',viewOrder.address],['ເບີ',viewOrder.phone||'-'],['ຈຳນວນ',`${viewOrder.quantity} ຊອງ`],['ຍອດ',fmtTHB(viewOrder.total)],['ໝາຍເຫດ',viewOrder.notes||'-']].map(([k,v])=>(
              <div key={k} style={{display:'flex',padding:'8px 0',borderBottom:`1px solid ${C.border}`,fontSize:13}}>
                <span style={{color:C.muted,width:80,flexShrink:0}}>{k}</span>
                <span style={{color:C.text}}>{v}</span>
              </div>
            ))}
            <Btn onClick={()=>setViewOrder(null)} color={C.card2} style={{border:`1px solid ${C.border}`,color:C.sub,width:'100%',justifyContent:'center',marginTop:16}}>ປິດ</Btn>
          </div>
        </div>
      )}
    </div>
  )
}
