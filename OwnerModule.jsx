import { useState } from 'react'
import { Card, CardTitle, KPICard, Btn, MiniBar, C } from './UI.jsx'
import { fmtTHB, todayStr, TOTAL_DEBT, TAX_RATE, DEBT_RATE, calcCommission, genId, ROLES } from './store.js'

function NumInput({ label, value, onChange, placeholder='' }) {
  const [local,setLocal]=useState(null)
  const display=local!==null?local:(value===0?'':String(value||''))
  return (
    <div style={{display:'flex',flexDirection:'column',gap:5}}>
      {label&&<label style={{fontSize:11,color:C.muted,fontWeight:600}}>{label}</label>}
      <input type="text" inputMode="numeric" value={display} placeholder={placeholder||'0'}
        onChange={e=>{const r=e.target.value.replace(/[^0-9.]/g,'');setLocal(r);onChange(r===''?0:parseFloat(r)||0)}}
        onFocus={e=>{setLocal(value===0?'':String(value||''));setTimeout(()=>e.target.select(),0)}}
        onBlur={()=>setLocal(null)}
        style={{background:'#0a0f1e',border:`1px solid ${C.border}`,borderRadius:9,color:C.text,padding:'10px 12px',fontSize:14,outline:'none',fontFamily:'inherit',width:'100%',boxSizing:'border-box'}}/>
    </div>
  )
}
function TxtInput({label,value,onChange,placeholder='',type='text'}) {
  return (
    <div style={{display:'flex',flexDirection:'column',gap:5}}>
      {label&&<label style={{fontSize:11,color:C.muted,fontWeight:600}}>{label}</label>}
      <input type={type} value={value} onChange={onChange} placeholder={placeholder}
        style={{background:'#0a0f1e',border:`1px solid ${C.border}`,borderRadius:9,color:C.text,padding:'10px 12px',fontSize:13,outline:'none',fontFamily:'inherit',width:'100%',boxSizing:'border-box'}}/>
    </div>
  )
}
function Modal({title,onClose,children}) {
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.8)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,padding:16}}>
      <div style={{background:'#1e293b',border:`1px solid ${C.border}`,borderRadius:16,padding:24,width:'100%',maxWidth:500,maxHeight:'90vh',overflowY:'auto'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
          <h3 style={{color:C.text,fontSize:15,fontWeight:700}}>{title}</h3>
          <button onClick={onClose} style={{background:'none',border:'none',color:C.muted,cursor:'pointer',fontSize:20}}>✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}
function SelInput({label,value,onChange,options}) {
  return (
    <div style={{display:'flex',flexDirection:'column',gap:5}}>
      {label&&<label style={{fontSize:11,color:C.muted,fontWeight:600}}>{label}</label>}
      <select value={value} onChange={onChange} style={{background:'#0a0f1e',border:`1px solid ${C.border}`,borderRadius:9,color:C.text,padding:'10px 12px',fontSize:13,fontFamily:'inherit',width:'100%'}}>
        {options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}

const TABS_OW=['dashboard','staff','promo','report','tax','audit']
const TAB_LABELS={dashboard:'📊 Dashboard',staff:'👥 ທີມ',promo:'🎁 ໂປຣ',report:'📋 ລາຍງານ',tax:'🧾 ອາກອນ',audit:'🔍 Log'}

export default function OwnerModule({state,dispatch,user,notify}) {
  const {orders,products,expenses,incomes,auditLog,rates,priceRates}=state
  const [tab,setTab]=useState('dashboard')
  const paidOrders=orders.filter(o=>o.status==='paid')
  const totalRevOrder=paidOrders.reduce((s,o)=>s+o.total,0)
  const totalIncOther=(incomes||[]).reduce((s,i)=>s+(i.currency==='KIP'?i.amount/rates.thbToKip:i.amount),0)
  const totalRevenue=totalRevOrder+totalIncOther
  const totalTax=totalRevenue*TAX_RATE
  const totalDebtAmt=totalRevenue*DEBT_RATE
  const totalExp=expenses.reduce((s,e)=>s+(e.currency==='KIP'?e.amount/rates.thbToKip:e.amount),0)
  const totalCost=paidOrders.reduce((s,o)=>{const p=products.find(p=>p.id===o.productId);return s+(p?(p.cost_per_unit||0)*o.quantity:0)},0)
  const netProfit=totalRevenue-totalTax-totalDebtAmt-totalExp-totalCost
  const debtPaid=totalRevenue*DEBT_RATE
  const debtPct=Math.min(100,(debtPaid/TOTAL_DEBT)*100)
  const today=todayStr()
  const getDateRev=d=>paidOrders.filter(o=>o.verified_at?.startsWith(d)).reduce((s,o)=>s+o.total,0)
  const getDateExp=d=>expenses.filter(e=>e.expense_date===d).reduce((s,e)=>s+(e.currency==='KIP'?e.amount/rates.thbToKip:e.amount),0)
  const getDateCost=d=>paidOrders.filter(o=>o.verified_at?.startsWith(d)).reduce((s,o)=>{const p=products.find(p=>p.id===o.productId);return s+(p?(p.cost_per_unit||0)*o.quantity:0)},0)
  const last7=Array.from({length:7},(_,i)=>{
    const d=new Date();d.setDate(d.getDate()-(6-i))
    const ds=d.toISOString().split('T')[0]
    const rev=getDateRev(ds);const exp=getDateExp(ds);const cost=getDateCost(ds)
    return{date:ds,label:`${d.getDate()}/${d.getMonth()+1}`,rev,exp,profit:rev*(1-TAX_RATE-DEBT_RATE)-exp-cost}
  })
  const todayData=last7[6]
  const agentMap={}
  orders.filter(o=>o.status==='paid'&&o.customer_type!=='ລູກຄ້າປີກ').forEach(o=>{agentMap[o.customerName]=(agentMap[o.customerName]||0)+o.total})
  const topAgents=Object.entries(agentMap).sort((a,b)=>b[1]-a[1]).slice(0,5)
  const moduleProps={state,dispatch,user,notify,rates,priceRates,paidOrders,totalRevenue,totalCost,netProfit,totalTax,orders,totalExp,last7,todayData,today,getDateCost,debtPaid,debtPct,topAgents,expenses}

  return (
    <div style={{display:'flex',flexDirection:'column',gap:14}}>
      <div style={{display:'flex',gap:4,overflowX:'auto',background:C.card,borderRadius:12,padding:4}}>
        {TABS_OW.map(t=>(
          <button key={t} onClick={()=>setTab(t)}
            style={{flex:'0 0 auto',padding:'8px 12px',background:tab===t?C.red+'22':'transparent',border:tab===t?`1px solid ${C.red}44`:'1px solid transparent',borderRadius:9,color:tab===t?C.red:C.muted,cursor:'pointer',fontSize:11,fontWeight:tab===t?700:400,fontFamily:'inherit',whiteSpace:'nowrap'}}>
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>
      {tab==='dashboard'&&<DashTab {...moduleProps}/>}
      {tab==='staff'&&<StaffTab state={state} dispatch={dispatch} user={user} notify={notify}/>}
      {tab==='promo'&&<PromoTab state={state} dispatch={dispatch} user={user} notify={notify}/>}
      {tab==='report'&&<ReportTab state={state} rates={rates}/>}
      {tab==='tax'&&<TaxTab state={state} dispatch={dispatch} user={user} notify={notify}/>}
      {tab==='audit'&&<AuditTab auditLog={auditLog}/>}
    </div>
  )
}

function DashTab({state,dispatch,user,notify,rates,priceRates,paidOrders,totalRevenue,totalCost,netProfit,totalTax,orders,totalExp,last7,todayData,today,getDateCost,debtPaid,debtPct,topAgents,expenses}) {
  const [showKIP,setShowKIP]=useState(false)
  const [kipLocal,setKipLocal]=useState('')
  const [editRate,setEditRate]=useState(null)
  const pendingExp=expenses.filter(e=>!e.approved)

  return (
    <>
      <div style={{display:'flex',justifyContent:'flex-end',gap:8,flexWrap:'wrap'}}>
        <Btn small onClick={()=>{setKipLocal(String(rates.thbToKip));setShowKIP(true)}} color={C.card2} style={{border:`1px solid ${C.border}`,color:C.sub}}>💱 KIP Rate</Btn>
        <Btn small onClick={()=>setEditRate({...priceRates[0]})} color={C.card2} style={{border:`1px solid ${C.border}`,color:C.sub}}>✏ ແກ້ລາຄາ</Btn>
      </div>
      <div style={{background:'linear-gradient(135deg,#1e1b4b,#0c2340)',borderRadius:16,padding:18,border:`1px solid ${C.purple}33`}}>
        <div style={{fontSize:11,color:C.muted,marginBottom:10}}>📅 ວັນນີ້ — {today}</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8}}>
          {[['💚 ລາຍຮັບ',todayData?.rev||0,C.green],['🏭 ຕົ້ນທຶນ',getDateCost(today),C.blue],['💸 ລາຍຈ່າຍ',todayData?.exp||0,C.red],['💰 ກຳໄລ',todayData?.profit||0,(todayData?.profit||0)>=0?C.green:C.red]].map(([l,v,c])=>(
            <div key={l} style={{textAlign:'center'}}><div style={{fontSize:9,color:C.muted}}>{l}</div><div style={{fontSize:14,fontWeight:800,color:c}}>{fmtTHB(v)}</div></div>
          ))}
        </div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(120px,1fr))',gap:10}}>
        <KPICard icon="📈" label="ຍອດຂາຍ" value={fmtTHB(totalRevenue)} sub={`${Math.round(totalRevenue*rates.thbToKip).toLocaleString()} ກີບ`} color={C.green}/>
        <KPICard icon="🏭" label="ຕົ້ນທຶນ" value={fmtTHB(totalCost)} color={C.blue}/>
        <KPICard icon="💰" label="ກຳໄລ" value={fmtTHB(netProfit)} color={netProfit>=0?C.purple:C.red}/>
        <KPICard icon="🧾" label="VAT" value={fmtTHB(totalTax)} color={C.amber}/>
        <KPICard icon="📦" label="Order" value={orders.length} sub={`${paidOrders.length} ຊຳລະ`} color={C.blue}/>
        <KPICard icon="💸" label="ລາຍຈ່າຍ" value={fmtTHB(totalExp)} color={C.red}/>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
        <Card><CardTitle>📊 ລາຍຮັບ 7 ວັນ</CardTitle><MiniBar data={last7.map(d=>({l:d.label,v:Math.max(0,d.rev)}))} color={C.green}/></Card>
        <Card><CardTitle>💰 ກຳໄລ 7 ວັນ</CardTitle><MiniBar data={last7.map(d=>({l:d.label,v:Math.max(0,d.profit)}))} color={C.purple}/></Card>
      </div>
      <Card>
        <div style={{display:'flex',justifyContent:'space-between',fontSize:13,color:C.muted,marginBottom:8}}>
          <span>ຊຳລະໜີ້: <span style={{color:C.green,fontWeight:700}}>{fmtTHB(debtPaid)}</span></span>
          <span>ເຫຼືອ: <span style={{color:C.red,fontWeight:700}}>{fmtTHB(Math.max(0,TOTAL_DEBT-debtPaid))}</span></span>
        </div>
        <div style={{background:'#0a0f1e',borderRadius:100,height:14,overflow:'hidden'}}>
          <div style={{height:'100%',width:`${debtPct}%`,background:`linear-gradient(90deg,${C.green},${C.purple})`,borderRadius:100}}/>
        </div>
        <div style={{textAlign:'center',fontSize:11,color:C.muted,marginTop:4}}>ໜີ້ 4,000,000 ฿ — {debtPct.toFixed(2)}%</div>
      </Card>
      {topAgents.length>0&&<Card><CardTitle>🏆 ຕົວແທນ Top</CardTitle>{topAgents.map(([name,total],i)=>(
        <div key={name} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 10px',background:'#0a0f1e',borderRadius:9,marginBottom:6}}>
          <span style={{fontSize:16}}>{['🥇','🥈','🥉','4️⃣','5️⃣'][i]}</span>
          <span style={{flex:1,color:C.text,fontWeight:600}}>{name}</span>
          <span style={{color:C.muted,fontSize:11}}>Commission: {fmtTHB(calcCommission(total))}</span>
          <span style={{color:C.green,fontWeight:800}}>{fmtTHB(total)}</span>
        </div>
      ))}</Card>}
      {pendingExp.length>0&&<Card><CardTitle color={C.amber}>⏳ ອະນຸມັດ ({pendingExp.length})</CardTitle>{pendingExp.map(e=>(
        <div key={e.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',background:'#0a0f1e',borderRadius:9,padding:'10px 12px',marginBottom:6,flexWrap:'wrap',gap:8}}>
          <div><div style={{color:C.text,fontWeight:600}}>{e.description}</div><div style={{fontSize:11,color:C.muted}}>{e.category}·{e.expense_date}</div></div>
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            <span style={{color:C.red,fontWeight:700}}>{e.currency==='KIP'?`${e.amount.toLocaleString()} ກີບ`:fmtTHB(e.amount)}</span>
            <Btn small onClick={()=>{dispatch({type:'APPROVE_EXPENSE',id:e.id,user:user.name});notify('ອະນຸມັດ ✅')}} color={C.green}>✓</Btn>
          </div>
        </div>
      ))}</Card>}
      {showKIP&&<Modal title="💱 ອັດຕາ KIP" onClose={()=>setShowKIP(false)}>
        <p style={{color:C.muted,fontSize:12,marginBottom:12}}>1 ບາດ = ? ກີບ — ປັດຈຸບັນ: {rates.thbToKip.toLocaleString()}</p>
        <input type="text" inputMode="numeric" value={kipLocal} onChange={e=>setKipLocal(e.target.value.replace(/[^0-9.]/g,''))} onFocus={e=>setTimeout(()=>e.target.select(),0)} placeholder="1320"
          style={{background:'#0a0f1e',border:`1px solid ${C.border}`,borderRadius:9,color:C.text,padding:'12px',fontSize:16,outline:'none',fontFamily:'inherit',width:'100%',boxSizing:'border-box'}}/>
        <div style={{display:'flex',gap:10,marginTop:14}}>
          <Btn onClick={()=>setShowKIP(false)} color={C.card2} style={{border:`1px solid ${C.border}`,color:C.sub,flex:1,justifyContent:'center'}}>ຍົກເລີກ</Btn>
          <Btn onClick={()=>{dispatch({type:'SET_RATE',thbToKip:parseFloat(kipLocal)||rates.thbToKip});setShowKIP(false);notify('ອັດຕາ KIP ✅')}} color={C.purple} style={{flex:1,justifyContent:'center'}}>ບັນທຶກ</Btn>
        </div>
      </Modal>}
      {editRate&&<Modal title="✏ ແກ້ໄຂລາຄາ" onClose={()=>setEditRate(null)}>
        <div style={{display:'flex',gap:6,marginBottom:16}}>
          {priceRates.map((r,i)=>{const cols=[C.purple,C.green,C.amber];return(
            <button key={r.id} onClick={()=>setEditRate({...r})} style={{flex:1,padding:'8px 4px',background:editRate.id===r.id?cols[i]+'22':'#0a0f1e',border:`2px solid ${editRate.id===r.id?cols[i]:C.border}`,borderRadius:9,color:editRate.id===r.id?cols[i]:C.muted,cursor:'pointer',fontSize:10,fontWeight:700,fontFamily:'inherit',lineHeight:1.4}}>
              {r.customer_type}<br/><span style={{color:C.text}}>฿{r.price_thb}</span>
            </button>
          )})}
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          <NumInput label="ລາຄາ THB (฿)" value={editRate.price_thb} onChange={v=>setEditRate(p=>({...p,price_thb:v}))}/>
          <NumInput label="ລາຄາ KIP (ກີບ)" value={editRate.price_kip} onChange={v=>setEditRate(p=>({...p,price_kip:v}))}/>
          <NumInput label="ຈຳນວນຕ່ຳສຸດ" value={editRate.min_qty} onChange={v=>setEditRate(p=>({...p,min_qty:v}))}/>
          <NumInput label="ຈຳນວນສູງສຸດ" value={editRate.max_qty} onChange={v=>setEditRate(p=>({...p,max_qty:v}))}/>
        </div>
        <div style={{background:'#0a0f1e',borderRadius:9,padding:10,marginTop:12,fontSize:12,color:C.green}}>Preview: ฿{editRate.price_thb} = {Number(editRate.price_kip).toLocaleString()} ກີບ</div>
        <div style={{display:'flex',gap:10,marginTop:14}}>
          <Btn onClick={()=>setEditRate(null)} color={C.card2} style={{border:`1px solid ${C.border}`,color:C.sub,flex:1,justifyContent:'center'}}>ຍົກເລີກ</Btn>
          <Btn onClick={()=>{dispatch({type:'UPDATE_PRICE_RATE',rate:editRate,user:user.name});setEditRate(null);notify('ລາຄາ ✅')}} color={C.green} style={{flex:1,justifyContent:'center'}}>💾 ບັນທຶກ</Btn>
        </div>
      </Modal>}
    </>
  )
}

const ROLE_LABELS={admin:'Admin 📋',packer:'Packer 📦',accountant:'ບັນຊີ 💼',owner:'ເຈົ້າຂອງ 👑'}
const ROLE_COLORS={admin:C.purple,packer:C.green,accountant:C.amber,owner:C.red}

function StaffTab({state,dispatch,user,notify}) {
  const staffList=state.staff||[]
  const [editS,setEditS]=useState(null)
  const [showAdd,setShowAdd]=useState(false)
  const blank={name:'',username:'',password:'1234',role:'admin',salary:0,currency:'THB',active:true}
  const [form,setForm]=useState(blank)
  const roleOpts=Object.entries(ROLE_LABELS).map(([v,l])=>({value:v,label:l}))
  const curOpts=[{value:'THB',label:'THB (บาท)'},{value:'KIP',label:'KIP (ກີບ)'}]

  return (
    <>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:10}}>
        <h3 style={{color:C.text,fontSize:16,fontWeight:700}}>👥 ຈັດການທີມງານ ({staffList.length} ຄົນ)</h3>
        <Btn small onClick={()=>setShowAdd(!showAdd)} color={C.purple}>＋ ເພີ່ມສະມາຊິກ</Btn>
      </div>
      {showAdd&&<Card>
        <CardTitle color={C.purple}>➕ ສະມາຊິກໃໝ່</CardTitle>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:12}}>
          <TxtInput label="ຊື່ *" value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} placeholder="ຊື່ເຕັມ..."/>
          <TxtInput label="Username *" value={form.username} onChange={e=>setForm(p=>({...p,username:e.target.value}))} placeholder="username"/>
          <TxtInput label="Password" value={form.password} onChange={e=>setForm(p=>({...p,password:e.target.value}))} placeholder="1234"/>
          <SelInput label="ໜ້າທີ່" value={form.role} onChange={e=>setForm(p=>({...p,role:e.target.value}))} options={roleOpts}/>
          <NumInput label="ເງິນເດືອນ" value={form.salary} onChange={v=>setForm(p=>({...p,salary:v}))}/>
          <SelInput label="ສະກຸນ" value={form.currency} onChange={e=>setForm(p=>({...p,currency:e.target.value}))} options={curOpts}/>
        </div>
        <div style={{display:'flex',gap:10,marginTop:14}}>
          <Btn onClick={()=>setShowAdd(false)} color={C.card2} style={{border:`1px solid ${C.border}`,color:C.sub}}>ຍົກເລີກ</Btn>
          <Btn onClick={()=>{
            if(!form.name.trim()||!form.username.trim()) return notify('ໃສ່ຊື່ ແລະ username','error')
            dispatch({type:'ADD_STAFF',staff:{...form,id:Date.now(),salary:+form.salary},user:user.name})
            setForm(blank);setShowAdd(false);notify('ເພີ່ມທີມງານ ✅')
          }} color={C.purple}>ເພີ່ມ</Btn>
        </div>
      </Card>}
      {staffList.map(s=>{
        const rc=ROLE_COLORS[s.role]||C.muted
        return (
          <div key={s.id} style={{background:C.card,border:`1px solid ${s.active?C.border:C.red+'44'}`,borderRadius:12,padding:16,display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:10}}>
            <div style={{display:'flex',alignItems:'center',gap:12}}>
              <div style={{width:40,height:40,background:rc+'22',border:`2px solid ${rc}44`,borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18}}>
                {s.role==='owner'?'👑':s.role==='admin'?'📋':s.role==='packer'?'📦':'💼'}
              </div>
              <div>
                <div style={{fontWeight:700,color:s.active?C.text:C.muted}}>{s.name}{!s.active&&<span style={{fontSize:10,color:C.red,marginLeft:6}}>(ປິດ)</span>}</div>
                <div style={{fontSize:11,color:C.muted}}>@{s.username} · <span style={{color:rc}}>{ROLE_LABELS[s.role]}</span></div>
                <div style={{fontSize:11,color:C.green,marginTop:2}}>💰 {s.salary?(s.currency==='KIP'?`${Number(s.salary).toLocaleString()} ກີບ/ເດືອນ`:fmtTHB(s.salary)+'/ເດືອນ'):'ບໍ່ມີ'}</div>
              </div>
            </div>
            <Btn small onClick={()=>setEditS({...s})} color={C.card2} style={{border:`1px solid ${C.border}`,color:C.sub}}>✏ ແກ້ໄຂ</Btn>
          </div>
        )
      })}
      {editS&&<Modal title={`✏ ${editS.name}`} onClose={()=>setEditS(null)}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          <TxtInput label="ຊື່" value={editS.name} onChange={e=>setEditS(p=>({...p,name:e.target.value}))}/>
          <TxtInput label="Username" value={editS.username} onChange={e=>setEditS(p=>({...p,username:e.target.value}))}/>
          <TxtInput label="Password" value={editS.password} onChange={e=>setEditS(p=>({...p,password:e.target.value}))}/>
          <SelInput label="ໜ້າທີ່" value={editS.role} onChange={e=>setEditS(p=>({...p,role:e.target.value}))} options={roleOpts}/>
          <NumInput label="ເງິນເດືອນ" value={editS.salary} onChange={v=>setEditS(p=>({...p,salary:v}))}/>
          <SelInput label="ສະກຸນ" value={editS.currency} onChange={e=>setEditS(p=>({...p,currency:e.target.value}))} options={curOpts}/>
        </div>
        <button onClick={()=>setEditS(p=>({...p,active:!p.active}))}
          style={{marginTop:14,background:editS.active?C.green+'22':C.red+'22',border:`1px solid ${editS.active?C.green:C.red}`,borderRadius:9,color:editS.active?C.green:C.red,padding:'10px',fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:'inherit',width:'100%'}}>
          {editS.active?'✅ ກຳລັງໃຊ້ງານ — ກົດເພື່ອ ປິດ':'🚫 ປິດໃຊ້ງານ — ກົດເພື່ອ ເປີດ'}
        </button>
        <div style={{display:'flex',gap:10,marginTop:14}}>
          <Btn onClick={()=>setEditS(null)} color={C.card2} style={{border:`1px solid ${C.border}`,color:C.sub,flex:1,justifyContent:'center'}}>ຍົກເລີກ</Btn>
          <Btn onClick={()=>{
            if(!editS.name.trim()||!editS.username.trim()) return notify('ໃສ່ຊື່ ແລະ username','error')
            dispatch({type:'UPDATE_STAFF',staff:editS,user:user.name});setEditS(null);notify('ອັບເດດ ✅')
          }} color={C.purple} style={{flex:1,justifyContent:'center'}}>💾 ບັນທຶກ</Btn>
        </div>
      </Modal>}
    </>
  )
}

