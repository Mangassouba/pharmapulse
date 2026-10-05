<template>
  <span>{{ parts[0] }}<span v-if="parts[1]" :style="accent ? { color: accent } : null">{{ parts[1] }}</span></span>
</template>

<script setup>
import { computed } from 'vue'
import { useSiteStore, DEFAULT_SITE_NAME } from '../stores/site.js'

// Site name with a two-tone accent: "Pharma|Pulse" by default, otherwise the last word
const props = defineProps({ accent: { type: String, default: '' } })
const site  = useSiteStore()

const parts = computed(() => {
  const name = site.name
  if (name === DEFAULT_SITE_NAME) return ['Pharma', 'Pulse']
  const i = name.lastIndexOf(' ')
  return i > 0 ? [name.slice(0, i + 1), name.slice(i + 1)] : [name, '']
})
</script>
