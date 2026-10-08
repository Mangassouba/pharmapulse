<template>
  <div style="padding:0;">
    <!-- Pharmacy header -->
    <div class="pp-hero">
      <div class="pub-container">
        <div v-if="loading" style="text-align:center;padding:20px;color:#6b7280;">{{ $t('common.loading') }}</div>
        <div v-else-if="pharmacy" class="pp-hero-row">
          <div class="pp-hero-icon" :style="pharmacyLogoUrl(pharmacy) ? 'background:#fff;overflow:hidden;' : ''"><img v-if="pharmacyLogoUrl(pharmacy)" :src="pharmacyLogoUrl(pharmacy)" :alt="pharmacy.name" style="width:100%;height:100%;object-fit:contain;"/><Hospital v-else size="1em" /></div>
          <div style="flex:1;min-width:0;overflow-wrap:anywhere;">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px;flex-wrap:wrap;">
              <h1 class="pp-title">{{ pharmacy.name }}</h1>
              <span class="pub-badge-green">{{ $t('profile.partner') }}</span>
              <DutyBadge :pharmacy="pharmacy"/>
            </div>
            <div style="color:#6b7280;font-size:.875rem;display:flex;gap:6px 16px;flex-wrap:wrap;margin-top:6px;">
              <span><MapPin size="1em" /> {{ pharmacy.address || pharmacy.city || $t('pub.defaultCountry') }}</span>
              <span v-if="pharmacy.phone"><Phone size="1em" /> <span class="mono-ltr">{{ pharmacy.phone }}</span></span>
              <span v-if="pharmacy.email"><Mail size="1em" /> {{ pharmacy.email }}</span>
            </div>
            <div v-if="pharmacy.duty_days?.length" style="font-size:.85rem;color:#4338ca;margin-top:6px;">
              <Moon size="1em" /> {{ $t('profile.onDutyEvery') }} <strong>{{ formatDutyDays(pharmacy.duty_days) }}</strong> · <strong>{{ formatDutyHours(pharmacy) }}</strong>
            </div>
            <div v-if="pharmacy._count" style="display:flex;gap:16px;margin-top:12px;flex-wrap:wrap;">
              <div style="text-align:center;padding:8px 16px;background:#f9fafb;border-radius:8px;">
                <div style="font-weight:800;font-family:'JetBrains Mono',monospace;color:#16a34a;">{{ pharmacy._count.products }}</div>
                <div style="font-size:.7rem;color:#6b7280;">{{ $t('nav.products') }}</div>
              </div>
            </div>
          </div>
          <div class="pp-hero-actions">
            <a v-if="routeUrl" :href="routeUrl" target="_blank" rel="noopener" class="pub-btn-outline pp-btn-route" style="font-size:.8rem;"><Navigation size="1em" /> {{ $t('profile.directions') }}</a>
            <template v-if="hasPosition(pharmacy)">
              <div v-if="distance !== null" class="pp-distance"><MapPin size="1em" /> {{ $t('profile.distanceFromYou', { d: formatDistance(distance) }) }}</div>
              <button v-else @click="locateMe" class="pub-btn-outline" style="font-size:.8rem;" :disabled="locating"><MapPin size="1em" /> {{ locating ? $t('settings.locating') : $t('profile.computeDistance') }}</button>
            </template>
          </div>
        </div>
        <PharmacyMap v-if="pharmacy && hasPosition(pharmacy)" :lat="pharmacy.latitude" :lng="pharmacy.longitude" :height="200" style="margin-top:16px;"/>
      </div>
    </div>

    <div class="pub-container pp-body">
      <div class="pp-layout">
        <!-- Sidebar filters -->
        <aside class="pp-aside">
          <div class="pp-box">
            <h3 style="font-weight:700;font-size:.9rem;margin:0 0 14px;">{{ $t('nav.categories') }}</h3>
            <div class="pp-cats">
              <button @click="selectCat('')" :style="`text-align:start;padding:8px 12px;border-radius:8px;border:none;cursor:pointer;font-size:.85rem;font-weight:${!filterCat?700:500};background:${!filterCat?'#f0fdf4':'transparent'};color:${!filterCat?'#16a34a':'#374151'};`">{{ $t('profile.allProducts') }}</button>
              <button v-for="cat in categories" :key="cat.id" @click="selectCat(cat.id)" :style="`text-align:start;padding:8px 12px;border-radius:8px;border:none;cursor:pointer;font-size:.85rem;font-weight:${filterCat===cat.id?700:500};background:${filterCat===cat.id?'#f0fdf4':'transparent'};color:${filterCat===cat.id?'#16a34a':'#374151'};`">
                {{ cat.name }}
                <span style="float:inline-end;font-size:.75rem;color:#9ca3af;">{{ cat._count?.produit || '' }}</span>
              </button>
            </div>
          </div>

          <div class="pp-box pp-filters">
            <h3 style="font-weight:700;font-size:.9rem;margin:0 0 12px;">{{ $t('profile.filters') }}</h3>
            <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:.85rem;">
              <input type="checkbox" v-model="inStockOnly" @change="page=1;fetchProds()"/>
              {{ $t('profile.inStockOnly') }}
            </label>
            <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:.85rem;">
              <input type="checkbox" v-model="withoutPrescription" @change="page=1;fetchProds()"/>
              {{ $t('profile.noPrescription') }}
            </label>
          </div>
        </aside>

        <!-- Products grid -->
        <div style="min-width:0;">
          <!-- Search + sort -->
          <div style="display:flex;gap:10px;margin-bottom:20px;flex-wrap:wrap;">
            <div style="flex:1 1 200px;min-width:0;position:relative;">
              <span style="position:absolute;inset-inline-start:11px;top:50%;transform:translateY(-50%);color:#9ca3af;"><Search size="1em" /></span>
              <input v-model="searchP" class="pub-hero-inp" :placeholder="$t('profile.searchPh')" style="width:100%;padding:9px 12px;padding-inline-start:36px;border:1px solid #e5e7eb;border-radius:9px;font-size:.875rem;outline:none;font-family:'Inter',sans-serif;" @input="debouncedFetch"/>
            </div>
            <select v-model="sortBy" class="pub-filter-select" @change="page=1;fetchProds()">
              <option value="name">{{ $t('profile.sort.name') }}</option>
              <option value="price_asc">{{ $t('profile.sort.priceAsc') }}</option>
              <option value="price_desc">{{ $t('profile.sort.priceDesc') }}</option>
              <option value="stock">{{ $t('profile.sort.stock') }}</option>
            </select>
            <span style="display:flex;align-items:center;font-size:.82rem;color:#6b7280;">{{ $t('categories.productCount', { n: meta.total || 0 }) }}</span>
          </div>

          <div v-if="loadingProds" style="text-align:center;padding:40px;color:#6b7280;">
            <div style="width:28px;height:28px;border:3px solid #e5e7eb;border-top-color:#16a34a;border-radius:50%;animation:spin .6s linear infinite;margin:0 auto 12px;"></div>
          </div>
          <div v-else-if="!products.length" style="text-align:center;padding:40px;">
            <div style="font-size:2.5rem;margin-bottom:12px;"><Package size="1em" /></div>
            <p style="color:#6b7280;">{{ $t('profile.noProduct') }}</p>
          </div>
          <div v-else class="pp-grid">
            <div v-for="p in products" :key="p.id" class="pub-card">
              <div v-if="p.image_updated_at" class="pp-prod-img"><ProductImage :product="p" :size="120"/></div>
              <div style="padding:16px;">
                <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:6px;margin-bottom:10px;">
                  <div style="min-width:0;overflow-wrap:anywhere;">
                    <div style="font-weight:700;font-size:.9rem;line-height:1.3;">{{ p.name }}</div>
                    <div style="font-size:.72rem;color:#6b7280;margin-top:3px;">{{ p.category?.name }}</div>
                    <div v-if="p.prescription_req" style="font-size:.68rem;color:#2563eb;font-weight:600;margin-top:3px;"><Stethoscope size="1em" /> {{ $t('profile.prescription') }}</div>
                  </div>
                  <span :class="p.stock===0?'pub-badge-red':p.stock<p.threshold?'pub-badge-yellow':'pub-badge-green'" style="flex-shrink:0;font-size:.65rem;">
                    {{ p.stock===0?$t('stock.out'):p.stock<p.threshold?$t('stock.low'):$t('profile.nInStock', { n: p.stock }) }}
                  </span>
                </div>

                <div style="display:flex;align-items:center;justify-content:space-between;gap:6px;flex-wrap:wrap;margin-bottom:12px;">
                  <div style="font-family:'JetBrains Mono',monospace;font-size:1.15rem;font-weight:800;color:#16a34a;">
                    {{ fmtNum(p.sale_price) }} MRU
                  </div>
                  <div style="font-size:.72rem;color:#9ca3af;">{{ $te('unitTypes', p.unit_type) }}{{ p.unit_quantity ? ' ×'+p.unit_quantity : '' }}</div>
                </div>

                <!-- Qty selector -->
                <div v-if="p.stock > 0" style="display:flex;gap:8px;align-items:center;">
                  <div style="display:flex;align-items:center;gap:4px;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
                    <button @click="decQty(p)" style="width:32px;height:32px;border:none;background:#f9fafb;cursor:pointer;font-weight:700;font-size:1rem;">−</button>
                    <span style="width:28px;text-align:center;font-family:'JetBrains Mono',monospace;font-weight:700;font-size:.875rem;">{{ qty[p.id] || 1 }}</span>
                    <button @click="incQty(p)" style="width:32px;height:32px;border:none;background:#f9fafb;cursor:pointer;font-weight:700;font-size:1rem;" :disabled="(qty[p.id]||1)>=p.stock">+</button>
                  </div>
                  <button @click="addToCart(p)" style="flex:1;background:#16a34a;color:white;border:none;border-radius:8px;padding:8px;font-size:.8rem;font-weight:700;cursor:pointer;transition:background .12s;" onmouseover="this.style.background='#15803d'" onmouseout="this.style.background='#16a34a'">
                    <ShoppingCart size="1em" /> {{ $t('common.add') }}
                  </button>
                </div>
                <button v-else style="width:100%;background:#f3f4f6;color:#9ca3af;border:none;border-radius:8px;padding:9px;font-size:.8rem;font-weight:700;cursor:not-allowed;" disabled>
                  {{ $t('profile.unavailable') }}
                </button>
              </div>
            </div>
          </div>

          <!-- Pagination -->
          <div v-if="meta.totalPages > 1" style="display:flex;align-items:center;justify-content:center;gap:8px;margin-top:24px;">
            <button :disabled="page===1" @click="page--;fetchProds()" style="width:36px;height:36px;border-radius:8px;border:1px solid #e5e7eb;background:white;cursor:pointer;font-weight:700;" :style="page===1?'opacity:.4;cursor:not-allowed':''">‹</button>
            <span style="font-size:.85rem;color:#6b7280;">{{ $t('common.page') }} {{ page }} / {{ meta.totalPages }}</span>
            <button :disabled="page>=meta.totalPages" @click="page++;fetchProds()" style="width:36px;height:36px;border-radius:8px;border:1px solid #e5e7eb;background:white;cursor:pointer;font-weight:700;" :style="page>=meta.totalPages?'opacity:.4;cursor:not-allowed':''">›</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Hospital, MapPin, Phone, Mail, Moon, Search, Package, Stethoscope, ShoppingCart, Navigation } from 'lucide-vue-next'
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useCartStore } from '../../stores/cart.js'
import { useToastStore } from '../../stores/toast.js'
import { formatDutyDays, formatDutyHours } from '../../utils/duty.js'
import DutyBadge from '../../components/DutyBadge.vue'
import ProductImage from '../../components/ProductImage.vue'
import { pharmacyLogoUrl } from '../../utils/logo.js'
import { distanceKm, formatDistance, hasPosition, directionsUrl, getCurrentPosition } from '../../utils/geo.js'
import PharmacyMap from '../../components/PharmacyMap.vue'
import { t, fmtNum } from '../../i18n/index.js'

