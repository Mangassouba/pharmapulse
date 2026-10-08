<template>
  <div style="display:flex;flex-direction:column;gap:16px;">
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;">
      <div class="card card-p"><div style="font-size:1.5rem;font-weight:800;font-family:'JetBrains Mono',monospace;color:#2563eb;">{{ store.recepMeta.total }}</div><div style="font-size:.78rem;color:#6b7280;">{{ $t('reception.total') }}</div></div>
      <div class="card card-p"><div style="font-size:1.5rem;font-weight:800;font-family:'JetBrains Mono',monospace;color:#16a34a;">{{ completed }}</div><div style="font-size:.78rem;color:#6b7280;">{{ $t('reception.completed') }}</div></div>
      <div class="card card-p"><div style="font-size:1.5rem;font-weight:800;font-family:'JetBrains Mono',monospace;color:#ca8a04;">{{ pending }}</div><div style="font-size:.78rem;color:#6b7280;">{{ $t('reception.pending') }}</div></div>
    </div>
    <!-- Form -->
    <div class="card card-p">
      <h3 style="font-weight:700;margin:0 0 16px;"><PackagePlus size="1em" /> {{ $t('reception.formTitle') }}</h3>
      <div class="form-grid form-2col" style="max-width:700px;gap:12px;margin-bottom:14px;">
        <div><label class="lbl">{{ $t('reception.supplier') }} *</label><input v-model="form.supplier" class="inp" :placeholder="$t('reception.supplierPh')" list="sup-list"/><datalist id="sup-list"><option v-for="s in suppliers" :key="s" :value="s"/></datalist></div>
        <div><label class="lbl">{{ $t('reception.invoiceNumber') }}</label><input v-model="form.invoice_number" class="inp" placeholder="FAC-2024-XXXX"/></div>
      </div>
      <!-- Items -->
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;"><span style="font-weight:600;font-size:.9rem;">{{ $t('common.items') }}</span><button class="btn btn-outline btn-sm" @click="addItem">+ {{ $t('common.add') }}</button></div>
      <div v-for="(item,i) in form.items" :key="i" style="display:flex;gap:10px;align-items:flex-end;flex-wrap:wrap;padding:12px;background:#f9fafb;border-radius:9px;border:1px solid #f3f4f6;margin-bottom:8px;">
        <div style="flex:2;min-width:180px;"><label class="lbl">{{ $t('common.product') }} *</label><select v-model="item.productId" class="inp"><option value="">— {{ $t('common.choose') }} —</option><option v-for="p in store.products" :key="p.id" :value="p.id">{{ p.name }} ({{ $t('common.units', { n: p.stock }) }})</option></select></div>
        <div style="width:80px;"><label class="lbl">{{ $t('common.qtyShort') }} *</label><input v-model.number="item.quantity" type="number" min="1" class="inp"/></div>
        <div style="width:110px;"><label class="lbl">{{ $t('reception.purchasePrice') }}</label><input v-model.number="item.price" type="number" min="0" class="inp"/></div>
        <div style="width:120px;"><label class="lbl">{{ $t('batches.number') }}</label><input v-model="item.batchNumber" class="inp"/></div>
        <div style="width:140px;"><label class="lbl">{{ $t('batches.expiryDate') }}</label><input v-model="item.expirationDate" type="date" class="inp"/></div>
        <button class="btn btn-icon" @click="form.items.splice(i,1)" style="border-color:#fecaca;"><X size="1em" /></button>
      </div>
      <div v-if="formTotal>0" style="padding:12px;background:#f0fdf4;border-radius:8px;display:flex;justify-content:space-between;font-size:.875rem;"><span>{{ $t('reception.estimatedTotal') }}</span><strong style="color:#16a34a;font-family:'JetBrains Mono',monospace;">{{ fmtNum(formTotal) }} MRU</strong></div>
      <div v-if="formErr" class="alert alert-red" style="margin-top:12px;"><CircleX size="1em" /> {{ formErr }}</div>
      <button class="btn btn-primary" style="margin-top:14px;" @click="save" :disabled="saving">{{ saving?$t('common.saving'):$t('reception.save') }}</button>
    </div>
    <!-- History -->
    <div class="card">
      <div style="padding:14px 18px;border-bottom:1px solid #f3f4f6;display:flex;align-items:center;justify-content:space-between;"><h3 style="font-weight:700;margin:0;font-size:.95rem;">{{ $t('reception.history') }}</h3><select v-model="filterStatus" class="inp" style="width:150px;" @change="fetchData"><option value="">{{ $t('common.all') }}</option><option value="PENDING">{{ $t('reception.pending') }}</option><option value="COMPLETED">{{ $t('reception.completed') }}</option><option value="CANCELLED">{{ $t('reception.cancelled') }}</option></select></div>
      <div v-if="store.isBusy('recep')" class="loading-box"><div class="spinner"></div></div>
      <div v-else class="tbl-wrap">
        <table class="tbl">
          <thead><tr><th>{{ $t('common.date') }}</th><th>{{ $t('reception.supplier') }}</th><th>{{ $t('common.items') }}</th><th>{{ $t('common.total') }}</th><th>{{ $t('common.status') }}</th><th>{{ $t('common.actions') }}</th></tr></thead>
          <tbody>
            <tr v-for="r in store.receptions" :key="r.id">
              <td style="font-family:'JetBrains Mono',monospace;font-size:.8rem;color:#6b7280;">{{ store.fmt(r.reception_date) }}</td>
              <td style="font-weight:600;">{{ r.supplier }}</td>
              <td style="font-size:.8rem;color:#6b7280;">{{ $t('categories.productCount', { n: r.details?.length ?? 0 }) }}</td>
              <td style="font-family:'JetBrains Mono',monospace;font-weight:700;color:#16a34a;">{{ fmtNum(r.total_amount) }} MRU</td>
              <td><span class="badge" :class="r.status==='COMPLETED'?'badge-green':r.status==='PENDING'?'badge-yellow':'badge-red'">{{ $te('receptionStatus', r.status) }}</span></td>
              <td>
                <div style="display:flex;gap:5px;" v-if="r.status==='PENDING'">
                  <button class="btn btn-primary btn-sm" @click="complete(r,'COMPLETED')"><CircleCheck size="1em" /> {{ $t('reception.validate') }}</button>
                  <button class="btn btn-outline btn-sm" @click="complete(r,'PARTIAL')">{{ $t('reception.partial') }}</button>
                  <button class="btn btn-danger btn-sm" @click="complete(r,'CANCELLED')"><X size="1em" /></button>
                </div>
                <span v-else style="font-size:.8rem;color:#6b7280;">—</span>
              </td>
            </tr>
            <tr v-if="!store.receptions.length"><td colspan="6" style="text-align:center;padding:28px;color:#6b7280;">{{ $t('reception.none') }}</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
