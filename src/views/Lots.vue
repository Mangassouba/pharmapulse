<template>
  <div style="display:flex;flex-direction:column;gap:16px;">
    <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;">
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <select v-model="filterStatus" class="inp" style="width:150px;" @change="fetchData"><option value="">{{ $t('common.allStatuses') }}</option><option v-for="s in ['ACTIVE','EXPIRED','DEPLETED']" :key="s" :value="s">{{ $t('batchStatus.' + s) }}</option></select>
        <select v-model="filterProd" class="inp" style="width:200px;" @change="fetchData"><option value="">{{ $t('common.allProducts') }}</option><option v-for="p in store.products" :key="p.id" :value="p.id">{{ p.name }}</option></select>
        <label style="display:flex;align-items:center;gap:6px;font-size:.85rem;font-weight:500;cursor:pointer;"><input type="checkbox" v-model="filterExpiring" @change="fetchData"/> {{ $t('batches.expiring30') }}</label>
      </div>
      <button class="btn btn-primary" @click="openAdd">+ {{ $t('batches.new') }}</button>
    </div>
    <div v-if="expiringCount>0" class="alert alert-yellow"><CalendarClock size="1em" /> <strong>{{ $t('batches.countLots', { n: expiringCount }) }}</strong> {{ $t('batches.expireSoon') }}</div>
    <div class="card">
      <div v-if="loading" class="loading-box"><div class="spinner"></div></div>
      <div v-else class="tbl-wrap">
        <table class="tbl">
          <thead><tr><th>{{ $t('batches.number') }}</th><th>{{ $t('common.product') }}</th><th>{{ $t('batches.initialQty') }}</th><th>{{ $t('batches.remainingQty') }}</th><th>{{ $t('batches.manufacturing') }}</th><th>{{ $t('batches.expiry') }}</th><th>{{ $t('common.status') }}</th></tr></thead>
          <tbody>
            <tr v-for="b in batches" :key="b.id" :style="isExpiringSoon(b)?'background:#fefce8':b.status==='EXPIRED'?'background:#fef2f2;opacity:.7':''">
              <td style="font-family:'JetBrains Mono',monospace;font-weight:700;">{{ b.number }}</td>
              <td style="font-weight:500;">{{ b.product?.name }}</td>
              <td style="font-family:'JetBrains Mono',monospace;color:#6b7280;">{{ b.initial_quantity }}</td>
              <td style="font-family:'JetBrains Mono',monospace;font-weight:700;" :style="{color:b.quantity===0?'#dc2626':'#111827'}">{{ b.quantity }}</td>
              <td style="font-family:'JetBrains Mono',monospace;font-size:.8rem;color:#6b7280;">{{ b.manufacturing_date?store.fmt(b.manufacturing_date):'—' }}</td>
              <td style="font-family:'JetBrains Mono',monospace;font-size:.8rem;" :style="{color:isExpiringSoon(b)||b.status==='EXPIRED'?'#dc2626':'#111827',fontWeight:isExpiringSoon(b)?700:400}">
                {{ store.fmt(b.expiration_date) }}
                <span v-if="isExpiringSoon(b)" style="margin-inline-start:4px;font-size:.68rem;background:#fef2f2;color:#dc2626;padding:1px 6px;border-radius:99px;font-weight:700;">{{ $t('common.daysShort', { n: daysLeft(b.expiration_date) }) }}</span>
              </td>
              <td><span class="badge" :class="b.status==='ACTIVE'?'badge-green':b.status==='EXPIRED'?'badge-red':'badge-gray'">{{ $te('batchStatus', b.status) }}</span></td>
            </tr>
            <tr v-if="!batches.length"><td colspan="7" style="text-align:center;padding:28px;color:#6b7280;">{{ $t('batches.none') }}</td></tr>
          </tbody>
        </table>
      </div>
      <div v-if="meta.totalPages>1" class="pagination">
        <button class="page-btn" @click="page--;fetchData()" :disabled="page===1">‹</button>
        <span style="font-size:.85rem;color:#6b7280;">{{ page }} / {{ meta.totalPages }}</span>
        <button class="page-btn" @click="page++;fetchData()" :disabled="page>=meta.totalPages">›</button>
      </div>
    </div>
    <Teleport to="body">
      <div v-if="showModal" class="modal-bg" @click.self="showModal=false">
        <div class="modal">
          <div class="modal-hd"><h3>{{ $t('batches.new') }}</h3><button class="btn btn-icon" @click="showModal=false"><X size="1em" /></button></div>
          <div class="modal-bd">
            <div class="form-grid form-2col" style="gap:12px;">
              <div><label class="lbl">{{ $t('common.product') }} *</label><select v-model="form.productId" class="inp"><option value="">— {{ $t('common.choose') }} —</option><option v-for="p in store.products" :key="p.id" :value="p.id">{{ p.name }}</option></select></div>
              <div><label class="lbl">{{ $t('batches.number') }} *</label><input v-model="form.number" class="inp" placeholder="LOT-2024-XXX"/></div>
              <div><label class="lbl">{{ $t('common.quantity') }} *</label><input v-model.number="form.quantity" type="number" min="0" class="inp"/></div>
              <div><label class="lbl">{{ $t('batches.expiryDate') }} *</label><input v-model="form.expiration_date" type="date" class="inp"/></div>
              <div><label class="lbl">{{ $t('batches.manufacturingDate') }}</label><input v-model="form.manufacturing_date" type="date" class="inp"/></div>
            </div>
            <div v-if="formErr" class="alert alert-red" style="margin-top:12px;"><CircleX size="1em" /> {{ formErr }}</div>
          </div>
          <div class="modal-ft"><button class="btn btn-outline" @click="showModal=false">{{ $t('common.cancel') }}</button><button class="btn btn-primary" @click="save" :disabled="saving">{{ saving?'...':$t('batches.create') }}</button></div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
