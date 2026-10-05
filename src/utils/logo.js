import api from '../services/api.js'

// Public URL of a pharmacy logo, versioned with logo_updated_at so browsers can cache it forever
export function pharmacyLogoUrl(ph) {
  if (!ph?.id || !ph.logo_updated_at) return null
  return `${api.defaults.baseURL}/public/pharmacies/${ph.id}/logo?v=${new Date(ph.logo_updated_at).getTime()}`
}

// Downscale an image file to fit in `max` px and return it as a data URL (keeps the upload small)
export function resizeImage(file, max = 512) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const scale  = Math.min(1, max / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width  = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      // PNG keeps transparency; fall back to JPEG if the PNG is still too heavy
      let data = canvas.toDataURL('image/png')
      if (data.length > 600_000) data = canvas.toDataURL('image/jpeg', 0.85)
      resolve(data)
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image illisible.')) }
    img.src = url
  })
}
