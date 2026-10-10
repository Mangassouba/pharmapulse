<template>
  <div style="display:flex;flex-direction:column;gap:16px;">
    <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;">
      <div class="search-box" style="flex:1;max-width:300px;"><span class="search-icon"><Search size="1em" /></span><input v-model="search" class="inp" :placeholder="$t('products.searchPh')" @input="debouncedFetch"/></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <select v-model="filterCat" class="inp" style="width:160px;" @change="fetchData"><option value="">{{ $t('products.allCategories') }}</option><option v-for="c in store.categories" :key="c.id" :value="c.id">{{ c.name }}</option></select>
        <select v-model="filterStatus" class="inp" style="width:140px;" @change="fetchData"><option value="">{{ $t('common.allStatuses') }}</option><option value="AVAILABLE">{{ $t('products.inStock') }}</option><option value="OUT_OF_STOCK">{{ $t('inventory.filterOut') }}</option></select>
        <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:.85rem;font-weight:500;color:#374151;"><input type="checkbox" v-model="filterLow" @change="fetchData"/> {{ $t('inventory.filterLow') }}</label>
        <button class="btn btn-outline" @click="doExport" :disabled="exporting"><Download size="1em" /> {{ exporting?'...':$t('products.export') }}</button>
        <button v-if="canImport" class="btn btn-outline" @click="openImport"><Upload size="1em" /> {{ $t('products.import') }}</button>
        <button class="btn btn-primary" @click="openAdd">+ {{ $t('products.new') }}</button>
      </div>
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;">
      <span style="padding:6px 12px;border-radius:99px;background:#f0fdf4;color:#16a34a;font-size:.78rem;font-weight:700;"><Package size="1em" /> {{ $t('categories.productCount', { n: store.prodMeta.total }) }}</span>
    </div>
    <div class="card">
      <div v-if="store.isBusy('prods')" class="loading-box"><div class="spinner"></div> {{ $t('common.loading') }}</div>
      <div v-else class="tbl-wrap">
        <table class="tbl">
          <thead><tr><th>{{ $t('common.product') }}</th><th>{{ $t('common.category') }}</th><th>{{ $t('products.salePrice') }}</th><th>{{ $t('common.stock') }}</th><th>{{ $t('products.threshold') }}</th><th>{{ $t('common.status') }}</th><th style="text-align:end;">{{ $t('common.actions') }}</th></tr></thead>
          <tbody>
            <tr v-for="p in store.products" :key="p.id">
              <td><div style="display:flex;align-items:center;gap:10px;"><ProductImage :product="p" :size="40"/><div><div style="font-weight:600;">{{ p.name }}</div><div style="font-size:.72rem;color:#6b7280;font-family:'JetBrains Mono',monospace;">{{ p.barcode }}</div></div></div></td>
              <td><span class="badge badge-blue">{{ p.category?.name }}</span></td>
              <td style="font-family:'JetBrains Mono',monospace;font-weight:700;">{{ fmtNum(p.sale_price) }} MRU</td>
              <td>
                <div style="display:flex;align-items:center;gap:8px;">
                  <span style="font-family:'JetBrains Mono',monospace;font-weight:700;" :style="{color:p.stock===0?'#dc2626':p.stock<p.threshold?'#ca8a04':'#16a34a'}">{{ p.stock }}</span>
                  <div class="progress" style="width:48px;"><div class="progress-fill" :style="{width:Math.min(100,(p.stock/p.threshold)*100)+'%',background:p.stock===0?'#dc2626':p.stock<p.threshold?'#ca8a04':'#16a34a'}"></div></div>
                </div>
              </td>
              <td style="font-family:'JetBrains Mono',monospace;color:#6b7280;">{{ p.threshold }}</td>
              <td><span class="badge" :class="p.stock===0?'badge-red':p.stock<p.threshold?'badge-yellow':'badge-green'">{{ p.stock===0?$t('stock.out'):p.stock<p.threshold?$t('stock.low'):$t('stock.ok') }}</span></td>
              <td><div style="display:flex;gap:5px;justify-content:flex-end;"><button class="btn btn-icon btn-sm" @click="openEdit(p)" :title="$t('common.edit')"><Pencil size="1em" /></button><button class="btn btn-icon btn-sm" @click="confirmDel(p)" style="border-color:#fecaca;"><Trash2 size="1em" /></button></div></td>
            </tr>
            <tr v-if="!store.products.length"><td colspan="7" style="text-align:center;padding:28px;color:#6b7280;">{{ $t('products.none') }}</td></tr>
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
          <div class="modal-hd"><h3>{{ editId?$t('products.edit'):$t('products.new') }}</h3><button class="btn btn-icon" @click="showModal=false"><X size="1em" /></button></div>
          <div class="modal-bd">
            <div class="form-grid form-2col" style="gap:12px;">
              <div style="grid-column:1/-1;display:flex;align-items:center;gap:14px;">
                <ProductImage :src="imagePreview" :size="72"/>
                <div style="display:flex;flex-direction:column;gap:6px;">
                  <label class="lbl" style="margin:0;">{{ $t('products.image') }}</label>
                  <div style="display:flex;gap:6px;flex-wrap:wrap;">
                    <button type="button" class="btn btn-outline btn-sm" @click="imageInput.click()"><ImagePlus size="1em" /> {{ imagePreview?$t('common.change'):$t('common.add') }}</button>
                    <button v-if="imagePreview" type="button" class="btn btn-outline btn-sm" style="border-color:#fecaca;color:#dc2626;" @click="clearImage"><Trash2 size="1em" /> {{ $t('common.remove') }}</button>
                  </div>
                  <span style="font-size:.72rem;color:#6b7280;">{{ $t('common.imageFormats') }}</span>
                </div>
                <input ref="imageInput" type="file" accept="image/png,image/jpeg,image/webp" style="display:none" @change="onImagePicked"/>
              </div>
              <div style="grid-column:1/-1"><label class="lbl">{{ $t('common.name') }} *</label><input v-model="form.name" class="inp"/></div>
              <div><label class="lbl">{{ $t('common.category') }} *</label><select v-model="form.categoryId" class="inp"><option value="">—</option><option v-for="c in store.categories" :key="c.id" :value="c.id">{{ c.name }}</option></select></div>
              <div><label class="lbl">{{ $t('products.barcode') }} *</label><input v-model="form.barcode" class="inp"/></div>
              <div><label class="lbl">{{ $t('products.salePriceMru') }} *</label><input v-model.number="form.sale_price" type="number" min="0" class="inp"/></div>
              <div><label class="lbl">{{ $t('reception.purchasePrice') }} *</label><input v-model.number="form.purchase_price" type="number" min="0" class="inp"/></div>
              <div><label class="lbl">{{ $t('products.initialStock') }}</label><input v-model.number="form.stock" type="number" min="0" class="inp"/></div>
              <div><label class="lbl">{{ $t('products.alertThreshold') }}</label><input v-model.number="form.threshold" type="number" min="0" class="inp"/></div>
              <div><label class="lbl">{{ $t('products.unitType') }}</label><select v-model="form.unit_type" class="inp"><option v-for="u in ['PIECE','BOX','BOTTLE','PACKET','TUBE','TABLET','AMPOULE']" :key="u" :value="u">{{ $t('unitTypes.' + u) }}</option></select></div>
              <div><label class="lbl">{{ $t('products.qtyPerUnit') }}</label><input v-model.number="form.unit_quantity" type="number" min="0" class="inp" :placeholder="$t('products.qtyPerUnitPh')"/></div>
              <div style="grid-column:1/-1;display:flex;gap:16px;"><label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:.875rem;"><input type="checkbox" v-model="form.prescription_req"/> {{ $t('products.prescriptionRequired') }}</label><label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:.875rem;"><input type="checkbox" v-model="form.is_divisible"/> {{ $t('products.divisible') }}</label></div>
            </div>
            <div v-if="formErr" class="alert alert-red" style="margin-top:12px;"><CircleX size="1em" /> {{ formErr }}</div>
          </div>
          <div class="modal-ft"><button class="btn btn-outline" @click="showModal=false">{{ $t('common.cancel') }}</button><button class="btn btn-primary" @click="save" :disabled="saving">{{ saving?'...':editId?$t('common.edit'):$t('common.create') }}</button></div>
        </div>
      </div>
    </Teleport>
    <!-- Import -->
    <Teleport to="body">
      <div v-if="showImport" class="modal-bg" @click.self="closeImport">
        <div class="modal" style="max-width:560px;">
          <div class="modal-hd"><h3>{{ $t('products.importTitle') }}</h3><button class="btn btn-icon" @click="closeImport"><X size="1em" /></button></div>
          <div class="modal-bd" style="display:flex;flex-direction:column;gap:12px;">
            <p style="color:#374151;font-size:.875rem;margin:0;">{{ $t('products.importHelp') }}</p>
            <p style="color:#6b7280;font-size:.8rem;margin:0;">{{ $t('products.importRules') }}</p>
            <div><button type="button" class="btn btn-outline btn-sm" @click="importInput.click()" :disabled="importing"><FileSpreadsheet size="1em" /> {{ $t('products.importChoose') }}</button></div>
            <input ref="importInput" type="file" accept=".xlsx,.xls,.csv" style="display:none" @change="onImportPicked"/>
            <div v-if="importRows.length" class="alert alert-green"><Check size="1em" /> {{ $t('products.importReady', { n: importRows.length, file: importFile }) }}</div>
            <div v-if="importErr" class="alert alert-red"><CircleX size="1em" /> {{ importErr }}</div>
            <div v-if="importErrors.length">
              <div style="font-weight:600;font-size:.85rem;margin-bottom:6px;">{{ $t('products.importErrors') }}</div>
              <ul style="max-height:220px;overflow:auto;margin:0;padding-inline-start:18px;font-size:.8rem;color:#b91c1c;display:flex;flex-direction:column;gap:3px;">
                <li v-for="e in importErrors.slice(0, 100)" :key="e.line + e.message">{{ e.message }}</li>
              </ul>
              <div v-if="importErrors.length>100" style="font-size:.78rem;color:#6b7280;margin-top:4px;">{{ $t('products.importMoreErrors', { n: importErrors.length - 100 }) }}</div>
            </div>
          </div>
          <div class="modal-ft"><button class="btn btn-outline" @click="closeImport">{{ $t('common.cancel') }}</button><button class="btn btn-primary" @click="doImport" :disabled="importing || !importRows.length">{{ importing?'...':$t('products.import') }}</button></div>
        </div>
      </div>
    </Teleport>
    <!-- Confirm delete -->
    <Teleport to="body">
      <div v-if="delTarget" class="modal-bg" @click.self="delTarget=null">
        <div class="modal" style="max-width:380px;">
          <div class="modal-hd"><h3 style="color:#dc2626;">{{ $t('products.deleteTitle') }}</h3><button class="btn btn-icon" @click="delTarget=null"><X size="1em" /></button></div>
          <div class="modal-bd"><p style="color:#6b7280;">{{ $t('products.deleteConfirm') }} <strong>{{ delTarget.name }}</strong> ? {{ $t('common.irreversible') }}</p></div>
          <div class="modal-ft"><button class="btn btn-outline" @click="delTarget=null">{{ $t('common.cancel') }}</button><button class="btn btn-danger" @click="doDel">{{ $t('common.delete') }}</button></div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
