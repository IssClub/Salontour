import { useState } from 'react'
import { MONS } from '../lib/helpers'

export default function ClientPanel({ name, appointments, providers, clients, onClose, onApptClick, onDeleteClient, onUpdateClient }) {
  const cl     = clients.find(c => c.name.toLowerCase() === name.toLowerCase())
  const visits = appointments
    .filter(a => a.client_name.toLowerCase() === name.toLowerCase())
    .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time))

  const totalMins = visits.reduce((s, a) => s + a.duration, 0)
  const svcCount  = {}
  visits.forEach(a => { svcCount[a.service] = (svcCount[a.service] || 0) + 1 })
  const topSvc = Object.entries(svcCount).sort((a, b) => b[1] - a[1])[0]?.[0] || '—'

  const [editMode,  setEditMode]  = useState(false)
  const [editName,  setEditName]  = useState(cl?.name  || name)
  const [editPhone, setEditPhone] = useState(cl?.phone || '')
  const [editNote,  setEditNote]  = useState(cl?.note  || '')

  async function handleSave() {
    if (!cl) return
    await onUpdateClient(cl.id, { name: editName.trim(), phone: editPhone.trim(), note: editNote.trim() })
    setEditMode(false)
  }

  return (
    <div className="fp from-right open">
      <div className="cc-hdr">
        <button className="fp-back" onClick={onClose}>›</button>
        <div className="cc-av">{(cl?.name || name)[0]}</div>
        <div style={{ flex: 1 }}>
          <div className="cc-name">{cl?.name || name}</div>
          {cl?.phone
            ? <a className="cc-phone" href={`tel:${cl.phone}`}>📞 {cl.phone}</a>
            : <div className="cc-phone">אין טלפון</div>
          }
        </div>
        {cl && onUpdateClient && (
          <button
            className="bcc"
            style={{ fontSize: 12, padding: '6px 12px' }}
            onClick={() => setEditMode(m => !m)}
          >✏️ ערוך</button>
        )}
        {onDeleteClient && cl && (
          <button
            className="bd"
            style={{ fontSize: 12, padding: '6px 12px' }}
            onClick={() => {
              if (window.confirm(`למחוק את הלקוח/ה ${cl.name}?`)) {
                onDeleteClient(cl.id)
                onClose()
              }
            }}
          >🗑</button>
        )}
      </div>

      {editMode && cl && (
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="fr">
            <label className="fl">שם</label>
            <input className="fi" value={editName} onChange={e => setEditName(e.target.value)} />
          </div>
          <div className="fr">
            <label className="fl">טלפון</label>
            <input className="fi" type="tel" value={editPhone} onChange={e => setEditPhone(e.target.value)} placeholder="05X-XXXXXXX" />
          </div>
          <div className="fr">
            <label className="fl">הערה</label>
            <input className="fi" value={editNote} onChange={e => setEditNote(e.target.value)} placeholder="הערה על הלקוח..." />
          </div>
          <div className="sa">
            <button className="bs" onClick={() => setEditMode(false)}>ביטול</button>
            <button className="bp" onClick={handleSave}>💾 שמור</button>
          </div>
        </div>
      )}

      <div className="cc-stats">
        <div className="cc-stat"><div className="cc-sv">{visits.length}</div><div className="cc-sl">ביקורים</div></div>
        <div className="cc-stat"><div className="cc-sv">{Math.round(totalMins / 60 * 10) / 10}</div><div className="cc-sl">שעות</div></div>
        <div className="cc-stat" style={{ minWidth: 110 }}>
          <div className="cc-sv" style={{ fontSize: 12, lineHeight: 1.3 }}>{topSvc}</div>
          <div className="cc-sl">שירות נפוץ</div>
        </div>
      </div>

      {cl?.note && !editMode && (
        <div style={{ padding: '10px 16px', fontSize: 13, color: 'var(--text-mid)', borderBottom: '1px solid var(--border)' }}>
          📝 {cl.note}
        </div>
      )}

      <div className="cc-ht">היסטוריית ביקורים</div>

      {visits.length === 0 && (
        <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-dim)' }}>אין ביקורים</div>
      )}
      {visits.map(a => {
        const d2 = new Date(a.date + 'T12:00:00')
        const pv = providers.find(p => p.id === a.provider_id)
        return (
          <div key={a.id} className="vit" onClick={() => onApptClick(a.id)}>
            <div className="vbd">
              <div className="vbd-d">{d2.getDate()}</div>
              <div className="vbd-m">{MONS[d2.getMonth()].slice(0, 3)}</div>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{a.service || '—'}</div>
              <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 1 }}>{pv?.name || '—'} · {a.time.slice(0, 5)}</div>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-mid)', marginRight: 'auto', flexShrink: 0 }}>{a.duration}′</div>
          </div>
        )
      })}
    </div>
  )
}
