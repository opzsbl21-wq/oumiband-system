import { useReducer, useState, useCallback, useEffect } from 'react'
import Login from './Login.jsx'
import AdminModule from './AdminModule.jsx'
import PackerModule from './PackerModule.jsx'
import FinanceModule from './FinanceModule.jsx'
import OwnerModule from './OwnerModule.jsx'
import { Notify, C } from './UI.jsx'
import { INITIAL_PRODUCTS, INITIAL_PRICE_RATES, INITIAL_EXPENSES, INITIAL_COUNTRY_RATES, ROLES, genId } from './store.js'

// ===== REDUCER =====
function reducer(state, action) {
  const log = (act, user, detail) => ({ id: genId(), time: new Date().toLocaleString('lo-LA'), action: act, user, detail })

  switch (action.type) {
    case 'ADD_ORDER':
      return { ...state, orders: [action.order, ...state.orders], auditLog: [log('ສ້າງ Order', action.order.created_by, `${action.order.customerName} ฿${action.order.total}`), ...state.auditLog].slice(0, 200) }

    case 'PACK_ORDER':
      return {
        ...state,
        orders: state.orders.map(o => o.id === action.id ? { ...o, pack_status: 'packed', packed_by: action.user, packed_at: new Date().toISOString() } : o),
        products: state.products.map(p => p.id === action.productId ? { ...p, stock: Math.max(0, p.stock - action.qty) } : p),
        auditLog: [log('ແພັກ', action.user, `#${action.id}`), ...state.auditLog].slice(0, 200)
      }

    case 'SHIP_ORDER':
      return {
        ...state,
        orders: state.orders.map(o => o.id === action.id ? { ...o, pack_status: 'shipped', status: 'shipped', tracking_number: action.tracking, shipped_at: new Date().toISOString() } : o),
        auditLog: [log('ສົ່ງ', action.user, `Tracking: ${action.tracking}`), ...state.auditLog].slice(0, 200)
      }

    case 'VERIFY_PAYMENT':
      return {
        ...state,
        orders: state.orders.map(o => o.id === action.id ? { ...o, status: 'paid', verified_by: action.user, verified_at: new Date().toISOString() } : o),
        auditLog: [log('ຢືນຢັນຊຳລະ', action.user, `#${action.id}`), ...state.auditLog].slice(0, 200)
      }

    case 'ADD_EXPENSE':
      return { ...state, expenses: [...state.expenses, action.expense], auditLog: [log('ລາຍຈ່າຍ', 'Accountant', action.expense.description), ...state.auditLog].slice(0, 200) }

    case 'ADD_INCOME':
      return { ...state, incomes: [...(state.incomes || []), action.income], auditLog: [log('ລາຍຮັບ', 'Accountant', action.income.description), ...state.auditLog].slice(0, 200) }

    case 'APPROVE_EXPENSE':
      return { ...state, expenses: state.expenses.map(e => e.id === action.id ? { ...e, approved: true } : e), auditLog: [log('ອະນຸມັດລາຍຈ່າຍ', action.user, `#${action.id}`), ...state.auditLog].slice(0, 200) }

    case 'SET_RATE':
      return { ...state, rates: { ...state.rates, thbToKip: action.thbToKip } }

    case 'UPDATE_PRICE_RATE':
      return { ...state, priceRates: state.priceRates.map(r => r.id === action.rate.id ? { ...action.rate, price_thb: parseFloat(action.rate.price_thb)||0, price_kip: parseFloat(action.rate.price_kip)||0, min_qty: parseInt(action.rate.min_qty)||0, max_qty: parseInt(action.rate.max_qty)||9999 } : r), auditLog: [log('ແກ້ລາຄາ', action.user || 'Owner', `${action.rate.customer_type}: ฿${action.rate.price_thb}`), ...state.auditLog].slice(0, 200) }

    // ===== STOCK ACTIONS =====
    case 'ADD_STOCK':
      return {
        ...state,
        products: state.products.map(p => p.id === action.productId ? { ...p, stock: p.stock + action.qty } : p),
        auditLog: [log('ເພີ່ມ Stock', action.user, `${action.productName} +${action.qty} ຊອງ`), ...state.auditLog].slice(0, 200)
      }

    case 'SET_STOCK':
      return {
        ...state,
        products: state.products.map(p => p.id === action.productId ? { ...p, stock: action.qty } : p),
        auditLog: [log('ແກ້ Stock', action.user, `${action.productName} = ${action.qty} ຊອງ`), ...state.auditLog].slice(0, 200)
      }

    case 'UPDATE_PRODUCT':
      return {
        ...state,
        products: state.products.map(p => p.id === action.product.id ? action.product : p),
        auditLog: [log('ແກ້ໄຂສິນຄ້າ', action.user, action.product.name), ...state.auditLog].slice(0, 200)
      }

    case 'ADD_PRODUCT':
      return {
        ...state,
        products: [...state.products, action.product],
        auditLog: [log('ເພີ່ມສິນຄ້າ', action.user, action.product.name), ...state.auditLog].slice(0, 200)
      }

    case 'LOAD_STATE':
      return action.state

    default:
      return state
  }
}

