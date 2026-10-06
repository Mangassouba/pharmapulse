import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '../services/api.js'

export const useAuthStore = defineStore('auth', () => {
  const user  = ref(JSON.parse(localStorage.getItem('pharma_user') || 'null'))
  const token = ref(localStorage.getItem('pharma_token') || null)
  const loading = ref(false)
  const justRegistered = ref(null) // { trialEnd } right after a successful registration

  const isLoggedIn = computed(() => !!token.value && !!user.value)

  async function login(email, password) {
    loading.value = true
    try {
      const res = await authApi.login({ email, password })
      user.value  = res.data.user
      token.value = res.data.token
      localStorage.setItem('pharma_user',  JSON.stringify(res.data.user))
      localStorage.setItem('pharma_token', res.data.token)
      return { ok: true }
    } catch (e) { return { ok: false, msg: e.message } }
    finally { loading.value = false }
  }

  async function register(data) {
    loading.value = true
    try {
      const res = await authApi.register(data)
      user.value  = res.data.user
      token.value = res.data.token
      localStorage.setItem('pharma_user',  JSON.stringify(res.data.user))
      localStorage.setItem('pharma_token', res.data.token)
      // Opens the payment prompt once (PaymentPrompt.vue); not persisted, so it never comes back
      justRegistered.value = { trialEnd: res.data.subscription?.trial_end_date ?? null }
      return { ok: true }
    } catch (e) { return { ok: false, msg: e.message } }
    finally { loading.value = false }
  }

  function setUser(data) {
    user.value = { ...user.value, ...data }
    localStorage.setItem('pharma_user', JSON.stringify(user.value))
  }

  function logout() {
    user.value = null; token.value = null
    localStorage.removeItem('pharma_user')
    localStorage.removeItem('pharma_token')
  }

  return { user, token, isLoggedIn, loading, justRegistered, login, register, logout, setUser }
})
