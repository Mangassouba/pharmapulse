import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useToastStore = defineStore('toast', () => {
  const toasts = ref([])
  function add(msg, type = 'success') {
    const id = Date.now()
    toasts.value.push({ id, msg, type })
    setTimeout(() => { toasts.value = toasts.value.filter(t => t.id !== id) }, 3500)
  }
  return { toasts, success: m => add(m,'success'), error: m => add(m,'error'), warning: m => add(m,'warning') }
})
