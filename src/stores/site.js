import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import api, { siteApi } from '../services/api.js'
import { t, locale } from '../i18n/index.js'

export const DEFAULT_SITE_NAME = 'PharmaPulse'

// Platform-wide settings managed by the SuperAdmin: site name and logo
export const useSiteStore = defineStore('site', () => {
  const name          = ref(DEFAULT_SITE_NAME)
  const logoUpdatedAt = ref(null)
  const pageTitle     = ref('') // i18n key set by the router, combined with the name in the browser tab
  let loaded = false

  const logoUrl = computed(() => logoUpdatedAt.value
    ? `${api.defaults.baseURL}/public/site/logo?v=${new Date(logoUpdatedAt.value).getTime()}`
    : null)

  async function fetch() {
    if (loaded) return
    loaded = true
    try {
      const res = await siteApi.get()
      name.value          = res.data.name || DEFAULT_SITE_NAME
      logoUpdatedAt.value = res.data.logo_updated_at
    } catch { loaded = false } // keep the defaults; retry on next call
  }

  function setName(v)        { name.value = v || DEFAULT_SITE_NAME }
  function setLogoVersion(v) { logoUpdatedAt.value = v }

  watch([name, pageTitle, locale], () => {
    document.title = pageTitle.value ? `${t(pageTitle.value)} — ${name.value}` : name.value
  }, { immediate: true })

  // Use the site logo as favicon when there is one
  watch(logoUrl, url => {
    let link = document.querySelector('link[rel="icon"]')
    if (!url) { link?.remove(); return }
    if (!link) { link = document.createElement('link'); link.rel = 'icon'; document.head.appendChild(link) }
    link.href = url
  })

  return { name, logoUpdatedAt, logoUrl, pageTitle, fetch, setName, setLogoVersion }
})
