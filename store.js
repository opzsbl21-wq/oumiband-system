export const ROLES = { ADMIN: 'admin', PACKER: 'packer', ACCOUNTANT: 'accountant', OWNER: 'owner' }

export const INITIAL_STAFF = [
  { id: 1, name: 'Admin ນ້ອຍ', username: 'admin', password: '1234', role: ROLES.ADMIN, salary: 18000, currency: 'THB', active: true },
  { id: 2, name: 'Packer ບຸນ', username: 'packer', password: '1234', role: ROLES.PACKER, salary: 15000, currency: 'THB', active: true },
  { id: 3, name: 'ບັນຊີ ມາລີ', username: 'accountant', password: '1234', role: ROLES.ACCOUNTANT, salary: 20000, currency: 'THB', active: true },
  { id: 4, name: 'ເຈົ້າຂອງ', username: 'owner', password: '1234', role: ROLES.OWNER, salary: 0, currency: 'THB', active: true },
]

export const INITIAL_PRODUCTS = [
  { id: 1, name: 'OuMi Band Pro', stock: 850, unit: 'ຊອງ', alert_threshold: 500, cost_per_unit: 150 },
  { id: 2, name: 'OuMi Band Slim', stock: 420, unit: 'ຊອງ', alert_threshold: 500, cost_per_unit: 120 },
  { id: 3, name: 'OuMi Refill Pack', stock: 1200, unit: 'ຊອງ', alert_threshold: 500, cost_per_unit: 80 },
]
export const INITIAL_PRICE_RATES = [
  { id: 1, customer_type: 'ລູກຄ້າປີກ', min_qty: 1, max_qty: 9, price_thb: 350, price_kip: 241500 },
  { id: 2, customer_type: 'ຕົວແທນ', min_qty: 10, max_qty: 49, price_thb: 300, price_kip: 207000 },
  { id: 3, customer_type: 'ຕົວແທນໃຫຍ່', min_qty: 50, max_qty: 9999, price_thb: 250, price_kip: 172500 },
]
export const INITIAL_COUNTRY_RATES = [
  { id: 1, country: 'ໄທ', currency: 'THB', symbol: '฿', rate_to_thb: 1, flag: '🇹🇭' },
  { id: 2, country: 'ລາວ', currency: 'KIP', symbol: 'ກີບ', rate_to_thb: 0.00076, flag: '🇱🇦' },
  { id: 3, country: 'ຈີນ', currency: 'CNY', symbol: '¥', rate_to_thb: 5.02, flag: '🇨🇳' },
  { id: 4, country: 'ສິງຄະໂປ', currency: 'SGD', symbol: 'S$', rate_to_thb: 26.8, flag: '🇸🇬' },
  { id: 5, country: 'ມາເລເຊຍ', currency: 'MYR', symbol: 'RM', rate_to_thb: 8.1, flag: '🇲🇾' },
  { id: 6, country: 'ສະຫະລັດ', currency: 'USD', symbol: '$', rate_to_thb: 35.5, flag: '🇺🇸' },
]
export const INITIAL_EXPENSES = [
  { id: 1, description: 'ຄ່າເຊົ່າສຳນັກງານ', amount: 15000, currency: 'THB', category: 'Fixed', expense_date: '2025-06-01', approved: true, attachment: null },
  { id: 2, description: 'ຄ່າໄຟຟ້າ', amount: 3200, currency: 'THB', category: 'Utility', expense_date: '2025-06-01', approved: true, attachment: null },
  { id: 3, description: 'ເງິນເດືອນພະນັກງານ', amount: 45000, currency: 'THB', category: 'Salary', expense_date: '2025-06-01', approved: false, attachment: null },
]
export const INITIAL_PROMOTIONS = [
  { id: 1, title: 'ໂປຣໂມຊັ່ນ Welcome', body: 'ຊື້ 10 ຊອງ ລາຄາພິເສດ ฿300/ຊອງ!', active: true, created_at: '2025-06-01' },
]
export const TAX_RATE = 0.07
export const DEBT_RATE = 0.15
export const TOTAL_DEBT = 4000000
export function genId() { return Date.now().toString(36) + Math.random().toString(36).substr(2, 5) }
export function calcOrder(total) {
  const tax = +(total * TAX_RATE).toFixed(2)
  const debt = +(total * DEBT_RATE).toFixed(2)
  return { tax_amount: tax, debt_amount: debt, net_amount: +(total - tax - debt).toFixed(2) }
}
export function getAutoType(qty, rates) { return rates.find(r => qty >= r.min_qty && qty <= r.max_qty) || rates[0] }
export function fmtTHB(n) { return '฿' + (+n || 0).toLocaleString('th-TH') }
export function fmtDate(d) { return new Date(d).toLocaleString('lo-LA') }
export function todayStr() { return new Date().toISOString().split('T')[0] }
export function calcCommission(sales) {
  if (sales >= 100000) return +(sales * 0.12).toFixed(2)
  if (sales >= 50000) return +(sales * 0.08).toFixed(2)
  return +(sales * 0.05).toFixed(2)
}

export const USERS = INITIAL_STAFF