<script setup>
import { CalendarClock, X, CircleX } from 'lucide-vue-next'
import { ref, computed, onMounted } from 'vue'
import { usePharmaStore } from '../stores/pharma.js'
import { useToastStore }  from '../stores/toast.js'
import { batchApi } from '../services/api.js'
import { t } from '../i18n/index.js'
const store=usePharmaStore(); const toast=useToastStore()
const batches=ref([]); const meta=ref({totalPages:1}); const loading=ref(false)
const filterStatus=ref(''); const filterProd=ref(''); const filterExpiring=ref(false); const page=ref(1)
const showModal=ref(false); const saving=ref(false); const formErr=ref('')
const form=ref({productId:'',number:'',quantity:0,expiration_date:'',manufacturing_date:''})
const expiringCount=computed(()=>batches.value.filter(b=>isExpiringSoon(b)).length)
const daysLeft=d=>Math.max(0,Math.floor((new Date(d)-new Date())/86400000))
const isExpiringSoon=b=>b.status==='ACTIVE'&&daysLeft(b.expiration_date)<=30&&daysLeft(b.expiration_date)>0
async function fetchData(){
  loading.value=true
  try{const p={page:page.value,pageSize:20,status:filterStatus.value||undefined,productId:filterProd.value||undefined};if(filterExpiring.value)p.expiringSoon='true';const r=await batchApi.list(p);batches.value=r.data;meta.value=r.meta}catch(e){toast.error(e.message)}finally{loading.value=false}
}
function openAdd(){form.value={productId:'',number:'',quantity:0,expiration_date:'',manufacturing_date:''};formErr.value='';showModal.value=true}
async function save(){
  formErr.value='';if(!form.value.productId){formErr.value=t('common.productRequired');return}if(!form.value.number){formErr.value=t('batches.numberRequired');return}if(!form.value.expiration_date){formErr.value=t('batches.expiryRequired');return}
  saving.value=true;try{await batchApi.create({...form.value,initial_quantity:form.value.quantity,manufacturing_date:form.value.manufacturing_date||undefined});toast.success(t('batches.created'));showModal.value=false;fetchData()}catch(e){formErr.value=e.message}finally{saving.value=false}
}
onMounted(async()=>{await store.fetchProducts({pageSize:100});fetchData()})
</script>
