import { useState, useCallback } from 'react'

export const ROLES = { ADMIN: 'admin', PACKER: 'packer', ACCOUNTANT: 'accountant', OWNER: 'owner' }

export const USERS = [
  { id: 1, name: 'Admin ນ້ອຍ', username: 'admin', password: '1234', role: ROLES.ADMIN },
  { id: 2, name: 'Packer ບຸນ', username: 'packer', password: '1234', role: ROLES.PACKER },
  { id: 3, name: 'ບັນຊີ ມາລີ', username: 'accountant', password: '1234', role: ROLES.ACCOUNTANT },
  { id: 4, name: 'ເຈົ້າຂອງ', username: 'owner', password: '1234', role: ROLES.OWNER },
]

export const INITIAL_PRODUCTS = [
  { id: 1, name: 'OuMi Band Pro', stock: 850, unit: 'ຊອງ', alert_threshold: 500 },
  { id: 2, name: 'OuMi Band Slim', stock: 420, unit: 'ຊອງ', alert_threshold: 500 },
  { id: 3, name: 'OuMi Refill Pack', stock: 1200, unit: 'ຊອງ', alert_threshold: 500 },
]

export const INITIAL_PRICE_RATES = [
  { id: 1, customer_type: 'ລູກຄ້າປີກ', min_qty: 1, max_qty: 9, price_per_unit: 350 },
  { id: 2, customer_type: 'ຕົວແທນ', min_qty: 10, max_qty: 49, price_per_unit: 300 },
  { id: 3, customer_type: 'ຕົວແທນໃຫຍ່', min_qty: 50, max_qty: 9999, price_per_unit: 250 },
]

export const INITIAL_EXPENSES = [
  { id: 1, description: 'ຄ່າເຊົ່າສຳນັກງານ', amount: 15000, currency: 'THB', category: 'Fixed', expense_date: '2025-06-01', approved: true },
  { id: 2, description: 'ຄ່າໄຟຟ້າ', amount: 3200, currency: 'THB', category: 'Utility', expense_date: '2025-06-01', approved: true },
  { id: 3, description: 'ເງິນເດືອນພະນັກງານ', amount: 45000, currency: 'THB', category: 'Salary', expense_date: '2025-06-01', approved: false },
]

export const TAX_RATE = 0.07
export const DEBT_RATE = 0.15
export const TOTAL_DEBT = 4000000

export function genId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5)
}

export function calcOrder(total) {
  const tax = +(total * TAX_RATE).toFixed(2)
  const debt = +(total * DEBT_RATE).toFixed(2)
  const net = +(total - tax - debt).toFixed(2)
  return { tax_amount: tax, debt_amount: debt, net_amount: net }
}

export function getAutoType(qty, rates) {
  return rates.find(r => qty >= r.min_qty && qty <= r.max_qty) || rates[0]
}

export function fmtTHB(n) {
  return '฿' + (+n || 0).toLocaleString('th-TH', { minimumFractionDigits: 0 })
}

export function fmtKIP(n, rate) {
  return ((+n || 0) * rate).toLocaleString('lo-LA') + ' ກີບ'
}

export function fmtDate(d) {
  return new Date(d).toLocaleString('lo-LA')
}
