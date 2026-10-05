<template>
  <div style="display:flex;flex-direction:column;gap:16px;">
    <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;">
      <div class="search-box" style="flex:1;max-width:300px;"><span class="search-icon"><Search size="1em" /></span><input v-model="search" class="inp" placeholder="Nom, code-barres..." @input="debouncedFetch"/></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <select v-model="filterCat" class="inp" style="width:160px;" @change="fetchData"><option value="">Toutes catégories</option><option v-for="c in store.categories" :key="c.id" :value="c.id">{{ c.name }}</option></select>
        <select v-model="filterStatus" class="inp" style="width:140px;" @change="fetchData"><option value="">Tous statuts</option><option value="AVAILABLE">En stock</option><option value="OUT_OF_STOCK">Rupture</option></select>
        <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:.85rem;font-weight:500;color:#374151;"><input type="checkbox" v-model="filterLow" @change="fetchData"/> Stock faible</label>
        <button class="btn btn-primary" @click="openAdd">+ Nouveau produit</button>
      </div>
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;">
      <span style="padding:6px 12px;border-radius:99px;background:#f0fdf4;color:#16a34a;font-size:.78rem;font-weight:700;"><Package size="1em" /> {{ store.prodMeta.total }} produits</span>
    </div>
    <div class="card">
      <div v-if="store.isBusy('prods')" class="loading-box"><div class="spinner"></div> Chargement...</div>
      <div v-else class="tbl-wrap">
        <table class="tbl">
          <thead><tr><th>Produit</th><th>Catégorie</th><th>Prix vente</th><th>Stock</th><th>Seuil</th><th>Statut</th><th style="text-align:right;">Actions</th></tr></thead>
          <tbody>
            <tr v-for="p in store.products" :key="p.id">
              <td><div style="font-weight:600;">{{ p.name }}</div><div style="font-size:.72rem;color:#6b7280;font-family:'JetBrains Mono',monospace;">{{ p.barcode }}</div></td>
              <td><span class="badge badge-blue">{{ p.category?.name }}</span></td>
              <td style="font-family:'JetBrains Mono',monospace;font-weight:700;">{{ Number(p.sale_price).toLocaleString('fr-FR') }} MRU</td>
              <td>
                <div style="display:flex;align-items:center;gap:8px;">
                  <span style="font-family:'JetBrains Mono',monospace;font-weight:700;" :style="{color:p.stock===0?'#dc2626':p.stock<p.threshold?'#ca8a04':'#16a34a'}">{{ p.stock }}</span>
                  <div class="progress" style="width:48px;"><div class="progress-fill" :style="{width:Math.min(100,(p.stock/p.threshold)*100)+'%',background:p.stock===0?'#dc2626':p.stock<p.threshold?'#ca8a04':'#16a34a'}"></div></div>
                </div>
              </td>
              <td style="font-family:'JetBrains Mono',monospace;color:#6b7280;">{{ p.threshold }}</td>
              <td><span class="badge" :class="p.stock===0?'badge-red':p.stock<p.threshold?'badge-yellow':'badge-green'">{{ p.stock===0?'RUPTURE':p.stock<p.threshold?'FAIBLE':'OK' }}</span></td>
              <td><div style="display:flex;gap:5px;justify-content:flex-end;"><button class="btn btn-icon btn-sm" @click="openEdit(p)"><Pencil size="1em" /></button><button class="btn btn-icon btn-sm" @click="confirmDel(p)" style="border-color:#fecaca;"><Trash2 size="1em" /></button></div></td>
            </tr>
            <tr v-if="!store.products.length"><td colspan="7" style="text-align:center;padding:28px;color:#6b7280;">Aucun produit</td></tr>
          </tbody>
        </table>
      </div>
      <div v-if="store.prodMeta.totalPages>1" class="pagination">
        <button class="page-btn" @click="page--;fetchData()" :disabled="page===1">‹</button>
        <span style="font-size:.85rem;color:#6b7280;">{{ page }} / {{ store.prodMeta.totalPages }}</span>
        <button class="page-btn" @click="page++;fetchData()" :disabled="page>=store.prodMeta.totalPages">›</button>
      </div>
    </div>
    <!-- Modal -->
    <Teleport to="body">
      <div v-if="showModal" class="modal-bg" @click.self="showModal=false">
        <div class="modal">
          <div class="modal-hd"><h3>{{ editId?'Modifier le produit':'Nouveau produit' }}</h3><button class="btn btn-icon" @click="showModal=false"><X size="1em" /></button></div>
          <div class="modal-bd">
            <div class="form-grid form-2col" style="gap:12px;">
              <div style="grid-column:1/-1"><label class="lbl">Nom *</label><input v-model="form.name" class="inp"/></div>
              <div><label class="lbl">Catégorie *</label><select v-model="form.categoryId" class="inp"><option value="">—</option><option v-for="c in store.categories" :key="c.id" :value="c.id">{{ c.name }}</option></select></div>
              <div><label class="lbl">Code-barres *</label><input v-model="form.barcode" class="inp"/></div>
              <div><label class="lbl">Prix vente (MRU) *</label><input v-model.number="form.sale_price" type="number" min="0" class="inp"/></div>
              <div><label class="lbl">Prix achat (MRU) *</label><input v-model.number="form.purchase_price" type="number" min="0" class="inp"/></div>
              <div><label class="lbl">Stock initial</label><input v-model.number="form.stock" type="number" min="0" class="inp"/></div>
              <div><label class="lbl">Seuil d'alerte</label><input v-model.number="form.threshold" type="number" min="0" class="inp"/></div>
              <div><label class="lbl">Type d'unité</label><select v-model="form.unit_type" class="inp"><option value="PIECE">Pièce</option><option value="BOX">Boîte</option><option value="BOTTLE">Flacon</option><option value="PACKET">Sachet</option><option value="TUBE">Tube</option><option value="TABLET">Comprimé</option><option value="AMPOULE">Ampoule</option></select></div>
              <div><label class="lbl">Qté par unité</label><input v-model.number="form.unit_quantity" type="number" min="0" class="inp" placeholder="ex: 20"/></div>
              <div style="grid-column:1/-1;display:flex;gap:16px;"><label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:.875rem;"><input type="checkbox" v-model="form.prescription_req"/> Ordonnance requise</label><label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:.875rem;"><input type="checkbox" v-model="form.is_divisible"/> Divisible</label></div>
            </div>
            <div v-if="formErr" class="alert alert-red" style="margin-top:12px;"><CircleX size="1em" /> {{ formErr }}</div>
          </div>
          <div class="modal-ft"><button class="btn btn-outline" @click="showModal=false">Annuler</button><button class="btn btn-primary" @click="save" :disabled="saving">{{ saving?'...':editId?'Modifier':'Créer' }}</button></div>
        </div>
      </div>
    </Teleport>
    <!-- Confirm delete -->
    <Teleport to="body">
      <div v-if="delTarget" class="modal-bg" @click.self="delTarget=null">
        <div class="modal" style="max-width:380px;">
          <div class="modal-hd"><h3 style="color:#dc2626;">Supprimer le produit ?</h3><button class="btn btn-icon" @click="delTarget=null"><X size="1em" /></button></div>
          <div class="modal-bd"><p style="color:#6b7280;">Voulez-vous supprimer <strong>{{ delTarget.name }}</strong> ? Cette action est irréversible.</p></div>
          <div class="modal-ft"><button class="btn btn-outline" @click="delTarget=null">Annuler</button><button class="btn btn-danger" @click="doDel">Supprimer</button></div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
