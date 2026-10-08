<template>
  <iframe
    :src="mapEmbedUrl(lat, lng)"
    :style="{ height: height + 'px' }"
    class="ph-map"
    :title="$t('pub.pharmacyMap')"
    loading="lazy"
    referrerpolicy="no-referrer"
  ></iframe>
</template>

<script setup>
import { mapEmbedUrl } from '../utils/geo.js'

defineProps({
  lat:    { type: Number, required: true },
  lng:    { type: Number, required: true },
  height: { type: Number, default: 220 },
})
</script>

<style scoped>
.ph-map { width: 100%; border: 1px solid #e5e7eb; border-radius: 12px; display: block; }
</style>
