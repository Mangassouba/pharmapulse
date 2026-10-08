<template>
  <div class="pub-page">
    <div class="pub-container">
      <div style="margin-bottom:20px;">
        <h1 class="pub-section-title">{{ $t('pub.footer.allPharmacies') }}</h1>
        <p class="pub-section-sub">{{ $t('list.count', { n: cartStore.pharmacies.length }) }}</p>
      </div>

      <div class="lp-filters">
        <div class="lp-search">
          <span style="position:absolute;inset-inline-start:11px;top:50%;transform:translateY(-50%);color:#9ca3af;"><Search size="1em" /></span>
          <input v-model="search" style="width:100%;padding:9px 12px;padding-inline-start:36px;border:1px solid #e5e7eb;border-radius:9px;font-size:.875rem;outline:none;font-family:'Inter',sans-serif;box-sizing:border-box;" :placeholder="$t('super.ph.searchPh')"/>
        </div>
        <select v-model="filterCity" style="padding:8px 14px;border:1px solid #e5e7eb;border-radius:8px;font-size:.85rem;background:white;cursor:pointer;outline:none;font-family:'Inter',sans-serif;">
          <option value="">{{ $t('list.allCities') }}</option>
          <option v-for="c in cities" :key="c" :value="c">{{ c }}</option>
        </select>
        <label style="display:flex;align-items:center;gap:6px;padding:8px 14px;border:1px solid #e5e7eb;border-radius:8px;font-size:.85rem;background:white;cursor:pointer;user-select:none;"
          :style="onDutyOnly ? 'background:#eef2ff;border-color:#c7d2fe;color:#4338ca;' : ''">
          <input type="checkbox" v-model="onDutyOnly"/> <Moon size="1em" /> {{ $t('list.onDutyToday') }}
        </label>
        <button @click="locateMe" style="display:flex;align-items:center;gap:6px;background:white;color:#374151;border:1px solid #d1d5db;border-radius:8px;padding:9px 16px;font-size:.85rem;font-weight:600;cursor:pointer;transition:all .12s;" onmouseover="this.style.borderColor='#16a34a';this.style.color='#16a34a'" onmouseout="this.style.borderColor='#d1d5db';this.style.color='#374151'">
          <MapPin size="1em" /> {{ cartStore.userLocation ? $t('list.nearMe') : $t('pub.locateMe') }}
        </button>
      </div>

      <div v-if="cartStore.loading" style="text-align:center;padding:60px;color:#6b7280;">
        <div style="width:28px;height:28px;border:3px solid #e5e7eb;border-top-color:#16a34a;border-radius:50%;animation:spin .6s linear infinite;margin:0 auto 12px;"></div> {{ $t('common.loading') }}
      </div>
      <div v-else-if="!filtered.length" style="text-align:center;padding:60px;">
        <div style="font-size:2.5rem;margin-bottom:12px;"><Hospital size="1em" /></div>
        <p style="color:#6b7280;">{{ $t('super.ph.none') }}</p>
      </div>
      <div v-else class="lp-grid">
        <div v-for="ph in filtered" :key="ph.id" class="pub-card">
          <div class="lp-card-body">
            <div class="lp-card-head">
              <div style="width:50px;height:50px;border-radius:14px;background:linear-gradient(135deg,#f0fdf4,#dcfce7);border:1px solid #bbf7d0;display:flex;align-items:center;justify-content:center;font-size:1.5rem;flex-shrink:0;overflow:hidden;" :style="pharmacyLogoUrl(ph) ? 'background:#fff;' : ''"><img v-if="pharmacyLogoUrl(ph)" :src="pharmacyLogoUrl(ph)" :alt="ph.name" style="width:100%;height:100%;object-fit:contain;"/><Hospital v-else size="1em" /></div>
              <div style="flex:1;min-width:0;">
                <div style="font-weight:700;font-size:1rem;margin-bottom:3px;">{{ ph.name }}</div>
                <div style="font-size:.78rem;color:#6b7280;"><MapPin size="1em" /> {{ [ph.address, ph.city, ph.country].filter(Boolean).join(', ') || $t('pub.defaultCountry') }}</div>
                <div v-if="ph.distance" style="font-size:.75rem;color:#16a34a;font-weight:600;margin-top:3px;"><Navigation size="1em" /> {{ formatDistance(ph.distance) }}</div>
              </div>
              <div class="lp-card-badges">
                <span class="pub-badge-green" style="font-size:.65rem;">{{ $t('pub.open') }}</span>
                <DutyBadge :pharmacy="ph"/>
              </div>
            </div>

            <div style="display:flex;gap:8px;font-size:.8rem;color:#6b7280;margin-bottom:14px;flex-wrap:wrap;overflow-wrap:anywhere;">
              <span v-if="ph.phone"><Phone size="1em" /> <span class="mono-ltr">{{ ph.phone }}</span></span>
              <span v-if="ph.email"><Mail size="1em" /> {{ ph.email }}</span>
            </div>

            <div v-if="ph.duty_days?.length" style="font-size:.78rem;color:#4338ca;margin:-6px 0 14px;">
              <Moon size="1em" /> {{ $t('list.onDutyLabel') }} {{ formatDutyDays(ph.duty_days) }} · {{ formatDutyHours(ph) }}
            </div>

            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:14px;">
              <div style="background:#f0fdf4;border-radius:8px;padding:8px;text-align:center;">
                <div style="font-family:'JetBrains Mono',monospace;font-weight:800;color:#16a34a;font-size:1.1rem;">{{ ph._count?.products ?? '—' }}</div>
                <div style="font-size:.65rem;color:#6b7280;margin-top:2px;">{{ $t('nav.products') }}</div>
              </div>
              <div style="background:#eff6ff;border-radius:8px;padding:8px;text-align:center;">
                <div style="font-family:'JetBrains Mono',monospace;font-weight:800;color:#2563eb;font-size:.9rem;">{{ ph.subscription?.plan || 'FREE' }}</div>
                <div style="font-size:.65rem;color:#6b7280;margin-top:2px;">{{ $t('super.ph.subscription') }}</div>
              </div>
              <div style="background:#f5f3ff;border-radius:8px;padding:8px;text-align:center;">
                <div style="font-family:'JetBrains Mono',monospace;font-weight:800;color:#7c3aed;font-size:.9rem;">{{ ph._count?.users ?? '—' }}</div>
                <div style="font-size:.65rem;color:#6b7280;margin-top:2px;">{{ $t('list.team') }}</div>
              </div>
            </div>

            <RouterLink :to="'/pharmacie/'+ph.id" style="display:flex;align-items:center;justify-content:center;gap:8px;background:#16a34a;color:white;border-radius:10px;padding:11px;font-weight:700;text-decoration:none;font-size:.875rem;transition:background .12s;" onmouseover="this.style.background='#15803d'" onmouseout="this.style.background='#16a34a'">
              {{ $t('pub.seeProducts') }}
            </RouterLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Search, Moon, MapPin, Hospital, Navigation, Phone, Mail } from 'lucide-vue-next'
