<template>
  <div class="app-shell" :data-theme="theme.mode">
    <aside class="sidebar" :class="{collapsed}">
      <!-- Logo -->
      <div class="nav-logo">
        <div class="nav-logo-icon" :style="logoUrl ? 'background:#fff;overflow:hidden;' : ''">
          <img v-if="logoUrl" :src="logoUrl" alt="" style="width:100%;height:100%;object-fit:contain;"/>
          <SiteLogo v-else />
        </div>
        <div v-show="!collapsed" class="nav-logo-text">
          <strong><SiteName accent="var(--green)" /></strong>
          <span>{{ auth.user?.pharmacy?.name || '' }}</span>
        </div>
      </div>

      <!-- Nav -->
      <nav style="flex:1;overflow-y:auto;padding:8px 0;">
        <div v-show="!collapsed" class="nav-section">Principal</div>
        <RouterLink to="/app"             class="nav-link" :class="{active: route.path === '/app'}">
          <span class="icon"><House size="1em" /></span><span v-show="!collapsed">Dashboard</span>
        </RouterLink>
        <RouterLink to="/app/alertes"     class="nav-link" :class="{active: route.path === '/app/alertes'}">
          <span class="icon"><Bell size="1em" /></span>
          <span v-show="!collapsed">Alertes</span>
          <span v-if="store.alertCount && !collapsed" class="nav-badge">{{ store.alertCount }}</span>
        </RouterLink>

        <div class="nav-divider"></div>
        <div v-show="!collapsed" class="nav-section">Gestion Stock</div>
        <RouterLink to="/app/produits"    class="nav-link" :class="{active: route.path === '/app/produits'}"><span class="icon"><Package size="1em" /></span><span v-show="!collapsed">Produits</span></RouterLink>
        <RouterLink to="/app/categories"  class="nav-link" :class="{active: route.path === '/app/categories'}"><span class="icon"><Tag size="1em" /></span><span v-show="!collapsed">Catégories</span></RouterLink>
        <RouterLink to="/app/reception"   class="nav-link" :class="{active: route.path === '/app/reception'}"><span class="icon"><PackagePlus size="1em" /></span><span v-show="!collapsed">Réception</span></RouterLink>
        <RouterLink to="/app/ventes"      class="nav-link" :class="{active: route.path === '/app/ventes'}"><span class="icon"><Banknote size="1em" /></span><span v-show="!collapsed">Ventes</span></RouterLink>
        <RouterLink to="/app/mouvements"  class="nav-link" :class="{active: route.path === '/app/mouvements'}"><span class="icon"><RefreshCw size="1em" /></span><span v-show="!collapsed">Mouvements</span></RouterLink>
        <RouterLink to="/app/inventaire"  class="nav-link" :class="{active: route.path === '/app/inventaire'}"><span class="icon"><ClipboardList size="1em" /></span><span v-show="!collapsed">Inventaire</span></RouterLink>
        <RouterLink to="/app/lots"        class="nav-link" :class="{active: route.path === '/app/lots'}"><span class="icon"><CalendarClock size="1em" /></span><span v-show="!collapsed">Lots & Dates</span></RouterLink>

        <div class="nav-divider"></div>
        <div v-show="!collapsed" class="nav-section">Administration</div>
        <RouterLink to="/app/commandes"          class="nav-link" :class="{active: route.path === '/app/commandes'}">
          <span class="icon"><ShoppingCart size="1em" /></span><span v-show="!collapsed">Commandes</span>
        </RouterLink>
        <RouterLink to="/app/commandes-en-ligne" class="nav-link" :class="{active: route.path === '/app/commandes-en-ligne'}">
          <span class="icon"><Globe size="1em" /></span>
          <span v-show="!collapsed">Commandes en ligne</span>
          <span v-if="onlineCount && !collapsed" class="nav-badge" style="background:var(--green);">{{ onlineCount }}</span>
        </RouterLink>
        <RouterLink to="/app/utilisateurs" class="nav-link" :class="{active: route.path === '/app/utilisateurs'}"><span class="icon"><Users size="1em" /></span><span v-show="!collapsed">Utilisateurs</span></RouterLink>
        <RouterLink to="/app/parametres"   class="nav-link" :class="{active: route.path === '/app/parametres'}"><span class="icon"><Settings size="1em" /></span><span v-show="!collapsed">Paramètres</span></RouterLink>
      </nav>

      <!-- Bottom user -->
      <div class="sidebar-bottom">
        <div class="user-chip">{{ initials }}</div>
        <div v-show="!collapsed" class="user-info">
          <div class="user-name">{{ auth.user?.name }}</div>
          <div class="user-role">{{ roleLabel }}</div>
        </div>
        <button @click="doLogout" class="btn btn-icon" style="flex-shrink:0;" title="Déconnexion"><LogOut size="1em" /></button>
      </div>

      <button class="sidebar-toggle" @click="collapsed = !collapsed">{{ collapsed ? '›' : '‹' }}</button>
    </aside>

    <!-- Main area -->
    <div class="main-area" :class="{expanded: collapsed}">
      <!-- Topbar -->
      <header class="topbar">
        <div style="display:flex;align-items:center;gap:12px;">
          <div style="width:4px;height:28px;background:var(--green);border-radius:99px;"></div>
          <div>
            <div style="font-weight:700;font-size:1rem;color:var(--text);">{{ pageTitle }}</div>
            <div style="font-size:.72rem;color:var(--text-muted);text-transform:capitalize;">{{ todayStr }}</div>
          </div>
        </div>

        <div style="display:flex;align-items:center;gap:8px;">
          <!-- Dark mode toggle -->
          <button class="btn btn-icon" @click="theme.toggle" :title="theme.mode === 'dark' ? 'Mode clair' : 'Mode sombre'">
            <component :is="theme.mode === 'dark' ? Sun : Moon" size="1em" />
          </button>

          <!-- Notifications -->
          <div style="position:relative;">
            <button class="btn btn-icon" @click="showNotifs = !showNotifs">
              <Bell size="1em" />
              <span v-if="store.unreadCount > 0" style="position:absolute;top:-4px;right:-4px;background:#dc2626;color:#fff;font-size:.6rem;font-weight:700;width:16px;height:16px;border-radius:50%;display:flex;align-items:center;justify-content:center;">{{ store.unreadCount }}</span>
            </button>
            <div v-if="showNotifs" style="position:absolute;top:calc(100% + 8px);right:0;background:var(--surface);border:1px solid var(--border);border-radius:12px;width:300px;box-shadow:0 8px 30px rgba(0,0,0,.1);z-index:50;overflow:hidden;">
              <div style="padding:12px 16px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;">
                <span style="font-weight:700;font-size:.875rem;color:var(--text);">Notifications</span>
                <button class="btn btn-xs btn-outline" @click="store.markAllRead();showNotifs=false">Tout lire</button>
              </div>
              <div style="max-height:280px;overflow-y:auto;">
                <div v-for="n in store.notifications.slice(0,6)" :key="n.id" style="padding:10px 16px;border-bottom:1px solid var(--border);font-size:.8rem;color:var(--text);" :style="n.is_read ? '' : 'background:var(--green-l)'">
                  <div style="font-weight:600;">{{ n.title }}</div>
                  <div style="color:var(--text-muted);margin-top:2px;">{{ n.message }}</div>
                </div>
                <div v-if="!store.notifications.length" style="padding:20px;text-align:center;color:var(--text-muted);font-size:.85rem;">Aucune notification</div>
              </div>
            </div>
          </div>

          <RouterLink v-if="store.alertCount > 0" to="/app/alertes" class="btn btn-sm btn-danger" style="text-decoration:none;">
            <TriangleAlert size="1em" /> {{ store.alertCount }} alerte(s)
          </RouterLink>
          <RouterLink to="/app/ventes" class="btn btn-sm btn-primary" style="text-decoration:none;">
            + Vente
          </RouterLink>
        </div>
      </header>

      <!-- Page -->
      <div class="page-body">
        <RouterView v-slot="{ Component }">
          <Transition name="fade" mode="out-in">
            <component :is="Component" />
          </Transition>
        </RouterView>
      </div>
    </div>

    <!-- Notif overlay -->
    <div v-if="showNotifs" @click="showNotifs = false" style="position:fixed;inset:0;z-index:39;"></div>

    <!-- Subscription payment instructions, right after registration -->
    <PaymentPrompt />
  </div>
