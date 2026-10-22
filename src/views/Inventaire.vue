<template>
  <div style="display:flex;flex-direction:column;gap:16px;">
    <div class="alert alert-blue"><ClipboardList size="1em" /> {{ $t('inventory.intro') }}</div>
    <div class="card card-p" style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;justify-content:space-between;">
      <div class="search-box" style="flex:1;max-width:280px;"><span class="search-icon"><Search size="1em" /></span><input v-model="search" class="inp" :placeholder="$t('common.searchPh')"/></div>
      <div style="display:flex;gap:8px;">
        <select v-model="filterStatus" class="inp" style="width:170px;"><option value="">{{ $t('common.all') }}</option><option value="ok">{{ $t('inventory.filterOk') }}</option><option value="low">{{ $t('inventory.filterLow') }}</option><option value="out">{{ $t('inventory.filterOut') }}</option></select>
        <button class="btn btn-outline btn-sm" @click="autoFill">{{ $t('inventory.prefill') }}</button>
        <button v-if="pendingCount>0" class="btn btn-primary" @click="applyAll" :disabled="applying">{{ applying?'...':$t('inventory.applyAll', { n: pendingCount }) }}</button>
      </div>
    </div>
    <div class="card">
      <div v-if="store.isBusy('prods')" class="loading-box"><div class="spinner"></div></div>
      <div v-else class="tbl-wrap">
        <table class="tbl">
          <thead><tr><th>{{ $t('common.product') }}</th><th>{{ $t('inventory.systemStock') }}</th><th>{{ $t('inventory.realStock') }}</th><th>{{ $t('inventory.gap') }}</th><th>{{ $t('common.note') }}</th><th>{{ $t('common.action') }}</th></tr></thead>
          <tbody>
            <tr v-for="p in filtered" :key="p.id" :style="rows[p.id]?.dirty?'background:#f0fdf4':''">
              <td><div style="font-weight:600;">{{ p.name }}</div><div style="font-size:.72rem;color:#6b7280;">{{ $te('unitTypes', p.unit_type) }}</div></td>
              <td style="font-family:'JetBrains Mono',monospace;font-weight:700;" :style="{color:p.stock===0?'#dc2626':p.stock<p.threshold?'#ca8a04':'#111827'}">{{ fmtStock(p) }}</td>
              <td>
                <!-- Produit à plusieurs conditionnements : on compte boîtes, plaquettes, comprimés… séparément -->
                <div v-if="rows[p.id]&&productUnitsOf(p).length>1" style="display:flex;gap:6px;flex-wrap:wrap;">
                  <label v-for="u in productUnitsOf(p)" :key="u.unit" style="display:flex;align-items:center;gap:4px;font-size:.75rem;color:#6b7280;"><input v-model.number="rows[p.id].counts[u.unit]" type="number" min="0" class="inp" style="width:64px;" @input="recount(p)"/>{{ $te('unitTypes', u.unit) }}</label>
                </div>
                <input v-else-if="rows[p.id]" v-model.number="rows[p.id].real" type="number" min="0" class="inp" style="width:90px;" @input="touch(p)"/>
              </td>
              <td>
                <span v-if="rows[p.id]?.dirty" :style="{padding:'2px 8px',borderRadius:'99px',fontFamily:'JetBrains Mono,monospace',fontWeight:'700',fontSize:'.82rem',background:diff(p)>0?'#f0fdf4':diff(p)<0?'#fef2f2':'#f9fafb',color:diff(p)>0?'#16a34a':diff(p)<0?'#dc2626':'#6b7280'}">{{ diff(p)>0?'+':'' }}{{ isNaN(diff(p))?'—':fmtQty(p, diff(p)) }}</span>
                <span v-else style="color:#9ca3af;">—</span>
                <!-- Lot concerné par l'écart : perte retirée de ce lot d'abord, surplus ajouté à ce lot -->
                <select v-if="rows[p.id]?.dirty&&diff(p)&&lots[p.id]?.length" v-model="rows[p.id].batchId" class="inp" style="display:block;margin-top:6px;width:220px;font-size:.75rem;" :title="$t('inventory.batchHelp')">
                  <option value="">{{ diff(p)<0 ? $t('inventory.batchAutoLoss') : $t('inventory.batchNone') }}</option>
                  <option v-for="b in lots[p.id]" :key="b.id" :value="b.id">{{ b.number }} · {{ store.fmt(b.expiration_date) }} · {{ fmtQty(p, b.quantity) }}{{ b.status!=='ACTIVE' ? ` (${$te('batchStatus', b.status)})` : '' }}</option>
                </select>
              </td>
              <td><input v-if="rows[p.id]" v-model="rows[p.id].note" class="inp" style="width:150px;" :placeholder="$t('inventory.reasonPh')"/></td>
              <td>
                <button v-if="rows[p.id]?.dirty&&rows[p.id]?.real!==p.stock" class="btn btn-primary btn-xs" @click="applyOne(p)"><Check size="1em" /></button>
                <span v-else-if="rows[p.id]?.dirty" style="color:#16a34a;font-size:.78rem;font-weight:600;"><CircleCheck size="1em" /> {{ $t('stock.ok') }}</span>
              </td>
            </tr>
            <tr v-if="!filtered.length"><td colspan="6" style="text-align:center;padding:28px;color:#6b7280;">{{ $t('products.none') }}</td></tr>
          </tbody>
        </table>
      </div>
    </div>
    <!-- Recent -->
    <div class="card">
      <div style="padding:12px 18px;border-bottom:1px solid #f3f4f6;"><h3 style="font-weight:700;margin:0;font-size:.9rem;">{{ $t('inventory.lastAdjustments') }}</h3></div>
      <div class="tbl-wrap">
        <table class="tbl">
          <thead><tr><th>{{ $t('common.date') }}</th><th>{{ $t('common.product') }}</th><th>{{ $t('inventory.expected') }}</th><th>{{ $t('inventory.real') }}</th><th>{{ $t('inventory.gap') }}</th><th>{{ $t('common.note') }}</th></tr></thead>
          <tbody>
            <tr v-for="inv in store.inventories" :key="inv.id">
              <td style="font-family:'JetBrains Mono',monospace;font-size:.8rem;color:#6b7280;">{{ store.fmt(inv.inventory_date) }}</td>
              <td style="font-weight:500;">{{ inv.product?.name }}</td>
              <td style="font-family:'JetBrains Mono',monospace;color:#6b7280;">{{ fmtQty(inv.product, inv.expected_stock) }}</td>
              <td style="font-family:'JetBrains Mono',monospace;font-weight:700;">{{ fmtQty(inv.product, inv.stock) }}</td>
              <td style="font-family:'JetBrains Mono',monospace;font-weight:700;" :style="{color:(inv.difference??0)>0?'#16a34a':(inv.difference??0)<0?'#dc2626':'#6b7280'}">{{ (inv.difference??0)>0?'+':'' }}{{ fmtQty(inv.product, inv.difference??0) }}</td>
              <td style="font-size:.8rem;color:#6b7280;">{{ inv.notes||'—' }}</td>
            </tr>
            <tr v-if="!store.inventories.length"><td colspan="6" style="text-align:center;padding:20px;color:#6b7280;">{{ $t('inventory.noAdjustments') }}</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ClipboardList, Search, Check, CircleCheck } from 'lucide-vue-next'
