import { useState, useEffect, useRef } from 'react'
import { today, t2m, m2t, PCOLS, hasConflict, isOnVacation, getDayHours } from '../lib/helpers'

const DURATIONS = [15, 30, 45, 60, 90, 120, 180]

export default function ApptModal({
  initial, providers, appointments, clients, settings, vacations,
  onSave, onClose
}) {
  const isEdit = !!initial.editId

  const [name,     setName]     = useState(initial.client_name || initial.name || '')
  const [phone,    setPhone]    = useState(initial.phone || '')
  const [service,  setService]  = useState(initial.service || '')
  const [date,     setDate]     = useState(initial.date || today())
  const [time,     setTime]     = useState(initial.time || '')
  const [dur,      setDur]      = useState(initial.duration || settings.default_duration || 60)
  const [provId,   setProvId]   = useState(initial.provider_id || initial.providerId || providers[0]?.id)
  const [note,     setNote]     = useState(initial.note || '')
  const [selClient,setSelClient]= useState(null)
  const [suggest,  setSuggest]  = useState([])
  const [showSug,  setShowSug]  = useState(false)
  const nameRef = useRef(null)

  // Conflict + vacation check
  const conflict  = date && time && provId
    ? hasConflict(appointments, date, time, dur, provId, initial.editId || null)
    : false
  const provOnVac = date && provId ? isOnVacation(vacations, provId, date) : false

  // Time options: 10-minute steps between open and close
  const { open: dayOpen, close: dayClose } = getDayHours(date || today(), settings)
  const timeOptions = []
  for (let m = dayOpen; m < dayClose; m += 15) timeOptions.push(m2t(m))

  // On edit — pre-select client chip
  useEffect(() => {
    if (isEdit && initial.client_name) {
      const cl = clients.find(c => c.name.toLowerCase() === initial.client_name.toLowerCase())
      if (cl) setSelClient(cl)
    }
  }, [])

  function handleNameInput(val) {
    setName(val)
    setSelClient(null)
    if (!val.trim()) { setSuggest([]); setShowSug(false); return }
    const q   = val.trim().toLowerCase()
    const res = clients.filter(c => c.name.toLowerCase().includes(q))
    setSuggest(res)
    setShowSug(true)
  }

  function selectClient(cl) {
    setSelClient(cl)
    setName(cl.name)
    setPhone(cl.phone || '')
    setShowSug(false)
    // pre-fill last service
    const lastAppt = appointments
      .filter(a => a.client_name.toLowerCase() === cl.name.toLowerCase())
      .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time))[0]
    if (lastAppt && !service) {
      setService(lastAppt.service || '')
      setDur(lastAppt.duration || dur)
    }
  }

  function clearClient() {
    setSelClient(null)
    setName('')
    setPhone('')
    setTimeout(() => nameRef.current?.focus(), 50)
  }

  function handleSave() {
    if (!name.trim() || !date || !time) return
    if (conflict || provOnVac) return
    onSave({
      name: name.trim(),
      phone, service, date,
      time: time.length === 5 ? time : time.slice(0, 5),
      duration: dur,
      provider_id: provId,
      note,
    }, initial.editId || null)
  }

  return (
    <div className="overlay open" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="sheet">
        <div className="sh-handle" />
        <div className="sh-title">{isEdit ? 'עריכת תור' : 'תור חדש'}</div>

        {conflict && (
          <div className="cwarn on">
            ⚠️ התנגשות עם תור קיים אצל {providers.find(p => p.id === provId)?.name} — שנה שעה או מטפל/ת
          </div>
        )}
        {!selClient && name.trim().length >= 2 && clients.find(c => c.name.toLowerCase() === name.trim().toLowerCase()) && (
          <div className="cwarn on" style={{ cursor: 'pointer' }}
            onClick={() => selectClient(clients.find(c => c.name.toLowerCase() === name.trim().toLowerCase()))}>
            👤 קיים לקוח בשם זה — <strong>לחץ לקישור לכרטיסיה הקיימת</strong>
          </div>
        )}
        {provOnVac && (
          <div className="cwarn on">
            🏖 {providers.find(p => p.id === provId)?.name} בחופשה בתאריך זה — בחר מטפל/ת אחר/ת
          </div>
        )}

        {/* Name / Client */}
        <div className="fr" style={{ position: 'relative' }}>
          <label className="fl">שם לקוח/ה</label>
          {selClient ? (
            <div className="cchip" style={{ display: 'flex' }}>
              <div className="chav">{selClient.name[0]}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-txt)' }}>{selClient.name}</div>
                <div style={{ fontSize: 10, color: 'var(--text-mid)' }}>
                  {appointments.filter(a => a.client_name.toLowerCase() === selClient.name.toLowerCase()).length} ביקורים
                  {service ? ` · ${service}` : ''}
                </div>
              </div>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: 'var(--text-dim)', marginRight: 'auto' }} onClick={clearClient}>✕</button>
            </div>
          ) : (
            <input
              ref={nameRef}
              className="fi"
              value={name}
              placeholder="הקלד שם לחיפוש..."
              autoComplete="off"
              onChange={e => handleNameInput(e.target.value)}
              onBlur={() => setTimeout(() => setShowSug(false), 150)}
              onFocus={() => name.trim() && setShowSug(true)}
            />
          )}
          {showSug && suggest.length > 0 && (
            <div className="sbox" style={{ display: 'block' }}>
              {suggest.map(cl => {
                const visits = appointments.filter(a => a.client_name.toLowerCase() === cl.name.toLowerCase())
                const last   = visits.sort((a,b)=>(b.date+b.time).localeCompare(a.date+a.time))[0]
                return (
                  <div key={cl.id} className="si" onMouseDown={() => selectClient(cl)}>
                    <div className="sav">{cl.name[0]}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{cl.name}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>
                        {cl.phone || 'אין טלפון'}{last ? ` · ${last.service}` : ''}
                      </div>
                    </div>
                    <div style={{ marginRight: 'auto', background: 'var(--bg)', borderRadius: 10, padding: '2px 7px', fontSize: 10, color: 'var(--text-mid)', flexShrink: 0 }}>
                      {visits.length} ביקורים
                    </div>
                  </div>
                )
              })}
              {!clients.some(c => c.name.toLowerCase() === name.trim().toLowerCase()) && name.trim().length >= 2 && (
                <div className="si" onMouseDown={() => { setShowSug(false) }}>
                  <div className="sav">＋</div>
                  <div style={{ color: 'var(--accent-txt)', fontSize: 13, fontWeight: 600 }}>
                    לקוח/ה חדש/ה: <strong>{name.trim()}</strong>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Phone */}
        <div className="fr" style={{ opacity: selClient ? 0.6 : 1 }}>
          <label className="fl">טלפון</label>
          <input className="fi" value={phone} onChange={e => setPhone(e.target.value)} placeholder="05X-XXXXXXX" type="tel" dir="ltr" />
        </div>

        {/* Service */}
        <div className="fr">
          <label className="fl">שירות</label>
          {settings.services?.length > 0 && (
            <div className="pills" style={{ marginBottom: 7 }}>
              {settings.services.map(s => (
                <div
                  key={s}
                  className={`pill ${service === s ? 'active' : ''}`}
                  onClick={() => setService(service === s ? '' : s)}
                >
                  {s}
                </div>
              ))}
            </div>
          )}
          <input
            className="fi"
            value={service}
            onChange={e => setService(e.target.value)}
            placeholder={settings.services?.length > 0 ? 'או הקלד שירות אחר...' : 'תספורת, צביעה, פן...'}
          />
        </div>

        {/* Date + Time */}
        <div className="fg2">
          <div className="fr" style={{ margin: 0 }}>
            <label className="fl">תאריך</label>
            <input className="fi" type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div className="fr" style={{ margin: 0 }}>
            <label className="fl">שעה</label>
            <select className="fi" value={time} onChange={e => setTime(e.target.value)}>
              <option value="">בחר שעה</option>
              {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        {/* Duration */}
        <div className="fr" style={{ marginTop: 12 }}>
          <label className="fl">משך טיפול</label>
          <div className="pills">
            {DURATIONS.map(m => (
              <div key={m} className={`pill ${dur === m ? 'active' : ''}`} onClick={() => setDur(m)}>
                {m < 60 ? `${m}′` : m === 60 ? `שעה` : m === 90 ? `ש׳וחצי` : m === 120 ? `2שע` : `3שע`}
              </div>
            ))}
          </div>
        </div>

        {/* Provider */}
        <div className="fr">
          <label className="fl">מטפל/ת</label>
          <div className="pills">
            {providers.map(p => {
              const onVac = isOnVacation(vacations, p.id, date)
              return (
                <div
                  key={p.id}
                  className={`pill pp ${provId === p.id ? 'active' : ''}`}
                  onClick={() => setProvId(p.id)}
                  style={{ opacity: onVac ? 0.5 : 1 }}
                >
                  <div className="pdot2" style={{ background: PCOLS[p.color] }} />
                  {p.name}{onVac ? ' 🏖' : ''}
                </div>
              )
            })}
          </div>
        </div>

        {/* Note */}
        <div className="fr">
          <label className="fl">הערה</label>
          <input className="fi" value={note} onChange={e => setNote(e.target.value)} placeholder="אלרגיה, בקשה מיוחדת..." />
        </div>

        <div className="sa">
          <button className="bs" onClick={onClose}>ביטול</button>
          <button className="bp" onClick={handleSave} disabled={conflict || provOnVac} style={{ opacity: (conflict || provOnVac) ? 0.5 : 1 }}>
            שמור תור
          </button>
        </div>
      </div>
    </div>
  )
}
