<template>
  <div class="pub-page">
    <div class="pub-container">
      <!-- Search bar -->
      <div style="margin-bottom:24px;">
        <div class="pub-search-bar" style="max-width:600px;background:white;border:1px solid #e5e7eb;border-radius:12px;padding:8px;padding-inline-start:14px;display:flex;align-items:center;gap:10px;">
          <span style="display:flex;flex-shrink:0;color:#9ca3af;"><Search size="1em" /></span>
          <input v-model="query" class="pub-hero-inp" :placeholder="$t('pub.searchPlaceholder')" @keyup.enter="doSearch" style="flex:1;min-width:0;border:none;outline:none;font-size:.95rem;font-family:'Inter',sans-serif;"/>
          <button @click="doSearch" class="rc-search-btn">{{ $t('common.search') }}</button>
        </div>
        <p v-if="query" style="margin-top:8px;color:#6b7280;font-size:.85rem;">
          {{ loading ? $t('search.searching') : $t('search.resultsFor', { n: results.length, q: query }) }}
        </p>
      </div>

      <!-- Filters -->
      <div class="rc-filters">
        <select v-model="filterCity" class="pub-filter-select" @change="doSearch">
          <option value="">{{ $t('list.allCities') }}</option>
          <option v-for="c in cities" :key="c" :value="c">{{ c }}</option>
        </select>
        <label style="display:flex;align-items:center;gap:6px;font-size:.85rem;font-weight:500;cursor:pointer;background:white;border:1px solid #e5e7eb;border-radius:8px;padding:8px 14px;">
          <input type="checkbox" v-model="inStockOnly" @change="doSearch"/>
          {{ $t('profile.inStockOnly') }}
        </label>
        <button @click="locateMe" class="pub-btn-outline" style="font-size:.82rem;padding:8px 14px;">
          <MapPin size="1em" /> {{ cartStore.userLocation ? $t('search.nearestFirst') : $t('settings.useMyPosition') }}
        </button>
      </div>

      <!-- Loading -->
      <div v-if="loading" style="text-align:center;padding:60px;">
        <div style="width:32px;height:32px;border:3px solid #e5e7eb;border-top-color:#16a34a;border-radius:50%;animation:spin .6s linear infinite;margin:0 auto 16px;"></div>
        <p style="color:#6b7280;">{{ $t('search.searchingAll') }}</p>
      </div>

      <!-- No results -->
      <div v-else-if="query && !results.length" style="text-align:center;padding:60px;">
        <div style="font-size:3rem;margin-bottom:16px;"><Search size="1em" /></div>
        <h3 style="font-weight:700;font-size:1.1rem;margin-bottom:8px;">{{ $t('search.noResults', { q: query }) }}</h3>
        <p style="color:#6b7280;font-size:.875rem;">{{ $t('search.noResultsHelp') }}</p>
        <button @click="query='';results=[]" style="margin-top:16px;background:#f3f4f6;border:none;border-radius:8px;padding:10px 20px;cursor:pointer;font-weight:600;">{{ $t('search.clear') }}</button>
      </div>

      <!-- Results grouped by product -->
      <div v-else-if="results.length">
        <div v-for="group in groupedResults" :key="group.name" style="margin-bottom:28px;">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:12px;padding-bottom:10px;border-bottom:2px solid #f3f4f6;">
            <div style="display:flex;align-items:center;gap:12px;min-width:0;">
              <ProductImage :product="group.image" :size="52"/>
              <div style="min-width:0;overflow-wrap:anywhere;">
                <h3 style="font-weight:800;font-size:1.05rem;margin:0;">{{ group.name }}</h3>
                <span style="font-size:.78rem;color:#6b7280;">{{ $t('search.pharmaciesAvailable', { n: group.items.length }) }}</span>
              </div>
            </div>
            <span class="pub-badge-green" style="font-size:.72rem;">{{ group.category }}</span>
          </div>
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(min(280px,100%),1fr));gap:14px;">
            <div v-for="item in group.items" :key="item.id + '-' + item.pharmacyId" class="pub-card" style="padding:16px;">
              <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:12px;">
                <div style="min-width:0;overflow-wrap:anywhere;">
                  <div style="font-weight:700;font-size:.9rem;">{{ item.pharmacyName }}</div>
                  <div style="font-size:.75rem;color:#6b7280;margin-top:2px;"><MapPin size="1em" /> {{ item.pharmacyCity }}</div>
                  <div v-if="item.distance" style="font-size:.75rem;color:#16a34a;font-weight:600;margin-top:2px;">
                    <Navigation size="1em" /> {{ formatDistance(item.distance) }}
                  </div>
                </div>
                <span class="pub-badge-green" v-if="item.stock > 0">{{ $t('profile.nInStock', { n: item.stock }) }}</span>
                <span class="pub-badge-red" v-else>{{ $t('inventory.filterOut') }}</span>
              </div>

              <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;margin-bottom:12px;">
                <div style="font-family:'JetBrains Mono',monospace;font-size:1.2rem;font-weight:800;color:#16a34a;">
                  {{ fmtNum(item.sale_price) }} MRU
                </div>
                <div style="font-size:.75rem;color:#9ca3af;">
                  {{ $te('unitTypes', item.unit_type) }}{{ item.unit_quantity ? ' × '+item.unit_quantity : '' }}
                </div>
              </div>

              <div style="display:flex;gap:8px;">
                <button
                  @click="$router.push('/pharmacie/'+item.pharmacyId)"
                  class="pub-btn-outline"
                  style="flex:1;justify-content:center;font-size:.8rem;padding:8px;"
                >
                  {{ $t('search.seePharmacy') }}
                </button>
                <button
                  v-if="item.stock > 0"
                  @click="addToCart(item)"
                  style="flex:1;background:#16a34a;color:white;border:none;border-radius:8px;padding:8px;font-size:.8rem;font-weight:700;cursor:pointer;transition:background .12s;"
                  onmouseover="this.style.background='#15803d'" onmouseout="this.style.background='#16a34a'"
                >
                  <ShoppingCart size="1em" /> {{ $t('common.add') }}
                </button>
                <button v-else style="flex:1;background:#f3f4f6;color:#9ca3af;border:none;border-radius:8px;padding:8px;font-size:.8rem;font-weight:700;cursor:not-allowed;" disabled>
                  {{ $t('profile.unavailable') }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- No query -->
      <div v-else style="text-align:center;padding:60px;">
        <div style="font-size:3rem;margin-bottom:16px;"><Pill size="1em" /></div>
        <h3 style="font-weight:700;font-size:1.1rem;margin-bottom:8px;">{{ $t('search.emptyTitle') }}</h3>
        <p style="color:#6b7280;font-size:.875rem;max-width:400px;margin:0 auto;">{{ $t('search.emptyHelp') }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Search, MapPin, Navigation, ShoppingCart, Pill } from 'lucide-vue-next'
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCartStore } from '../../stores/cart.js'
import { useToastStore } from '../../stores/toast.js'
import ProductImage from '../../components/ProductImage.vue'
import { formatDistance } from '../../utils/geo.js'
import { t, fmtNum } from '../../i18n/index.js'