const route     = useRoute()
const cartStore = useCartStore()
const toast     = useToastStore()

const pharmacy   = ref(null)
const products   = ref([])
const categories = ref([])
const meta       = ref({ total:0, totalPages:1 })
const loading    = ref(false)
const loadingProds = ref(false)
const filterCat  = ref('')
const inStockOnly = ref(false)
const withoutPrescription = ref(false)
const searchP    = ref('')
const sortBy     = ref('name')
const page       = ref(1)
const qty        = ref({})

function incQty(p) { qty.value[p.id] = Math.min((qty.value[p.id]||1)+1, p.stock) }
function decQty(p) { qty.value[p.id] = Math.max(1, (qty.value[p.id]||1)-1) }

let dt
function debouncedFetch() { clearTimeout(dt); dt = setTimeout(() => { page.value = 1; fetchProds() }, 400) }

async function fetchProds() {
  loadingProds.value = true
  const params = { page: page.value, pageSize: 12, sortBy: sortBy.value }
  if (searchP.value)         params.search = searchP.value
  if (filterCat.value)       params.categoryId = filterCat.value
  if (inStockOnly.value)     params.inStock = 'true'
  if (withoutPrescription.value) params.prescriptionReq = 'false'
  try {
    const res = await cartStore.fetchPharmacyProducts(route.params.id, params)
    products.value  = res.data || []
    meta.value      = res.meta || { total:0, totalPages:1 }
    // Extract categories from products — fusion pour ne pas perdre les catégories quand un filtre est actif
    const catMap = Object.fromEntries(categories.value.map(c => [c.id, c]))
    products.value.forEach(p => { if (p.category) catMap[p.category.id] = p.category })
    categories.value = Object.values(catMap)
  } finally { loadingProds.value = false }
}

