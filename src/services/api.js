import axios from 'axios'
import { locale, t } from '../i18n/index.js'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('pharma_token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  cfg.headers['Accept-Language'] = locale.value
  return cfg
})

api.interceptors.response.use(
  r => r.data,
  err => {
    // Session expired → back to login. Not for a failed login itself, so its message stays visible.
    if (err.response?.status === 401 && err.config?.headers?.Authorization && !err.config.url?.startsWith('/auth/login')) {
      localStorage.removeItem('pharma_token')
      localStorage.removeItem('pharma_user')
      window.location.href = '/login'
    }
    const data = err.response?.data
    return Promise.reject({ status: err.response?.status, message: data?.message || httpErrorText(err), errors: data?.errors })
  }
)

// Plain-language text when the API gave no message (no network, timeout, proxy page…)
function httpErrorText(err) {
  if (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT') return t('httpErrors.timeout')
  if (!err.response) return t('httpErrors.offline')
  if (err.response.status === 403) return t('httpErrors.forbidden')
  if (err.response.status === 404) return t('httpErrors.notFound')
  return t('httpErrors.server')
}

export default api

export const authApi = {
  register:       d => api.post('/auth/register', d),
  login:          d => api.post('/auth/login', d),
  forgotPassword: d => api.post('/auth/forgot-password', d),
  resetPassword:  d => api.post('/auth/reset-password', d),
  me:             () => api.get('/auth/me'),
  updateMe:       d => api.put('/auth/me', d),
  logout:         () => api.post('/auth/logout'),
  changePassword: d => api.put('/auth/password', d),
  updateDuty:     d => api.put('/auth/pharmacy/duty', d),
  updateLocation: d => api.put('/auth/pharmacy/location', d),
  updateLogo:     d => api.put('/auth/pharmacy/logo', d),
  deleteLogo:     () => api.delete('/auth/pharmacy/logo'),
}
export const siteApi       = { get: () => api.get('/public/site') }
export const dashboardApi  = { get: () => api.get('/dashboard') }
export const productApi    = {
  list:   p => api.get('/products', { params: p }),
  stats:  () => api.get('/products/stats'),
  get:    id => api.get(`/products/${id}`),
  create: d  => api.post('/products', d),
  update: (id,d) => api.put(`/products/${id}`, d),
  delete: id => api.delete(`/products/${id}`),
  updateImage: (id,d) => api.put(`/products/${id}/image`, d),
  deleteImage: id => api.delete(`/products/${id}/image`),
}
export const categoryApi   = {
  list:   p => api.get('/categories', { params: p }),
  create: d => api.post('/categories', d),
  update: (id,d) => api.put(`/categories/${id}`, d),
  delete: id => api.delete(`/categories/${id}`),
}
export const saleApi       = {
  list:   p => api.get('/sales', { params: p }),
  stats:  () => api.get('/sales/stats'),
  get:    id => api.get(`/sales/${id}`),
  create: d  => api.post('/sales', d),
}
export const receptionApi  = {
  list:     p => api.get('/receptions', { params: p }),
  get:      id => api.get(`/receptions/${id}`),
  create:   d  => api.post('/receptions', d),
  complete: (id,d) => api.patch(`/receptions/${id}/complete`, d),
}
export const inventoryApi  = {
  list:  p => api.get('/inventories', { params: p }),
  apply: d => api.post('/inventories', d),
}
export const movementApi   = {
  list:  p => api.get('/movements', { params: p }),
  stats: () => api.get('/movements/stats'),
}
export const batchApi      = {
  list:     p => api.get('/batches', { params: p }),
  expiring: () => api.get('/batches/expiring'),
  create:   d  => api.post('/batches', d),
  update:   (id,d) => api.put(`/batches/${id}`, d),
}
export const orderApi      = {
  list:         p => api.get('/orders', { params: p }),
  get:          id => api.get(`/orders/${id}`),
  create:       d  => api.post('/orders', d),
  updateStatus: (id,d) => api.patch(`/orders/${id}/status`, d),
  delete:       id => api.delete(`/orders/${id}`),
}
export const userApi       = {
  list:   p => api.get('/users', { params: p }),
  create: d => api.post('/users', d),
  update: (id,d) => api.put(`/users/${id}`, d),
  delete: id => api.delete(`/users/${id}`),
}
export const notifApi      = {
  list:        p => api.get('/notifications', { params: p }),
  unreadCount: () => api.get('/notifications/unread-count'),
  markAllRead: () => api.patch('/notifications/read-all'),
  markRead:    id => api.patch(`/notifications/${id}/read`),
}
export const superApi      = {
  login:          d => api.post('/super/auth/login', d),
  notifications:  p  => api.get('/super/notifications', { params: p }),
  markNotifRead:  id => api.patch(`/super/notifications/${id}/read`),
  markAllNotifRead: () => api.patch('/super/notifications/read-all'),
  updateSite:     d => api.put('/super/site', d),
  updateSiteLogo: d => api.put('/super/site/logo', d),
  deleteSiteLogo: () => api.delete('/super/site/logo'),
  forgotPassword: d => api.post('/super/auth/forgot-password', d),
  resetPassword:  d => api.post('/super/auth/reset-password', d),
  stats:          () => api.get('/super/stats'),
  listPharmacies: p  => api.get('/super/pharmacies', { params: p }),
  getPharmacy:    id => api.get(`/super/pharmacies/${id}`),
  createPharmacy: d  => api.post('/super/pharmacies', d),
  updatePharmacy: (id,d) => api.put(`/super/pharmacies/${id}`, d),
  setStatus:      (id,d) => api.patch(`/super/pharmacies/${id}/status`, d),
  deletePharmacy: (id, confirmName) => api.delete(`/super/pharmacies/${id}`, { data: { confirmName } }),
  restorePharmacy: id => api.post(`/super/pharmacies/${id}/restore`),
  renew:          (id,d) => api.post(`/super/pharmacies/${id}/renew`, d),
  getPayments:    id => api.get(`/super/pharmacies/${id}/payments`),
  listUsers:      p  => api.get('/super/users', { params: p }),
  getLogs:        p  => api.get('/super/logs', { params: p }),
}

// Expose raw axios instance for custom calls


// ── Order verification (pharmacie side) ──────────────────────────
export const verifyApi = {
  verifyPickupCode:  (code)   => api.get(`/orders/verify/${code}`),
  validatePickup:    (id, d)  => api.patch(`/orders/${id}/validate-pickup`, d),
}
