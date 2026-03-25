// ── Date / Time helpers ──────────────────────────────────────
export const today = () => new Date().toISOString().slice(0, 10)

export const t2m = (t) => {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + (m || 0)
}

export const m2t = (m) =>
  `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`

export const addDays = (ds, n) => {
  const d = new Date(ds + 'T12:00:00')
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

// ── Constants ────────────────────────────────────────────────
export const PCOLS = {
  '1': '#c9956a', '2': '#6a9bc9', '3': '#c96a9b',
  '4': '#6ac98b', '5': '#c9a56a', '6': '#9b6ac9'
}
export const PLIGHT = (k) => PCOLS[k] + '22'
export const CKEYS = Object.keys(PCOLS)

export const SVC_ICONS = {
  'תספורת': '✂️', 'פן': '💨', 'צביע': '🎨', 'הארה': '✨',
  'מניק': '💅', 'פדיק': '🦶', 'גבות': '👁️', 'הסרת': '🌸', 'טיפול': '💆'
}
export const siIcon = (s) => {
  const k = Object.keys(SVC_ICONS).find(k => (s || '').includes(k))
  return k ? SVC_ICONS[k] : '💇'
}

export const DAY_S  = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש']
export const DAY_F  = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת']
export const MONS   = ['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר']

// ── Business logic ───────────────────────────────────────────
export const getDayHours = (dateStr, settings) => {
  const dow = new Date(dateStr + 'T12:00:00').getDay()
  const ov  = settings.day_hours?.[dow]
  return ov
    ? { open: ov.open, close: ov.close }
    : { open: settings.open_mins, close: settings.close_mins }
}

export const hasConflict = (appointments, date, time, duration, providerId, excludeId = null) => {
  const s = t2m(time), e = s + duration
  return appointments.some(a => {
    if (a.id === excludeId || a.date !== date || a.provider_id !== providerId) return false
    const as = t2m(a.time), ae = as + a.duration
    return s < ae && e > as
  })
}

export const isOnVacation = (vacations, providerId, dateStr) =>
  vacations.some(v => v.provider_id === providerId && dateStr >= v.from_date && dateStr <= v.to_date)

// ── Security ──────────────────────────────────────────────────
export async function hashPin(pin) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(String(pin)))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}
