import { t } from '../i18n/index.js'

// Straight-line distance in km between two GPS points (same formula as the API)
export function distanceKm(lat1, lng1, lat2, lng2) {
  const R    = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a    = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180)
    * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function formatDistance(km) {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`
}

export function hasPosition(ph) {
  return ph?.latitude != null && ph?.longitude != null
}

// Google Maps directions (opens the app on phones): GPS point if known, else the written address
export function directionsUrl(ph) {
  const destination = hasPosition(ph)
    ? `${ph.latitude},${ph.longitude}`
    : [ph?.name, ph?.address, ph?.city, ph?.country].filter(Boolean).join(', ')
  if (!destination) return null
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`
}

// OpenStreetMap embed centred on the point, with a marker (no API key needed)
export function mapEmbedUrl(lat, lng, delta = 0.006) {
  const bbox = [lng - delta, lat - delta, lng + delta, lat + delta].join(',')
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`
}

// Browser geolocation as a promise, with translated error messages
export function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error(t('geo.unavailable')))
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy }),
      err => reject(new Error(err.code === 1
        ? t('geo.denied')
        : t('geo.failed'))),
      { enableHighAccuracy: true, timeout: 15000 },
    )
  })
}
