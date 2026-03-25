// ── Topbar.jsx ────────────────────────────────────────────────
import { DAY_F, MONS, today } from '../lib/helpers'

export default function Topbar({ settings, curDate, curView, onPrevDay, onNextDay, onSetView, onNewAppt, onOpenSettings }) {
  const d    = new Date(curDate + 'T12:00:00')
  const isT  = curDate === today()
  const name = settings.salon_name || 'סלון'

  return (
    <div className="topbar">
      <div className="logo" onClick={onOpenSettings}>
        ✂<em>{name}</em>תור
      </div>
      <div className="day-nav">
        <button className="nav-btn" onClick={onPrevDay}>›</button>
        <div className="day-lbl">
          <div className="day-lbl-main">
            {isT && <span className="today-chip">היום</span>}
            יום {DAY_F[d.getDay()]}
          </div>
          <div className="day-lbl-sub">{d.getDate()} ב{MONS[d.getMonth()]}</div>
        </div>
        <button className="nav-btn" onClick={onNextDay}>‹</button>
      </div>
      <div className="topbar-right">
        <div className="view-toggle">
          {['day','free','month'].map(v => (
            <button
              key={v}
              className={`vt-btn ${curView === v ? 'active' : ''}`}
              onClick={() => onSetView(v)}
            >
              {{ day:'יום', free:'פנוי', month:'חודש' }[v]}
            </button>
          ))}
        </div>
        <button className="icon-btn" onClick={onOpenSettings} title="הגדרות">⚙</button>
        <button className="add-btn" onClick={onNewAppt}>✂<span className="btn-label"> תור</span></button>
      </div>
    </div>
  )
}
