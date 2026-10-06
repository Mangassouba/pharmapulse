<template>
  <div :style="box">
    <strong>Démo :</strong> {{ account.email }} / {{ account.password }}
  </div>
</template>

<script setup>
import { computed } from 'vue'

// Seed accounts (npm run db:seed in the API). This file is only imported when
// import.meta.env.DEV is true, so it never ends up in the production bundle.
const ACCOUNTS = {
  pharmacy: {
    email: 'admin@pharmaciechifa.mr', password: 'Admin1234!',
    style: 'margin-top:12px;padding:10px 14px;background:#f0fdf4;border-radius:8px;font-size:.78rem;color:#166534;border:1px solid #bbf7d0;',
  },
  super: {
    email: 'superAdmin@gmail.com', password: 'SuperAdmin2024!',
    style: 'margin-top:12px;padding:10px;background:#f5f3ff;border-radius:8px;font-size:.77rem;color:#7c3aed;text-align:center;',
  },
}

const props   = defineProps({ space: { type: String, default: 'pharmacy' } })
const account = computed(() => ACCOUNTS[props.space])
const box     = computed(() => account.value.style)
</script>
