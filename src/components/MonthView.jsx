import { today, DAY_S, MONS, PCOLS } from '../lib/helpers'

export default function MonthView({ curDate, curMonth, settings, providers, appointments, onPickDay }) {
  const base   = new Date(curMonth + 'T12:00:00')
  const year   = base.getFullYear()
  const month  = base.getMonth()
  const first  = new Date(year, month, 1).getDay()
  const days   = new Date(year, month + 1, 0).getDate()
  const prevDays = new Date(year, month, 0).getDate()
  const todayStr = today()

  const cells = []

  // Prev month padding
  for (let i = first - 1; i >= 0; i--) {
    cells.push({ dom: prevDays - i, ds: null, otherMonth: true })
  }
  // Current month
  for (let dom = 1; dom <= days; dom++) {
    const ds  = `${year}-${String(month + 1).padStart(2,'0')}-${String(dom).padStart(2,'0')}`
    const dow = new Date(ds + 'T12:00:00').getDay()
    cells.push({ dom, ds, dow, otherMonth: false, isWork: settings.work_days?.includes(dow) })
  }
  // Next month padding
  const total = Math.ceil((first + days) / 7) * 7
  for (let i = 1; i <= total - (first + days); i++) {
    cells.push({ dom: i, ds: null, otherMonth: true })
  }

  return (
    <div className="month-wrap">
      <div className="month-dow">
        {DAY_S.map(d => <div key={d} className="month-dow-lbl">{d}</div>)}
      </div>
      <div className="month-grid">
        {cells.map((c, idx) => {
          if (c.otherMonth) return (
            <div key={idx} className="mday other-month"><div className="mday-num">{c.dom}</div></div>
          )
          const dayAppts = appointments.filter(a => a.date === c.ds)
          const isActive = c.ds === curDate
          const isToday  = c.ds === todayStr
          return (
            <div
              key={c.ds}
              className={`mday ${c.isWork ? '' : 'off'} ${isToday ? 'today' : ''} ${isActive ? 'active' : ''}`}
              onClick={() => c.isWork && onPickDay(c.ds)}
            >
              <div className="mday-num">{c.dom}</div>
              <div className="mday-dots">
                {providers.map(p => {
                  const has = dayAppts.some(a => a.provider_id === p.id)
                  return has ? <div key={p.id} className="mday-dot" style={{ background: PCOLS[p.color] }} /> : null
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
