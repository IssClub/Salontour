// ── Topbar.jsx ────────────────────────────────────────────────
import { DAY_S, today } from '../lib/helpers'

const VIEWS = ['day', 'free', 'month']
const VLABELS = { day: 'יום', free: 'פנוי', month: 'חודש' }

export default function Topbar({ settings, curDate, curView, onPrevDay, onNextDay, onSetView, onNewAppt, onOpenSettings, onOpenClients, onOpenReminders }) {
  const d    = new Date(curDate + 'T12:00:00')
  const isT  = curDate === today()
  const name = settings.salon_name || 'סלון'

  function cycleView() {
    const next = VIEWS[(VIEWS.indexOf(curView) + 1) % VIEWS.length]
    onSetView(next)
  }

  return (
    <div className="topbar">
      <div className="logo" onClick={onOpenSettings}>
        ✂<em>{name}</em>
      </div>
      <div className="day-nav">
        <button className="nav-btn" onClick={onPrevDay}>‹</button>
        <div className="day-lbl">
          <div className="day-lbl-main">
            {isT && <span className="today-chip">היום</span>}
            יום {DAY_S[d.getDay()]}
          </div>
        </div>
        <button className="nav-btn" onClick={onNextDay}>›</button>
      </div>
      <div className="topbar-right">
        <div className="view-toggle">
          {VIEWS.map(v => (
            <button
              key={v}
              className={`vt-btn ${curView === v ? 'active' : ''}`}
              onClick={() => onSetView(v)}
            >
              {VLABELS[v]}
            </button>
          ))}
        </div>
        <button className="view-cycle-btn" onClick={cycleView}>{VLABELS[curView]} ↻</button>
        <button className="icon-btn" onClick={onOpenReminders} title="תזכורות WhatsApp">💬</button>
        <button className="icon-btn" onClick={onOpenClients} title="לקוחות">👥</button>
        <button className="add-btn" onClick={onNewAppt}>✂<span className="btn-label"> תור</span></button>
      </div>
    </div>
  )
}