function PromoTab({state,dispatch,user,notify}) {
  const promos=state.promotions||[]
  const [editP,setEditP]=useState(null)
  const [showAdd,setShowAdd]=useState(false)
  const blank={title:'',body:'',active:true}
  const [form,setForm]=useState(blank)
  const copy=text=>{navigator.clipboard?.writeText(text).then(()=>notify('ຄັດລອກ ✅')).catch(()=>notify('ກົດຄ້າງ → ຄັດລອກ','error'))||notify('ກົດຄ້າງ → ຄັດລອກ','error')}

  return (
    <>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:10}}>
        <h3 style={{color:C.text,fontSize:16,fontWeight:700}}>🎁 ຈັດການໂປຣໂມຊັ່ນ</h3>
        <Btn small onClick={()=>setShowAdd(!showAdd)} color={C.amber}>＋ ໂປຣໃໝ່</Btn>
      </div>
      <div style={{background:C.card,borderRadius:12,padding:12,fontSize:12,color:C.muted,border:`1px solid ${C.amber}33`}}>
        💡 Owner ສ້າງໂປຣ → Admin ເຫັນ → ກົດ 📋 ຄັດລອກ → ສ່ງລູກຄ້າທາງ Messenger/Line ໄດ້ທັນທີ
      </div>
      {showAdd&&<Card>
        <CardTitle color={C.amber}>➕ ໂປຣໃໝ່</CardTitle>
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          <TxtInput label="ຫົວຂໍ້" value={form.title} onChange={e=>setForm(p=>({...p,title:e.target.value}))} placeholder="Summer Sale 2025..."/>
          <div style={{display:'flex',flexDirection:'column',gap:5}}>
            <label style={{fontSize:11,color:C.muted,fontWeight:600}}>ຂໍ້ຄວາມ (ສ່ງຫາລູກຄ້າ)</label>
            <textarea value={form.body} onChange={e=>setForm(p=>({...p,body:e.target.value}))} placeholder="🎉 ໂປຣພິເສດ! ຊື້ 10 ຊອງ ลາຄາ ฿300 ເທົ່ານັ້ນ!..." rows={5}
              style={{background:'#0a0f1e',border:`1px solid ${C.border}`,borderRadius:9,color:C.text,padding:'10px 12px',fontSize:13,outline:'none',fontFamily:'inherit',resize:'vertical'}}/>
          </div>
        </div>
        <div style={{display:'flex',gap:10,marginTop:14}}>
          <Btn onClick={()=>setShowAdd(false)} color={C.card2} style={{border:`1px solid ${C.border}`,color:C.sub}}>ຍົກເລີກ</Btn>
          <Btn onClick={()=>{
            if(!form.title.trim()||!form.body.trim()) return notify('ໃສ່ຫົວຂໍ້ ແລະ ຂໍ້ຄວາມ','error')
            dispatch({type:'ADD_PROMO',promo:{...form,id:genId(),created_at:todayStr()},user:user.name})
            setForm(blank);setShowAdd(false);notify('ສ້າງໂປຣ ✅')
          }} color={C.amber}>ສ້າງ</Btn>
        </div>
      </Card>}
      {promos.length===0&&<div style={{textAlign:'center',color:C.muted,padding:40}}>ຍັງບໍ່ມີໂປຣ</div>}
      {promos.map(p=>(
        <div key={p.id} style={{background:C.card,border:`1px solid ${p.active?C.amber+'55':C.border}`,borderRadius:14,padding:16}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:10,marginBottom:10}}>
            <div>
              <div style={{fontWeight:700,color:C.text,fontSize:14}}>{p.title}</div>
              <div style={{fontSize:11,color:C.muted,marginTop:2}}>{p.created_at} · {p.active?<span style={{color:C.green}}>✅ ໃຊ້ງານ</span>:<span style={{color:C.red}}>🚫 ປິດ</span>}</div>
            </div>
            <div style={{display:'flex',gap:6}}>
              <button onClick={()=>dispatch({type:'TOGGLE_PROMO',id:p.id,user:user.name})}
                style={{background:p.active?C.green+'22':C.red+'22',border:`1px solid ${p.active?C.green:C.red}44`,borderRadius:7,color:p.active?C.green:C.red,padding:'5px 10px',fontSize:11,cursor:'pointer',fontFamily:'inherit',fontWeight:700}}>
                {p.active?'✅':'🚫'}
              </button>
              <Btn small onClick={()=>setEditP({...p})} color={C.card2} style={{border:`1px solid ${C.border}`,color:C.sub}}>✏</Btn>
            </div>
          </div>
          <div style={{background:'#0a0f1e',borderRadius:10,padding:12,fontSize:12,color:C.sub,lineHeight:1.7,whiteSpace:'pre-wrap'}}>{p.body}</div>
          <button onClick={()=>copy(p.body)}
            style={{marginTop:10,background:'none',border:`1px solid ${C.amber}44`,borderRadius:8,color:C.amber,padding:'8px 16px',fontSize:12,cursor:'pointer',fontFamily:'inherit',fontWeight:700}}>
            📋 ຄັດລອກ → ສ່ງລູກຄ້າ
          </button>
        </div>
      ))}
      {editP&&<Modal title="✏ ແກ້ໄຂໂປຣ" onClose={()=>setEditP(null)}>
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          <TxtInput label="ຫົວຂໍ້" value={editP.title} onChange={e=>setEditP(p=>({...p,title:e.target.value}))}/>
          <div style={{display:'flex',flexDirection:'column',gap:5}}>
            <label style={{fontSize:11,color:C.muted,fontWeight:600}}>ຂໍ້ຄວາມ</label>
            <textarea value={editP.body} onChange={e=>setEditP(p=>({...p,body:e.target.value}))} rows={6}
              style={{background:'#0a0f1e',border:`1px solid ${C.border}`,borderRadius:9,color:C.text,padding:'10px 12px',fontSize:13,outline:'none',fontFamily:'inherit',resize:'vertical'}}/>
          </div>
        </div>
        <div style={{display:'flex',gap:10,marginTop:14}}>
          <Btn onClick={()=>setEditP(null)} color={C.card2} style={{border:`1px solid ${C.border}`,color:C.sub,flex:1,justifyContent:'center'}}>ຍົກເລີກ</Btn>
          <Btn onClick={()=>{dispatch({type:'UPDATE_PROMO',promo:editP,user:user.name});setEditP(null);notify('ໂປຣ ✅')}} color={C.amber} style={{flex:1,justifyContent:'center'}}>💾 ບັນທຶກ</Btn>
        </div>
      </Modal>}
    </>
  )
}

