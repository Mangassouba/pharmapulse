<template>
  <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#1e1b4b,#3730a3,#4c1d95);">
    <div style="background:#fff;border-radius:18px;padding:36px;width:100%;max-width:400px;box-shadow:0 20px 60px rgba(0,0,0,.3);">
      <div style="text-align:center;margin-bottom:28px;">
        <div style="width:56px;height:56px;border-radius:16px;background:linear-gradient(135deg,#7c3aed,#4c1d95);display:flex;align-items:center;justify-content:center;font-size:1.8rem;margin:0 auto 12px;box-shadow:0 8px 20px rgba(124,58,237,.3);color:#fff;"><Shield size="1em" /></div>
        <h1 style="font-size:1.4rem;font-weight:800;margin:0;">Pharma<span style="color:#7c3aed">Pulse</span></h1>
        <div style="display:inline-block;margin-top:6px;padding:3px 12px;background:#f5f3ff;color:#7c3aed;border-radius:99px;font-size:.7rem;font-weight:700;letter-spacing:.07em;">MOT DE PASSE OUBLIÉ</div>
      </div>
      <div v-if="error" style="background:#fef2f2;border:1px solid #fecaca;color:#dc2626;border-radius:8px;padding:10px 14px;font-size:.85rem;margin-bottom:14px;"><CircleX size="1em" /> {{ error }}</div>
      <div v-if="sent" style="background:#f5f3ff;border:1px solid #ddd6fe;color:#5b21b6;border-radius:8px;padding:10px 14px;font-size:.85rem;margin-bottom:14px;"><CircleCheck size="1em" /> {{ sent }}</div>
      <template v-else>
        <p style="font-size:.85rem;color:#6b7280;margin:0 0 14px;">Saisissez votre email : vous recevrez un lien pour choisir un nouveau mot de passe.</p>
        <div><label class="lbl">Email</label><input v-model="email" class="inp" type="email" placeholder="superadmin@pharmapulse.com" @keyup.enter="submit" style="border-color:#ddd6fe;" onfocus="this.style.borderColor='#7c3aed'" onblur="this.style.borderColor='#ddd6fe'"/></div>
        <button @click="submit" :disabled="loading" style="width:100%;margin-top:16px;padding:11px;border:none;border-radius:9px;background:linear-gradient(135deg,#7c3aed,#4c1d95);color:#fff;font-size:.9rem;font-weight:700;cursor:pointer;font-family:'Inter',sans-serif;" :style="loading?'opacity:.6;cursor:not-allowed':''">
          {{ loading ? 'Envoi...' : 'Envoyer le lien' }}
        </button>
      </template>
      <p style="text-align:center;margin-top:14px;font-size:.8rem;color:#6b7280;">
        ← <RouterLink to="/super/login" style="color:#7c3aed;font-weight:600;">Retour à la connexion</RouterLink>
      </p>
    </div>
  </div>
</template>
<script setup>
import { Shield, CircleX, CircleCheck } from 'lucide-vue-next'
import { ref } from 'vue'
import { superApi } from '../../services/api.js'
const email = ref(''); const error = ref(''); const sent = ref(''); const loading = ref(false)
async function submit() {
  error.value = ''
  if (!email.value) { error.value = 'Saisissez votre email.'; return }
  loading.value = true
  try {
    const res = await superApi.forgotPassword({ email: email.value })
    sent.value = res.message
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}
</script>
