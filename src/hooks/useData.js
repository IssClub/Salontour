import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const oneYearAgo = () => {
  const d = new Date()
  d.setFullYear(d.getFullYear() - 1)
  return d.toISOString().slice(0, 10)
}

const DEFAULT_SETTINGS = {
  salon_name: '',
  work_days: [0,1,2,3,4],
  open_mins: 540,
  close_mins: 1200,
  default_duration: 60,
  day_hours: {},
}

export function useData() {
  const [loading, setLoading]           = useState(true)
  const [settings, setSettings]         = useState(DEFAULT_SETTINGS)
  const [providers, setProviders]       = useState([])
  const [appointments, setAppointments] = useState([])
  const [clients, setClients]           = useState([])
  const [vacations, setVacations]       = useState([])

  // ── Initial load ──────────────────────────────────────────
  useEffect(() => {
    loadAll()
  }, [])

  async function loadAll() {
    setLoading(true)
    const [s, p, a, c, v] = await Promise.all([
      supabase.from('settings').select('*').single(),
      supabase.from('providers').select('*').order('sort_order'),
      supabase.from('appointments').select('*').gte('date', oneYearAgo()).order('date').order('time'),
      supabase.from('clients').select('*').order('name'),
      supabase.from('vacations').select('*').order('from_date'),
    ])
    if (s.data)  setSettings({ ...DEFAULT_SETTINGS, ...s.data })
    if (p.data)  setProviders(p.data)
    if (a.data)  setAppointments(a.data)
    if (c.data)  setClients(c.data)
    if (v.data)  setVacations(v.data)
    setLoading(false)
  }

  // ── Realtime subscriptions ────────────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel('db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, () => {
        supabase.from('appointments').select('*').order('date').order('time')
          .then(({ data }) => data && setAppointments(data))
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'providers' }, () => {
        supabase.from('providers').select('*').order('sort_order')
          .then(({ data }) => data && setProviders(data))
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, () => {
        supabase.from('settings').select('*').single()
          .then(({ data }) => data && setSettings({ ...DEFAULT_SETTINGS, ...data }))
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vacations' }, () => {
        supabase.from('vacations').select('*').order('from_date')
          .then(({ data }) => data && setVacations(data))
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clients' }, () => {
        supabase.from('clients').select('*').order('name')
          .then(({ data }) => data && setClients(data))
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  // ── Appointments ──────────────────────────────────────────
  const saveAppointment = useCallback(async (appt, editId = null, clientId = null) => {
    if (editId) {
      const { error } = await supabase.from('appointments').update({
        client_name: appt.name,
        client_id: clientId,
        phone: appt.phone,
        service: appt.service,
        date: appt.date,
        time: appt.time,
        duration: appt.duration,
        provider_id: appt.provider_id,
        note: appt.note,
        updated_at: new Date().toISOString(),
      }).eq('id', editId)
      return { error }
    } else {
      const { error } = await supabase.from('appointments').insert({
        client_name: appt.name,
        client_id: clientId,
        phone: appt.phone,
        service: appt.service,
        date: appt.date,
        time: appt.time,
        duration: appt.duration,
        provider_id: appt.provider_id,
        note: appt.note || '',
      })
      return { error }
    }
  }, [])

  const deleteAppointment = useCallback(async (id) => {
    const { error } = await supabase.from('appointments').delete().eq('id', id)
    return { error }
  }, [])

  // ── Settings ──────────────────────────────────────────────
  const saveSettings = useCallback(async (newSettings) => {
    const { error } = await supabase.from('settings')
      .update({ ...newSettings, updated_at: new Date().toISOString() })
      .eq('id', settings.id)
    if (!error) setSettings(s => ({ ...s, ...newSettings }))
    return { error }
  }, [settings.id])

  // ── Providers ─────────────────────────────────────────────
  const saveProvider = useCallback(async (prov, idx) => {
    const { error } = await supabase.from('providers').update({
      name: prov.name, color: prov.color
    }).eq('id', prov.id)
    return { error }
  }, [])

  const addProvider = useCallback(async (name, color) => {
    const { error } = await supabase.from('providers').insert({
      name, color, sort_order: providers.length
    })
    return { error }
  }, [providers.length])

  const deleteProvider = useCallback(async (id) => {
    const { error } = await supabase.from('providers').delete().eq('id', id)
    return { error }
  }, [])

  // ── Vacations ─────────────────────────────────────────────
  const addVacation = useCallback(async (vac) => {
    const { error } = await supabase.from('vacations').insert({
      provider_id: vac.provider_id,
      from_date: vac.from_date,
      to_date: vac.to_date,
      note: vac.note || '',
    })
    return { error }
  }, [])

  const deleteVacation = useCallback(async (id) => {
    const { error } = await supabase.from('vacations').delete().eq('id', id)
    return { error }
  }, [])

  // ── Clients ───────────────────────────────────────────────
  const upsertClient = useCallback(async (name, phone) => {
    const existing = clients.find(c => c.name.toLowerCase() === name.trim().toLowerCase())
    if (existing) {
      if (phone && !existing.phone) {
        await supabase.from('clients').update({ phone }).eq('id', existing.id)
      }
      return existing.id
    } else {
      const { data: inserted } = await supabase.from('clients')
        .insert({ name: name.trim(), phone: phone || '', note: '' })
        .select('id')
        .single()
      return inserted?.id || null
    }
  }, [clients])

  return {
    loading,
    settings, saveSettings,
    providers, saveProvider, addProvider, deleteProvider,
    appointments, saveAppointment, deleteAppointment,
    clients, upsertClient,
    vacations, addVacation, deleteVacation,
    reload: loadAll,
  }
}