function ReportTab({state,rates}) {
  const {orders,incomes,expenses}=state
  const paidOrders=orders.filter(o=>o.status==='paid')
  const thbOrders=paidOrders.filter(o=>!o.currency||o.currency==='THB')
  const kipOrders=paidOrders.filter(o=>o.currency==='KIP')
  const thbInc=(incomes||[]).filter(i=>i.currency==='THB')
  const kipInc=(incomes||[]).filter(i=>i.currency==='KIP')
  const thbExpA=expenses.filter(e=>e.approved&&e.currency==='THB')
  const kipExpA=expenses.filter(e=>e.approved&&e.currency==='KIP')
  const s=arr=>arr.reduce((t,x)=>t+(x.total||x.amount||0),0)
  const sumTO=s(thbOrders),sumKO=kipOrders.reduce((t,o)=>t+o.total*rates.thbToKip,0)
  const sumTI=s(thbInc),sumKI=s(kipInc)
  const sumTE=s(thbExpA),sumKE=s(kipExpA)
  const Sec=({icon,title,color,rows,total,isKip})=>(
    <div style={{background:C.card,border:`1px solid ${color}33`,borderRadius:14,padding:16,marginBottom:10}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
        <div style={{fontSize:12,fontWeight:700,color,textTransform:'uppercase'}}>{icon} {title}</div>
        <div style={{fontSize:15,fontWeight:800,color}}>{isKip?`${Math.round(total).toLocaleString()} ກີບ`:fmtTHB(total)}</div>
      </div>
      {rows.slice(0,8).map((r,i)=>(
        <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'5px 0',borderBottom:`1px solid ${C.border}`,fontSize:11}}>
          <span style={{color:C.sub,flex:1}}>{r.label}</span>
          <span style={{color,fontWeight:600}}>{isKip?`${Math.round(r.amount).toLocaleString()} ກີບ`:fmtTHB(r.amount)}</span>
        </div>
      ))}
      {rows.length===0&&<div style={{textAlign:'center',color:'#334155',padding:10}}>ບໍ່ມີ</div>}
    </div>
  )
  return (
    <>
      <h3 style={{color:C.text,fontSize:16,fontWeight:700}}>📋 ລາຍງານແຍກສະກຸນ</h3>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
        <div style={{background:C.card,border:`1px solid ${C.green}44`,borderRadius:12,padding:14}}>
          <div style={{fontSize:11,color:C.muted}}>🇹🇭 ລາຍຮັບ THB ທັງໝົດ</div>
          <div style={{fontSize:20,fontWeight:800,color:C.green,marginTop:4}}>{fmtTHB(sumTO+sumTI)}</div>
          <div style={{fontSize:10,color:C.muted,marginTop:3}}>Order: {fmtTHB(sumTO)} | ອື່ນໆ: {fmtTHB(sumTI)}</div>
          <div style={{fontSize:10,color:C.red,marginTop:2}}>ລາຍຈ່າຍ: {fmtTHB(sumTE)}</div>
          <div style={{fontSize:11,color:C.purple,fontWeight:700,marginTop:4}}>ກຳໄລ THB: {fmtTHB(sumTO+sumTI-sumTE)}</div>
        </div>
        <div style={{background:C.card,border:`1px solid ${C.blue}44`,borderRadius:12,padding:14}}>
          <div style={{fontSize:11,color:C.muted}}>🇱🇦 ລາຍຮັບ KIP ທັງໝົດ</div>
          <div style={{fontSize:20,fontWeight:800,color:C.blue,marginTop:4}}>{Math.round(sumKO+sumKI).toLocaleString()} ກີບ</div>
          <div style={{fontSize:10,color:C.muted,marginTop:3}}>≈ {fmtTHB(Math.round((sumKO+sumKI)/rates.thbToKip))}</div>
          <div style={{fontSize:10,color:C.red,marginTop:2}}>ລາຍຈ່າຍ: {Math.round(sumKE).toLocaleString()} ກີບ</div>
          <div style={{fontSize:11,color:C.purple,fontWeight:700,marginTop:4}}>ກຳໄລ KIP: {Math.round(sumKO+sumKI-sumKE).toLocaleString()} ກີບ</div>
        </div>
      </div>
      <Sec icon="🇹🇭" title="Order THB" color={C.green} rows={thbOrders.map(o=>({label:`${o.customerName} (${o.quantity}ຊ)`,amount:o.total}))} total={sumTO}/>
      <Sec icon="💰" title="ລາຍຮັບ THB ອື່ນໆ" color={C.purple} rows={thbInc.map(i=>({label:i.description,amount:i.amount}))} total={sumTI}/>
      <Sec icon="💸" title="ລາຍຈ່າຍ THB" color={C.red} rows={thbExpA.map(e=>({label:e.description,amount:e.amount}))} total={sumTE}/>
      <Sec icon="🇱🇦" title="Order KIP" color={C.blue} rows={kipOrders.map(o=>({label:`${o.customerName} (${o.quantity}ຊ)`,amount:o.total*rates.thbToKip}))} total={sumKO} isKip/>
      <Sec icon="💰" title="ລາຍຮັບ KIP ອື່ນໆ" color={C.amber} rows={kipInc.map(i=>({label:i.description,amount:i.amount}))} total={sumKI} isKip/>
      <Sec icon="💸" title="ລາຍຈ່າຍ KIP" color={C.red} rows={kipExpA.map(e=>({label:e.description,amount:e.amount}))} total={sumKE} isKip/>
    </>
  )
}

