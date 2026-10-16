<template>
  <span>{{ parts[0] }}<span v-if="parts[1]" :style="accent ? { color: accent } : null">{{ parts[1] }}</span></span>
</template>

<script setup>
import { computed } from 'vue'
import { useSiteStore } from '../stores/site.js'

// Site name with a two-tone accent on the last word ("Yonki |Saha")
const props = defineProps({ accent: { type: String, default: '' } })
const site  = useSiteStore()

const parts = computed(() => {
  const name = site.name
  const i = name.lastIndexOf(' ')
  return i > 0 ? [name.slice(0, i + 1), name.slice(i + 1)] : [name, '']
})
</script>
