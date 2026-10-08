import { defineStore } from 'pinia'
import { ref } from 'vue'
import { superApi } from '../services/api.js'
import { t, fmtDate } from '../i18n/index.js'

export const NOTIF_COLORS = { INFO: '#7c3aed', SUCCESS: '#16a34a', WARNING: '#d97706', ERROR: '#dc2626' }

export function timeAgo(d) {
  const s = Math.round((Date.now() - new Date(d)) / 1000)
  if (s < 60) return t('time.justNow')
  if (s < 3600) return t('time.minutesAgo', { n: Math.floor(s / 60) })
  if (s < 86400) return t('time.hoursAgo', { n: Math.floor(s / 3600) })
  if (s < 7 * 86400) return t('time.daysAgo', { n: Math.floor(s / 86400) })
  return fmtDate(d)
}

// SuperAdmin notifications, shared by the header bell and the dashboard card
export const useSuperNotificationsStore = defineStore('superNotifications', () => {
  const items  = ref([])
  const unread = ref(0)

  async function load() {
    try {
      const res = await superApi.notifications({ limit: 20 })
      items.value  = res.data.items
      unread.value = res.data.unread
    } catch { /* keep the last list; retried on next load */ }
  }

  function markRead(n) {
    if (n.is_read) return
    n.is_read = true
    unread.value = Math.max(0, unread.value - 1)
    superApi.markNotifRead(n.id).catch(() => {})
  }

  async function markAllRead() {
    items.value.forEach(n => { n.is_read = true })
    unread.value = 0
    await superApi.markAllNotifRead().catch(() => load())
  }

  return { items, unread, load, markRead, markAllRead }
})