</template>

<script setup>
import SiteLogo from '../SiteLogo.vue'
import SiteName from '../SiteName.vue'
import { useSiteStore } from '../../stores/site.js'
import { House, Bell, Package, Tag, PackagePlus, Banknote, RefreshCw, ClipboardList, CalendarClock, ShoppingCart, Globe, Users, Settings, LogOut, TriangleAlert, Sun, Moon, Component } from 'lucide-vue-next'
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore }   from '../../stores/auth.js'
import { usePharmaStore } from '../../stores/pharma.js'
import { useThemeStore }  from '../../stores/theme.js'
import { orderApi }       from '../../services/api.js'
import { pharmacyLogoUrl } from '../../utils/logo.js'
import PaymentPrompt from '../PaymentPrompt.vue'

const route  = useRoute()
const router = useRouter()
const auth   = useAuthStore()
const site   = useSiteStore()
const logoUrl = computed(() => pharmacyLogoUrl(auth.user?.pharmacy))
const store  = usePharmaStore()
const theme  = useThemeStore()

const collapsed  = ref(false)
const showNotifs = ref(false)
const onlineCount = ref(0)

const initials = computed(() => (auth.user?.name || 'U').slice(0, 2).toUpperCase())
const roleLabels = { ADMIN: 'Administrateur', MANAGER: 'Manager', CAISSIER: 'Caissier', STOCK_MANAGER: 'Stock Manager' }
const roleLabel  = computed(() => roleLabels[auth.user?.role] || auth.user?.role || '')
const todayStr   = computed(() => new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }))

const pageTitles = {
  '/app':                     'Dashboard',
  '/app/produits':            'Produits',
  '/app/categories':          'Catégories',
  '/app/reception':           'Réception',
  '/app/ventes':              'Ventes',
  '/app/mouvements':          'Mouvements de Stock',
  '/app/inventaire':          'Inventaire',
  '/app/alertes':             'Alertes Stock',
  '/app/lots':                'Lots & Péremptions',
  '/app/commandes':           'Commandes',
  '/app/commandes-en-ligne':  'Commandes en ligne',
  '/app/utilisateurs':        'Utilisateurs',
  '/app/parametres':          'Paramètres',
}
const pageTitle = computed(() => pageTitles[route.path] || site.name)

async function fetchOnlineCount() {
  try {
    const r = await orderApi.list({ source: 'ONLINE', status: 'PENDING', pageSize: 1 })
    onlineCount.value = r.meta?.total || 0
  } catch {}
}

function doLogout() { auth.logout(); router.push('/login') }

onMounted(async () => {
  await Promise.all([
    store.fetchDashboard().catch(() => {}),
    store.fetchNotifications().catch(() => {}),
    fetchOnlineCount(),
  ])
})
</script>
