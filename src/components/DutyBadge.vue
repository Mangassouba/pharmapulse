<template>
  <span v-if="status" class="duty-badge" :class="{ 'duty-badge--now': status === 'now' }">
    <Moon size="1em" /> {{ status === 'now' ? 'DE GARDE MAINTENANT' : `DE GARDE DÈS ${pharmacy.duty_start}` }}
  </span>
</template>

<script setup>
import { Moon } from 'lucide-vue-next'
import { computed } from 'vue'
import { dutyStatus } from '../utils/duty.js'

const props  = defineProps({ pharmacy: { type: Object, required: true } })
const status = computed(() => dutyStatus(props.pharmacy))
</script>

<style scoped>
.duty-badge {
  font-size: .65rem; font-weight: 700; white-space: nowrap;
  padding: 2px 8px; border-radius: 99px;
  background: #eef2ff; color: #4338ca; border: 1px solid #c7d2fe;
}
.duty-badge--now { background: #4338ca; color: white; border-color: #4338ca; }
</style>
