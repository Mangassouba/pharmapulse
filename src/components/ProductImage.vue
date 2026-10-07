<template>
  <div class="prod-img" :style="{ width: px, height: px, borderRadius: radius }">
    <img v-if="url && !failed" :src="url" :alt="product?.name" loading="lazy" @error="failed = true"/>
    <Pill v-else :size="iconSize" color="#16a34a"/>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { Pill } from 'lucide-vue-next'
import { productImageUrl } from '../utils/logo.js'

// Product thumbnail: the uploaded image, or a pill icon when there is none
const props = defineProps({
  product: { type: Object, default: null },
  size:    { type: Number, default: 40 },
  // Overrides the computed image URL (e.g. a local preview before upload)
  src:     { type: String, default: null },
})

const failed   = ref(false)
const url      = computed(() => props.src || productImageUrl(props.product))
const px       = computed(() => props.size + 'px')
const radius   = computed(() => Math.round(props.size / 4) + 'px')
const iconSize = computed(() => Math.round(props.size * 0.45))
watch(url, () => { failed.value = false })
</script>

<style scoped>
.prod-img { flex-shrink: 0; display: flex; align-items: center; justify-content: center; overflow: hidden; background: #f0fdf4; border: 1px solid #e5e7eb; }
.prod-img img { width: 100%; height: 100%; object-fit: contain; background: #fff; }
</style>
