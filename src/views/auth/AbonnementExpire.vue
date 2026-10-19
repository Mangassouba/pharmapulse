<template>
  <div class="auth-bg">
    <div class="auth-card" style="text-align:center;">
      <LangSwitcher class="auth-lang" />
      <RouterLink to="/" class="auth-home"><ArrowLeft size="1em" /> {{ $t('common.home') }}</RouterLink>
      <div style="width:52px;height:52px;border-radius:14px;background:#fef2f2;border:1px solid #fecaca;color:#dc2626;display:flex;align-items:center;justify-content:center;font-size:1.6rem;margin:0 auto 12px;"><CalendarX size="1em" /></div>
      <h1 style="font-size:1.35rem;font-weight:800;margin:0 0 6px;">{{ $t('payment.expiredTitle') }}</h1>
      <p v-if="auth.user?.pharmacy?.name" style="color:#6b7280;font-size:.85rem;margin:0 0 16px;">{{ auth.user.pharmacy.name }}</p>

      <p style="margin:0 0 14px;font-size:.92rem;">{{ $t('payment.expiredIntro') }}</p>
      <div style="display:flex;align-items:center;justify-content:center;gap:10px;margin-bottom:10px;">
        <span style="font-family:'JetBrains Mono',monospace;font-size:1.8rem;font-weight:800;letter-spacing:.06em;color:#16a34a;direction:ltr;">{{ PAYMENT_NUMBER }}</span>
        <button class="btn btn-sm btn-outline" @click="copy" :title="copied ? $t('payment.copied') : $t('payment.copyNumber')">
          <Check v-if="copied" size="1em" /><Copy v-else size="1em" /> {{ copied ? $t('payment.copied') : $t('payment.copy') }}
        </button>
      </div>
      <div style="display:flex;justify-content:center;gap:8px;margin-bottom:16px;">
        <span v-for="m in PAYMENT_METHODS" :key="m" style="padding:4px 12px;border-radius:99px;background:#f0fdf4;border:1px solid #bbf7d0;color:#166534;font-size:.8rem;font-weight:700;">{{ m }}</span>
      </div>
      <div style="padding:10px 14px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;font-size:.85rem;">
        {{ $t('payment.amount') }} <strong>{{ $t('payment.perMonth', { price }) }}</strong>
      </div>
      <p style="margin:12px 0 0;font-size:.8rem;color:#6b7280;">{{ $t('payment.activation') }}</p>
      <p style="margin:6px 0 0;font-size:.8rem;color:#6b7280;">{{ $t('payment.contact') }} <span class="mono-ltr" style="font-weight:700;">+222 44 89 69 20</span></p>

      <div v-if="error" class="alert alert-red" style="margin-top:14px;text-align:start;"><CircleX size="1em" /> {{ error }}</div>
      <button class="btn btn-primary" style="width:100%;justify-content:center;margin-top:16px;padding:10px;" @click="retry" :disabled="checking">
        <RefreshCw size="1em" /> {{ checking ? $t('common.loading') : $t('payment.retry') }}
      </button>
      <button class="btn btn-outline" style="width:100%;justify-content:center;margin-top:8px;" @click="logout">
        <LogOut size="1em" /> {{ $t('payment.logout') }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { CalendarX, Copy, Check, CircleX, RefreshCw, LogOut, ArrowLeft } from 'lucide-vue-next'
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth.js'
import { dashboardApi } from '../../services/api.js'
import LangSwitcher from '../../components/LangSwitcher.vue'
import { fmtNum, t } from '../../i18n/index.js'
import { PAYMENT_NUMBER, PAYMENT_METHODS, MONTHLY_PRICE, CURRENCY } from '../../config/payment.js'

// Shown when the API answers 402 (subscription past its end date), see services/api.js
const auth     = useAuthStore()
const router   = useRouter()
const copied   = ref(false)
const checking = ref(false)
const error    = ref('')

const price = computed(() => `${fmtNum(MONTHLY_PRICE)} ${CURRENCY}`)

async function copy() {
  try {
    await navigator.clipboard.writeText(PAYMENT_NUMBER)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch { /* clipboard unavailable (http, old browser): the number stays readable */ }
}

// Back to the app once the SuperAdmin has recorded the payment
async function retry() {
  checking.value = true
  error.value = ''
  try {
    await dashboardApi.get()
    router.push('/app')
  } catch (e) {
    error.value = e.status === 402 ? t('payment.stillExpired') : e.message
  } finally { checking.value = false }
}

function logout() {
  auth.logout()
  router.push('/login')
}
</script>
