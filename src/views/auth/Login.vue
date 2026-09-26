<template>
  <div class="auth-bg">
    <div class="auth-card">
      <div style="text-align:center;margin-bottom:28px;">
        <div style="width:52px;height:52px;border-radius:14px;background:#f0fdf4;border:1px solid #bbf7d0;display:flex;align-items:center;justify-content:center;font-size:1.6rem;margin:0 auto 12px;">💊</div>
        <h1 style="font-size:1.5rem;font-weight:800;margin:0;">Pharma<span style="color:#16a34a">Pulse</span></h1>
        <p style="color:#6b7280;font-size:.85rem;margin:4px 0 0;">Espace pharmacie — Connexion</p>
      </div>
      <div v-if="error" class="alert alert-red" style="margin-bottom:14px;">❌ {{ error }}</div>
      <div class="form-grid" style="gap:13px;">
        <div><label class="lbl">Email</label><input v-model="email" class="inp" type="email" placeholder="admin@pharma.com" @keyup.enter="submit"/></div>
        <div><label class="lbl">Mot de passe</label><input v-model="password" class="inp" type="password" placeholder="••••••••" @keyup.enter="submit"/></div>
      </div>
      <button class="btn btn-primary" style="width:100%;justify-content:center;margin-top:16px;padding:10px;" @click="submit" :disabled="auth.loading">
        {{ auth.loading ? 'Connexion...' : 'Se connecter' }}
      </button>
      <div style="margin-top:12px;padding:10px 14px;background:#f0fdf4;border-radius:8px;font-size:.78rem;color:#166534;border:1px solid #bbf7d0;">
        <strong>Démo :</strong> admin@pharma.com / Admin1234!
      </div>
      <p style="text-align:center;margin-top:14px;font-size:.85rem;color:#6b7280;">
        Pas de compte ? <RouterLink to="/register" style="color:#16a34a;font-weight:600;">Créer un compte</RouterLink>
      </p>
      <p style="text-align:center;margin-top:8px;font-size:.78rem;">
        <RouterLink to="/super/login" style="color:#7c3aed;font-weight:600;">🛡️ Panneau Super Admin</RouterLink>
      </p>
    </div>
  </div>
</template>
<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth.js'
const auth = useAuthStore(); const router = useRouter()
const email = ref(''); const password = ref(''); const error = ref('')
async function submit() {
  error.value = ''
  if (!email.value || !password.value) { error.value = 'Remplissez tous les champs.'; return }
  const res = await auth.login(email.value, password.value)
  if (res.ok) router.push('/app'); else error.value = res.msg
}
</script>