function selectCat(id) {
  filterCat.value = id
  page.value = 1
  fetchProds()
}

function addToCart(p) {
  cartStore.addItem(
    { id: p.id, name: p.name, sale_price: p.sale_price, stock: p.stock, unit_type: p.unit_type, image_updated_at: p.image_updated_at },
    parseInt(route.params.id),
    pharmacy.value?.name || t('receipt.pharmacy')
  )
  toast.success(t('profile.addedToCart', { name: p.name }))
  qty.value[p.id] = 1
}

const locating = ref(false)
const routeUrl = computed(() => pharmacy.value && directionsUrl(pharmacy.value))
// Distance from the visitor, once their position is known (here or on another public page)
const distance = computed(() => {
  const u = cartStore.userLocation
  if (!u || !hasPosition(pharmacy.value)) return null
  return distanceKm(u.lat, u.lng, pharmacy.value.latitude, pharmacy.value.longitude)
})

async function locateMe() {
  locating.value = true
  try {
    const { lat, lng } = await getCurrentPosition()
    cartStore.userLocation = { lat, lng }
  } catch (e) {
    toast.error(e.message)
  } finally { locating.value = false }
}

onMounted(async () => {
  loading.value = true
  try {
    pharmacy.value = await cartStore.fetchPharmacyDetail(route.params.id)
  } finally { loading.value = false }
  await fetchProds()
})
</script>