<script setup>
import { Search, Package, Pencil, Trash2, X, CircleX, ImagePlus, Download, Upload, FileSpreadsheet, Check } from 'lucide-vue-next'
import { ref, computed, onMounted } from 'vue'
import { usePharmaStore } from '../stores/pharma.js'
import { useToastStore }  from '../stores/toast.js'
import { useAuthStore }   from '../stores/auth.js'
import { productApi }     from '../services/api.js'
import { productImageUrl, resizeImage } from '../utils/logo.js'
import { downloadProductSheet, readProductSheet } from '../utils/productSheet.js'
import ProductImage from '../components/ProductImage.vue'
import { t, fmtNum } from '../i18n/index.js'
const store = usePharmaStore(); const toast = useToastStore(); const auth = useAuthStore()
const search=ref(''); const filterCat=ref(''); const filterStatus=ref(''); const filterLow=ref(false); const page=ref(1)
const showModal=ref(false); const editId=ref(null); const saving=ref(false); const formErr=ref(''); const delTarget=ref(null)
// Image is uploaded separately once the product exists: imageData = new data URL to send, imageRemoved = delete on save
const imageInput=ref(null); const imagePreview=ref(null); const imageData=ref(null); const imageRemoved=ref(false)
function resetImage(p) { imagePreview.value=productImageUrl(p); imageData.value=null; imageRemoved.value=false }
async function onImagePicked(e) {
  const file = e.target.files?.[0]
  e.target.value = ''
  if (!file) return
  if (!['image/png','image/jpeg','image/webp'].includes(file.type)) { formErr.value=t('common.unsupportedFormat'); return }
  try { imageData.value = await resizeImage(file); imagePreview.value = imageData.value; imageRemoved.value=false; formErr.value='' }
  catch(err) { formErr.value = err.message }
}
function clearImage() { imagePreview.value=null; imageData.value=null; imageRemoved.value=true }
async function saveImage(id) {
  if (imageData.value) await productApi.updateImage(id, { image: imageData.value })
  else if (imageRemoved.value) await productApi.deleteImage(id)
}
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
function openAdd() { editId.value=null; form.value=emptyForm(); resetImage(null); formErr.value=''; showModal.value=true }
function openEdit(p) { editId.value=p.id; form.value={name:p.name,categoryId:p.categoryId,barcode:p.barcode,sale_price:Number(p.sale_price),purchase_price:Number(p.purchase_price),stock:p.stock,threshold:p.threshold,unit_type:p.unit_type,unit_quantity:p.unit_quantity,prescription_req:p.prescription_req,is_divisible:p.is_divisible}; resetImage(p); formErr.value=''; showModal.value=true }
async function save() {
  formErr.value=''
  if (!form.value.name) { formErr.value=t('common.nameRequired'); return }
  if (!form.value.categoryId) { formErr.value=t('products.categoryRequired'); return }
  if (!form.value.barcode) { formErr.value=t('products.barcodeRequired'); return }
  saving.value=true
  try {
    let id = editId.value
    if (id) { await store.updateProduct(id,form.value); toast.success(t('products.updated')) } else { id = (await store.createProduct(form.value)).data.id; toast.success(t('products.created')) }
    // The product is saved at this point: an image failure is only reported, not blocking
    try { await saveImage(id) } catch(e) { toast.error(t('products.imageNotSaved') + ' ' + e.message) }
    showModal.value=false; fetchData()
  } catch(e) { formErr.value=e.message } finally { saving.value=false }
}
function confirmDel(p) { delTarget.value=p }
async function doDel() { try { await store.deleteProduct(delTarget.value.id); toast.success(t('common.deleted')); fetchData() } catch(e) { toast.error(e.message) } delTarget.value=null }
// Export: every product of the pharmacy, not just the current page or filters
const exporting=ref(false)
async function doExport() {
  exporting.value=true
  try {
    const { data } = await productApi.exportAll()
    if (!data.length) toast.error(t('products.exportEmpty'))
    else await downloadProductSheet(data)
  } catch(e) { toast.error(e.message) } finally { exporting.value=false }
}
// Import: the file is read here, the server checks every row and saves all or nothing (same roles as POST /products/import)
const canImport = computed(() => ['ADMIN','MANAGER','STOCK_MANAGER'].includes(auth.user?.role))
const showImport=ref(false); const importInput=ref(null); const importing=ref(false)
const importRows=ref([]); const importFile=ref(''); const importErr=ref(''); const importErrors=ref([])
function openImport() { importRows.value=[]; importFile.value=''; importErr.value=''; importErrors.value=[]; showImport.value=true }
function closeImport() { if (!importing.value) showImport.value=false }
async function onImportPicked(e) {
  const file = e.target.files?.[0]
  e.target.value = ''
  if (!file) return
  importRows.value=[]; importErr.value=''; importErrors.value=[]
  try { importRows.value = await readProductSheet(file); importFile.value = file.name }
  catch(err) { importErr.value = err.message }
}
async function doImport() {
  importing.value=true; importErr.value=''; importErrors.value=[]
  try {
    const r = await productApi.import(importRows.value)
    toast.success(r.message)
    showImport.value=false; page.value=1; fetchData()
  } catch(e) {
    importErr.value = e.message
    importErrors.value = (e.errors || []).filter(x => x.line) // row errors from the import service
  } finally { importing.value=false }
}
onMounted(async () => { await store.fetchCategories(); fetchData() })
</script>
