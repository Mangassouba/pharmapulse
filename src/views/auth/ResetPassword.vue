<template>
  <div class="auth-bg">
    <div class="auth-card">
      <div style="text-align:center;margin-bottom:28px;">
        <div style="width:52px;height:52px;border-radius:14px;background:#f0fdf4;border:1px solid #bbf7d0;display:flex;align-items:center;justify-content:center;font-size:1.6rem;margin:0 auto 12px;"><SiteLogo /></div>
        <h1 style="font-size:1.5rem;font-weight:800;margin:0;"><SiteName accent="#16a34a" /></h1>
        <p style="color:#6b7280;font-size:.85rem;margin:4px 0 0;">Nouveau mot de passe</p>
      </div>
      <div v-if="error" class="alert alert-red" style="margin-bottom:14px;"><CircleX size="1em" /> {{ error }}</div>
      <div v-if="done" class="alert alert-green" style="margin-bottom:14px;"><CircleCheck size="1em" /> {{ done }}</div>
      <template v-else-if="token">
        <div class="form-grid" style="gap:13px;">
          <div><label class="lbl">Nouveau mot de passe</label><input v-model="password" class="inp" type="password" placeholder="••••••••" @keyup.enter="submit"/></div>
          <div><label class="lbl">Confirmer le mot de passe</label><input v-model="confirm" class="inp" type="password" placeholder="••••••••" @keyup.enter="submit"/></div>
        </div>
        <button class="btn btn-primary" style="width:100%;justify-content:center;margin-top:16px;padding:10px;" @click="submit" :disabled="loading">
          {{ loading ? 'Enregistrement...' : 'Changer le mot de passe' }}
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
import { useRoute } from 'vue-router'
import { authApi } from '../../services/api.js'
const token = useRoute().query.token || ''
const password = ref(''); const confirm = ref(''); const loading = ref(false)
const error = ref(token ? '' : 'Lien de réinitialisation invalide.'); const done = ref('')
async function submit() {
  error.value = ''
  if (password.value.length < 6) { error.value = 'Le mot de passe doit contenir au moins 6 caractères.'; return }
  if (password.value !== confirm.value) { error.value = 'Les mots de passe ne correspondent pas.'; return }
  loading.value = true
  try {
    const res = await authApi.resetPassword({ token, newPassword: password.value })
    done.value = res.message
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}
</script>
