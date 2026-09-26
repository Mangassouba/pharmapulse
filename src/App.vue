<template>
  <RouterView/>
  <!-- Global toast -->
  <div class="toast-wrap">
    <TransitionGroup name="fade">
      <div v-for="t in toastStore.toasts" :key="t.id" class="toast" :class="t.type==='error'?'err':t.type==='warning'?'warn':''">
        <span>{{ t.type==='success'?'✅':t.type==='error'?'❌':'⚠️' }}</span>
        {{ t.msg }}
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup>
import { useToastStore } from './stores/toast.js'
const toastStore = useToastStore()
</script>
