<template>
  <div class="pub-shell">
    <!-- Header -->
    <header class="pub-header">
      <div class="pub-container">
        <RouterLink to="/pharmacies" class="pub-logo">
          <div class="pub-logo-icon"><SiteLogo :size="20" color="white" /></div>
          <div>
            <div class="pub-logo-name"><SiteName /></div>
            <div class="pub-logo-sub">Trouver votre médicament</div>
          </div>
        </RouterLink>

        <div class="pub-header-center">
          <div class="pub-search-bar" v-if="showSearch">
            <Search :size="16" class="pub-search-icon" />
            <input
              v-model="q"
              class="pub-search-inp"
              placeholder="Rechercher un médicament..."
              @keyup.enter="doSearch"
              @input="debouncedSearch"
            />
            <button v-if="q" @click="q=''; cartStore.searchResults=[]" class="pub-search-clear"><X :size="14" /></button>
            <button class="pub-search-btn" @click="doSearch" aria-label="Rechercher">
              <Search :size="14" class="pub-search-btn-icon" /><span class="pub-search-btn-text">Rechercher</span>
            </button>
          </div>
        </div>

        <div class="pub-header-right">
          <button class="pub-loc-btn" @click="requestLocation" :class="{active: cartStore.userLocation}" :aria-label="cartStore.userLocation ? 'Localisé' : 'Me localiser'">
            <MapPin :size="14" /> <span class="pub-btn-label">{{ cartStore.userLocation ? 'Localisé' : 'Me localiser' }}</span>
          </button>
          <RouterLink to="/panier" class="pub-cart-btn" aria-label="Panier">
            <ShoppingCart :size="16" /> <span class="pub-btn-label">Panier</span>
            <span v-if="cartStore.totalItems > 0" class="pub-cart-badge">{{ cartStore.totalItems }}</span>
          </RouterLink>
          <RouterLink :to="authStore.isLoggedIn ? '/app' : '/login'" class="pub-login-btn" :aria-label="authStore.isLoggedIn ? 'Mon espace' : 'Connexion'">
            <component :is="authStore.isLoggedIn ? LayoutDashboard : LogIn" :size="16" />
            <span class="pub-btn-label">{{ authStore.isLoggedIn ? 'Mon espace' : 'Connexion' }}</span>
          </RouterLink>
        </div>
      </div>
    </header>

    <!-- Main -->
    <main class="pub-main">
      <RouterView />
    </main>

    <!-- Footer -->
    <footer class="pub-footer">
      <div class="pub-container">
        <div class="pub-footer-grid">
          <div>
            <div style="font-weight:800;font-size:1.1rem;margin-bottom:8px;color:#fff;"><SiteName accent="#4ade80" /></div>
            <p style="color:#9ca3af;font-size:.85rem;line-height:1.6;">Trouvez vos médicaments dans les pharmacies proches de chez vous, commandez en ligne et récupérez en pharmacie.</p>
          </div>
          <div>
            <div style="font-weight:700;margin-bottom:10px;">Navigation</div>
            <div style="display:flex;flex-direction:column;gap:6px;">
              <RouterLink to="/pharmacies" style="color:#9ca3af;font-size:.85rem;text-decoration:none;">Toutes les pharmacies</RouterLink>
              <RouterLink to="/recherche" style="color:#9ca3af;font-size:.85rem;text-decoration:none;">Rechercher un produit</RouterLink>
              <RouterLink to="/panier" style="color:#9ca3af;font-size:.85rem;text-decoration:none;">Mon panier</RouterLink>
              <RouterLink to="/commandes-client" style="color:#9ca3af;font-size:.85rem;text-decoration:none;">Suivre ma commande</RouterLink>
            </div>
          </div>
          <div>
            <div style="font-weight:700;margin-bottom:10px;">Contact</div>
            <div class="pub-footer-contact">
              <div><Mail :size="14" /> support@pharmapulse.mr</div>
              <div><Phone :size="14" /> +222 45 00 00 00</div>
              <div><Clock :size="14" /> Lun–Sam : 8h–20h</div>
            </div>
          </div>
        </div>
        <div style="border-top:1px solid #1f2937;margin-top:24px;padding-top:16px;text-align:center;color:#4b5563;font-size:.78rem;">
          © {{ new Date().getFullYear() }} {{ site.name }} — Plateforme SaaS de gestion de pharmacie
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import SiteLogo from '../SiteLogo.vue'
import SiteName from '../SiteName.vue'
import { useSiteStore } from '../../stores/site.js'
const site = useSiteStore()
import { ref, computed, onMounted } from 'vue'
import { trackVisit } from '../../utils/visits.js'
import { useRouter, useRoute } from 'vue-router'
import { useCartStore } from '../../stores/cart.js'
import { useAuthStore } from '../../stores/auth.js'
import { Search, X, MapPin, ShoppingCart, LogIn, LayoutDashboard, Mail, Phone, Clock } from 'lucide-vue-next'

