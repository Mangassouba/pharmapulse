<template>
  <img v-if="site.logoUrl" :src="site.logoUrl" :alt="site.name" class="site-logo-img"/>
  <component v-else :is="fallback" :size="size" :color="color" />
</template>

<script setup>
import { Pill } from 'lucide-vue-next'
import { useSiteStore } from '../stores/site.js'

// Drop-in replacement for the brand icon: shows the site logo if the SuperAdmin set one
defineProps({
  fallback: { type: [Object, Function], default: () => Pill },
  size:     { type: [String, Number], default: '1em' },
  color:    { type: String, default: undefined },
})
const site = useSiteStore()
</script>

<style scoped>
/* Fills the parent icon box (which keeps its own size and border-radius) */
.site-logo-img { width: 100%; height: 100%; object-fit: contain; background: #fff; border-radius: inherit; padding: 2px; box-sizing: border-box; }
</style>
