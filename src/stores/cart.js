import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'

const pub = axios.create({
  baseURL: (import.meta.env.VITE_API_URL || 'http://localhost:3000/api'),
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

export const useCartStore = defineStore('cart', () => {
  const items         = ref(JSON.parse(localStorage.getItem('pub_cart') || '[]'))
  const userLocation  = ref(null)
  const pharmacies    = ref([])
  const searchResults = ref([])
  const loading       = ref(false)

  const totalItems  = computed(() => items.value.reduce((s, i) => s + i.qty, 0))
  const totalAmount = computed(() => items.value.reduce((s, i) => s + i.qty * Number(i.product.sale_price), 0))

  function saveCart() { localStorage.setItem('pub_cart', JSON.stringify(items.value)) }

  function addItem(product, pharmacyId, pharmacyName) {
    const ex = items.value.find(i => i.product.id === product.id && i.pharmacyId === pharmacyId)
    if (ex) { if (ex.qty < product.stock) ex.qty++ } else {
      items.value.push({ product, pharmacyId, pharmacyName, qty: 1 })
    }
    saveCart()
  }

  function removeItem(idx) { items.value.splice(idx, 1); saveCart() }
  function updateQty(idx, qty) { if (qty <= 0) { removeItem(idx); return }; items.value[idx].qty = qty; saveCart() }
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

  async function searchProducts(q, pharmacyId) {
    if (!q || q.length < 2) { searchResults.value = []; return }
    loading.value = true
    try {
      const params = { q }
      if (pharmacyId) params.pharmacyId = pharmacyId
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
    totalItems, totalAmount, byPharmacy,
    addItem, removeItem, updateQty, clearCart,
    fetchPharmacies, searchProducts, fetchPharmacyProducts, fetchPharmacyDetail,
    placeOrder, trackOrder,
  }
})
