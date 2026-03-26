import { useState, useCallback, useRef } from 'react'
import { useData } from './hooks/useData'
import { today, addDays } from './lib/helpers'

import Topbar        from './components/Topbar'
import DateStrip     from './components/DateStrip'
import DayView       from './components/DayView'
import FreeView      from './components/FreeView'
import MonthView     from './components/MonthView'
import ApptModal     from './components/ApptModal'
import DetailModal   from './components/DetailModal'
import ClientPanel   from './components/ClientPanel'
import SettingsPanel from './components/SettingsPanel'
import PinLock        from './components/PinLock'
import Toast          from './components/Toast'
import ReminderPanel      from './components/ReminderPanel'
import ClientsListPanel   from './components/ClientsListPanel'

export default function App() {
  const data = useData()

  const [curDate,    setCurDate]    = useState(today())
  const [curView,    setCurView]    = useState('day')
  const [curMonth,   setCurMonth]   = useState(today())

  // Modals
  const [apptModal,   setApptModal]   = useState(null)  // null | { editId?, providerId?, date?, time? }
  const [detailId,    setDetailId]    = useState(null)
  const [clientName,  setClientName]  = useState(null)
  const [settingsOpen,setSettingsOpen]= useState(false)
  const [toast,       setToast]       = useState('')

  const showToast = useCallback((msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2800)
  }, [])

  const swipeStartX = useRef(null)

  // WhatsApp reminders
  const tomorrow      = addDays(today(), 1)
  const reminderKey   = `reminder_dismissed_${tomorrow}`
  const [reminderDismissed, setReminderDismissed] = useState(
    () => localStorage.getItem(reminderKey) === 'true'
  )
  const [reminderOpen,    setReminderOpen]    = useState(false)
  const [clientsListOpen, setClientsListOpen] = useState(false)

  const openNewAppt = useCallback((providerId, date, time) => {
    setApptModal({ providerId, date: date || curDate, time: time || '' })
  }, [curDate])

  if (data.loading) return (
    <div className="loading">
      <div className="spinner"></div>
      טוען נתונים...
    </div>
  )

  // PIN lock — stored only in localStorage for privacy
  const pinLocked = data.settings.pin &&
    localStorage.getItem('salon_pin_unlocked') !== 'true'

  return (
    <div className="app-wrap">
      {pinLocked && (
        <PinLock
          pin={data.settings.pin}
          salonName={data.settings.salon_name}
          onUnlock={() => {
            localStorage.setItem('salon_pin_unlocked', 'true')
            // force re-render
            data.reload()
          }}
        />
      )}

      <Topbar
        settings={data.settings}
        curDate={curDate}
        curView={curView}
        onPrevDay={() => setCurDate(d => addDays(d, -1))}
        onNextDay={() => setCurDate(d => addDays(d, 1))}
        onSetView={setCurView}
        onNewAppt={() => openNewAppt()}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenClients={() => setClientsListOpen(true)}
        onOpenReminders={() => setReminderOpen(true)}
      />

      <DateStrip
        curDate={curDate}
        curView={curView}
        curMonth={curMonth}
        appointments={data.appointments}
        settings={data.settings}
        onSelectDate={setCurDate}
        onPrevWeek={() => setCurDate(d => addDays(d, -7))}
        onNextWeek={() => setCurDate(d => addDays(d, 7))}
        onPrevMonth={() => {
          const d = new Date(curMonth + 'T12:00:00')
          d.setMonth(d.getMonth() - 1)
          setCurMonth(d.toISOString().slice(0, 10))
        }}
        onNextMonth={() => {
          const d = new Date(curMonth + 'T12:00:00')
          d.setMonth(d.getMonth() + 1)
          setCurMonth(d.toISOString().slice(0, 10))
        }}
        onPrevMonthJump={() => {
          const d = new Date(curDate + 'T12:00:00')
          d.setDate(1)
          d.setMonth(d.getMonth() - 1)
          setCurDate(d.toISOString().slice(0, 10))
        }}
        onNextMonthJump={() => {
          const d = new Date(curDate + 'T12:00:00')
          d.setDate(1)
          d.setMonth(d.getMonth() + 1)
          setCurDate(d.toISOString().slice(0, 10))
        }}
      />

      {/* Pending appointments banner */}
      {(() => {
        const pending = data.appointments.filter(a => a.status === 'pending')
        if (!pending.length) return null
        const first = pending.sort((a,b) => a.date.localeCompare(b.date))[0]
        return (
          <div
            className="reminder-banner"
            style={{ background: 'var(--amber-bg)', borderColor: 'var(--amber)', cursor: 'pointer' }}
            onClick={() => { setCurDate(first.date); setCurView('day'); setDetailId(first.id) }}
          >
            <span style={{ color: 'var(--amber)', fontWeight: 700, fontSize: 13 }}>
              ⏳ {pending.length} {pending.length === 1 ? 'תור ממתין' : 'תורים ממתינים'} לאישור — לחץ לפרטים
            </span>
          </div>
        )
      })()}

      {/* WhatsApp reminder banner */}
      {!reminderDismissed && data.appointments.some(a => a.date === tomorrow) && (
        <div className="reminder-banner">
          <button onClick={() => setReminderOpen(true)}>
            💬 יש תורים מחר — שלח תזכורות WhatsApp
          </button>
          <button className="rem-dismiss" onClick={() => {
            localStorage.setItem(reminderKey, 'true')
            setReminderDismissed(true)
          }}>✕</button>
        </div>
      )}

      <div
        className="cal-outer"
        id="calOuter"
        onTouchStart={e => { swipeStartX.current = e.touches[0].clientX }}
        onTouchEnd={e => {
          if (swipeStartX.current === null) return
          const dx = e.changedTouches[0].clientX - swipeStartX.current
          swipeStartX.current = null
          if (Math.abs(dx) < 60) return
          if (curView === 'day' || curView === 'free') {
            dx > 0 ? setCurDate(d => addDays(d, 1)) : setCurDate(d => addDays(d, -1))
          }
        }}
      >
        {curView === 'day' && (
          <DayView
            curDate={curDate}
            settings={data.settings}
            providers={data.providers}
            appointments={data.appointments}
            vacations={data.vacations}
            onSlotClick={openNewAppt}
            onApptClick={setDetailId}
          />
        )}
        {curView === 'free' && (
          <FreeView
            curDate={curDate}
            settings={data.settings}
            providers={data.providers}
            appointments={data.appointments}
            vacations={data.vacations}
            onSlotClick={openNewAppt}
          />
        )}
        {curView === 'month' && (
          <MonthView
            curDate={curDate}
            curMonth={curMonth}
            settings={data.settings}
            providers={data.providers}
            appointments={data.appointments}
            vacations={data.vacations}
            onPickDay={(ds) => { setCurDate(ds); setCurView('day') }}
          />
        )}
      </div>

      {apptModal !== null && (
        <ApptModal
          initial={apptModal}
          providers={data.providers}
          appointments={data.appointments}
          clients={data.clients}
          settings={data.settings}
          vacations={data.vacations}
          onSave={async (appt, editId) => {
            const clientId = await data.upsertClient(appt.name, appt.phone)
            const { error } = await data.saveAppointment(appt, editId, clientId)
            if (error) { showToast('שגיאה בשמירה'); return }
            setApptModal(null)
            showToast('התור נשמר ✓')
          }}
          onClose={() => setApptModal(null)}
        />
      )}

      {detailId && (
        <DetailModal
          apptId={detailId}
          appointments={data.appointments}
          providers={data.providers}
          onClose={() => setDetailId(null)}
          onEdit={(appt) => {
            setDetailId(null)
            setApptModal({ editId: appt.id, ...appt })
          }}
          onDelete={async (id) => {
            const { error } = await data.deleteAppointment(id)
            if (error) { showToast('שגיאה במחיקה'); return }
            setDetailId(null)
            showToast('התור נמחק')
          }}
          onConfirm={async (id) => {
            const appt = data.appointments.find(a => a.id === id)
            const { error } = await data.confirmAppointment(id)
            if (error) { showToast('שגיאה בעדכון'); return }
            showToast('התור אושר ✓')
            if (appt?.phone && window.confirm('לשלוח הודעת WhatsApp ללקוח?')) {
              const ph  = appt.phone.replace(/\D/g, '').replace(/^0/, '')
              const msg = encodeURIComponent(`שלום ${appt.client_name} 😊\nתורך אושר!\n📅 ${appt.date} בשעה ${appt.time.slice(0,5)}\n✂ ${appt.service || 'טיפול'}\nמחכים לך!`)
              window.open(`https://wa.me/972${ph}?text=${msg}`, '_blank')
            }
          }}
          onReject={async (id) => {
            if (!window.confirm('לדחות ולמחוק את הבקשה?')) return
            const appt = data.appointments.find(a => a.id === id)
            const { error } = await data.rejectAppointment(id)
            if (error) { showToast('שגיאה במחיקה'); return }
            setDetailId(null)
            showToast('הבקשה נדחתה')
            if (appt?.phone && window.confirm('לשלוח הודעת WhatsApp ללקוח?')) {
              const ph  = appt.phone.replace(/\D/g, '').replace(/^0/, '')
              const msg = encodeURIComponent(`שלום ${appt.client_name},\nמצטערים, לא הצלחנו לאשר את בקשת התור שלך לתאריך ${appt.date}.\nאנא צור/י קשר עם המספרה לקביעת תור טלפוני 📞`)
              window.open(`https://wa.me/972${ph}?text=${msg}`, '_blank')
            }
          }}
          onClientCard={(name) => { setDetailId(null); setClientName(name) }}
        />
      )}

      {clientName && (
        <ClientPanel
          name={clientName}
          appointments={data.appointments}
          providers={data.providers}
          clients={data.clients}
          onClose={() => setClientName(null)}
          onApptClick={(id) => { setClientName(null); setDetailId(id) }}
          onDeleteClient={async (id, deleteAppts) => {
            if (deleteAppts) await data.deleteClientAppointments(id)
            const { error } = await data.deleteClient(id)
            if (error) showToast('שגיאה במחיקה')
            else showToast('הלקוח נמחק')
          }}
          onUpdateClient={async (id, updates) => {
            const { error } = await data.updateClient(id, updates)
            if (error) showToast('שגיאה בעדכון')
            else showToast('הלקוח עודכן ✓')
          }}
        />
      )}

      {settingsOpen && (
        <SettingsPanel
          settings={data.settings}
          providers={data.providers}
          vacations={data.vacations}
          onSave={async (newSettings) => {
            const { error } = await data.saveSettings(newSettings)
            if (error) { showToast('שגיאה בשמירה'); return }
            showToast('ההגדרות נשמרו ✓')
            setSettingsOpen(false)
          }}
          onSaveProvider={data.saveProvider}
          onAddProvider={data.addProvider}
          onDeleteProvider={data.deleteProvider}
          onAddVacation={data.addVacation}
          onDeleteVacation={data.deleteVacation}
          onClose={() => setSettingsOpen(false)}
          onExport={() => {
            const d = data.getExportData()
            const blob = new Blob([JSON.stringify(d, null, 2)], { type: 'application/json' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `salontour-${new Date().toISOString().slice(0,10)}.json`
            document.body.appendChild(a); a.click()
            document.body.removeChild(a); URL.revokeObjectURL(url)
            showToast('הנתונים יוצאו ✓')
          }}
          onImport={async (file) => {
            try {
              const text = await file.text()
              await data.importData(JSON.parse(text))
              showToast('הנתונים יובאו ✓')
            } catch { showToast('שגיאה בייבוא הקובץ') }
          }}
          onDeleteAll={async () => {
            await data.deleteAllData()
            showToast('כל הנתונים נמחקו')
          }}
        />
      )}

      {clientsListOpen && (
        <ClientsListPanel
          clients={data.clients}
          appointments={data.appointments}
          onClose={() => setClientsListOpen(false)}
          onSelectClient={(name) => { setClientsListOpen(false); setClientName(name) }}
        />
      )}

      {reminderOpen && (
        <ReminderPanel
          appointments={data.appointments}
          providers={data.providers}
          settings={data.settings}
          targetDate={tomorrow}
          onClose={() => setReminderOpen(false)}
        />
      )}

      <Toast message={toast} />
    </div>
  )
}
