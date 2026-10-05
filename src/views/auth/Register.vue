<template>
  <div class="auth-bg">
    <div class="auth-card">
      <div style="text-align:center;margin-bottom:24px;">
        <div style="width:52px;height:52px;border-radius:14px;background:#f0fdf4;border:1px solid #bbf7d0;display:flex;align-items:center;justify-content:center;font-size:1.6rem;margin:0 auto 12px;"><SiteLogo /></div>
        <h1 style="font-size:1.4rem;font-weight:800;margin:0;">Créer votre pharmacie</h1>
        <p style="color:#6b7280;font-size:.82rem;margin:4px 0 0;">Accès immédiat — SaaS sécurisé</p>
      </div>
      <div v-if="error" class="alert alert-red" style="margin-bottom:12px;"><CircleX size="1em" /> {{ error }}</div>
      <div class="form-grid" style="gap:12px;">
        <div><label class="lbl">Nom de la pharmacie *</label><input v-model="form.pharmacyName" class="inp" placeholder="Pharmacie Chifa"/></div>
        <div><label class="lbl">Votre nom *</label><input v-model="form.name" class="inp" placeholder="Dr. Mohamed Ould Ahmed"/></div>
        <div><label class="lbl">Email *</label><input v-model="form.email" class="inp" type="email"/></div>
        <div><label class="lbl">Mot de passe * (min. 6)</label><input v-model="form.password" class="inp" type="password" @keyup.enter="submit"/></div>
      </div>
      <button class="btn btn-primary" style="width:100%;justify-content:center;margin-top:16px;padding:10px;" @click="submit" :disabled="auth.loading">
        {{ auth.loading ? 'Création...' : 'Créer mon espace' }}
      </button>
      <p style="text-align:center;margin-top:14px;font-size:.85rem;color:#6b7280;">
        Déjà inscrit ? <RouterLink to="/login" style="color:#16a34a;font-weight:600;">Se connecter</RouterLink>
      </p>
    </div>
  </div>
</template>
<script setup>
import SiteLogo from '../../components/SiteLogo.vue'
import { CircleX } from 'lucide-vue-next'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth.js'
const auth = useAuthStore(); const router = useRouter()
const error = ref(''); const form = ref({ pharmacyName:'', name:'', email:'', password:'' })
async function submit() {
  error.value = ''
  if (!form.value.pharmacyName || !form.value.name || !form.value.email || !form.value.password) { error.value = 'Tous les champs sont obligatoires.'; return }
  if (form.value.password.length < 6) { error.value = 'Mot de passe trop court.'; return }
  const res = await auth.register(form.value)
  if (res.ok) router.push('/app'); else error.value = res.msg
}
</script>
