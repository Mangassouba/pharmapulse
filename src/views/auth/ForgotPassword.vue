<template>
  <div class="auth-bg">
    <div class="auth-card">
      <div style="text-align:center;margin-bottom:28px;">
        <div style="width:52px;height:52px;border-radius:14px;background:#f0fdf4;border:1px solid #bbf7d0;display:flex;align-items:center;justify-content:center;font-size:1.6rem;margin:0 auto 12px;"><SiteLogo /></div>
        <h1 style="font-size:1.5rem;font-weight:800;margin:0;"><SiteName accent="#16a34a" /></h1>
        <p style="color:#6b7280;font-size:.85rem;margin:4px 0 0;">Mot de passe oublié</p>
      </div>
      <div v-if="error" class="alert alert-red" style="margin-bottom:14px;"><CircleX size="1em" /> {{ error }}</div>
      <div v-if="sent" class="alert alert-green" style="margin-bottom:14px;"><CircleCheck size="1em" /> {{ sent }}</div>
      <template v-else>
        <p style="font-size:.85rem;color:#6b7280;margin:0 0 14px;">Saisissez votre email : vous recevrez un lien pour choisir un nouveau mot de passe.</p>
        <div><label class="lbl">Email</label><input v-model="email" class="inp" type="email" placeholder="admin@pharma.com" @keyup.enter="submit"/></div>
        <button class="btn btn-primary" style="width:100%;justify-content:center;margin-top:16px;padding:10px;" @click="submit" :disabled="loading">
          {{ loading ? 'Envoi...' : 'Envoyer le lien' }}
        </button>
      </template>
      <p style="text-align:center;margin-top:14px;font-size:.85rem;">
        <RouterLink to="/login" style="color:#16a34a;font-weight:600;">Retour à la connexion</RouterLink>
      </p>
    </div>
  </div>
</template>
<script setup>
import SiteName from '../../components/SiteName.vue'
import SiteLogo from '../../components/SiteLogo.vue'
import { CircleX, CircleCheck } from 'lucide-vue-next'
import { ref } from 'vue'
import { authApi } from '../../services/api.js'
const email = ref(''); const error = ref(''); const sent = ref(''); const loading = ref(false)
async function submit() {
  error.value = ''
  if (!email.value) { error.value = 'Saisissez votre email.'; return }
  loading.value = true
  try {
    const res = await authApi.forgotPassword({ email: email.value })
    sent.value = res.message
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}
</script>
