import { useState } from 'react'
import { USERS } from '../store.js'

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      const user = USERS.find(u => u.username === username && u.password === password)
      if (user) { onLogin(user) }
      else { setError('ຊື່ຜູ້ໃຊ້ ຫຼື ລະຫັດຜ່ານບໍ່ຖືກຕ້ອງ'); setLoading(false) }
    }, 600)
  }

  const quickLogin = (user) => { setUsername(user.username); setPassword(user.password) }

  const roleColors = { admin: '#6366f1', packer: '#10b981', accountant: '#f59e0b', owner: '#ef4444' }
  const roleIcons = { admin: '📋', packer: '📦', accountant: '💼', owner: '👑' }

  return (
    <div style={styles.wrap}>
      <div style={styles.bg} />
      <div style={styles.card}>
        {/* Logo */}
        <div style={styles.logoWrap}>
          <div style={styles.logoIcon}>🎗️</div>
          <div style={styles.logoText}>OuMi Band</div>
          <div style={styles.logoSub}>ລະບົບຈັດການທຸລະກິດ</div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.fieldWrap}>
            <label style={styles.label}>ຊື່ຜູ້ໃຊ້</label>
            <input value={username} onChange={e => { setUsername(e.target.value); setError('') }}
              placeholder="username" style={styles.input} autoComplete="username" />
          </div>
          <div style={styles.fieldWrap}>
            <label style={styles.label}>ລະຫັດຜ່ານ</label>
            <input type="password" value={password} onChange={e => { setPassword(e.target.value); setError('') }}
              placeholder="••••••" style={styles.input} autoComplete="current-password" />
          </div>
          {error && <div style={styles.error}>⚠ {error}</div>}
          <button type="submit" disabled={loading} style={{ ...styles.btn, opacity: loading ? 0.7 : 1 }}>
            {loading ? 'ກຳລັງເຂົ້າສູ່ລະບົບ...' : 'ເຂົ້າສູ່ລະບົບ'}
          </button>
        </form>

        {/* Quick login */}
        <div style={styles.quickWrap}>
          <div style={styles.quickLabel}>ທົດສອບດ່ວນ:</div>
          <div style={styles.quickGrid}>
            {USERS.map(u => (
              <button key={u.id} onClick={() => quickLogin(u)}
                style={{ ...styles.quickBtn, borderColor: roleColors[u.role], color: roleColors[u.role] }}>
                {roleIcons[u.role]} {u.role}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

const styles = {
  wrap: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, position: 'relative', overflow: 'hidden', background: '#0a0f1e' },
  bg: { position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 30% 20%, #1e1b4b 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, #0c2340 0%, transparent 60%)', pointerEvents: 'none' },
  card: { background: 'rgba(30,41,59,0.95)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 20, padding: '40px 32px', width: '100%', maxWidth: 400, position: 'relative', boxShadow: '0 25px 60px rgba(0,0,0,0.5)' },
  logoWrap: { textAlign: 'center', marginBottom: 32 },
  logoIcon: { fontSize: 48, marginBottom: 8 },
  logoText: { fontSize: 28, fontWeight: 700, color: '#f1f5f9', letterSpacing: 1 },
  logoSub: { fontSize: 13, color: '#64748b', marginTop: 4 },
  form: { display: 'flex', flexDirection: 'column', gap: 16 },
  fieldWrap: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 13, color: '#94a3b8', fontWeight: 600 },
  input: { background: '#0f172a', border: '1px solid #334155', borderRadius: 10, color: '#f1f5f9', padding: '12px 16px', fontSize: 14, outline: 'none', fontFamily: 'inherit', transition: 'border-color 0.2s' },
  error: { background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, color: '#f87171', padding: '10px 14px', fontSize: 13 },
  btn: { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none', borderRadius: 10, color: '#fff', padding: '14px', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', marginTop: 4, transition: 'transform 0.1s' },
  quickWrap: { marginTop: 28, borderTop: '1px solid #1e293b', paddingTop: 20 },
  quickLabel: { fontSize: 11, color: '#475569', marginBottom: 10, textAlign: 'center' },
  quickGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 },
  quickBtn: { background: 'transparent', border: '1px solid', borderRadius: 8, padding: '8px', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, transition: 'all 0.2s' },
}