import { ref, computed, onMounted } from 'vue'
import { useCartStore } from '../../stores/cart.js'
import { dutyStatus, formatDutyDays, formatDutyHours } from '../../utils/duty.js'
import DutyBadge from '../../components/DutyBadge.vue'
import { pharmacyLogoUrl } from '../../utils/logo.js'
import { formatDistance } from '../../utils/geo.js'

const cartStore = useCartStore()
const search    = ref('')
const filterCity = ref('')
const onDutyOnly = ref(false)

const cities = computed(() => [...new Set(cartStore.pharmacies.map(p => p.city).filter(Boolean))])

const filtered = computed(() => {
  const q = search.value.toLowerCase()
  const c = filterCity.value
  return cartStore.pharmacies.filter(p => {
    const mQ = !q || p.name.toLowerCase().includes(q) || p.city?.toLowerCase().includes(q)
    const mC = !c || p.city === c
    const mD = !onDutyOnly.value || dutyStatus(p) !== null
    return mQ && mC && mD
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
.pub-page { padding: 32px 0; }
.lp-filters { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 24px; }
.lp-filters > * { flex-shrink: 0; }
.lp-search { position: relative; flex: 1 1 220px; max-width: 300px; }
.lp-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(320px, 100%), 1fr)); gap: 18px; }
.lp-card-body { padding: 20px; }
.lp-card-head { display: flex; align-items: flex-start; gap: 14px; margin-bottom: 14px; }
.lp-card-badges { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; flex-shrink: 0; }
@media (max-width: 640px) {
  .pub-page { padding: 20px 0; }
  .lp-search { flex-basis: 100%; max-width: none; }
  .lp-filters > :not(.lp-search) { flex: 1 1 auto; justify-content: center; }
  .lp-grid { gap: 12px; }
  .lp-card-body { padding: 16px; }
  .lp-card-head { flex-wrap: wrap; gap: 12px; }
  .lp-card-badges { flex-direction: row; flex-wrap: wrap; align-items: center; flex-basis: 100%; }
}
</style>