function TaxTab({state,dispatch,user,notify}) {
  const {expenses}=state
  const taxExp=expenses.filter(e=>e.category==='Tax')
  const [showAdd,setShowAdd]=useState(false)
  const [editT,setEditT]=useState(null)
  const blank={description:'',amount:0,currency:'THB',expense_date:todayStr(),category:'Tax',approved:false,attachment:null}
  const [form,setForm]=useState(blank)
  const total=taxExp.filter(e=>e.approved).reduce((s,e)=>s+(e.currency==='KIP'?e.amount/state.rates.thbToKip:e.amount),0)
  const curOpts=[{value:'THB',label:'THB'},{value:'KIP',label:'KIP'}]

  return (
    <>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:10}}>
        <h3 style={{color:C.text,fontSize:16,fontWeight:700}}>🧾 ຈັດການອາກອນ</h3>
        <Btn small onClick={()=>setShowAdd(!showAdd)} color={C.amber}>＋ ເພີ່ມ</Btn>
      </div>
      <div style={{background:C.card,border:`1px solid ${C.amber}44`,borderRadius:12,padding:14}}>
        <div style={{fontSize:11,color:C.muted}}>💰 ອາກອນທີ່ຊຳລະແລ້ວ</div>
        <div style={{fontSize:26,fontWeight:800,color:C.amber}}>{fmtTHB(total)}</div>
        <div style={{fontSize:11,color:C.muted,marginTop:4}}>{taxExp.filter(e=>e.approved).length} ລາຍການ</div>
      </div>
      {showAdd&&<Card>
        <CardTitle color={C.amber}>➕ ລາຍການໃໝ່</CardTitle>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:12}}>
          <TxtInput label="ລາຍລະອຽດ *" value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))} placeholder="VAT ເດືອນ 6..."/>
          <NumInput label="ຈຳນວນ *" value={form.amount} onChange={v=>setForm(p=>({...p,amount:v}))}/>
          <SelInput label="ສະກຸນ" value={form.currency} onChange={e=>setForm(p=>({...p,currency:e.target.value}))} options={curOpts}/>
          <TxtInput label="ວັນທີ" type="date" value={form.expense_date} onChange={e=>setForm(p=>({...p,expense_date:e.target.value}))}/>
        </div>
        <div style={{display:'flex',gap:10,marginTop:14}}>
          <Btn onClick={()=>setShowAdd(false)} color={C.card2} style={{border:`1px solid ${C.border}`,color:C.sub}}>ຍົກເລີກ</Btn>
          <Btn onClick={()=>{
            if(!form.description.trim()||!form.amount) return notify('ໃສ່ຂໍ້ມູນ','error')
            dispatch({type:'ADD_EXPENSE',expense:{...form,id:genId(),amount:+form.amount}})
            setForm(blank);setShowAdd(false);notify('ເພີ່ມ ✅')
          }} color={C.amber}>ເພີ່ມ</Btn>
        </div>
      </Card>}
      {taxExp.length===0&&<div style={{textAlign:'center',color:C.muted,padding:40}}>ຍັງບໍ່ມີລາຍການ</div>}
      {taxExp.map(e=>(
        <div key={e.id} style={{background:C.card,border:`1px solid ${e.approved?C.green+'44':C.amber+'44'}`,borderRadius:12,padding:14,display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:8}}>
          <div>
            <div style={{color:C.text,fontWeight:600}}>{e.description}</div>
            <div style={{fontSize:11,color:C.muted}}>{e.expense_date} · {e.approved?<span style={{color:C.green}}>✅ ຊຳລະ</span>:<span style={{color:C.amber}}>⏳ ລໍຖ້າ</span>}</div>
          </div>
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            <span style={{color:C.amber,fontWeight:700}}>{e.currency==='KIP'?`${e.amount.toLocaleString()} ກີບ`:fmtTHB(e.amount)}</span>
            <Btn small onClick={()=>setEditT({...e})} color={C.card2} style={{border:`1px solid ${C.border}`,color:C.sub}}>✏</Btn>
            {!e.approved&&<Btn small onClick={()=>{dispatch({type:'APPROVE_EXPENSE',id:e.id,user:user.name});notify('ຊຳລະ ✅')}} color={C.green}>✓ ຊຳລະ</Btn>}
          </div>
        </div>
      ))}
      {editT&&<Modal title="✏ ແກ້ໄຂ" onClose={()=>setEditT(null)}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          <TxtInput label="ລາຍລະອຽດ" value={editT.description} onChange={e=>setEditT(p=>({...p,description:e.target.value}))}/>
          <NumInput label="ຈຳນວນ" value={editT.amount} onChange={v=>setEditT(p=>({...p,amount:v}))}/>
          <TxtInput label="ວັນທີ" type="date" value={editT.expense_date} onChange={e=>setEditT(p=>({...p,expense_date:e.target.value}))}/>
          <SelInput label="ສະກຸນ" value={editT.currency} onChange={e=>setEditT(p=>({...p,currency:e.target.value}))} options={curOpts}/>
        </div>
        <div style={{display:'flex',gap:10,marginTop:14}}>
          <Btn onClick={()=>setEditT(null)} color={C.card2} style={{border:`1px solid ${C.border}`,color:C.sub,flex:1,justifyContent:'center'}}>ຍົກເລີກ</Btn>
          <Btn onClick={()=>{dispatch({type:'UPDATE_EXPENSE',expense:editT,user:user.name});setEditT(null);notify('ແກ້ໄຂ ✅')}} color={C.amber} style={{flex:1,justifyContent:'center'}}>💾 ບັນທຶກ</Btn>
        </div>
      </Modal>}
    </>
  )
}

function AuditTab({auditLog}) {
  return (
    <>
      <h3 style={{color:C.text,fontSize:16,fontWeight:700}}>🔍 Audit Log</h3>
      <Card>
        <div style={{maxHeight:500,overflowY:'auto'}}>
          {auditLog.length===0&&<div style={{textAlign:'center',color:'#334155',padding:24}}>ຍັງບໍ່ມີ</div>}
          {auditLog.map(log=>(
            <div key={log.id} style={{display:'flex',gap:8,padding:'6px 0',borderBottom:`1px solid ${C.border}`,fontSize:11}}>
              <span style={{color:C.muted,whiteSpace:'nowrap',minWidth:85}}>{log.time}</span>
              <span style={{background:'#1e293b',color:C.sub,padding:'1px 6px',borderRadius:5,whiteSpace:'nowrap'}}>{log.user}</span>
              <span style={{color:'#475569'}}>{log.action}: {log.detail}</span>
            </div>
          ))}
        </div>
      </Card>
    </>
  )
}