const router    = useRouter()
const route     = useRoute()
const cartStore = useCartStore()
const authStore = useAuthStore()
const q         = ref('')

// Count this browser once per day in the platform visitor stats
onMounted(trackVisit)

const showSearch = computed(() => route.path !== '/')

let dt
function debouncedSearch() {
  clearTimeout(dt)
  dt = setTimeout(() => { if (q.value.length >= 2) cartStore.searchProducts(q.value) }, 400)
}
function doSearch() {
  if (q.value.trim()) router.push({ path: '/recherche', query: { q: q.value.trim() } })
}
function requestLocation() {
  if (!navigator.geolocation) return
  navigator.geolocation.getCurrentPosition(
    pos => {
      cartStore.userLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude }
    },
    () => alert('Impossible d\'accéder à votre position.')
  )
}
</script>

<style>
/* ── Public CSS Variables ────────────────────────────── */
.pub-shell { min-height: 100vh; display: flex; flex-direction: column; background: #f8fafc; font-family: 'Inter', sans-serif; }
.pub-container { max-width: 1200px; margin: 0 auto; padding: 0 20px; width: 100%; }
.pub-header { background: #1a1a2e; border-bottom: 1px solid #16213e; position: sticky; top: 0; z-index: 100; }
.pub-header .pub-container { display: flex; align-items: center; gap: 16px; height: 64px; }
.pub-logo { display: flex; align-items: center; gap: 10px; text-decoration: none; flex-shrink: 0; }
.pub-logo-icon { width: 36px; height: 36px; border-radius: 9px; background: linear-gradient(135deg,#16a34a,#15803d); display: flex; align-items: center; justify-content: center; font-size: 1.1rem; }
.pub-logo-name { font-weight: 800; font-size: .95rem; color: white; line-height: 1.2; }
.pub-logo-name span { color: #4ade80; }
.pub-logo-sub { font-size: .65rem; color: #6b7280; font-weight: 500; }
.pub-header-center { flex: 1; max-width: 560px; }
.pub-search-bar { display: flex; align-items: center; background: white; border-radius: 99px; padding: 6px 6px 6px 14px; gap: 8px; border: 2px solid transparent; transition: border-color .15s; }
.pub-search-bar:focus-within { border-color: #16a34a; }
.pub-search-icon { color: #9ca3af; flex-shrink: 0; }
.pub-search-inp { flex: 1; border: none; outline: none; font-size: .875rem; font-family: 'Inter', sans-serif; background: transparent; }
.pub-search-clear { background: none; border: none; cursor: pointer; color: #9ca3af; font-size: .85rem; padding: 0 4px; display: flex; align-items: center; }
.pub-footer-contact { color: #9ca3af; font-size: .85rem; line-height: 1.8; }
.pub-footer-contact div { display: flex; align-items: center; gap: 8px; }
.pub-search-btn { background: #16a34a; color: white; border: none; border-radius: 99px; padding: 7px 16px; font-size: .8rem; font-weight: 700; cursor: pointer; white-space: nowrap; transition: background .12s; }
.pub-search-btn:hover { background: #15803d; }
.pub-header-right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.pub-loc-btn { display: flex; align-items: center; gap: 6px; background: transparent; border: 1px solid #374151; color: #9ca3af; border-radius: 99px; padding: 7px 14px; font-size: .78rem; font-weight: 600; cursor: pointer; transition: all .15s; white-space: nowrap; }
.pub-loc-btn:hover, .pub-loc-btn.active { border-color: #16a34a; color: #4ade80; }
.pub-cart-btn { display: flex; align-items: center; gap: 8px; background: #16a34a; color: white; border-radius: 99px; padding: 8px 18px; font-size: .85rem; font-weight: 700; text-decoration: none; position: relative; transition: background .12s; }
.pub-cart-btn:hover { background: #15803d; }
.pub-login-btn { display: flex; align-items: center; gap: 6px; background: transparent; border: 1px solid #4ade80; color: #4ade80; border-radius: 99px; padding: 7px 16px; font-size: .85rem; font-weight: 700; text-decoration: none; white-space: nowrap; transition: all .15s; }
.pub-login-btn:hover { background: #16a34a; border-color: #16a34a; color: white; }
.pub-cart-badge { background: #ef4444; color: white; border-radius: 50%; width: 20px; height: 20px; font-size: .68rem; font-weight: 800; display: flex; align-items: center; justify-content: center; }
.pub-main { flex: 1; }
.pub-footer { background: #111827; padding: 40px 0 20px; margin-top: auto; }
.pub-footer-grid { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 32px; }
/* ── Responsive ───────────────────────────────────── */
.pub-shell, .pub-shell *, .pub-shell *::before, .pub-shell *::after { box-sizing: border-box; }
.pub-shell { overflow-x: clip; }
.pub-shell input, .pub-shell select, .pub-shell textarea { max-width: 100%; }
.pub-search-btn { display: flex; align-items: center; justify-content: center; }
.pub-search-btn-icon { display: none; }
@media (max-width: 1024px) {
  .pub-logo-sub { display: none; }
  .pub-loc-btn .pub-btn-label { display: none; }
  .pub-loc-btn { padding: 8px 10px; }
}
@media (max-width: 768px) {
  .pub-container { padding: 0 16px; }
  .pub-header .pub-container { flex-wrap: wrap; height: auto; padding: 10px 16px; gap: 10px; }
  .pub-header-center { flex: 1 1 100%; max-width: none; order: 3; }
  .pub-header-center:not(:has(.pub-search-bar)) { display: none; }
  .pub-header-right { margin-left: auto; gap: 6px; }
  .pub-footer { padding: 28px 0 16px; }
  .pub-footer-grid { grid-template-columns: 1fr 1fr; gap: 20px; }
  .pub-footer-grid > div:first-child { grid-column: 1 / -1; }
}
@media (max-width: 560px) {
  .pub-btn-label { display: none; }
  .pub-cart-btn, .pub-login-btn { padding: 8px 10px; gap: 4px; }
  .pub-search-btn { padding: 8px 10px; }
  .pub-search-btn-text { display: none; }
  .pub-search-btn-icon { display: block; }
  .pub-shell input, .pub-shell select, .pub-shell textarea { font-size: 16px !important; } /* évite le zoom auto iOS */
  .pub-footer-grid { grid-template-columns: 1fr; }
  .pub-section-title { font-size: 1.3rem; }
}
@media (max-width: 360px) {
  .pub-container { padding: 0 12px; }
  .pub-header .pub-container { padding: 8px 12px; }
  .pub-logo-icon { width: 32px; height: 32px; }
  .pub-logo-name { font-size: .85rem; }
}
/* Pub cards */
.pub-card { background: white; border-radius: 14px; border: 1px solid #e5e7eb; overflow: hidden; transition: box-shadow .2s, transform .2s; }
.pub-card:hover { box-shadow: 0 8px 30px rgba(0,0,0,.1); transform: translateY(-2px); }
.pub-section-title { font-size: 1.5rem; font-weight: 800; color: #111827; margin-bottom: 4px; }
.pub-section-sub { font-size: .9rem; color: #6b7280; margin-bottom: 24px; }
.pub-badge-green { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; padding: 3px 10px; border-radius: 99px; font-size: .72rem; font-weight: 700; }
.pub-badge-red { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; padding: 3px 10px; border-radius: 99px; font-size: .72rem; font-weight: 700; }
.pub-badge-yellow { background: #fefce8; color: #ca8a04; border: 1px solid #fef08a; padding: 3px 10px; border-radius: 99px; font-size: .72rem; font-weight: 700; }
</style>