const route     = useRoute()
const router    = useRouter()
const cartStore = useCartStore()
const toast     = useToastStore()

const query      = ref(route.query.q || '')
const results    = ref([])
const loading    = ref(false)
const filterCity = ref('')
const inStockOnly = ref(false)

const cities = computed(() => [...new Set(results.value.map(r => r.pharmacyCity).filter(Boolean))])

const groupedResults = computed(() => {
  let list = results.value
  if (filterCity.value) list = list.filter(r => r.pharmacyCity === filterCity.value)
  if (inStockOnly.value) list = list.filter(r => r.stock > 0)
  const groups = {}
  list.forEach(item => {
    const key = item.name
    if (!groups[key]) groups[key] = { name: item.name, category: item.category?.name || '—', image: null, items: [] }
    if (!groups[key].image && item.image_updated_at) groups[key].image = item
    groups[key].items.push(item)
  })
  return Object.values(groups).sort((a, b) => b.items.length - a.items.length)
})

async function doSearch() {
  const q = query.value.trim()
  if (!q) { results.value = []; return }
  router.replace({ path: '/recherche', query: { q } })
  loading.value = true
  try {
    await cartStore.searchProducts(q)
    results.value = cartStore.searchResults
  } finally { loading.value = false }
}

function addToCart(item) {
  cartStore.addItem(
    { id: item.productId || item.id, name: item.name, sale_price: item.sale_price, stock: item.stock, unit_type: item.unit_type, image_updated_at: item.image_updated_at },
    item.pharmacyId,
    item.pharmacyName
  )
  toast.success(`${t('profile.addedToCart', { name: item.name })} (${item.pharmacyName})`)
}

function locateMe() {
  if (!navigator.geolocation) return
  navigator.geolocation.getCurrentPosition(pos => {
    cartStore.userLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude }
    if (query.value) doSearch()
  })
}

watch(() => route.query.q, val => { if (val) { query.value = val; doSearch() } })
onMounted(() => { if (query.value) doSearch() })
</script>

<style scoped>
.pub-filter-select { padding: 8px 14px; border: 1px solid #e5e7eb; border-radius: 8px; font-size: .85rem; background: white; cursor: pointer; outline: none; font-family: 'Inter', sans-serif; }
.pub-filter-select:focus { border-color: #16a34a; }
.pub-btn-outline { display: inline-flex; align-items: center; justify-content: center; gap: 6px; background: white; color: #374151; border: 1px solid #d1d5db; border-radius: 8px; padding: 9px 18px; font-size: .875rem; font-weight: 600; cursor: pointer; text-decoration: none; transition: all .12s; font-family: 'Inter', sans-serif; }
.pub-btn-outline:hover { border-color: #16a34a; color: #16a34a; }
@keyframes spin { to { transform: rotate(360deg); } }
.pub-page { padding: 32px 0; }
.rc-search-btn { background: #16a34a; color: white; border: none; border-radius: 8px; padding: 8px 18px; font-weight: 700; cursor: pointer; white-space: nowrap; flex-shrink: 0; }
.rc-filters { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 24px; }
@media (max-width: 640px) {
  .pub-page { padding: 20px 0; }
  .rc-search-btn { padding: 8px 12px; font-size: .85rem; }
  .rc-filters > * { flex: 1 1 auto; justify-content: center; }
}
</style>
