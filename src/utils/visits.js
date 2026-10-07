import axios from 'axios'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

// Anonymous id kept in this browser, so a visitor is counted once per day however many pages they open
function visitorId() {
  let id = localStorage.getItem('pp_visitor')
  if (!id) {
    id = crypto.randomUUID?.() || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`
    localStorage.setItem('pp_visitor', id)
  }
  return id
}

// Records today's visit to the public site (at most one request per browser per day)
export function trackVisit() {
  try {
    const today = new Date().toISOString().slice(0, 10)
    if (localStorage.getItem('pp_visit_day') === today) return
    axios.post(`${API}/public/visit`, { visitorId: visitorId() }, { timeout: 10000 })
      .then(() => localStorage.setItem('pp_visit_day', today))
      .catch(() => { /* stats only: never bother the visitor */ })
  } catch { /* storage blocked (private mode…): skip tracking */ }
}
