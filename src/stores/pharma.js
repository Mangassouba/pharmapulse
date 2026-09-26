import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  dashboardApi, productApi, categoryApi, saleApi,
  receptionApi, inventoryApi, movementApi, notifApi,
} from '../services/api.js'

export const usePharmaStore = defineStore('pharma', () => {
  // ── State ──────────────────────────────────────────────────────
  const dashboard   = ref(null)
  const products    = ref([])
  const prodMeta    = ref({ total: 0, page: 1, totalPages: 1 })
  const categories  = ref([])
  const sales       = ref([])
  const salesMeta   = ref({ total: 0, totalPages: 1 })
  const receptions  = ref([])
  const recepMeta   = ref({ total: 0, totalPages: 1 })
  const movements   = ref([])
  const movMeta     = ref({ total: 0, totalPages: 1 })
  const inventories = ref([])
  const invMeta     = ref({ total: 0, totalPages: 1 })
  const notifications = ref([])   // Exposed as "notifications"
  const unreadCount   = ref(0)    // Exposed as "unreadCount"
  const _busy = ref({})

  // ── Computed ───────────────────────────────────────────────────
  const alertCount = computed(() => dashboard.value?.alerts?.total ?? 0)
  const alerts     = computed(() => [
    ...(dashboard.value?.alerts?.outOfStock || []),
    ...(dashboard.value?.alerts?.lowStock   || []),
  ])

  // ── Loading helpers ────────────────────────────────────────────
  function isBusy(k)  { return !!_busy.value[k] }
  function setB(k, v) { _busy.value = { ..._busy.value, [k]: v } }

  // ── Helpers ───────────────────────────────────────────────────
  const fmt      = d => new Date(d).toLocaleDateString('fr-FR')
  const fmtPrice = v => Number(v || 0).toLocaleString('fr-FR') + ' F'

  // ── Dashboard ─────────────────────────────────────────────────
  async function fetchDashboard() {
    setB('dash', true)
    try { const r = await dashboardApi.get(); dashboard.value = r.data }
    catch (e) { console.error('dashboard error', e) }
    finally   { setB('dash', false) }
  }

  // ── Products ──────────────────────────────────────────────────
  async function fetchProducts(params = {}) {
    setB('prods', true)
    try { const r = await productApi.list(params); products.value = r.data; prodMeta.value = r.meta }
    finally { setB('prods', false) }
  }
  async function createProduct(d)    { const r = await productApi.create(d); products.value.unshift(r.data); return r }
  async function updateProduct(id,d) {
    const r = await productApi.update(id, d)
    const i = products.value.findIndex(p => p.id === id)
    if (i !== -1) products.value[i] = r.data
    return r
  }
  async function deleteProduct(id)   { await productApi.delete(id); products.value = products.value.filter(p => p.id !== id) }

  // ── Categories ────────────────────────────────────────────────
  async function fetchCategories()     { const r = await categoryApi.list(); categories.value = r.data }
  async function createCategory(d)     { const r = await categoryApi.create(d); categories.value.push(r.data); return r }
  async function updateCategory(id, d) {
    const r = await categoryApi.update(id, d)
    const i = categories.value.findIndex(c => c.id === id)
    if (i !== -1) categories.value[i] = r.data
    return r
  }
  async function deleteCategory(id) { await categoryApi.delete(id); categories.value = categories.value.filter(c => c.id !== id) }

  // ── Sales ─────────────────────────────────────────────────────
  async function fetchSales(p = {}) {
    setB('sales', true)
    try { const r = await saleApi.list(p); sales.value = r.data; salesMeta.value = r.meta }
    finally { setB('sales', false) }
  }
  async function createSale(d) {
    const r = await saleApi.create(d)
    sales.value.unshift(r.data)
    await Promise.all([fetchDashboard(), fetchProducts()])
    return r
  }

  // ── Receptions ────────────────────────────────────────────────
  async function fetchReceptions(p = {}) {
    setB('recep', true)
    try { const r = await receptionApi.list(p); receptions.value = r.data; recepMeta.value = r.meta }
    finally { setB('recep', false) }
  }
  async function createReception(d) { const r = await receptionApi.create(d); receptions.value.unshift(r.data); return r }
  async function completeReception(id, status) {
    const r = await receptionApi.complete(id, { status })
    const i = receptions.value.findIndex(x => x.id === id)
    if (i !== -1) receptions.value[i].status = status
    await Promise.all([fetchDashboard(), fetchProducts()])
    return r
  }

  // ── Movements ─────────────────────────────────────────────────
  async function fetchMovements(p = {}) {
    setB('mov', true)
    try { const r = await movementApi.list(p); movements.value = r.data; movMeta.value = r.meta }
    finally { setB('mov', false) }
  }

  // ── Inventories ───────────────────────────────────────────────
  async function fetchInventories(p = {}) {
    setB('inv', true)
    try { const r = await inventoryApi.list(p); inventories.value = r.data; invMeta.value = r.meta }
    finally { setB('inv', false) }
  }
  async function applyInventory(items) {
    const r = await inventoryApi.apply({ items })
    await Promise.all([fetchDashboard(), fetchProducts()])
    return r
  }

  // ── Notifications ─────────────────────────────────────────────
  async function fetchNotifications() {
    try {
      const [a, b] = await Promise.all([notifApi.list(), notifApi.unreadCount()])
      notifications.value = a.data || []
      unreadCount.value   = b.data?.count ?? 0
    } catch (e) { console.error('notif error', e) }
  }
  async function markAllRead() {
    await notifApi.markAllRead()
    notifications.value.forEach(n => n.is_read = true)
    unreadCount.value = 0
  }

  return {
    // State
    dashboard, products, prodMeta, categories,
    sales, salesMeta, receptions, recepMeta,
    movements, movMeta, inventories, invMeta,
    notifications, unreadCount, alertCount, alerts,

    // Helpers
    isBusy, fmt, fmtPrice,

    // Actions
    fetchDashboard,
    fetchProducts, createProduct, updateProduct, deleteProduct,
    fetchCategories, createCategory, updateCategory, deleteCategory,
    fetchSales, createSale,
    fetchReceptions, createReception, completeReception,
    fetchMovements,
    fetchInventories, applyInventory,
    fetchNotifications, markAllRead,
  }
})
