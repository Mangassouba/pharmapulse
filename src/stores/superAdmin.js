import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { superApi } from '../services/api.js'

export const useSuperAdminStore = defineStore('superAdmin', () => {
  const admin   = ref(JSON.parse(localStorage.getItem('super_admin') || 'null'))
  const token   = ref(localStorage.getItem('super_token') || null)
  const stats   = ref(null)
  const loading = ref(false)

  const isLoggedIn = computed(() => !!token.value && !!admin.value)

  async function login(email, password) {
    loading.value = true
    try {
      const res = await superApi.login({ email, password })
      admin.value = res.data.admin
      token.value = res.data.token
      localStorage.setItem('super_admin', JSON.stringify(res.data.admin))
      localStorage.setItem('super_token', res.data.token)
      localStorage.setItem('pharma_token', res.data.token)
      return { ok: true }
    } catch (e) { return { ok: false, msg: e.message } }
    finally { loading.value = false }
  }

  function logout() {
    admin.value = null; token.value = null
    localStorage.removeItem('super_admin')
    localStorage.removeItem('super_token')
    localStorage.removeItem('pharma_token')
  }

  async function fetchStats() {
    loading.value = true
    try { const r = await superApi.stats(); stats.value = r.data }
    finally { loading.value = false }
  }

  return { admin, token, isLoggedIn, stats, loading, login, logout, fetchStats }
})
