<template>
  <div class="auth-bg">
    <div class="auth-card">
      <LangSwitcher class="auth-lang" />
      <RouterLink to="/" class="auth-home"><ArrowLeft size="1em" /> {{ $t('common.home') }}</RouterLink>
      <div style="text-align:center;margin-bottom:24px;">
        <div style="width:52px;height:52px;border-radius:14px;background:#f0fdf4;border:1px solid #bbf7d0;display:flex;align-items:center;justify-content:center;font-size:1.6rem;margin:0 auto 12px;"><SiteLogo /></div>
        <h1 style="font-size:1.4rem;font-weight:800;margin:0;">{{ $t('auth.registerTitle') }}</h1>
        <p style="color:#6b7280;font-size:.82rem;margin:4px 0 0;">{{ $t('auth.registerSubtitle') }}</p>
        <div style="display:inline-flex;align-items:center;gap:6px;margin-top:12px;padding:5px 14px;border-radius:99px;background:#f0fdf4;border:1px solid #bbf7d0;color:#166534;font-size:.82rem;font-weight:700;">
          <Gift size="1em" /> {{ $t('auth.trialBadge', { n: TRIAL_DAYS }) }}
        </div>
        <p style="color:#6b7280;font-size:.75rem;margin:6px 0 0;">{{ $t('auth.trialNote', { price }) }}</p>
      </div>
      <div v-if="error" class="alert alert-red" style="margin-bottom:12px;"><CircleX size="1em" /> {{ error }}</div>
      <div class="form-grid" style="gap:12px;">
        <div><label class="lbl">{{ $t('auth.pharmacyName') }} *</label><input v-model="form.pharmacyName" class="inp" :placeholder="$t('auth.pharmacyNamePh')"/></div>
        <div><label class="lbl">{{ $t('common.country') }} *</label><select v-model="form.pharmacyCountry" class="inp"><option v-for="c in COUNTRY_CODES" :key="c" :value="c">{{ countryName(c) }} ({{ COUNTRIES[c].currency }})</option></select></div>
        <div><label class="lbl">{{ $t('auth.yourName') }} *</label><input v-model="form.name" class="inp" placeholder="Dr. Mohamed Ould Ahmed"/></div>
        <div><label class="lbl">{{ $t('common.email') }} *</label><input v-model="form.email" class="inp" type="email"/></div>
        <div><label class="lbl">{{ $t('auth.passwordMin') }}</label>
          <div style="position:relative;">
            <input v-model="form.password" class="inp" :type="showPassword ? 'text' : 'password'" style="padding-inline-end:38px;" @keyup.enter="submit"/>
            <button type="button" @click="showPassword = !showPassword" :aria-label="showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'" style="position:absolute;inset-inline-end:8px;top:50%;transform:translateY(-50%);background:none;border:none;padding:4px;cursor:pointer;color:#6b7280;display:flex;align-items:center;">
              <EyeOff v-if="showPassword" size="1.1em" /><Eye v-else size="1.1em" />
            </button>
          </div>
        </div>
      </div>
      <button class="btn btn-primary" style="width:100%;justify-content:center;margin-top:16px;padding:10px;" @click="submit" :disabled="auth.loading">
        {{ auth.loading ? $t('auth.creating') : $t('auth.createSpace') }}
      </button>
      <p style="text-align:center;margin-top:14px;font-size:.85rem;color:#6b7280;">
        {{ $t('auth.alreadyRegistered') }} <RouterLink to="/login" style="color:#16a34a;font-weight:600;">{{ $t('auth.login') }}</RouterLink>
      </p>
    </div>
  </div>
</template>
<script setup>
import SiteLogo from '../../components/SiteLogo.vue'
import { CircleX, Gift, ArrowLeft, Eye, EyeOff } from 'lucide-vue-next'
import { ref, computed } from 'vue'
import LangSwitcher from '../../components/LangSwitcher.vue'
import { t, fmtNum } from '../../i18n/index.js'
import { TRIAL_DAYS, MONTHLY_PRICE, CURRENCY } from '../../config/payment.js'
import { COUNTRIES, COUNTRY_CODES, DEFAULT_COUNTRY } from '../../config/countries.js'
import { countryName } from '../../utils/geo.js'

import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth.js'
const auth = useAuthStore(); const router = useRouter()
const price = computed(() => `${fmtNum(MONTHLY_PRICE)} ${CURRENCY}`) // reformatted on language change
const error = ref(''); const showPassword = ref(false); const form = ref({ pharmacyName:'', pharmacyCountry: DEFAULT_COUNTRY, name:'', email:'', password:'' })
async function submit() {
  error.value = ''
  if (!form.value.pharmacyName || !form.value.name || !form.value.email || !form.value.password) { error.value = t('auth.allRequired'); return }
  if (form.value.password.length < 6) { error.value = t('auth.passwordTooShort'); return }
  const res = await auth.register(form.value)
  if (res.ok) router.push('/app'); else error.value = res.msg
}
</script>
