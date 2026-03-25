// ── FreeView.jsx ──────────────────────────────────────────────
import { getDayHours, hasConflict, isOnVacation, m2t, PCOLS, DAY_F } from '../lib/helpers'

export function FreeView({ curDate, settings, providers, appointments, vacations, onSlotClick }) {
  const dow    = new Date(curDate + 'T12:00:00').getDay()
  const isWork = settings.work_days?.includes(dow)

  if (!isWork) return (
    <div className="no-work"><div style={{ fontSize: 36 }}>🌿</div><div>יום מנוחה</div></div>
  )

  const { open, close } = getDayHours(curDate, settings)

  return (
    <div className="free-view">
      {providers.map(p => {
        const onVac = isOnVacation(vacations, p.id, curDate)
        const slots = []
        if (!onVac) {
          for (let m = open; m + settings.default_duration <= close; m += 30) {
            if (!hasConflict(appointments, curDate, m2t(m), settings.default_duration, p.id)) {
              slots.push(m)
            }
          }
        }
        return (
          <div key={p.id} className="free-section">
            <div className="free-prov-hdr">
              <div className="free-prov-av" style={{ background: PCOLS[p.color] }}>{p.name[0]}</div>
              <div className="free-prov-name">{p.name}</div>
              {onVac && <div style={{ color: 'var(--red)', fontSize: 11, fontWeight: 600 }}>🏖 בחופשה</div>}
            </div>
            {onVac ? null : slots.length === 0
              ? <div className="no-free">אין חלונות פנויים</div>
              : (
                <div className="free-slots-grid">
                  {slots.map(m => (
                    <div
                      key={m}
                      className="free-slot-pill"
                      onClick={() => onSlotClick(p.id, curDate, m2t(m))}
                    >
                      {m2t(m)}
                    </div>
                  ))}
                </div>
              )
            }
          </div>
        )
      })}
    </div>
  )
}

export default FreeView


// ── MonthView.jsx ─────────────────────────────────────────────
// (exported separately below — imported by name in App.jsx)
