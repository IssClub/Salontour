import { useEffect, useRef } from 'react'
import { DAY_S, MONS, today as todayFn, addDays } from '../lib/helpers'

export default function DateStrip({
  curDate, curView, curMonth,
  appointments, settings,
  onSelectDate, onPrevWeek, onNextWeek,
  onPrevMonth, onNextMonth,
  onPrevMonthJump, onNextMonthJump,
}) {
  const ref = useRef(null)

  useEffect(() => {
    ref.current?.querySelector('.active')?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' })
  }, [curDate])

  if (curView === 'month') {
    const d = new Date(curMonth + 'T12:00:00')
    return (
      <div className="strip" ref={ref}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 8px' }}>
          <button className="nav-btn" onClick={onPrevMonth}>›</button>
          <div style={{ fontSize: 14, fontWeight: 700 }}>{MONS[d.getMonth()]} {d.getFullYear()}</div>
          <button className="nav-btn" onClick={onNextMonth}>‹</button>
        </div>
      </div>
    )
  }

  // Week strip
  const base      = new Date(curDate + 'T12:00:00')
  const weekStart = new Date(base)
  weekStart.setDate(base.getDate() - base.getDay())

  const todayStr = todayFn()

  const days = Array.from({ length: 7 }, (_, i) => {
    const d  = new Date(weekStart)
    d.setDate(d.getDate() + i)
    const ds = d.toISOString().slice(0, 10)
    return { d, ds, dow: d.getDay() }
  })

  return (
    <div className="strip" ref={ref}>
      <button className="nav-btn" style={{ flexShrink: 0 }} onClick={onPrevMonthJump} title="חודש קודם">«</button>
      <button className="nav-btn" style={{ flexShrink: 0 }} onClick={onPrevWeek} title="שבוע קודם">‹</button>
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: '2px' }}>
        {days.map(({ d, ds, dow }) => {
          const isWork = settings.work_days?.includes(dow)
          const has    = appointments.some(a => a.date === ds)
          return (
            <div
              key={ds}
              className={`dpill ${ds === curDate ? 'active' : ''} ${ds === todayStr ? 'today' : ''} ${has ? 'has-appts' : ''} ${isWork ? '' : 'off'}`}
              onClick={() => onSelectDate(ds)}
            >
              <div className="dp-dow">{DAY_S[dow]}</div>
              <div className="dp-num">{d.getDate()}</div>
              <div className="dp-dot" />
            </div>
          )
        })}
      </div>
      <button className="nav-btn" style={{ flexShrink: 0 }} onClick={onNextWeek} title="שבוע הבא">›</button>
      <button className="nav-btn" style={{ flexShrink: 0 }} onClick={onNextMonthJump} title="חודש הבא">»</button>
    </div>
  )
}
