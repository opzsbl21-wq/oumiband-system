import { useReducer, useState, useCallback } from 'react'
import Login from './Login.jsx'
import AdminModule from './AdminModule.jsx'
import PackerModule from './PackerModule.jsx'
import FinanceModule from './FinanceModule.jsx'
import OwnerModule from './OwnerModule.jsx'
import { Notify, C } from './UI.jsx'
import { INITIAL_PRODUCTS, INITIAL_PRICE_RATES, INITIAL_EXPENSES, ROLES, genId } from './store.js'

function reducer(state, action) {
  const log = (action, user, detail) => ({
    id: genId(), time: new Date().toLocaleString('lo-LA'), action, user, detail
  })
  switch (action.type) {
    case 'ADD_ORDER':
      return {
        ...state,
        orders: [action.order, ...state.orders],
        auditLog: [log('ສ້າງ Order', action.order.created_by, `${action.order.customerName} ฿${action.order.total}`), ...state.auditLog].slice(0, 100)
      }
    case 'PACK_ORDER':
      return {
        ...state,
        orders: state.orders.map(o => o.id === action.id ? { ...o, pack_status: 'packed', packed_by: action.user, packed_at: new Date().toISOString() } : o),
        products: state.products.map(p => p.id === action.productId ? { ...p, stock: Math.max(0, p.stock - action.qty) } : p),
        auditLog: [log('ແພັກ Order', action.user, `Order ID: ${action.id}`), ...state.auditLog].slice(0, 100)
      }
    case 'SHIP_ORDER':
      return {
        ...state,
        orders: state.orders.map(o => o.id === action.id ? { ...o, pack_status: 'shipped', status: 'shipped', tracking_number: action.tracking, shipped_at: new Date().toISOString() } : o),
        auditLog: [log('ສົ່ງ Order', action.user, `Tracking: ${action.tracking}`), ...state.auditLog].slice(0, 100)
      }
    case 'VERIFY_PAYMENT':
      return {
        ...state,
        orders: state.orders.map(o => o.id === action.id ? { ...o, status: 'paid', verified_by: action.user, verified_at: new Date().toISOString() } : o),
        auditLog: [log('ຢືນຢັນຊຳລະ', action.user, `Order ID: ${action.id}`), ...state.auditLog].slice(0, 100)
      }
    case 'ADD_EXPENSE':
      return {
        ...state,
        expenses: [...state.expenses, action.expense],
        auditLog: [log('ເພີ່ມລາຍຈ່າຍ', 'Accountant', action.expense.description), ...state.auditLog].slice(0, 100)
      }
    case 'APPROVE_EXPENSE':
      return {
        ...state,
        expenses: state.expenses.map(e => e.id === action.id ? { ...e, approved: true } : e),
        auditLog: [log('ອະນຸມັດລາຍຈ່າຍ', action.user, `ID: ${action.id}`), ...state.auditLog].slice(0, 100)
      }
    case 'SET_RATE':
      return { ...state, rates: { ...state.rates, thbToKip: action.thbToKip } }
    default:
      return state
  }
}

const INITIAL_STATE = {
  orders: [],
  products: INITIAL_PRODUCTS,
  priceRates: INITIAL_PRICE_RATES,
  expenses: INITIAL_EXPENSES,
  auditLog: [],
  rates: { thbToKip: 1320 },
}

const TABS = {
  [ROLES.ADMIN]:      [{ id: 'admin', label: 'ສ້າງອໍເດີ', icon: '📋', color: C.purple }],
  [ROLES.PACKER]:     [{ id: 'packer', label: 'ແພັກເຄື່ອງ', icon: '📦', color: C.green }],
  [ROLES.ACCOUNTANT]: [{ id: 'finance', label: 'ບັນຊີ', icon: '💼', color: C.amber }],
  [ROLES.OWNER]: [
    { id: 'owner', label: 'Dashboard', icon: '👑', color: C.red },
    { id: 'admin', label: 'ອໍເດີ', icon: '📋', color: C.purple },
    { id: 'packer', label: 'ສົ່ງເຄື່ອງ', icon: '📦', color: C.green },
    { id: 'finance', label: 'ບັນຊີ', icon: '💼', color: C.amber },
  ],
}

export default function App() {
  const [user, setUser] = useState(null)
  const [activeTab, setActiveTab] = useState(null)
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE)
  const [notif, setNotif] = useState(null)

  const notify = useCallback((msg, type = 'success') => {
    setNotif({ msg, type })
    setTimeout(() => setNotif(null), 3000)
  }, [])

  const handleLogin = (u) => {
    setUser(u)
    setActiveTab(TABS[u.role][0].id)
  }

  const handleLogout = () => { setUser(null); setActiveTab(null) }

  if (!user) return <Login onLogin={handleLogin} />

  const tabs = TABS[user.role]
  const roleColors = { admin: C.purple, packer: C.green, accountant: C.amber, owner: C.red }
  const roleColor = roleColors[user.role]
  const moduleProps = { state, dispatch, user, notify }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: "'Noto Sans Lao', sans-serif" }}>
      <Notify {...(notif || {})} />
      <div style={{ background: 'rgba(17,24,39,0.98)', borderBottom: `1px solid ${C.border}`, position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 22 }}>🎗️</span>
              <div>
                <div style={{ fontWeight: 800, fontSize: 15, color: C.text, lineHeight: 1 }}>OuMi Band</div>
                <div style={{ fontSize: 9, color: C.muted }}>ລະບົບຈັດການທຸລະກິດ</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 2 }}>
              {tabs.map(t => (
                <button key={t.id} onClick={() => setActiveTab(t.id)}
                  style={{ background: activeTab === t.id ? t.color + '15' : 'transparent', border: 'none', cursor: 'pointer', padding: '6px 12px', borderRadius: 8, fontFamily: 'inherit', fontSize: 12, fontWeight: activeTab === t.id ? 700 : 400, color: activeTab === t.id ? t.color : C.muted, transition: 'all 0.15s', whiteSpace: 'nowrap' }}>
                  {t.icon} {t.label}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, background: roleColor + '22', border: `1px solid ${roleColor}44`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>
                {user.role === 'owner' ? '👑' : user.role === 'admin' ? '📋' : user.role === 'packer' ? '📦' : '💼'}
              </div>
              <button onClick={handleLogout} style={{ background: 'none', border: `1px solid ${C.border}`, borderRadius: 7, color: C.muted, padding: '5px 10px', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>ອອກ</button>
            </div>
          </div>
        </div>
      </div>
      <div style={{ background: roleColor + '0d', borderBottom: `1px solid ${roleColor}22`, padding: '6px 16px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', fontSize: 12, color: roleColor }}>
          ສະບາຍດີ, <strong>{user.name}</strong> · ສິດ: {user.role.toUpperCase()}
        </div>
      </div>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '16px 16px 40px' }}>
        {activeTab === 'admin' && <AdminModule {...moduleProps} />}
        {activeTab === 'packer' && <PackerModule {...moduleProps} />}
        {activeTab === 'finance' && <FinanceModule {...moduleProps} />}
        {activeTab === 'owner' && <OwnerModule {...moduleProps} />}
      </div>
    </div>
  )
}
