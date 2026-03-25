import { useState } from 'react'

const HEB = 'אבגדהוזחטיכלמנסעפצקרשת'.split('')

export default function ClientsListPanel({ clients, appointments, onClose, onSelectClient }) {
  const [search, setSearch] = useState('')
  const [letter, setLetter] = useState(null)

  const sorted   = [...clients].sort((a, b) => a.name.localeCompare(b.name, 'he'))
  const usedLetters = HEB.filter(l => clients.some(c => c.name.startsWith(l)))

  const filtered = sorted.filter(c => {
    if (search)  return c.name.toLowerCase().includes(search.toLowerCase())
    if (letter)  return c.name.startsWith(letter)
    return true
  })

  return (
    <div className="fp open">
      <div className="fp-tb">
        <button className="fp-back" onClick={onClose}>›</button>
        <div className="fp-title">👥 לקוחות ({clients.length})</div>
      </div>

      <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)' }}>
        <input
          className="fi"
          placeholder="🔍 חיפוש לקוח..."
          value={search}
          onChange={e => { setSearch(e.target.value); setLetter(null) }}
        />
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, padding: '8px 14px', borderBottom: '1px solid var(--border)' }}>
        <div
          className={`pill ${!letter && !search ? 'active' : ''}`}
          style={{ padding: '3px 10px', fontSize: 11 }}
          onClick={() => { setLetter(null); setSearch('') }}
        >הכל</div>
        {usedLetters.map(l => (
          <div
            key={l}
            className={`pill ${letter === l ? 'active' : ''}`}
            style={{ padding: '3px 9px', fontSize: 12, minWidth: 30, textAlign: 'center' }}
            onClick={() => { setLetter(l); setSearch('') }}
          >{l}</div>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {filtered.length === 0 && (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-dim)', fontSize: 13 }}>
            אין לקוחות
          </div>
        )}
        {filtered.map(c => {
          const visits   = appointments.filter(a => a.client_name?.toLowerCase() === c.name.toLowerCase())
          const lastVisit = [...visits].sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time))[0]
          return (
            <div
              key={c.id}
              className="cl-row"
              onClick={() => onSelectClient(c.name)}
            >
              <div className="chav">{c.name[0]}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{c.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 1 }}>
                  {c.phone || 'אין טלפון'} · {visits.length} ביקורים
                </div>
              </div>
              {lastVisit && (
                <div style={{ fontSize: 10, color: 'var(--text-mid)', textAlign: 'center', flexShrink: 0 }}>
                  <div>ביקור אחרון</div>
                  <div style={{ fontWeight: 600 }}>{lastVisit.date}</div>
                </div>
              )}
              <div style={{ color: 'var(--text-dim)', fontSize: 16, marginRight: 4 }}>›</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