<script setup>
import { Search, Package, Pencil, Trash2, X, CircleX } from 'lucide-vue-next'
import { ref, onMounted } from 'vue'
import { usePharmaStore } from '../stores/pharma.js'
import { useToastStore }  from '../stores/toast.js'
const store = usePharmaStore(); const toast = useToastStore()
const search=ref(''); const filterCat=ref(''); const filterStatus=ref(''); const filterLow=ref(false); const page=ref(1)
const showModal=ref(false); const editId=ref(null); const saving=ref(false); const formErr=ref(''); const delTarget=ref(null)
const emptyForm = () => ({ name:'',categoryId:'',barcode:'',sale_price:0,purchase_price:0,stock:0,threshold:10,unit_type:'BOX',unit_quantity:null,prescription_req:false,is_divisible:false })
const form = ref(emptyForm())
let dt; function debouncedFetch() { clearTimeout(dt); dt=setTimeout(fetchData,380) }
async function fetchData() {
  const p = { page:page.value, pageSize:20 }
  if (search.value) p.search=search.value
  if (filterCat.value) p.categoryId=filterCat.value
  if (filterStatus.value) p.status=filterStatus.value
  if (filterLow.value) p.lowStock='true'
  await store.fetchProducts(p)
}
function openAdd() { editId.value=null; form.value=emptyForm(); formErr.value=''; showModal.value=true }
function openEdit(p) { editId.value=p.id; form.value={name:p.name,categoryId:p.categoryId,barcode:p.barcode,sale_price:Number(p.sale_price),purchase_price:Number(p.purchase_price),stock:p.stock,threshold:p.threshold,unit_type:p.unit_type,unit_quantity:p.unit_quantity,prescription_req:p.prescription_req,is_divisible:p.is_divisible}; formErr.value=''; showModal.value=true }
async function save() {
  formErr.value=''
  if (!form.value.name) { formErr.value='Nom obligatoire'; return }
  if (!form.value.categoryId) { formErr.value='Catégorie obligatoire'; return }
  if (!form.value.barcode) { formErr.value='Code-barres obligatoire'; return }
  saving.value=true
  try { if (editId.value) { await store.updateProduct(editId.value,form.value); toast.success('Produit mis à jour.') } else { await store.createProduct(form.value); toast.success('Produit créé.') } showModal.value=false; fetchData() } catch(e) { formErr.value=e.message } finally { saving.value=false }
}
function confirmDel(p) { delTarget.value=p }
async function doDel() { try { await store.deleteProduct(delTarget.value.id); toast.success('Supprimé.'); fetchData() } catch(e) { toast.error(e.message) } delTarget.value=null }
onMounted(async () => { await store.fetchCategories(); fetchData() })
</script>
