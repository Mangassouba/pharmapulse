<template>
  <div style="display:flex;flex-direction:column;gap:16px;max-width:680px;">
    <!-- Profile -->
    <div class="card card-p">
      <h3 style="font-weight:700;margin:0 0 4px;">Mon Profil</h3>
      <p style="font-size:.8rem;color:#6b7280;margin:0 0 18px;">Informations personnelles</p>
      <div style="display:flex;align-items:center;gap:14px;margin-bottom:18px;padding-bottom:16px;border-bottom:1px solid #f3f4f6;">
        <div style="width:52px;height:52px;border-radius:12px;background:#f0fdf4;color:#16a34a;font-weight:800;font-size:1.2rem;display:flex;align-items:center;justify-content:center;">{{ initials }}</div>
        <div><div style="font-weight:700;font-size:1.05rem;">{{ auth.user?.name }}</div><div style="font-size:.82rem;color:#6b7280;">{{ auth.user?.email }}</div><span class="badge badge-green" style="margin-top:4px;display:inline-block;">{{ auth.user?.role }}</span></div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px;">
        <div><label class="lbl">Nom complet</label><input v-model="profile.name" class="inp"/></div>
        <div><label class="lbl">Téléphone</label><input v-model="profile.phone" class="inp"/></div>
        <div style="grid-column:1/-1"><label class="lbl">Adresse</label><input v-model="profile.address" class="inp"/></div>
      </div>
      <div v-if="profileMsg" class="alert" :class="profileMsg.ok?'alert-green':'alert-red'" style="margin-bottom:10px;">{{ profileMsg.text }}</div>
      <button class="btn btn-primary btn-sm" @click="saveProfile" :disabled="savingProfile">{{ savingProfile?'...':'Sauvegarder le profil' }}</button>
    </div>

    <!-- Change password -->
    <div class="card card-p">
      <h3 style="font-weight:700;margin:0 0 4px;">Changer le mot de passe</h3>
      <p style="font-size:.8rem;color:#6b7280;margin:0 0 16px;">Sécurisez votre accès</p>
      <div style="display:flex;flex-direction:column;gap:12px;max-width:380px;">
        <div><label class="lbl">Mot de passe actuel</label><input v-model="pwd.current" class="inp" type="password"/></div>
        <div><label class="lbl">Nouveau mot de passe</label><input v-model="pwd.newPwd" class="inp" type="password"/></div>
        <div><label class="lbl">Confirmer</label><input v-model="pwd.confirm" class="inp" type="password" @keyup.enter="changePwd"/></div>
      </div>
      <div v-if="pwdMsg" class="alert" :class="pwdMsg.ok?'alert-green':'alert-red'" style="margin-top:10px;max-width:380px;">{{ pwdMsg.text }}</div>
      <button class="btn btn-primary btn-sm" style="margin-top:14px;" @click="changePwd" :disabled="savingPwd">{{ savingPwd?'...':'Changer le mot de passe' }}</button>
    </div>

    <!-- Pharmacy info -->
    <div class="card card-p">
      <h3 style="font-weight:700;margin:0 0 16px;">Informations Pharmacie</h3>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <div><label class="lbl">Nom</label><input :value="auth.user?.pharmacy?.name||'—'" class="inp" disabled style="background:#f9fafb;cursor:not-allowed;"/></div>
        <div><label class="lbl">Email</label><input :value="auth.user?.pharmacy?.email||'—'" class="inp" disabled style="background:#f9fafb;cursor:not-allowed;"/></div>
        <div><label class="lbl">Ville</label><input :value="auth.user?.pharmacy?.city||'—'" class="inp" disabled style="background:#f9fafb;cursor:not-allowed;"/></div>
        <div><label class="lbl">Pays</label><input :value="auth.user?.pharmacy?.country||'—'" class="inp" disabled style="background:#f9fafb;cursor:not-allowed;"/></div>
      </div>
    </div>

    <!-- System info -->
    <div class="card card-p">
      <h3 style="font-weight:700;margin:0 0 14px;">Informations Système</h3>
      <div style="display:flex;flex-direction:column;gap:0;">
        <div v-for="info in sysInfo" :key="info.label" style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid #f3f4f6;">
          <span style="font-size:.875rem;color:#6b7280;">{{ info.label }}</span>
          <span style="font-family:'JetBrains Mono',monospace;font-size:.85rem;font-weight:600;" :style="{color:info.color||'#111827'}">{{ info.value }}</span>
        </div>
      </div>
      <button class="btn btn-danger btn-sm" style="margin-top:16px;" @click="doLogout">🚪 Se déconnecter</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore }   from '../stores/auth.js'
import { usePharmaStore } from '../stores/pharma.js'
import { authApi }        from '../services/api.js'

const auth   = useAuthStore()
const store  = usePharmaStore()
const router = useRouter()

const initials    = computed(() => (auth.user?.name || 'U').slice(0, 2).toUpperCase())
const savingProfile = ref(false)
const savingPwd   = ref(false)
const profileMsg  = ref(null)
const pwdMsg      = ref(null)

const profile = ref({
  name:    auth.user?.name    || '',
  phone:   auth.user?.phone   || '',
  address: auth.user?.address || '',
})
const pwd = ref({ current: '', newPwd: '', confirm: '' })

onMounted(async () => {
  try {
    const res = await authApi.me()
    auth.setUser(res.data)
    profile.value = {
      name:    auth.user?.name    || '',
      phone:   auth.user?.phone   || '',
      address: auth.user?.address || '',
    }
  } catch (e) { /* keep cached values if refresh fails */ }
})

const sysInfo = computed(() => [
  { label: 'Version',          value: 'PharmaPulse v1.0.0',       color: '#16a34a' },
  { label: 'Framework',        value: 'Vue 3 + Vite 5' },
  { label: 'Backend',          value: 'Express + Prisma v6' },
  { label: 'Produits en stock',value: `${store.products.length} réf.` },
  { label: 'Alertes actives',  value: `${store.alertCount}`, color: store.alertCount > 0 ? '#dc2626' : '#16a34a' },
  { label: 'Rôle actuel',      value: auth.user?.role || '—' },
])

async function saveProfile() {
  savingProfile.value = true
  profileMsg.value = null
  try {
    const res = await authApi.updateMe({
      name:    profile.value.name,
      phone:   profile.value.phone,
      address: profile.value.address,
    })
    auth.setUser(res.data)
    profileMsg.value = { ok: true, text: '✅ Profil mis à jour.' }
  } catch (e) {
    profileMsg.value = { ok: false, text: '❌ ' + e.message }
  } finally { savingProfile.value = false }
}

async function changePwd() {
  pwdMsg.value = null
  if (!pwd.value.current || !pwd.value.newPwd) { pwdMsg.value = { ok: false, text: '❌ Remplissez tous les champs.' }; return }
  if (pwd.value.newPwd.length < 6) { pwdMsg.value = { ok: false, text: '❌ Nouveau mot de passe trop court.' }; return }
  if (pwd.value.newPwd !== pwd.value.confirm) { pwdMsg.value = { ok: false, text: '❌ Les mots de passe ne correspondent pas.' }; return }
  savingPwd.value = true
  try {
    await authApi.changePassword({ currentPassword: pwd.value.current, newPassword: pwd.value.newPwd })
    pwdMsg.value = { ok: true, text: '✅ Mot de passe changé avec succès.' }
    pwd.value = { current: '', newPwd: '', confirm: '' }
  } catch (e) {
    pwdMsg.value = { ok: false, text: '❌ ' + e.message }
  } finally { savingPwd.value = false }
}

function doLogout() { auth.logout(); router.push('/login') }
</script>
