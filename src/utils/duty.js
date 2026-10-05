// Jours de garde : même numérotation que Date.getDay() (0 = dimanche … 6 = samedi)
export const WEEK_DAYS = [
  { value: 1, label: 'Lundi',    short: 'Lun' },
  { value: 2, label: 'Mardi',    short: 'Mar' },
  { value: 3, label: 'Mercredi', short: 'Mer' },
  { value: 4, label: 'Jeudi',    short: 'Jeu' },
  { value: 5, label: 'Vendredi', short: 'Ven' },
  { value: 6, label: 'Samedi',   short: 'Sam' },
  { value: 0, label: 'Dimanche', short: 'Dim' },
]

const toMinutes = hhmm => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m }

export const formatDutyDays = (days, key = 'label') => WEEK_DAYS
  .filter(d => (days || []).includes(d.value))
  .map(d => d[key])
  .join(', ')

/** "20:00 – 08:00 (lendemain)" ou "24h/24" quand aucun horaire n'est défini */
export function formatDutyHours(ph) {
  if (!ph?.duty_start || !ph?.duty_end) return '24h/24'
  const overnight = toMinutes(ph.duty_end) < toMinutes(ph.duty_start)
  return `${ph.duty_start} – ${ph.duty_end}${overnight ? ' (lendemain)' : ''}`
}

/**
 * 'now'   → la pharmacie est de garde en ce moment
 * 'later' → elle sera de garde plus tard aujourd'hui
 * null    → pas de garde aujourd'hui (ou garde du jour déjà terminée)
 * Une garde de nuit (fin < début) commencée la veille compte jusqu'à l'heure de fin.
 */
export function dutyStatus(ph, now = new Date()) {
  const days = ph?.duty_days || []
  if (!days.length) return null
  const today = now.getDay()
  const yesterday = (today + 6) % 7
  if (!ph.duty_start || !ph.duty_end) return days.includes(today) ? 'now' : null

  const mins  = now.getHours() * 60 + now.getMinutes()
  const start = toMinutes(ph.duty_start)
  const end   = toMinutes(ph.duty_end)

  if (start < end) {
    if (!days.includes(today)) return null
    if (mins < start) return 'later'
    return mins < end ? 'now' : null
  }
  // Garde de nuit
  if (days.includes(yesterday) && mins < end) return 'now'
  if (days.includes(today)) return mins >= start ? 'now' : 'later'
  return null
}