const INITIAL_STATE = {
  orders: [],
  products: INITIAL_PRODUCTS,
  priceRates: INITIAL_PRICE_RATES,
  countryRates: INITIAL_COUNTRY_RATES,
  expenses: INITIAL_EXPENSES,
  incomes: [],
  auditLog: [],
  rates: { thbToKip: 1320 },
}

const STORAGE_KEY = 'oumiband_v3'

function sanitizeRates(rates) {
  if (!rates) return INITIAL_PRICE_RATES
  return rates.map(r => ({
    ...r,
    price_thb: parseFloat(r.price_thb) || 0,
    price_kip: parseFloat(r.price_kip) || 0,
    min_qty: parseInt(r.min_qty) || 0,
    max_qty: parseInt(r.max_qty) || 9999,
  }))
}

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      return {
        ...INITIAL_STATE,
        ...parsed,
        priceRates: sanitizeRates(parsed.priceRates),
        countryRates: parsed.countryRates || INITIAL_COUNTRY_RATES,
        incomes: parsed.incomes || [],
      }
    }
  } catch (e) {}
  return INITIAL_STATE
}

const TABS = {
  [ROLES.ADMIN]:      [{ id: 'admin', label: 'ສ້າງອໍເດີ', icon: '📋', color: C.purple }],
  [ROLES.PACKER]:     [{ id: 'packer', label: 'ແພັກ/ສົ່ງ', icon: '📦', color: C.green }, { id: 'stock', label: 'Stock', icon: '🗃️', color: C.blue }],
  [ROLES.ACCOUNTANT]: [{ id: 'finance', label: 'ບັນຊີ', icon: '💼', color: C.amber }],
  [ROLES.OWNER]: [
    { id: 'owner', label: 'Dashboard', icon: '👑', color: C.red },
    { id: 'admin', label: 'ອໍເດີ', icon: '📋', color: C.purple },
    { id: 'packer', label: 'ສົ່ງ', icon: '📦', color: C.green },
    { id: 'stock', label: 'Stock', icon: '🗃️', color: C.blue },
    { id: 'finance', label: 'ບັນຊີ', icon: '💼', color: C.amber },
  ],
}

