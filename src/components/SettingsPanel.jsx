import { useState } from 'react'
import { m2t, DAY_F, PCOLS, CKEYS, hashPin } from '../lib/helpers'

function buildTimeOptions() {
  const opts = []
  for (let m = 360; m <= 1380; m += 30) opts.push(m)
  return opts
}
const TIME_OPTS = buildTimeOptions()

export default function SettingsPanel({
  settings, providers, vacations,
  onSave, onSaveProvider, onAddProvider, onDeleteProvider,
  onAddVacation, onDeleteVacation, onClose
}) {
  const [salonName,  setSalonName]  = useState(settings.salon_name || '')
  const [openMins,   setOpenMins]   = useState(settings.open_mins)
  const [closeMins,  setCloseMins]  = useState(settings.close_mins)
  const [defDur,     setDefDur]     = useState(settings.default_duration)
  const [workDays,   setWorkDays]   = useState([...(settings.work_days || [])])
  const [dayHours,   setDayHours]   = useState({ ...(settings.day_hours || {}) })
  const [services,   setServices]   = useState(settings.services || [])
  const [newSvc,     setNewSvc]     = useState('')
  const [pinBuf,     setPinBuf]     = useState('')
  const [pinStatus,  setPinStatus]  = useState(settings.pin ? '🔒 PIN מוגדר' : '🔓 אין PIN')
  const [showVacForm,setShowVacForm]= useState(false)
  const [vacProv,    setVacProv]    = useState(providers[0]?.id || '')
  const [vacFrom,    setVacFrom]    = useState('')
  const [vacTo,      setVacTo]      = useState('')
  const [vacNote,    setVacNote]    = useState('')

  function toggleDay(d) {
    setWorkDays(prev =>
      prev.includes(d) ? (prev.length > 1 ? prev.filter(x => x !== d) : prev) : [...prev, d]
    )
  }

  function addService() {
    const t = newSvc.trim()
    if (!t || services.includes(t)) return
    setServices(prev => [...prev, t])
    setNewSvc('')
  }

  async function handleSave() {
    let newPin
    if (pinBuf.length === 4) {
      newPin = await hashPin(pinBuf)
    } else if (pinBuf.length === 0) {
      newPin = null
    } else {
      newPin = settings.pin
    }
    onSave({
      salon_name: salonName,
      open_mins: openMins,
      close_mins: closeMins,
      default_duration: defDur,
      work_days: workDays,
      day_hours: dayHours,
      services,
      pin: newPin,
    })
  }

  async function handleAddVac() {
    if (!vacFrom || !vacTo || vacTo < vacFrom) return
    await onAddVacation({ provider_id: vacProv, from_date: vacFrom, to_date: vacTo, note: vacNote })
    setShowVacForm(false)
    setVacFrom(''); setVacTo(''); setVacNote('')
  }

  return (
    <div className="fp open">
      <div className="fp-tb">
        <button className="fp-back" onClick={onClose}>›</button>
        <div className="fp-title">⚙ הגדרות</div>
      </div>

      {/* Salon Name */}
      <div className="fps">
        <div className="fpst">🏪 שם המספרה</div>
        <div className="fpc">
          <div className="fpr">
            <input
              className="fi"
              value={salonName}
              onChange={e => setSalonName(e.target.value)}
              placeholder="שם המספרה..."
              style={{ border: 'none', background: 'transparent', padding: 0, fontSize: 14, fontWeight: 600 }}
            />
          </div>
        </div>
      </div>

      {/* Default Hours */}
      <div className="fps">
        <div className="fpst">🕐 שעות ברירת מחדל</div>
        <div className="fpc">
          <div className="fpr">
            <div className="fprl">פתיחה</div>
            <select className="sel" value={openMins} onChange={e => setOpenMins(+e.target.value)}>
              {TIME_OPTS.map(m => <option key={m} value={m}>{m2t(m)}</option>)}
            </select>
          </div>
          <div className="fpr">
            <div className="fprl">סגירה</div>
            <select className="sel" value={closeMins} onChange={e => setCloseMins(+e.target.value)}>
              {TIME_OPTS.map(m => <option key={m} value={m}>{m2t(m)}</option>)}
            </select>
          </div>
          <div className="fpr">
            <div className="fprl">משך תור ברירת מחדל</div>
            <select className="sel" value={defDur} onChange={e => setDefDur(+e.target.value)}>
              {[15,30,45,60,90,120].map(m => <option key={m} value={m}>{m}′</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Working Days */}
      <div className="fps">
        <div className="fpst">📅 ימי עבודה ושעות</div>
        <div className="fpc">
          {[0,1,2,3,4,5,6].map(d => {
            const isW = workDays.includes(d)
            const ov  = dayHours[d]
            return (
              <div key={d} className="day-row">
                <div className="dr-top">
                  <div>
                    <div className="fprl">יום {DAY_F[d]}</div>
                    <div className="fprs">
                      {!isW ? 'יום חופש' : ov ? `${m2t(ov.open)} – ${m2t(ov.close)}` : 'שעות ברירת מחדל'}
                    </div>
                  </div>
                  <button className={`tog ${isW ? 'on' : ''}`} onClick={() => toggleDay(d)} />
                </div>
                {isW && (
                  <div className="dr-hours">
                    <span style={{ fontSize: 11, color: 'var(--text-mid)' }}>שעות מיוחדות:</span>
                    <select
                      className="sel"
                      value={ov?.open ?? openMins}
                      style={{ fontSize: 12, padding: '4px 8px' }}
                      onChange={e => {
                        const o = +e.target.value
                        const c = ov?.close ?? closeMins
                        if (c > o) setDayHours(prev => ({ ...prev, [d]: { open: o, close: c } }))
                      }}
                    >
                      {TIME_OPTS.map(m => <option key={m} value={m}>{m2t(m)}</option>)}
                    </select>
                    <span style={{ color: 'var(--text-dim)' }}>–</span>
                    <select
                      className="sel"
                      value={ov?.close ?? closeMins}
                      style={{ fontSize: 12, padding: '4px 8px' }}
                      onChange={e => {
                        const c = +e.target.value
                        const o = ov?.open ?? openMins
                        if (c > o) setDayHours(prev => ({ ...prev, [d]: { open: o, close: c } }))
                      }}
                    >
                      {TIME_OPTS.map(m => <option key={m} value={m}>{m2t(m)}</option>)}
                    </select>
                    {ov && (
                      <button
                        onClick={() => setDayHours(prev => { const n={...prev}; delete n[d]; return n })}
                        style={{ fontSize: 11, background: 'none', border: 'none', color: 'var(--text-mid)', cursor: 'pointer', marginRight: 'auto' }}
                      >↺ ברירת מחדל</button>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Services */}
      <div className="fps">
        <div className="fpst">✂ שירותים</div>
        <div className="fpc">
          {services.length === 0 && (
            <div style={{ padding: '10px 14px', fontSize: 13, color: 'var(--text-dim)' }}>אין שירותים מוגדרים</div>
          )}
          {services.map(s => (
            <div key={s} className="fpr">
              <div className="fprl">{s}</div>
              <button className="brm" onClick={() => setServices(prev => prev.filter(x => x !== s))}>✕</button>
            </div>
          ))}
          <div className="fpr" style={{ gap: 8 }}>
            <input
              className="fi"
              style={{ flex: 1, padding: '7px 10px', fontSize: 13 }}
              value={newSvc}
              onChange={e => setNewSvc(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addService()}
              placeholder="הוסף שירות... (Enter)"
            />
            <button
              onClick={addService}
              style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 14px', fontFamily: 'Heebo', fontSize: 13, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}
            >＋</button>
          </div>
        </div>
      </div>

      {/* Providers */}
      <div className="fps">
        <div className="fpst">💇 מטפלים</div>
        <div className="fpc">
          {providers.map((pv) => (
            <div key={pv.id} className="pi">
              <div className="piav" style={{ background: PCOLS[pv.color] }}>{pv.name[0]}</div>
              <input
                className="fi"
                style={{ flex: 1, padding: '7px 10px', fontSize: 13 }}
                defaultValue={pv.name}
                onBlur={e => onSaveProvider({ ...pv, name: e.target.value })}
              />
              <div className="swatches">
                {CKEYS.map(k => (
                  <div
                    key={k}
                    className={`sw ${pv.color === k ? 'on' : ''}`}
                    style={{ background: PCOLS[k] }}
                    onClick={() => onSaveProvider({ ...pv, color: k })}
                  />
                ))}
              </div>
              {providers.length > 1 && (
                <button className="brm" onClick={() => onDeleteProvider(pv.id)}>✕</button>
              )}
            </div>
          ))}
          <button className="badd" onClick={() => {
            const used = providers.map(p => p.color)
            const fc   = CKEYS.find(k => !used.includes(k)) || '1'
            onAddProvider('מטפל/ת חדש/ה', fc)
          }}>＋ הוסף מטפל/ת</button>
        </div>
      </div>

      {/* Vacations */}
      <div className="fps">
        <div className="fpst">🏖 חופשות עובדים</div>
        <div className="fpc">
          {vacations.length === 0 && (
            <div style={{ padding: '12px 14px', fontSize: 13, color: 'var(--text-dim)' }}>אין חופשות מוגדרות</div>
          )}
          {vacations.map(v => {
            const pv = providers.find(p => p.id === v.provider_id)
            return (
              <div key={v.id} className="vi">
                <div className="piav" style={{ background: PCOLS[pv?.color||'1'], width: 30, height: 30, fontSize: 12, flexShrink: 0 }}>
                  {pv?.name[0] || '?'}
                </div>
                <div>
                  <div className="vi-name">{pv?.name || '—'}{v.note ? ` · ${v.note}` : ''}</div>
                  <div className="vi-dates">{v.from_date} → {v.to_date}</div>
                </div>
                <button className="brvac" onClick={() => onDeleteVacation(v.id)}>🗑</button>
              </div>
            )
          })}

          {showVacForm ? (
            <div style={{ padding: '12px 14px', borderTop: '1px solid var(--border)' }}>
              <div className="fr">
                <label className="fl">עובד/ת</label>
                <select className="fi" value={vacProv} onChange={e => setVacProv(e.target.value)}>
                  {providers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="fr">
                <label className="fl">טווח חופשה</label>
                <div className="vac-range">
                  <input
                    className="fi"
                    type="date"
                    value={vacFrom}
                    onChange={e => {
                      setVacFrom(e.target.value)
                      if (!vacTo || e.target.value > vacTo) setVacTo(e.target.value)
                    }}
                  />
                  <div className="vac-range-arrow">→</div>
                  <input
                    className="fi"
                    type="date"
                    value={vacTo}
                    min={vacFrom}
                    onChange={e => setVacTo(e.target.value)}
                  />
                </div>
                {vacFrom && vacTo && vacFrom !== vacTo && (
                  <div style={{ fontSize: 11, color: 'var(--text-mid)', marginTop: 5 }}>
                    {Math.round((new Date(vacTo) - new Date(vacFrom)) / 86400000) + 1} ימים
                  </div>
                )}
              </div>
              <div className="fr" style={{ marginTop: 8 }}>
                <label className="fl">הערה</label>
                <input className="fi" value={vacNote} onChange={e => setVacNote(e.target.value)} placeholder="חופשה, מחלה..." />
              </div>
              <div className="sa">
                <button className="bs" onClick={() => setShowVacForm(false)}>ביטול</button>
                <button className="bp" onClick={handleAddVac}>שמור</button>
              </div>
            </div>
          ) : (
            <button className="badd" onClick={() => setShowVacForm(true)}>＋ הוסף חופשה</button>
          )}
        </div>
      </div>

      {/* PIN */}
      <div className="fps">
        <div className="fpst">🔐 קוד גישה (PIN)</div>
        <div className="fpc">
          <div className="fpr" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
            <div className="fprl">PIN בן 4 ספרות</div>
            <div className="fprs">השאר ריק לביטול</div>
          </div>
          <div className="pdots">
            {[0,1,2,3].map(i => <div key={i} className={`pdot ${i < pinBuf.length ? 'on' : ''}`} />)}
          </div>
          <div className="kpad">
            {[1,2,3,4,5,6,7,8,9].map(n => (
              <button key={n} className="key" onClick={() => pinBuf.length < 4 && setPinBuf(b => b + n)}>{n}</button>
            ))}
            <button className="key" style={{ gridColumn: 1 }} onClick={() => pinBuf.length < 4 && setPinBuf(b => b + '0')}>0</button>
            <button className="key del" style={{ gridColumn: 3 }} onClick={() => setPinBuf(b => b.slice(0,-1))}>⌫</button>
          </div>
          <div style={{ padding: '0 14px 12px', fontSize: 11, color: 'var(--text-dim)' }}>{pinStatus}</div>
        </div>
      </div>

      <button className="fp-save" onClick={handleSave}>💾 שמור הגדרות</button>
    </div>
  )
}
