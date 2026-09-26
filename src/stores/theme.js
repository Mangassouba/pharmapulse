import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  const mode = ref(localStorage.getItem('pharma_theme') || 'light')

  function toggle() {
    mode.value = mode.value === 'dark' ? 'light' : 'dark'
  }

  watch(mode, v => localStorage.setItem('pharma_theme', v), { immediate: true })

  return { mode, toggle }
})
