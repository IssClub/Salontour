import { useState } from 'react'
import { PCOLS } from '../lib/helpers'

export default function ReminderPanel({ appointments, providers, settings, targetDate, onClose }) {
  const [sent, setSent] = useState(new Set())

  const appts = appointments
    .filter(a => a.date === targetDate)
    .sort((a, b) => a.time.localeCompare(b.time))

  const salonName = settings.salon_name || 'הסלון'

  function buildMsg(appt) {
    return encodeURIComponent(
      `שלום ${appt.client_name} 😊\n` +
      `תזכורת לתורך ב${salonName} מחר ב-${appt.time.slice(0, 5)}` +
      (appt.service ? ` לשירות ${appt.service}` : '') +
      `.\nנשמח לראותך! 💇`
    )
  }

  function sendOne(appt) {
    const ph = (appt.phone || '').replace(/\D/g, '')
    if (!ph) return
    window.open(`https://wa.me/972${ph.replace(/^0/, '')}?text=${buildMsg(appt)}`, '_blank')
    setSent(prev => new Set([...prev, appt.id]))
  }

  function sendAll() {
    const unsent = appts.filter(a => !sent.has(a.id) && (a.phone || '').replace(/\D/g, ''))
    unsent.forEach((appt, i) => setTimeout(() => sendOne(appt), i * 700))
  }

  const withPhone  = appts.filter(a => (a.phone || '').replace(/\D/g, ''))
  const sentCount  = [...sent].filter(id => withPhone.some(a => a.id === id)).length
  const remaining  = withPhone.length - sentCount

  return (
    <div className="fp from-right open">
      <div className="fp-tb">
        <button className="fp-back" onClick={onClose}>›</button>
        <div className="fp-title">📲 תזכורות מחר</div>
        {sentCount > 0 && (
          <div style={{ marginRight: 'auto', fontSize: 12, color: 'var(--green)', fontWeight: 600 }}>
            {sentCount}/{withPhone.length} נשלחו ✓
          </div>
        )}
      </div>

      {appts.length === 0 ? (
        <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-dim)', fontSize: 14 }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>🗓</div>
          אין תורים מחר
        </div>
      ) : (
        <>
          {/* Send All Button */}
          {withPhone.length > 0 && (
            <div style={{ padding: '12px 14px 4px' }}>
              <button
                className="bp"
                style={{ width: '100%', opacity: remaining === 0 ? 0.5 : 1 }}
                onClick={sendAll}
                disabled={remaining === 0}
              >
                💬 שלח לכולם {remaining > 0 ? `(${remaining} נותרו)` : '— הכל נשלח ✓'}
              </button>
            </div>
          )}

          {/* Appointment Cards */}
          <div style={{ padding: '8px 14px 24px' }}>
            {appts.map(appt => {
              const prov    = providers.find(p => p.id === appt.provider_id)
              const col     = PCOLS[prov?.color || '1']
              const isSent  = sent.has(appt.id)
              const hasPhone = !!(appt.phone || '').replace(/\D/g, '')

              return (
                <div key={appt.id} className={`rem-card ${isSent ? 'sent' : ''}`}>
                  <div className="rem-time">{appt.time.slice(0, 5)}</div>
                  <div className="rem-info">
                    <div className="rem-name">{appt.client_name}</div>
                    <div className="rem-sub">
                      {appt.service && <span>{appt.service} · </span>}
                      <span style={{ color: col }}>{prov?.name}</span>
                    </div>
                    {!hasPhone && (
                      <div style={{ fontSize: 10, color: 'var(--red)', marginTop: 2 }}>⚠ אין מספר טלפון</div>
                    )}
                  </div>
                  <button
                    className={`rem-btn ${isSent ? 'sent' : ''}`}
                    onClick={() => sendOne(appt)}
                    disabled={!hasPhone || isSent}
                    title={!hasPhone ? 'אין מספר טלפון' : isSent ? 'נשלח' : 'שלח WhatsApp'}
                  >
                    {isSent ? '✓' : '💬'}
                  </button>
                </div>
              )
            })}

            {withPhone.length < appts.length && (
              <div style={{ fontSize: 11, color: 'var(--text-dim)', textAlign: 'center', marginTop: 8 }}>
                {appts.length - withPhone.length} לקוחות ללא מספר טלפון לא ישלחו תזכורת
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
