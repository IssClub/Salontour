import { useState } from 'react'
import { hashPin } from '../lib/helpers'

export default function PinLock({ pin, onUnlock, salonName }) {
  const [buf, setBuf] = useState('')
  const [err, setErr] = useState('')

  async function press(k) {
    if (buf.length >= 4) return
    const next = buf + k
    setBuf(next)
    if (next.length === 4) {
      setTimeout(async () => {
        const hashed = await hashPin(next)
        if (hashed === pin) { onUnlock() }
        else { setErr('קוד שגוי, נסה שוב'); setBuf('') }
      }, 100)
    }
  }

  return (
    <div className="lock" style={{ animation: err ? 'shake .4s ease' : undefined }}>
      <div className="lk-logo">✂<span style={{ fontWeight: 300, color: 'var(--text-mid)' }}>{salonName || 'סלון'}</span>תור</div>
      <div className="lk-sub">הזן קוד גישה</div>
      <div className="pdots">
        {[0, 1, 2, 3].map(i => <div key={i} className={`pdot ${i < buf.length ? 'on' : ''}`} />)}
      </div>
      <div className="lk-err">{err}</div>
      <div className="lkpad">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
          <button key={n} className="key" onClick={() => press(String(n))}>{n}</button>
        ))}
        <button className="key" style={{ gridColumn: 1 }} onClick={() => press('0')}>0</button>
        <button className="key del" style={{ gridColumn: 3 }} onClick={() => setBuf(b => b.slice(0, -1))}>⌫</button>
      </div>
    </div>
  )
}
