<template>
  <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#1e1b4b,#3730a3,#4c1d95);">
    <LangSwitcher class="auth-lang" />
    <div style="background:#fff;border-radius:18px;padding:36px;width:100%;max-width:400px;box-shadow:0 20px 60px rgba(0,0,0,.3);">
      <div style="text-align:center;margin-bottom:28px;">
        <div style="width:56px;height:56px;border-radius:16px;background:linear-gradient(135deg,#7c3aed,#4c1d95);display:flex;align-items:center;justify-content:center;font-size:1.8rem;margin:0 auto 12px;box-shadow:0 8px 20px rgba(124,58,237,.3);color:#fff;"><SiteLogo :fallback="Shield" /></div>
        <h1 style="font-size:1.4rem;font-weight:800;margin:0;"><SiteName accent="#7c3aed" /></h1>
        <div style="display:inline-block;margin-top:6px;padding:3px 12px;background:#f5f3ff;color:#7c3aed;border-radius:99px;font-size:.7rem;font-weight:700;letter-spacing:.07em;">{{ $t('auth.newPassword') }}</div>
      </div>
      <div v-if="error" style="background:#fef2f2;border:1px solid #fecaca;color:#dc2626;border-radius:8px;padding:10px 14px;font-size:.85rem;margin-bottom:14px;"><CircleX size="1em" /> {{ error }}</div>
      <div v-if="done" style="background:#f5f3ff;border:1px solid #ddd6fe;color:#5b21b6;border-radius:8px;padding:10px 14px;font-size:.85rem;margin-bottom:14px;"><CircleCheck size="1em" /> {{ done }}</div>
      <template v-else-if="token">
        <div class="form-grid" style="gap:13px;">
          <div><label class="lbl">{{ $t('auth.newPassword') }}</label><input v-model="password" class="inp" type="password" placeholder="••••••••" @keyup.enter="submit" style="border-color:#ddd6fe;" onfocus="this.style.borderColor='#7c3aed'" onblur="this.style.borderColor='#ddd6fe'"/></div>
          <div><label class="lbl">{{ $t('auth.confirmPassword') }}</label><input v-model="confirm" class="inp" type="password" placeholder="••••••••" @keyup.enter="submit" style="border-color:#ddd6fe;" onfocus="this.style.borderColor='#7c3aed'" onblur="this.style.borderColor='#ddd6fe'"/></div>
        </div>
        <button @click="submit" :disabled="loading" style="width:100%;margin-top:16px;padding:11px;border:none;border-radius:9px;background:linear-gradient(135deg,#7c3aed,#4c1d95);color:#fff;font-size:.9rem;font-weight:700;cursor:pointer;font-family:'Inter',sans-serif;" :style="loading?'opacity:.6;cursor:not-allowed':''">
          {{ loading ? $t('common.saving') : $t('auth.changePassword') }}
        </button>
      </template>
      <p style="text-align:center;margin-top:14px;font-size:.8rem;color:#6b7280;">
        ← <RouterLink to="/super/login" style="color:#7c3aed;font-weight:600;">{{ $t('auth.backToLogin') }}</RouterLink>
      </p>
    </div>
  </div>
</template>
<script setup>
import SiteName from '../../components/SiteName.vue'
import SiteLogo from '../../components/SiteLogo.vue'
import { Shield, CircleX, CircleCheck } from 'lucide-vue-next'
import { ref } from 'vue'
import LangSwitcher from '../../components/LangSwitcher.vue'
import { t } from '../../i18n/index.js'

import { useRoute } from 'vue-router'
import { superApi } from '../../services/api.js'
const token = useRoute().query.token || ''
const password = ref(''); const confirm = ref(''); const loading = ref(false)
const error = ref(token ? '' : t('auth.invalidResetLink')); const done = ref('')
async function submit() {
  error.value = ''
  if (password.value.length < 6) { error.value = t('auth.passwordMin6'); return }
  if (password.value !== confirm.value) { error.value = t('auth.passwordMismatch'); return }
  loading.value = true
  try {
    const res = await superApi.resetPassword({ token, newPassword: password.value })
    done.value = res.message
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}
</script>
