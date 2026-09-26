<template>
  <div style="padding:32px 0;">
    <div class="pub-container">
      <div style="margin-bottom:28px;">
        <h1 class="pub-section-title">Toutes les pharmacies</h1>
        <p class="pub-section-sub">{{ cartStore.pharmacies.length }} pharmacie(s) partenaire(s) disponible(s)</p>
      </div>

      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:24px;">
        <div style="position:relative;flex:1;max-width:300px;">
          <span style="position:absolute;left:11px;top:50%;transform:translateY(-50%);color:#9ca3af;">🔍</span>
          <input v-model="search" style="width:100%;padding:9px 12px 9px 36px;border:1px solid #e5e7eb;border-radius:9px;font-size:.875rem;outline:none;font-family:'Inter',sans-serif;box-sizing:border-box;" placeholder="Rechercher une pharmacie..."/>
        </div>
        <select v-model="filterCity" style="padding:8px 14px;border:1px solid #e5e7eb;border-radius:8px;font-size:.85rem;background:white;cursor:pointer;outline:none;font-family:'Inter',sans-serif;">
          <option value="">Toutes les villes</option>
          <option v-for="c in cities" :key="c" :value="c">{{ c }}</option>
        </select>
        <button @click="locateMe" style="display:flex;align-items:center;gap:6px;background:white;color:#374151;border:1px solid #d1d5db;border-radius:8px;padding:9px 16px;font-size:.85rem;font-weight:600;cursor:pointer;transition:all .12s;" onmouseover="this.style.borderColor='#16a34a';this.style.color='#16a34a'" onmouseout="this.style.borderColor='#d1d5db';this.style.color='#374151'">
          📍 {{ cartStore.userLocation ? 'Proches de moi' : 'Me localiser' }}
        </button>
      </div>

      <div v-if="cartStore.loading" style="text-align:center;padding:60px;color:#6b7280;">
        <div style="width:28px;height:28px;border:3px solid #e5e7eb;border-top-color:#16a34a;border-radius:50%;animation:spin .6s linear infinite;margin:0 auto 12px;"></div> Chargement...
      </div>
      <div v-else-if="!filtered.length" style="text-align:center;padding:60px;">
        <div style="font-size:2.5rem;margin-bottom:12px;">🏥</div>
        <p style="color:#6b7280;">Aucune pharmacie trouvée.</p>
      </div>
      <div v-else style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:18px;">
        <div v-for="ph in filtered" :key="ph.id" class="pub-card">
          <div style="padding:20px;">
            <div style="display:flex;align-items:flex-start;gap:14px;margin-bottom:14px;">
              <div style="width:50px;height:50px;border-radius:14px;background:linear-gradient(135deg,#f0fdf4,#dcfce7);border:1px solid #bbf7d0;display:flex;align-items:center;justify-content:center;font-size:1.5rem;flex-shrink:0;">🏥</div>
              <div style="flex:1;min-width:0;">
                <div style="font-weight:700;font-size:1rem;margin-bottom:3px;">{{ ph.name }}</div>
                <div style="font-size:.78rem;color:#6b7280;">📍 {{ [ph.address, ph.city, ph.country].filter(Boolean).join(', ') || 'Sénégal' }}</div>
                <div v-if="ph.distance" style="font-size:.75rem;color:#16a34a;font-weight:600;margin-top:3px;">🗺️ {{ ph.distance < 1 ? (ph.distance*1000).toFixed(0)+'m' : ph.distance.toFixed(1)+'km' }}</div>
              </div>
              <span class="pub-badge-green" style="flex-shrink:0;font-size:.65rem;">OUVERTE</span>
            </div>

            <div style="display:flex;gap:8px;font-size:.8rem;color:#6b7280;margin-bottom:14px;flex-wrap:wrap;">
              <span v-if="ph.phone">📞 {{ ph.phone }}</span>
              <span v-if="ph.email">📧 {{ ph.email }}</span>
            </div>

            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:14px;">
              <div style="background:#f0fdf4;border-radius:8px;padding:8px;text-align:center;">
                <div style="font-family:'JetBrains Mono',monospace;font-weight:800;color:#16a34a;font-size:1.1rem;">{{ ph._count?.products ?? '—' }}</div>
                <div style="font-size:.65rem;color:#6b7280;margin-top:2px;">Produits</div>
              </div>
              <div style="background:#eff6ff;border-radius:8px;padding:8px;text-align:center;">
                <div style="font-family:'JetBrains Mono',monospace;font-weight:800;color:#2563eb;font-size:.9rem;">{{ ph.subscription?.plan || 'FREE' }}</div>
                <div style="font-size:.65rem;color:#6b7280;margin-top:2px;">Abonnement</div>
              </div>
              <div style="background:#f5f3ff;border-radius:8px;padding:8px;text-align:center;">
                <div style="font-family:'JetBrains Mono',monospace;font-weight:800;color:#7c3aed;font-size:.9rem;">{{ ph._count?.users ?? '—' }}</div>
                <div style="font-size:.65rem;color:#6b7280;margin-top:2px;">Équipe</div>
              </div>
            </div>

            <RouterLink :to="'/pharmacie/'+ph.id" style="display:flex;align-items:center;justify-content:center;gap:8px;background:#16a34a;color:white;border-radius:10px;padding:11px;font-weight:700;text-decoration:none;font-size:.875rem;transition:background .12s;" onmouseover="this.style.background='#15803d'" onmouseout="this.style.background='#16a34a'">
              Voir les produits →
            </RouterLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useCartStore } from '../../stores/cart.js'

const cartStore = useCartStore()
const search    = ref('')
const filterCity = ref('')

const cities = computed(() => [...new Set(cartStore.pharmacies.map(p => p.city).filter(Boolean))])

const filtered = computed(() => {
  const q = search.value.toLowerCase()
  const c = filterCity.value
  return cartStore.pharmacies.filter(p => {
    const mQ = !q || p.name.toLowerCase().includes(q) || p.city?.toLowerCase().includes(q)
    const mC = !c || p.city === c
    return mQ && mC
  })
})

function locateMe() {
  if (!navigator.geolocation) return
  navigator.geolocation.getCurrentPosition(pos => {
    cartStore.userLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude }
    cartStore.fetchPharmacies(pos.coords.latitude, pos.coords.longitude)
  })
}

onMounted(() => cartStore.fetchPharmacies(cartStore.userLocation?.lat, cartStore.userLocation?.lng))
</script>

<style scoped>
@keyframes spin { to { transform: rotate(360deg); } }
</style>
