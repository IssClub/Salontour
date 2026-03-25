// ── DetailModal.jsx ───────────────────────────────────────────
import { t2m, m2t, PCOLS, siIcon, MONS } from '../lib/helpers'

export function DetailModal({ apptId, appointments, providers, onClose, onEdit, onDelete, onClientCard }) {
  const appt = appointments.find(a => a.id === apptId)
  if (!appt) return null

  const prov = providers.find(p => p.id === appt.provider_id)
  const col  = PCOLS[prov?.color || '1']
  const endT = m2t(t2m(appt.time) + appt.duration)
  const ph   = (appt.phone || '').replace(/\D/g, '')
  const msg  = encodeURIComponent(`שלום ${appt.client_name}, תזכורת לתורך ב-${appt.time.slice(0,5)} לשירות ${appt.service} 💇`)

  return (
    <div className="overlay open" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="sheet">
        <div className="sh-handle" />
        <div className="dt-hdr">
          <div className="dt-av" style={{ background: `${col}22` }}>{siIcon(appt.service)}</div>
          <div>
            <div className="dt-name">{appt.client_name}</div>
            <div className="dt-svc">{appt.service || 'שירות לא צוין'}</div>
          </div>
        </div>

        <div className="dr">
          <div className="di">📞</div>
          <div style={{ flex: 1 }}>
            {ph
              ? <a className="dv" href={`tel:${appt.phone}`} style={{ direction: 'ltr', color: 'var(--accent-txt)', textDecoration: 'none', display: 'block' }}>{appt.phone}</a>
              : <div className="dv">לא צוין</div>
            }
            <div className="dm">טלפון</div>
          </div>
          {ph && <a className="bwa" href={`tel:${appt.phone}`} style={{ textDecoration: 'none', padding: '6px 12px', fontSize: 12 }}>📞 חייג</a>}
        </div>
        <div className="dr">
          <div className="di">🕐</div>
          <div><div className="dv">{appt.time.slice(0,5)} – {endT} ({appt.duration}′)</div><div className="dm">זמן</div></div>
        </div>
        <div className="dr">
          <div className="di" style={{ color: col }}>●</div>
          <div><div className="dv">{prov?.name || '—'}</div><div className="dm">מטפל/ת</div></div>
        </div>
        {appt.note && (
          <div className="dr">
            <div className="di">📝</div>
            <div><div className="dv">{appt.note}</div></div>
          </div>
        )}

        <div className="ar">
          <button className="bwa" onClick={() => ph && window.open(`https://wa.me/972${ph.replace(/^0/,'')}?text=${msg}`, '_blank')}>
            💬 WhatsApp
          </button>
          <button className="bcc" onClick={() => onClientCard(appt.client_name)}>
            👤 כרטיס לקוח
          </button>
          <button className="bd" onClick={() => onDelete(apptId)}>🗑</button>
        </div>

        <div className="sa">
          <button className="bs" onClick={onClose}>סגור</button>
          <button className="bp" onClick={() => onEdit(appt)}>✏️ ערוך</button>
        </div>
      </div>
    </div>
  )
}

export default DetailModal
