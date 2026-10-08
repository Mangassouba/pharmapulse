<template>
  <Teleport to="body">
    <div v-if="open" class="modal-bg" @click.self="close">
      <div class="modal" style="max-width:440px;" role="dialog" aria-labelledby="pay-title">
        <div class="modal-hd">
          <h3 id="pay-title"><Wallet size="1em" /> {{ $t('payment.title') }}</h3>
          <button class="btn btn-icon" @click="close" :aria-label="$t('common.close')"><X size="1em" /></button>
        </div>
        <div class="modal-bd" style="text-align:center;">
          <p style="margin:0 0 14px;font-size:.92rem;color:var(--text);">
            {{ $t('payment.intro') }}
          </p>
          <div style="display:flex;align-items:center;justify-content:center;gap:10px;margin-bottom:10px;">
            <span style="font-family:'JetBrains Mono',monospace;font-size:1.8rem;font-weight:800;letter-spacing:.06em;color:#16a34a;direction:ltr;">{{ PAYMENT_NUMBER }}</span>
            <button class="btn btn-sm btn-outline" @click="copy" :title="copied ? $t('payment.copied') : $t('payment.copyNumber')">
              <Check v-if="copied" size="1em" /><Copy v-else size="1em" /> {{ copied ? $t('payment.copied') : $t('payment.copy') }}
            </button>
          </div>
          <div style="display:flex;justify-content:center;gap:8px;margin-bottom:16px;">
            <span v-for="m in PAYMENT_METHODS" :key="m" style="padding:4px 12px;border-radius:99px;background:#f0fdf4;border:1px solid #bbf7d0;color:#166534;font-size:.8rem;font-weight:700;">{{ m }}</span>
          </div>
          <div style="padding:10px 14px;background:#f9fafb;border:1px solid var(--border);border-radius:8px;font-size:.85rem;color:var(--text);">
            {{ $t('payment.amount') }} <strong>{{ $t('payment.perMonth', { price }) }}</strong>
          </div>
          <p v-if="trialEndLabel" style="margin:12px 0 0;font-size:.8rem;color:#6b7280;">
            {{ $t('payment.trialUntil') }} <strong>{{ trialEndLabel }}</strong>.
            {{ $t('payment.activation') }}
          </p>
        </div>
        <div class="modal-ft">
          <button class="btn btn-primary" @click="close">{{ $t('payment.understood') }}</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { Wallet, X, Copy, Check } from 'lucide-vue-next'
import { ref, computed } from 'vue'
import { useAuthStore } from '../stores/auth.js'
import { fmtNum, fmtDate } from '../i18n/index.js'
import { PAYMENT_NUMBER, PAYMENT_METHODS, MONTHLY_PRICE, CURRENCY } from '../config/payment.js'

// Shown once, right after a successful registration (auth.justRegistered)
const auth   = useAuthStore()
const open   = computed(() => !!auth.justRegistered)
const copied = ref(false)

const price = computed(() => `${fmtNum(MONTHLY_PRICE)} ${CURRENCY}`)
const trialEndLabel = computed(() => {
  const d = auth.justRegistered?.trialEnd
  return d ? fmtDate(d, { day: 'numeric', month: 'long', year: 'numeric' }) : ''
})

async function copy() {
  try {
    await navigator.clipboard.writeText(PAYMENT_NUMBER)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch { /* clipboard unavailable (http, old browser): the number stays readable */ }
}

function close() { auth.justRegistered = null }
</script>