import { ref, computed, onMounted, watch } from 'vue'
import { usePharmaStore } from '../stores/pharma.js'
import { useToastStore }  from '../stores/toast.js'
import { batchApi } from '../services/api.js'
import { t } from '../i18n/index.js'
import { fmtStock, fmtQty, productUnitsOf, splitQty, joinQty } from '../utils/units.js'
const store=usePharmaStore(); const toast=useToastStore()
const search=ref(''); const filterStatus=ref(''); const applying=ref(false)
const rows=ref({})
// real = stock compté, en unités de base ; counts = le même réparti par unité (saisie boîtes / plaquettes / comprimés)
// batchId = lot de l'écart choisi ('' = automatique : perte prise des lots expirés puis des plus anciens ; surplus hors lot)
const freshRow=(p,real)=>({real,counts:splitQty(p,real),note:'',dirty:false,batchId:''})
// Lots du produit, chargés à la première saisie sur sa ligne
const lots=ref({})
async function loadLots(p){if(lots.value[p.id])return;lots.value[p.id]=[];try{const r=await batchApi.list({productId:p.id,pageSize:100});lots.value[p.id]=r.data||[]}catch{}}
function touch(p){rows.value[p.id].dirty=true;loadLots(p)}
function recount(p){const row=rows.value[p.id];row.real=joinQty(p,row.counts);touch(p)}
const itemOf=p=>({productId:p.id,stock:rows.value[p.id].real,notes:rows.value[p.id].note,...(rows.value[p.id].batchId&&{batchId:rows.value[p.id].batchId})})
function initRows(){store.products.forEach(p=>{if(!rows.value[p.id])rows.value[p.id]=freshRow(p,p.stock)})}
watch(()=>store.products.length,initRows)
const filtered=computed(()=>{
  const q=search.value.toLowerCase()
  return store.products.filter(p=>{
    const mQ=!q||p.name.toLowerCase().includes(q)
    const s=filterStatus.value
    const mS=!s||(s==='ok'&&p.stock>=p.threshold&&p.stock>0)||(s==='low'&&p.stock<p.threshold&&p.stock>0)||(s==='out'&&p.stock===0)
    return mQ&&mS
  })
})
const pendingCount=computed(()=>store.products.filter(p=>rows.value[p.id]?.dirty&&rows.value[p.id]?.real!==p.stock).length)
const diff=p=>{const r=rows.value[p.id]?.real;return(typeof r==='number')?r-p.stock:NaN}
function autoFill(){store.products.forEach(p=>{if(rows.value[p.id])rows.value[p.id]=freshRow(p,p.stock)})}
async function applyOne(p){
  const row=rows.value[p.id];if(!row||row.real===undefined)return
  try{await store.applyInventory([itemOf(p)]);toast.success(`"${p.name}" → ${productUnitsOf(p).length>1?fmtQty(p,row.real):t('common.units', { n: row.real })}`);rows.value[p.id]=freshRow(p,row.real);delete lots.value[p.id];await store.fetchInventories({pageSize:20})}catch(e){toast.error(e.message)}
}
async function applyAll(){
  const changed=store.products.filter(p=>rows.value[p.id]?.dirty&&rows.value[p.id]?.real!==p.stock)
  const items=changed.map(itemOf)
  if(!items.length)return;applying.value=true
  try{await store.applyInventory(items);toast.success(t('inventory.applied', { n: items.length }));changed.forEach(p=>{rows.value[p.id]=freshRow(p,rows.value[p.id].real);delete lots.value[p.id]});await store.fetchInventories({pageSize:20})}catch(e){toast.error(e.message)}finally{applying.value=false}
}
onMounted(async()=>{await store.fetchProducts({pageSize:100});await store.fetchInventories({pageSize:20});initRows()})
</script>
