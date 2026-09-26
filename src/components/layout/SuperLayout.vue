<template>
  <div class="super-layout">
    <aside class="super-sidebar">
      <div style="padding:18px 16px;border-bottom:1px solid rgba(255,255,255,.1);display:flex;align-items:center;gap:10px;">
        <div style="width:34px;height:34px;border-radius:8px;background:rgba(255,255,255,.15);display:flex;align-items:center;justify-content:center;font-size:1.1rem;">🛡️</div>
        <div>
          <div style="font-weight:800;font-size:.9rem;color:#fff;">Pharma<span style="color:#a78bfa">Pulse</span></div>
          <div style="font-size:.65rem;color:#a78bfa;font-weight:700;letter-spacing:.08em;">SUPER ADMIN</div>
        </div>
      </div>

      <nav style="flex:1;padding:10px 0;">
        <RouterLink to="/super"              class="snav-link" :class="{active:route.path==='/super'}"><span>📊</span> Dashboard</RouterLink>
        <RouterLink to="/super/pharmacies"   class="snav-link" :class="{active:route.path.startsWith('/super/pharmacies')}"><span>🏥</span> Pharmacies</RouterLink>
        <RouterLink to="/super/utilisateurs" class="snav-link" :class="{active:route.path==='/super/utilisateurs'}"><span>👥</span> Utilisateurs</RouterLink>
        <RouterLink to="/super/logs"         class="snav-link" :class="{active:route.path==='/super/logs'}"><span>📋</span> Journaux</RouterLink>
      </nav>

      <div style="padding:12px 14px;border-top:1px solid rgba(255,255,255,.1);display:flex;align-items:center;gap:8px;">
        <div style="width:32px;height:32px;border-radius:8px;background:rgba(255,255,255,.15);color:#c4b5fd;font-weight:800;font-size:.8rem;display:flex;align-items:center;justify-content:center;">{{ initials }}</div>
        <div style="flex:1;min-width:0;">
          <div style="font-size:.8rem;font-weight:700;color:#fff;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ superStore.admin?.name }}</div>
          <div style="font-size:.68rem;color:#a78bfa;">Super Admin</div>
        </div>
        <button @click="doLogout" style="background:transparent;border:1px solid rgba(255,255,255,.2);width:28px;height:28px;border-radius:6px;cursor:pointer;color:#fff;font-size:.85rem;display:flex;align-items:center;justify-content:center;">🚪</button>
      </div>
    </aside>

    <div class="super-main">
      <header class="super-topbar">
        <div>
          <div style="font-weight:700;font-size:1rem;color:#1e1b4b;">{{ pageTitle }}</div>
          <div style="font-size:.72rem;color:#7c3aed;">{{ todayStr }}</div>
        </div>
        <div style="display:flex;align-items:center;gap:8px;">
          <div style="background:#f5f3ff;border:1px solid #ddd6fe;padding:5px 12px;border-radius:99px;font-size:.72rem;font-weight:700;color:#7c3aed;display:flex;align-items:center;gap:6px;">
            <span style="width:7px;height:7px;border-radius:50%;background:#7c3aed;display:inline-block;animation:pulse 2s infinite;"></span>
            PLATEFORME EN DIRECT
          </div>
        </div>
      </header>

      <div class="super-body">
        <RouterView v-slot="{Component}">
          <Transition name="fade" mode="out-in"><component :is="Component" /></Transition>
        </RouterView>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSuperAdminStore } from '../../stores/superAdmin.js'

const route       = useRoute()
const router      = useRouter()
const superStore  = useSuperAdminStore()
const initials    = computed(() => (superStore.admin?.name||'SA').slice(0,2).toUpperCase())
const todayStr    = computed(() => new Date().toLocaleDateString('fr-FR',{weekday:'long',year:'numeric',month:'long',day:'numeric'}))
const titles      = { '/super':'Dashboard Plateforme', '/super/pharmacies':'Gestion Pharmacies', '/super/utilisateurs':'Tous les Utilisateurs', '/super/logs':'Journaux d\'activité' }
const pageTitle   = computed(() => titles[route.path] || 'Super Admin')
function doLogout() { superStore.logout(); router.push('/super/login') }
onMounted(() => superStore.fetchStats())
</script>

<style scoped>
@keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(1.5)} }
</style>
