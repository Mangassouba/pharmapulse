<template>
  <div style="padding:0;">
    <!-- Pharmacy header -->
    <div style="background:white;border-bottom:1px solid #e5e7eb;padding:28px 0;">
      <div class="pub-container">
        <div v-if="loading" style="text-align:center;padding:20px;color:#6b7280;">Chargement...</div>
        <div v-else-if="pharmacy" style="display:flex;align-items:flex-start;gap:20px;flex-wrap:wrap;">
          <div style="width:64px;height:64px;border-radius:16px;background:linear-gradient(135deg,#f0fdf4,#dcfce7);border:2px solid #bbf7d0;display:flex;align-items:center;justify-content:center;font-size:2rem;flex-shrink:0;">🏥</div>
          <div style="flex:1;min-width:200px;">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px;flex-wrap:wrap;">
              <h1 style="font-weight:800;font-size:1.4rem;margin:0;">{{ pharmacy.name }}</h1>
              <span class="pub-badge-green">PARTENAIRE</span>
            </div>
            <div style="color:#6b7280;font-size:.875rem;display:flex;gap:16px;flex-wrap:wrap;margin-top:6px;">
              <span>📍 {{ pharmacy.address || pharmacy.city || 'Sénégal' }}</span>
              <span v-if="pharmacy.phone">📞 {{ pharmacy.phone }}</span>
              <span v-if="pharmacy.email">📧 {{ pharmacy.email }}</span>
            </div>
            <div v-if="pharmacy._count" style="display:flex;gap:16px;margin-top:12px;flex-wrap:wrap;">
              <div style="text-align:center;padding:8px 16px;background:#f9fafb;border-radius:8px;">
                <div style="font-weight:800;font-family:'JetBrains Mono',monospace;color:#16a34a;">{{ pharmacy._count.products }}</div>
                <div style="font-size:.7rem;color:#6b7280;">Produits</div>
              </div>
            </div>
          </div>
          <div style="display:flex;flex-direction:column;gap:8px;">
            <button @click="locateMe" class="pub-btn-outline" style="font-size:.8rem;">📍 Calculer la distance</button>
          </div>
        </div>
      </div>
    </div>

    <div class="pub-container" style="padding-top:28px;padding-bottom:40px;">
      <div style="display:grid;grid-template-columns:220px 1fr;gap:24px;align-items:start;">
        <!-- Sidebar filters -->
        <aside style="position:sticky;top:80px;">
          <div style="background:white;border-radius:12px;border:1px solid #e5e7eb;padding:18px;">
            <h3 style="font-weight:700;font-size:.9rem;margin:0 0 14px;">Catégories</h3>
            <div style="display:flex;flex-direction:column;gap:4px;">
              <button @click="filterCat=''" :style="`text-align:left;padding:8px 12px;border-radius:8px;border:none;cursor:pointer;font-size:.85rem;font-weight:${!filterCat?700:500};background:${!filterCat?'#f0fdf4':'transparent'};color:${!filterCat?'#16a34a':'#374151'};`">Tous les produits</button>
              <button v-for="cat in categories" :key="cat.id" @click="filterCat=cat.id;fetchProds()" :style="`text-align:left;padding:8px 12px;border-radius:8px;border:none;cursor:pointer;font-size:.85rem;font-weight:${filterCat===cat.id?700:500};background:${filterCat===cat.id?'#f0fdf4':'transparent'};color:${filterCat===cat.id?'#16a34a':'#374151'};`">
                {{ cat.name }}
                <span style="float:right;font-size:.75rem;color:#9ca3af;">{{ cat._count?.produit || '' }}</span>
              </button>
            </div>
          </div>

          <div style="background:white;border-radius:12px;border:1px solid #e5e7eb;padding:18px;margin-top:12px;">
            <h3 style="font-weight:700;font-size:.9rem;margin:0 0 12px;">Filtres</h3>
            <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:.85rem;margin-bottom:10px;">
              <input type="checkbox" v-model="inStockOnly" @change="fetchProds()"/>
              En stock uniquement
            </label>
            <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:.85rem;">
              <input type="checkbox" v-model="withoutPrescription" @change="fetchProds()"/>
              Sans ordonnance
            </label>
          </div>
        </aside>

        <!-- Products grid -->
        <div>
          <!-- Search + sort -->
          <div style="display:flex;gap:10px;margin-bottom:20px;flex-wrap:wrap;">
            <div style="flex:1;min-width:200px;position:relative;">
              <span style="position:absolute;left:11px;top:50%;transform:translateY(-50%);color:#9ca3af;">🔍</span>
              <input v-model="searchP" class="pub-hero-inp" placeholder="Chercher dans cette pharmacie..." style="width:100%;padding:9px 12px 9px 36px;border:1px solid #e5e7eb;border-radius:9px;font-size:.875rem;outline:none;font-family:'Inter',sans-serif;" @input="debouncedFetch"/>
            </div>
            <select v-model="sortBy" class="pub-filter-select" @change="fetchProds()">
              <option value="name">Nom A-Z</option>
              <option value="price_asc">Prix croissant</option>
              <option value="price_desc">Prix décroissant</option>
              <option value="stock">Stock dispo</option>
            </select>
            <span style="display:flex;align-items:center;font-size:.82rem;color:#6b7280;">{{ meta.total || 0 }} produit(s)</span>
          </div>

          <div v-if="loadingProds" style="text-align:center;padding:40px;color:#6b7280;">
            <div style="width:28px;height:28px;border:3px solid #e5e7eb;border-top-color:#16a34a;border-radius:50%;animation:spin .6s linear infinite;margin:0 auto 12px;"></div>
          </div>
          <div v-else-if="!products.length" style="text-align:center;padding:40px;">
            <div style="font-size:2.5rem;margin-bottom:12px;">📦</div>
            <p style="color:#6b7280;">Aucun produit trouvé.</p>
          </div>
          <div v-else style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:14px;">
            <div v-for="p in products" :key="p.id" class="pub-card">
              <div style="padding:16px;">
                <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:6px;margin-bottom:10px;">
                  <div>
                    <div style="font-weight:700;font-size:.9rem;line-height:1.3;">{{ p.name }}</div>
                    <div style="font-size:.72rem;color:#6b7280;margin-top:3px;">{{ p.category?.name }}</div>
                    <div v-if="p.prescription_req" style="font-size:.68rem;color:#2563eb;font-weight:600;margin-top:3px;">🩺 Ordonnance</div>
                  </div>
                  <span :class="p.stock===0?'pub-badge-red':p.stock<p.threshold?'pub-badge-yellow':'pub-badge-green'" style="flex-shrink:0;font-size:.65rem;">
                    {{ p.stock===0?'RUPTURE':p.stock<p.threshold?'FAIBLE':p.stock+' en stock' }}
                  </span>
                </div>

                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
                  <div style="font-family:'JetBrains Mono',monospace;font-size:1.15rem;font-weight:800;color:#16a34a;">
                    {{ Number(p.sale_price).toLocaleString('fr-FR') }} F
                  </div>
                  <div style="font-size:.72rem;color:#9ca3af;">{{ p.unit_type }}{{ p.unit_quantity ? ' ×'+p.unit_quantity : '' }}</div>
                </div>

                <!-- Qty selector -->
                <div v-if="p.stock > 0" style="display:flex;gap:8px;align-items:center;">
                  <div style="display:flex;align-items:center;gap:4px;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
                    <button @click="decQty(p)" style="width:32px;height:32px;border:none;background:#f9fafb;cursor:pointer;font-weight:700;font-size:1rem;">−</button>
                    <span style="width:28px;text-align:center;font-family:'JetBrains Mono',monospace;font-weight:700;font-size:.875rem;">{{ qty[p.id] || 1 }}</span>
                    <button @click="incQty(p)" style="width:32px;height:32px;border:none;background:#f9fafb;cursor:pointer;font-weight:700;font-size:1rem;" :disabled="(qty[p.id]||1)>=p.stock">+</button>
                  </div>
                  <button @click="addToCart(p)" style="flex:1;background:#16a34a;color:white;border:none;border-radius:8px;padding:8px;font-size:.8rem;font-weight:700;cursor:pointer;transition:background .12s;" onmouseover="this.style.background='#15803d'" onmouseout="this.style.background='#16a34a'">
                    🛒 Ajouter
                  </button>
                </div>
                <button v-else style="width:100%;background:#f3f4f6;color:#9ca3af;border:none;border-radius:8px;padding:9px;font-size:.8rem;font-weight:700;cursor:not-allowed;" disabled>
                  Indisponible
                </button>
              </div>
            </div>
          </div>

          <!-- Pagination -->
          <div v-if="meta.totalPages > 1" style="display:flex;align-items:center;justify-content:center;gap:8px;margin-top:24px;">
            <button :disabled="page===1" @click="page--;fetchProds()" style="width:36px;height:36px;border-radius:8px;border:1px solid #e5e7eb;background:white;cursor:pointer;font-weight:700;" :style="page===1?'opacity:.4;cursor:not-allowed':''">‹</button>
            <span style="font-size:.85rem;color:#6b7280;">Page {{ page }} / {{ meta.totalPages }}</span>
            <button :disabled="page>=meta.totalPages" @click="page++;fetchProds()" style="width:36px;height:36px;border-radius:8px;border:1px solid #e5e7eb;background:white;cursor:pointer;font-weight:700;" :style="page>=meta.totalPages?'opacity:.4;cursor:not-allowed':''">›</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useCartStore } from '../../stores/cart.js'
import { useToastStore } from '../../stores/toast.js'

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
function debouncedFetch() { clearTimeout(dt); dt = setTimeout(() => fetchProds(), 400) }

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
    // Extract categories from products
    const catMap = {}
    products.value.forEach(p => { if (p.category) catMap[p.category.id] = p.category })
    categories.value = Object.values(catMap)
  } finally { loadingProds.value = false }
}

function addToCart(p) {
  cartStore.addItem(
    { id: p.id, name: p.name, sale_price: p.sale_price, stock: p.stock, unit_type: p.unit_type },
    parseInt(route.params.id),
    pharmacy.value?.name || 'Pharmacie'
  )
  toast.success(`"${p.name}" ajouté au panier`)
  qty.value[p.id] = 1
}

function locateMe() {
  if (!navigator.geolocation) return
  navigator.geolocation.getCurrentPosition(pos => {
    cartStore.userLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude }
  })
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
</style>