<script setup>
import { PackagePlus, X, CircleX, CircleCheck } from 'lucide-vue-next'
import { ref, computed, onMounted } from 'vue'
import { usePharmaStore } from '../stores/pharma.js'
import { useToastStore }  from '../stores/toast.js'
import { t, fmtNum } from '../i18n/index.js'
const store=usePharmaStore(); const toast=useToastStore()
const saving=ref(false); const formErr=ref(''); const filterStatus=ref('')
const suppliers=['CAMEC','Pharmagroupe Mauritanie','MedDist Nouakchott','SanofiDist','LABOREX']
const emptyItem = () => ({ productId:'',quantity:1,price:0,batchNumber:'',expirationDate:'' })
const form = ref({ supplier:'', invoice_number:'', items:[emptyItem()] })
const completed = computed(() => store.receptions.filter(r=>r.status==='COMPLETED').length)
const pending   = computed(() => store.receptions.filter(r=>r.status==='PENDING').length)
const formTotal = computed(() => form.value.items.reduce((s,i)=>s+(i.quantity||0)*(i.price||0),0))
function addItem() { form.value.items.push(emptyItem()) }
async function fetchData() { await store.fetchReceptions({ status:filterStatus.value||undefined, pageSize:20 }) }
async function save() {
  formErr.value=''
  if (!form.value.supplier.trim()) { formErr.value=t('reception.supplierRequired'); return }
  const items=form.value.items.filter(i=>i.productId&&i.quantity>0)
  if (!items.length) { formErr.value=t('reception.addOneProduct'); return }
  if (items.some(i=>i.batchNumber?.trim()&&!i.expirationDate)) { formErr.value=t('reception.expiryRequired'); return }
  saving.value=true
  try { await store.createReception({...form.value,items}); toast.success(t('reception.saved')); form.value={supplier:'',invoice_number:'',items:[emptyItem()]}; fetchData() } catch(e) { formErr.value=e.message } finally { saving.value=false }
}
async function complete(r,status) {
  try { await store.completeReception(r.id,status); toast.success(status==='COMPLETED'?t('reception.stocksUpdated'):status==='CANCELLED'?t('reception.cancelledToast'):t('reception.partialSaved')); fetchData() } catch(e) { toast.error(e.message) }
}
onMounted(async () => { await store.fetchProducts({pageSize:100}); fetchData() })
</script>
