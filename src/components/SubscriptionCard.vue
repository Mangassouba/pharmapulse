<template>
  <div id="abonnement" class="card card-p">
    <h3 style="font-weight:700;margin:0 0 4px;"><CreditCard size="1em" /> {{ $t('subscription.title') }}</h3>
    <p style="font-size:.8rem;color:#6b7280;margin:0 0 16px;">{{ $t('subscription.help') }}</p>

    <div v-if="loading && !sub" style="font-size:.85rem;color:#6b7280;">{{ $t('common.loading') }}</div>
    <div v-else-if="error" class="alert alert-red">{{ error }}</div>
    <div v-else-if="!sub" class="alert alert-yellow">{{ $t('subscription.none') }}</div>

    <template v-else>
      <!-- Status + countdown -->
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;padding:14px;border-radius:10px;border:1px solid;"
        :style="{ background: tone.bg, borderColor: tone.border }">
        <div>
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
            <span class="badge" :class="tone.badge">{{ $te('subscriptionStatus', sub.status) }}</span>
            <span style="font-size:.8rem;color:#6b7280;">{{ $t('subscription.plan') }} : <strong>{{ sub.plan }}</strong></span>
          </div>
          <div style="margin-top:6px;font-size:.9rem;font-weight:600;" :style="{ color: tone.text }">
            {{ expired ? $t('subscription.expiredOn', { date: fmt(sub.end_date) }) : $t('subscription.endsOn', { date: fmt(sub.end_date) }) }}
          </div>
        </div>
        <div v-if="!expired" style="text-align:end;">
          <div style="font-family:'JetBrains Mono',monospace;font-size:1.6rem;font-weight:800;line-height:1;" :style="{ color: tone.text }">{{ sub.days_left }}</div>
          <div style="font-size:.75rem;color:#6b7280;">{{ sub.days_left <= 1 ? $t('subscription.lastDay') : $t('subscription.daysLeft', { n: sub.days_left }) }}</div>
        </div>
      </div>
      <div v-if="!expired" style="height:6px;background:var(--surface-2);border-radius:99px;overflow:hidden;margin-top:10px;">
        <div style="height:100%;border-radius:99px;transition:width .3s;" :style="{ width: progress + '%', background: tone.bar }"></div>
      </div>

      <!-- Dates -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin-top:14px;">
        <div><div class="lbl">{{ $t('subscription.periodStart') }}</div><div style="font-size:.9rem;">{{ fmt(sub.period_start ?? sub.start_date) }}</div></div>
        <div><div class="lbl">{{ $t('subscription.end') }}</div><div style="font-size:.9rem;">{{ fmt(sub.end_date) }}</div></div>
        <div v-if="sub.trial_end_date"><div class="lbl">{{ $t('subscription.trialEnd') }}</div><div style="font-size:.9rem;">{{ fmt(sub.trial_end_date) }}</div></div>
      </div>

      <!-- How to renew -->
      <div style="margin-top:16px;padding:14px;border:1px solid var(--border);border-radius:10px;background:var(--surface-2);">
        <div style="font-weight:700;font-size:.9rem;margin-bottom:4px;">{{ $t('subscription.renewTitle') }}</div>
        <p style="font-size:.8rem;color:#6b7280;margin:0 0 10px;">{{ $t('subscription.renewIntro') }}</p>
        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
          <span style="font-family:'JetBrains Mono',monospace;font-size:1.3rem;font-weight:800;letter-spacing:.06em;color:#16a34a;direction:ltr;">{{ PAYMENT_NUMBER }}</span>
          <button class="btn btn-xs btn-outline" @click="copy"><Check v-if="copied" size="1em" /><Copy v-else size="1em" /> {{ copied ? $t('payment.copied') : $t('payment.copy') }}</button>
          <span v-for="m in PAYMENT_METHODS" :key="m" style="padding:3px 10px;border-radius:99px;background:#f0fdf4;border:1px solid #bbf7d0;color:#166534;font-size:.75rem;font-weight:700;">{{ m }}</span>
        </div>
        <div style="margin-top:8px;font-size:.82rem;">{{ $t('payment.amount') }} <strong>{{ $t('payment.perMonth', { price }) }}</strong></div>
        <div style="margin-top:4px;font-size:.78rem;color:#6b7280;">{{ $t('payment.activation') }}</div>
      </div>

      <!-- Payment history (ADMIN only, the API omits it for other roles) -->
      <div style="margin-top:16px;">
        <div style="font-weight:700;font-size:.9rem;margin-bottom:8px;">{{ $t('subscription.history') }}</div>
        <p v-if="!isAdmin" style="font-size:.8rem;color:#9ca3af;margin:0;">{{ $t('subscription.adminOnly') }}</p>
        <p v-else-if="!sub.payments?.length" style="font-size:.8rem;color:#6b7280;margin:0;">{{ $t('subscription.noPayments') }}</p>
        <div v-else class="tbl-wrap">
          <table class="tbl" style="width:100%;font-size:.82rem;">
            <thead><tr>
              <th>{{ $t('subscription.paidAt') }}</th>
              <th>{{ $t('subscription.amount') }}</th>
              <th>{{ $t('subscription.period') }}</th>
              <th>{{ $t('subscription.method') }}</th>
              <th>{{ $t('subscription.reference') }}</th>
            </tr></thead>
            <tbody>
              <tr v-for="p in sub.payments" :key="p.id">
                <td>{{ fmt(p.paid_at) }}</td>
                <td class="mono-ltr" style="font-weight:600;">{{ fmtNum(p.amount) }} {{ p.currency }}</td>
                <td>{{ fmt(p.period_start) }} → {{ fmt(p.period_end) }}</td>
                <td>{{ $te('paymentMethods', p.method) }}</td>
                <td class="mono-ltr">{{ p.reference || '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { CreditCard, Copy, Check } from 'lucide-vue-next'
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth.js'
import { fmtNum, fmtDate } from '../i18n/index.js'
import { PAYMENT_NUMBER, PAYMENT_METHODS, MONTHLY_PRICE, CURRENCY } from '../config/payment.js'

const auth    = useAuthStore()
const sub     = computed(() => auth.subscription)
const isAdmin = computed(() => auth.user?.role === 'ADMIN')
const loading = ref(false)
const error   = ref('')
const copied  = ref(false)

const price   = computed(() => `${fmtNum(MONTHLY_PRICE)} ${CURRENCY}`)
const fmt     = d => d ? fmtDate(d, { day: 'numeric', month: 'long', year: 'numeric' }) : '—'
const expired = computed(() => !sub.value || sub.value.status === 'EXPIRED' || sub.value.status === 'CANCELLED' || sub.value.days_left <= 0)

// Share of the paid period running now still left (period_start → end_date)
const progress = computed(() => {
  const s = sub.value
  if (!s) return 0
  const total = new Date(s.end_date) - new Date(s.period_start ?? s.start_date)
  const left  = new Date(s.end_date) - Date.now()
  return total > 0 ? Math.max(2, Math.min(100, (left / total) * 100)) : 0
})

const TONES = {
  ok:      { bg: '#f0fdf4', border: '#bbf7d0', text: '#166534', bar: '#16a34a', badge: 'badge-green' },
  trial:   { bg: '#eff6ff', border: '#bfdbfe', text: '#1e40af', bar: '#2563eb', badge: 'badge-blue' },
  soon:    { bg: '#fffbeb', border: '#fde68a', text: '#92400e', bar: '#d97706', badge: 'badge-yellow' },
  expired: { bg: '#fef2f2', border: '#fecaca', text: '#991b1b', bar: '#dc2626', badge: 'badge-red' },
}
const tone = computed(() => {
  if (expired.value) return TONES.expired
  if (sub.value.days_left <= 7) return TONES.soon
  return sub.value.status === 'TRIAL' ? TONES.trial : TONES.ok
})

async function copy() {
  try {
    await navigator.clipboard.writeText(PAYMENT_NUMBER)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch { /* clipboard unavailable: the number stays readable */ }
}

onMounted(async () => {
  loading.value = true
  try { await auth.fetchSubscription() }
  catch (e) { error.value = e.message }
  finally { loading.value = false }
})
</script>