export default function App() {
  const [user, setUser] = useState(null)
  const [activeTab, setActiveTab] = useState(null)
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE, loadState)
  const [notif, setNotif] = useState(null)

  // ===== AUTO SAVE TO LOCALSTORAGE =====
  useEffect(() => {
    try {
      // Don't save attachment data (too large) — save everything else
      const stateToSave = {
        ...state,
        expenses: state.expenses.map(e => ({ ...e, attachment: e.attachment ? { name: e.attachment.name, type: e.attachment.type, data: null } : null })),
        incomes: (state.incomes || []).map(i => ({ ...i, attachment: i.attachment ? { name: i.attachment.name, type: i.attachment.type, data: null } : null })),
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave))
    } catch (e) {
      // Storage full — save without audit log
      try {
        const minimal = { ...state, auditLog: state.auditLog.slice(0, 20), expenses: state.expenses.map(e => ({ ...e, attachment: null })), incomes: (state.incomes || []).map(i => ({ ...i, attachment: null })) }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(minimal))
      } catch (e2) {}
    }
  }, [state])

  const notify = useCallback((msg, type = 'success') => {
    setNotif({ msg, type })
    setTimeout(() => setNotif(null), 3200)
  }, [])

  const handleLogin = (u) => { setUser(u); setActiveTab(TABS[u.role][0].id) }
  const handleLogout = () => { setUser(null); setActiveTab(null) }

  if (!user) return <Login onLogin={handleLogin} />

  const tabs = TABS[user.role]
  const roleColors = { admin: C.purple, packer: C.green, accountant: C.amber, owner: C.red }
  const roleColor = roleColors[user.role]
  const moduleProps = { state, dispatch, user, notify }
  const lowStock = state.products.filter(p => p.stock <= p.alert_threshold)

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: "'Noto Sans Lao', sans-serif" }}>
      <Notify {...(notif || {})} />

      {/* Header */}
      <div style={{ background: 'rgba(17,24,39,0.98)', borderBottom: `1px solid ${C.border}`, position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 54, gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <span style={{ fontSize: 20 }}>🎗️</span>
              <div>
                <div style={{ fontWeight: 800, fontSize: 13, color: C.text, lineHeight: 1 }}>OuMi Band</div>
                <div style={{ fontSize: 9, color: C.muted }}>System</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 2, overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              {tabs.map(t => (
                <button key={t.id} onClick={() => setActiveTab(t.id)}
                  style={{ background: activeTab === t.id ? t.color + '15' : 'transparent', border: activeTab === t.id ? `1px solid ${t.color}44` : '1px solid transparent', cursor: 'pointer', padding: '6px 10px', borderRadius: 8, fontFamily: 'inherit', fontSize: 11, fontWeight: activeTab === t.id ? 700 : 400, color: activeTab === t.id ? t.color : C.muted, whiteSpace: 'nowrap' }}>
                  {t.icon} {t.label}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
              {lowStock.length > 0 && (
                <button onClick={() => setActiveTab('stock')} style={{ background: C.red + '22', color: C.red, border: `1px solid ${C.red}44`, borderRadius: 6, padding: '3px 8px', fontSize: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                  ⚠ {lowStock.length}
                </button>
              )}
              <div style={{ width: 28, height: 28, background: roleColor + '22', border: `1px solid ${roleColor}44`, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>
                {user.role === 'owner' ? '👑' : user.role === 'admin' ? '📋' : user.role === 'packer' ? '📦' : '💼'}
              </div>
              <button onClick={handleLogout} style={{ background: 'none', border: `1px solid ${C.border}`, borderRadius: 7, color: C.muted, padding: '4px 8px', fontSize: 10, cursor: 'pointer', fontFamily: 'inherit' }}>ອອກ</button>
            </div>
          </div>
        </div>
      </div>

      {/* User badge */}
      <div style={{ background: roleColor + '0d', borderBottom: `1px solid ${roleColor}22`, padding: '4px 16px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', fontSize: 11, color: roleColor }}>
          ສະບາຍດີ <strong>{user.name}</strong> · {user.role.toUpperCase()} · ຂໍ້ມູນບັນທຶກ Auto ✅
        </div>
      </div>

      {/* Low stock alert */}
      {lowStock.length > 0 && (
        <div style={{ background: C.red + '11', borderBottom: `1px solid ${C.red}33`, padding: '5px 16px' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', fontSize: 11, color: C.red }}>
            🔴 Stock ໃກ້ໝົດ: {lowStock.map(p => `${p.name} (${p.stock})`).join(' · ')} — <button onClick={() => setActiveTab('stock')} style={{ background: 'none', border: 'none', color: C.red, textDecoration: 'underline', cursor: 'pointer', fontSize: 11, fontFamily: 'inherit' }}>ເພີ່ມ Stock</button>
          </div>
        </div>
      )}

      {/* Content */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '14px 12px 40px' }}>
        {activeTab === 'admin' && <AdminModule {...moduleProps} />}
        {activeTab === 'packer' && <PackerModule {...moduleProps} />}
        {activeTab === 'stock' && <StockModule {...moduleProps} />}
        {activeTab === 'finance' && <FinanceModule {...moduleProps} />}
        {activeTab === 'owner' && <OwnerModule {...moduleProps} />}
      </div>
    </div>
  )
}

// ===== STOCK MODULE (inline) =====
function StockModule({ state, dispatch, user, notify }) {
  const { products } = state
  const [editProduct, setEditProduct] = useState(null)
  const [addQty, setAddQty] = useState({})
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [newProduct, setNewProduct] = useState({ name: '', stock: 0, unit: 'ຊອງ', alert_threshold: 500, cost_per_unit: 0 })

  const handleAddStock = (p) => {
    const qty = +addQty[p.id]
    if (!qty || qty <= 0) return notify('ໃສ່ຈຳນວນທີ່ຕ້ອງການເພີ່ມ', 'error')
    dispatch({ type: 'ADD_STOCK', productId: p.id, productName: p.name, qty, user: user.name })
    setAddQty(prev => ({ ...prev, [p.id]: '' }))
    notify(`ເພີ່ມ ${p.name} +${qty} ຊອງ ✅`)
  }

  const handleSetStock = () => {
    if (!editProduct) return
    dispatch({ type: 'UPDATE_PRODUCT', product: editProduct, user: user.name })
    setEditProduct(null)
    notify('ບັນທຶກສຳເລັດ ✅')
  }

  const handleAddProduct = () => {
    if (!newProduct.name.trim()) return notify('ໃສ່ຊື່ສິນຄ້າ', 'error')
    dispatch({ type: 'ADD_PRODUCT', product: { ...newProduct, id: Date.now(), stock: +newProduct.stock, alert_threshold: +newProduct.alert_threshold, cost_per_unit: +newProduct.cost_per_unit }, user: user.name })
    setNewProduct({ name: '', stock: 0, unit: 'ຊອງ', alert_threshold: 500, cost_per_unit: 0 })
    setShowAddProduct(false)
    notify('ເພີ່ມສິນຄ້າສຳເລັດ ✅')
  }

  const totalStock = products.reduce((s, p) => s + p.stock, 0)
  const totalValue = products.reduce((s, p) => s + p.stock * (p.cost_per_unit || 0), 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <h2 style={{ color: C.blue, fontSize: 18, fontWeight: 800 }}>🗃️ ຈັດການ Stock</h2>
        <Btn onClick={() => setShowAddProduct(!showAddProduct)} color={C.blue}>＋ ສິນຄ້າໃໝ່</Btn>
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
        <KPIBox icon="📦" label="Stock ທັງໝົດ" value={totalStock.toLocaleString()} sub="ຊອງ" color={C.blue} />
        <KPIBox icon="💰" label="ມູນຄ່າ Stock" value={'฿' + totalValue.toLocaleString()} sub="ຕາມຕົ້ນທຶນ" color={C.green} />
        <KPIBox icon="⚠" label="ໃກ້ໝົດ" value={products.filter(p => p.stock <= p.alert_threshold).length} sub="ລາຍການ" color={C.red} />
      </div>

      {/* Add New Product Form */}
      {showAddProduct && (
        <div style={{ background: C.card, border: `1px solid ${C.blue}44`, borderRadius: 14, padding: 18 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.blue, marginBottom: 14, textTransform: 'uppercase' }}>➕ ເພີ່ມສິນຄ້າໃໝ່</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
            <InputBox label="ຊື່ສິນຄ້າ *" value={newProduct.name} onChange={e => setNewProduct(p => ({ ...p, name: e.target.value }))} placeholder="ຊື່..." />
            <InputBox label="Stock ເລີ່ມຕົ້ນ" type="number" value={newProduct.stock} onChange={e => setNewProduct(p => ({ ...p, stock: e.target.value }))} />
            <InputBox label="ໜ່ວຍ" value={newProduct.unit} onChange={e => setNewProduct(p => ({ ...p, unit: e.target.value }))} placeholder="ຊອງ" />
            <InputBox label="ແຈ້ງເຕືອນເມື່ອຕ່ຳກວ່າ" type="number" value={newProduct.alert_threshold} onChange={e => setNewProduct(p => ({ ...p, alert_threshold: e.target.value }))} />
            <InputBox label="ຕົ້ນທຶນ/ຊິ້ນ (฿)" type="number" value={newProduct.cost_per_unit} onChange={e => setNewProduct(p => ({ ...p, cost_per_unit: e.target.value }))} />
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
            <Btn onClick={() => setShowAddProduct(false)} color={C.card2} style={{ border: `1px solid ${C.border}`, color: C.sub }}>ຍົກເລີກ</Btn>
            <Btn onClick={handleAddProduct} color={C.blue}>ເພີ່ມສິນຄ້າ</Btn>
          </div>
        </div>
      )}

      {/* Product Cards */}
      {products.map(p => {
        const low = p.stock <= p.alert_threshold
        const pct = Math.min(100, (p.stock / Math.max(p.alert_threshold * 3, 1)) * 100)
        return (
          <div key={p.id} style={{ background: C.card, border: `1px solid ${low ? C.red + '66' : C.border}`, borderRadius: 14, padding: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: C.text }}>{p.name}</div>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
                  ຕົ້ນທຶນ: ฿{p.cost_per_unit}/ຊິ້ນ · ແຈ້ງເຕືອນ: {p.alert_threshold} {p.unit}
                  · ມູນຄ່າ: <span style={{ color: C.green }}>฿{(p.stock * (p.cost_per_unit || 0)).toLocaleString()}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Btn small onClick={() => setEditProduct({ ...p })} color={C.card2} style={{ border: `1px solid ${C.border}`, color: C.sub }}>✏ ແກ້ໄຂ</Btn>
              </div>
            </div>

            {/* Stock display */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 11, color: C.muted }}>Stock ປັດຈຸບັນ</div>
                <div style={{ fontSize: 36, fontWeight: 800, color: low ? C.red : C.green, lineHeight: 1 }}>{p.stock.toLocaleString()}</div>
                <div style={{ fontSize: 11, color: C.muted }}>{p.unit}</div>
              </div>
              <div style={{ flex: 1, minWidth: 120 }}>
                <div style={{ background: '#0a0f1e', borderRadius: 100, height: 10, marginBottom: 4 }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: low ? C.red : C.green, borderRadius: 100, transition: 'width 0.5s', minWidth: p.stock > 0 ? 4 : 0 }} />
                </div>
                {low && <div style={{ fontSize: 11, color: C.red, fontWeight: 700 }}>🔴 ໃກ້ໝົດ — ຕ້ອງສັ່ງຊື້ເພີ່ມ!</div>}
              </div>
            </div>

            {/* Add Stock Input */}
            <div style={{ background: '#0a0f1e', borderRadius: 10, padding: 12, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ fontSize: 12, color: C.muted, flexShrink: 0 }}>➕ ຮັບສິນຄ້າເຂົ້າ:</div>
              <input
                type="number"
                value={addQty[p.id] || ''}
                onChange={e => setAddQty(prev => ({ ...prev, [p.id]: e.target.value }))}
                placeholder="ຈຳນວນ..."
                min="1"
                style={{ flex: 1, minWidth: 100, maxWidth: 160, background: '#111827', border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, padding: '9px 12px', fontSize: 13, outline: 'none', fontFamily: 'inherit' }}
              />
              <Btn small onClick={() => handleAddStock(p)} color={C.green}>+ ເພີ່ມ {p.unit}</Btn>
            </div>
          </div>
        )
      })}

      {/* Edit Modal */}
      {editProduct && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div style={{ background: '#1e293b', border: `1px solid ${C.border}`, borderRadius: 16, padding: 24, width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ color: C.text, marginBottom: 20 }}>✏ ແກ້ໄຂ: {editProduct.name}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <InputBox label="ຊື່ສິນຄ້າ" value={editProduct.name} onChange={e => setEditProduct(p => ({ ...p, name: e.target.value }))} />
              <InputBox label="Stock ປັດຈຸບັນ" type="number" value={editProduct.stock} onChange={e => setEditProduct(p => ({ ...p, stock: e.target.value }))} />
              <InputBox label="ໜ່ວຍ" value={editProduct.unit} onChange={e => setEditProduct(p => ({ ...p, unit: e.target.value }))} />
              <InputBox label="ແຈ້ງເຕືອນ (ໜ່ວຍ)" type="number" value={editProduct.alert_threshold} onChange={e => setEditProduct(p => ({ ...p, alert_threshold: e.target.value }))} />
              <InputBox label="ຕົ້ນທຶນ/ຊິ້ນ (฿)" type="number" value={editProduct.cost_per_unit} onChange={e => setEditProduct(p => ({ ...p, cost_per_unit: e.target.value }))} />
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <Btn onClick={() => setEditProduct(null)} color={C.card2} style={{ border: `1px solid ${C.border}`, color: C.sub, flex: 1, justifyContent: 'center' }}>ຍົກເລີກ</Btn>
              <Btn onClick={handleSetStock} color={C.blue} style={{ flex: 1, justifyContent: 'center' }}>💾 ບັນທຶກ</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Mini components for StockModule
function KPIBox({ icon, label, value, sub, color }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 14, borderLeft: `3px solid ${color}` }}>
      <div style={{ fontSize: 11, color: C.muted }}>{icon} {label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color, marginTop: 4 }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: '#334155' }}>{sub}</div>}
    </div>
  )
}

function InputBox({ label, value, onChange, type = 'text', placeholder = '' }) {
  const isNum = type === 'number'
  const displayVal = (value === null || value === undefined) ? '' : value
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {label && <label style={{ fontSize: 11, color: C.muted, fontWeight: 600 }}>{label}</label>}
      <input
        type={isNum ? 'text' : type}
        inputMode={isNum ? 'numeric' : undefined}
        value={displayVal}
        onChange={onChange}
        onFocus={isNum ? e => e.target.select() : undefined}
        placeholder={placeholder}
        style={{ background: '#0a0f1e', border: `1px solid ${C.border}`, borderRadius: 9, color: C.text, padding: '10px 12px', fontSize: 13, outline: 'none', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' }}
      />
    </div>
  )
}

function Btn({ children, onClick, color = C.purple, disabled = false, small = false, style = {} }) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ background: disabled ? '#1e293b' : color, border: 'none', borderRadius: 9, color: disabled ? C.muted : '#fff', padding: small ? '7px 12px' : '10px 16px', fontSize: small ? 12 : 13, fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 5, opacity: disabled ? 0.5 : 1, ...style }}>
      {children}
    </button>
  )
}
