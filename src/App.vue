<template>
  <RouterView/>
  <!-- Global toast -->
  <div class="toast-wrap">
    <TransitionGroup name="fade">
      <div v-for="t in toastStore.toasts" :key="t.id" class="toast" :class="t.type==='error'?'err':t.type==='warning'?'warn':''">
        <component :is="t.type==='success' ? CircleCheck : t.type==='error' ? CircleX : TriangleAlert" size="1em" />
        {{ t.msg }}
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup>
import { CircleCheck, CircleX, TriangleAlert } from 'lucide-vue-next'
import { useToastStore } from './stores/toast.js'
const toastStore = useToastStore()
</script>