<style scoped>
.pub-filter-select { padding: 8px 14px; border: 1px solid #e5e7eb; border-radius: 8px; font-size: .85rem; background: white; cursor: pointer; outline: none; font-family: 'Inter', sans-serif; }
.pub-btn-outline { display: inline-flex; align-items: center; gap: 6px; background: white; color: #374151; border: 1px solid #d1d5db; border-radius: 8px; padding: 9px 18px; font-size: .875rem; font-weight: 600; cursor: pointer; text-decoration: none; transition: all .12s; font-family: 'Inter', sans-serif; }
.pub-btn-outline:hover { border-color: #16a34a; color: #16a34a; }
@keyframes spin { to { transform: rotate(360deg); } }

.pp-hero { background: white; border-bottom: 1px solid #e5e7eb; padding: 28px 0; }
.pp-hero-row { display: flex; align-items: flex-start; gap: 20px; flex-wrap: wrap; }
.pp-hero-icon { width: 64px; height: 64px; border-radius: 16px; background: linear-gradient(135deg,#f0fdf4,#dcfce7); border: 2px solid #bbf7d0; display: flex; align-items: center; justify-content: center; font-size: 2rem; flex-shrink: 0; }
.pp-title { font-weight: 800; font-size: 1.4rem; margin: 0; }
.pp-hero-actions { display: flex; flex-direction: column; gap: 8px; }
.pp-btn-route { background: #16a34a; color: white; border-color: #16a34a; justify-content: center; }
.pp-btn-route:hover { background: #15803d; color: white; }
.pp-distance { font-size: .85rem; font-weight: 700; color: #16a34a; text-align: center; padding: 6px 0; }
.pp-body { padding-top: 28px; padding-bottom: 40px; }
.pp-layout { display: grid; grid-template-columns: 220px minmax(0, 1fr); gap: 24px; align-items: start; }
.pp-aside { position: sticky; top: 80px; }
.pp-box { background: white; border-radius: 12px; border: 1px solid #e5e7eb; padding: 18px; }
.pp-cats { display: flex; flex-direction: column; gap: 4px; }
.pp-filters { margin-top: 12px; }
.pp-filters label + label { margin-top: 10px; }
.pp-prod-img { display: flex; justify-content: center; padding: 14px 16px 0; }
.pp-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(220px, 100%), 1fr)); gap: 14px; }

@media (max-width: 860px) {
  .pp-layout { grid-template-columns: minmax(0, 1fr); gap: 16px; }
  .pp-aside { position: static; display: flex; flex-direction: column; gap: 10px; min-width: 0; }
  .pp-box { padding: 12px 14px; }
  .pp-box h3 { display: none; }
  .pp-filters { margin-top: 0; display: flex; flex-wrap: wrap; gap: 8px 18px; }
  .pp-filters label + label { margin-top: 0; }
  /* Catégories en barre de chips défilante */
  .pp-cats { flex-direction: row; overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: none; gap: 6px; }
  .pp-cats::-webkit-scrollbar { display: none; }
  .pp-cats > button { flex-shrink: 0; white-space: nowrap; border: 1px solid #e5e7eb !important; border-radius: 99px !important; }
  .pp-cats > button span { float: none !important; margin-inline-start: 6px; }
}
@media (max-width: 640px) {
  .pp-hero { padding: 18px 0; }
  .pp-hero-row { gap: 12px; }
  .pp-hero-icon { width: 48px; height: 48px; font-size: 1.5rem; border-radius: 12px; }
  .pp-title { font-size: 1.15rem; }
  .pp-hero-actions { flex-basis: 100%; }
  .pp-hero-actions .pub-btn-outline { justify-content: center; }
  .pp-body { padding-top: 16px; padding-bottom: 28px; }
}
</style>
