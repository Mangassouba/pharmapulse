import { defineStore, acceptHMRUpdate } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'
import { locale } from '../i18n/index.js'
import { DEFAULT_CURRENCY } from '../config/countries.js'
import { productUnitsOf, mainUnitOf, unitPrice, maxUnits } from '../utils/units.js'

const pub = axios.create({
  baseURL: (import.meta.env.VITE_API_URL || 'http://localhost:3000/api'),
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})
pub.interceptors.request.use(cfg => { cfg.headers['Accept-Language'] = locale.value; return cfg })

export const useCartStore = defineStore('cart', () => {
  const items         = ref(JSON.parse(localStorage.getItem('pub_cart') || '[]'))
  const userLocation  = ref(null)
  const pharmacies    = ref([])
  const searchResults = ref([])
  const loading       = ref(false)

  // A line is a product in one of its sold units (`unit`: 'BLISTER'…; absent = main unit, as in older carts)
  const lineUnit  = i => productUnitsOf(i.product).find(u => u.unit === i.unit) || mainUnitOf(i.product)
  const linePrice = i => unitPrice(i.product, lineUnit(i))
  const lineTotal = i => i.qty * linePrice(i)
  const lineMax   = i => maxUnits(i.product, lineUnit(i))

  const totalItems  = computed(() => items.value.reduce((s, i) => s + i.qty, 0))
  const totalAmount = computed(() => items.value.reduce((s, i) => s + lineTotal(i), 0))
  // One total per currency: pharmacies from different countries can't be summed ({ MRU: 1500, XOF: 3000 })
  const totalsByCurrency = computed(() => items.value.reduce((acc, i) => {
    const cur = i.product.currency || DEFAULT_CURRENCY
    acc[cur] = (acc[cur] || 0) + lineTotal(i)
    return acc
  }, {}))

  function saveCart() { localStorage.setItem('pub_cart', JSON.stringify(items.value)) }

  function addItem(product, pharmacyId, pharmacyName, qty = 1, unit = mainUnitOf(product).unit) {
    const n   = Math.max(1, parseInt(qty) || 1)
    const max = maxUnits(product, productUnitsOf(product).find(u => u.unit === unit) || mainUnitOf(product))
    if (max < 1) return
    const ex = items.value.find(i => i.product.id === product.id && i.pharmacyId === pharmacyId && lineUnit(i).unit === unit)
    if (ex) { ex.qty = Math.min(ex.qty + n, max) } else {
      items.value.push({ product, pharmacyId, pharmacyName, qty: Math.min(n, max), unit })
    }
    saveCart()
  }

  function removeItem(idx) { items.value.splice(idx, 1); saveCart() }
  function updateQty(idx, qty) {
    if (qty <= 0) { removeItem(idx); return }
    items.value[idx].qty = Math.min(qty, lineMax(items.value[idx])); saveCart()
  }
  function clearCart() { items.value = []; localStorage.removeItem('pub_cart') }

  const byPharmacy = computed(() => {
    const groups = {}
    items.value.forEach((item, idx) => {
      if (!groups[item.pharmacyId]) groups[item.pharmacyId] = { pharmacyId: item.pharmacyId, pharmacyName: item.pharmacyName, items: [] }
      groups[item.pharmacyId].items.push({ ...item, idx })
    })
    return Object.values(groups)
  })

  async function fetchPharmacies(lat, lng) {
    loading.value = true
    try {
      const params = {}
      if (lat && lng) { params.lat = lat; params.lng = lng }
      const res = await pub.get('/public/pharmacies', { params })
      pharmacies.value = res.data.data || res.data
    } catch (e) { console.error(e); pharmacies.value = [] }
    finally { loading.value = false }
  }

  async function searchProducts(q, pharmacyId, country) {
    if (!q || q.length < 2) { searchResults.value = []; return }
    loading.value = true
    try {
      const params = { q }
      if (pharmacyId) params.pharmacyId = pharmacyId
      if (country)    params.country    = country
      if (userLocation.value) { params.lat = userLocation.value.lat; params.lng = userLocation.value.lng }
      const res = await pub.get('/public/products/search', { params })
      searchResults.value = res.data.data || res.data
    } catch (e) { console.error(e); searchResults.value = [] }
    finally { loading.value = false }
  }

  async function fetchPharmacyProducts(pharmacyId, params = {}) {
    loading.value = true
    try { const res = await pub.get(`/public/pharmacies/${pharmacyId}/products`, { params }); return res.data }
    catch (e) { return { data: [], meta: {} } }
    finally { loading.value = false }
  }

  async function fetchPharmacyDetail(pharmacyId) {
    const res = await pub.get(`/public/pharmacies/${pharmacyId}`)
    return res.data.data || res.data
  }

  async function placeOrder(orderData) {
    const res = await pub.post('/public/orders', orderData)
    return res.data
  }

  async function trackOrder(code) {
    const res = await pub.get(`/public/orders/${code}`)
    return res.data
  }

  return {
    items, userLocation, pharmacies, searchResults, loading,
    totalItems, totalAmount, totalsByCurrency, byPharmacy,
    addItem, removeItem, updateQty, clearCart, lineUnit, linePrice, lineTotal, lineMax,
    fetchPharmacies, searchProducts, fetchPharmacyProducts, fetchPharmacyDetail,
    placeOrder, trackOrder,
  }
})

// Recharge le store à chaud en dev (sinon l'onglet garde l'ancienne version jusqu'au F5)
if (import.meta.hot) import.meta.hot.accept(acceptHMRUpdate(useCartStore, import.meta.hot))
