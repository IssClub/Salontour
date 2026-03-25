import { useEffect, useRef } from 'react'
import { today, t2m, m2t, PCOLS, PLIGHT, siIcon, getDayHours, isOnVacation } from '../lib/helpers'

const RH = 52 // row height px (matches --rh CSS var)
const TW = 48 // time gutter width

export default function DayView({ curDate, settings, providers, appointments, vacations, onSlotClick, onApptClick }) {
  const gridRef  = useRef(null)
  const hdrRef   = useRef(null)

  const dow   = new Date(curDate + 'T12:00:00').getDay()
  const isWork = settings.work_days?.includes(dow)

  useEffect(() => {
    if (!isWork || !gridRef.current) return
    const { open } = getDayHours(curDate, settings)
    const now  = new Date()
    const nm   = now.getHours() * 60 + now.getMinutes()
    const hdrH = hdrRef.current?.offsetHeight || RH
    const wrap = document.getElementById('calOuter')
    if (!wrap) return
    const targetMins = curDate === today() ? Math.max(open, nm - 60) : open
    wrap.scrollTop = hdrH + ((targetMins - open) / 30) * RH - 10
  }, [curDate, isWork])

  if (!isWork) return (
    <div style={{ display: 'block' }}>
      <div className="no-work"><div style={{ fontSize: 36 }}>🌿</div><div>יום מנוחה — הסלון סגור</div></div>
    </div>
  )

  const { open, close } = getDayHours(curDate, settings)
  const slots = []
  for (let m = open; m < close; m += 30) slots.push(m)

  const dayAppts = appointments.filter(a => a.date === curDate)

  // Now line
  const nowMins  = new Date().getHours() * 60 + new Date().getMinutes()
  const showNow  = curDate === today() && nowMins >= open && nowMins <= close

  return (
    <div
      className="cal-grid"
      ref={gridRef}
      style={{ gridTemplateColumns: `${TW}px repeat(${providers.length}, 1fr)` }}
    >
      {/* Header */}
      <div ref={hdrRef} className="ch-time" />
      {providers.map(p => {
        const cnt      = dayAppts.filter(a => a.provider_id === p.id).length
        const onVac    = isOnVacation(vacations, p.id, curDate)
        return (
          <div key={p.id} className="ch-prov" style={{ background: PLIGHT(p.color) }}>
            <div className="ph-inner">
              <div className="ph-av" style={{ background: PCOLS[p.color] }}>{p.name[0]}</div>
              <div>
                <div className="ph-name">{p.name}</div>
                <div className="ph-count">
                  {onVac ? <span style={{ color: 'var(--red)' }}>בחופשה</span> : `${cnt} תורים`}
                </div>
              </div>
            </div>
          </div>
        )
      })}

      {/* Time rows */}
      {slots.map(m => {
        const isH = m % 60 === 0
        return [
          <div key={`tl-${m}`} className={`t-label${isH ? '' : ' half'}`}>
            {isH ? m2t(m) : ''}
          </div>,
          ...providers.map(p => (
            <div
              key={`slot-${m}-${p.id}`}
              data-p={p.id}
              className={`slot${isH ? '' : ' half'}`}
              style={{ background: PLIGHT(p.color) }}
              onClick={() => onSlotClick(p.id, curDate, m2t(m))}
            />
          ))
        ]
      })}

      {/* Vacation overlays — absolute positioned like ApptBlock */}
      {providers.map(p =>
        isOnVacation(vacations, p.id, curDate)
          ? <VacationOverlay key={p.id} provider={p} open={open} close={close} />
          : null
      )}

      {/* Appointment blocks */}
      {dayAppts.map(appt => (
        <ApptBlock
          key={appt.id}
          appt={appt}
          openMins={open}
          providers={providers}
          onClick={() => onApptClick(appt.id)}
        />
      ))}

      {/* Now line */}
      {showNow && <NowLine openMins={open} nowMins={nowMins} />}
    </div>
  )
}

function VacationOverlay({ provider, open, close }) {
  const ref = useRef(null)
  const col = PCOLS[provider.color]
  const totalSlots = (close - open) / 30
  const h = totalSlots * RH - 4

  useEffect(() => {
    if (!ref.current) return
    const grid = ref.current.closest('.cal-grid')
    if (!grid) return

    function update() {
      if (!ref.current) return
      const cell = grid.querySelector(`.slot[data-p="${provider.id}"]`)
      if (!cell) return
      const cr = cell.getBoundingClientRect()
      const gr = grid.getBoundingClientRect()
      ref.current.style.right = (gr.right - cr.right + 3) + 'px'
      ref.current.style.width = (cr.width - 6) + 'px'
    }

    update()
    const ro = new ResizeObserver(update)
    ro.observe(grid)
    return () => ro.disconnect()
  }, [provider.id])

  return (
    <div
      ref={ref}
      style={{
        position: 'absolute',
        top: RH + 2,
        right: 3,
        width: 100,
        height: h,
        background: `${col}18`,
        border: `2px dashed ${col}66`,
        color: col,
        borderRadius: 8,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 13,
        fontWeight: 700,
        zIndex: 6,
        pointerEvents: 'none',
      }}
    >
      🏖 חופשה
    </div>
  )
}

function ApptBlock({ appt, openMins, providers, onClick }) {
  const ref = useRef(null)
  const prov = providers.find(p => p.id === appt.provider_id)
  const col  = PCOLS[prov?.color || '1']
  const sm   = t2m(appt.time)
  const top  = RH + ((sm - openMins) / 30) * RH + 2
  const h    = Math.max((appt.duration / 30) * RH - 5, 26)
  const endT = m2t(sm + appt.duration)
  const icon = siIcon(appt.service)

  useEffect(() => {
    if (!ref.current) return
    const grid = ref.current.closest('.cal-grid')
    if (!grid) return

    function update() {
      if (!ref.current) return
      const cell = grid.querySelector(`.slot[data-p="${appt.provider_id}"]`)
      if (!cell) return
      const cr = cell.getBoundingClientRect()
      const gr = grid.getBoundingClientRect()
      ref.current.style.right = (gr.right - cr.right + 3) + 'px'
      ref.current.style.width = (cr.width - 6) + 'px'
    }

    update()
    const ro = new ResizeObserver(update)
    ro.observe(grid)
    return () => ro.disconnect()
  }, [appt.provider_id, providers])

  return (
    <div
      ref={ref}
      className="appt"
      style={{ top, height: h, borderColor: col, position: 'absolute', right: 3, width: 140 }}
      onClick={e => { e.stopPropagation(); onClick() }}
    >
      <div className="appt-top">
        <span className="appt-icon">{icon}</span>
        <div className="appt-name">{appt.client_name}</div>
      </div>
      {h > 42 && <div className="appt-svc" style={{ color: col }}>{appt.service}</div>}
      {h > 60 && <div className="appt-time-lbl">{appt.time.slice(0,5)} – {endT}</div>}
      <div className="appt-dur">{appt.duration}′</div>
    </div>
  )
}

function NowLine({ openMins, nowMins }) {
  const top = RH + ((nowMins - openMins) / 30) * RH
  return (
    <div
      className="now-line"
      style={{ top, right: TW, left: 0, position: 'absolute' }}
    />
  )
}
