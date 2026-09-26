<template>
  <div style="display:flex;flex-direction:column;gap:16px;">
    <div class="alert alert-blue">📋 Saisissez le stock réel compté. L'écart est calculé automatiquement et un mouvement d'ajustement est créé pour la traçabilité.</div>
    <div class="card card-p" style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;justify-content:space-between;">
      <div class="search-box" style="flex:1;max-width:280px;"><span class="search-icon">🔍</span><input v-model="search" class="inp" placeholder="Rechercher..."/></div>
      <div style="display:flex;gap:8px;">
        <select v-model="filterStatus" class="inp" style="width:170px;"><option value="">Tous</option><option value="ok">Stock OK</option><option value="low">Stock faible</option><option value="out">Rupture</option></select>
        <button class="btn btn-outline btn-sm" @click="autoFill">Pré-remplir</button>
        <button v-if="pendingCount>0" class="btn btn-primary" @click="applyAll" :disabled="applying">{{ applying?'...':'✅ Appliquer tout ('+pendingCount+')' }}</button>
      </div>
    </div>
    <div class="card">
      <div v-if="store.isBusy('prods')" class="loading-box"><div class="spinner"></div></div>
      <div v-else class="tbl-wrap">
        <table class="tbl">
          <thead><tr><th>Produit</th><th>Stock système</th><th>Stock réel</th><th>Écart</th><th>Note</th><th>Action</th></tr></thead>
          <tbody>
            <tr v-for="p in filtered" :key="p.id" :style="rows[p.id]?.dirty?'background:#f0fdf4':''">
              <td><div style="font-weight:600;">{{ p.name }}</div><div style="font-size:.72rem;color:#6b7280;">{{ p.unit_type }}</div></td>
              <td style="font-family:'JetBrains Mono',monospace;font-weight:700;" :style="{color:p.stock===0?'#dc2626':p.stock<p.threshold?'#ca8a04':'#111827'}">{{ p.stock }}</td>
              <td><input v-if="rows[p.id]" v-model.number="rows[p.id].real" type="number" min="0" class="inp" style="width:90px;" @input="rows[p.id].dirty=true"/></td>
              <td>
                <span v-if="rows[p.id]?.dirty" :style="{padding:'2px 8px',borderRadius:'99px',fontFamily:'JetBrains Mono,monospace',fontWeight:'700',fontSize:'.82rem',background:diff(p)>0?'#f0fdf4':diff(p)<0?'#fef2f2':'#f9fafb',color:diff(p)>0?'#16a34a':diff(p)<0?'#dc2626':'#6b7280'}">{{ diff(p)>0?'+':'' }}{{ isNaN(diff(p))?'—':diff(p) }}</span>
                <span v-else style="color:#9ca3af;">—</span>
              </td>
              <td><input v-if="rows[p.id]" v-model="rows[p.id].note" class="inp" style="width:150px;" placeholder="Raison..."/></td>
              <td>
                <button v-if="rows[p.id]?.dirty&&rows[p.id]?.real!==p.stock" class="btn btn-primary btn-xs" @click="applyOne(p)">✓</button>
                <span v-else-if="rows[p.id]?.dirty" style="color:#16a34a;font-size:.78rem;font-weight:600;">✅ OK</span>
              </td>
            </tr>
            <tr v-if="!filtered.length"><td colspan="6" style="text-align:center;padding:28px;color:#6b7280;">Aucun produit</td></tr>
          </tbody>
        </table>
      </div>
    </div>
    <!-- Recent -->
    <div class="card">
      <div style="padding:12px 18px;border-bottom:1px solid #f3f4f6;"><h3 style="font-weight:700;margin:0;font-size:.9rem;">Derniers ajustements</h3></div>
      <div class="tbl-wrap">
        <table class="tbl">
          <thead><tr><th>Date</th><th>Produit</th><th>Attendu</th><th>Réel</th><th>Écart</th><th>Note</th></tr></thead>
          <tbody>
            <tr v-for="inv in store.inventories" :key="inv.id">
              <td style="font-family:'JetBrains Mono',monospace;font-size:.8rem;color:#6b7280;">{{ store.fmt(inv.inventory_date) }}</td>
              <td style="font-weight:500;">{{ inv.product?.name }}</td>
              <td style="font-family:'JetBrains Mono',monospace;color:#6b7280;">{{ inv.expected_stock }}</td>
              <td style="font-family:'JetBrains Mono',monospace;font-weight:700;">{{ inv.stock }}</td>
              <td style="font-family:'JetBrains Mono',monospace;font-weight:700;" :style="{color:(inv.difference??0)>0?'#16a34a':(inv.difference??0)<0?'#dc2626':'#6b7280'}">{{ (inv.difference??0)>0?'+':'' }}{{ inv.difference??0 }}</td>
              <td style="font-size:.8rem;color:#6b7280;">{{ inv.notes||'—' }}</td>
            </tr>
            <tr v-if="!store.inventories.length"><td colspan="6" style="text-align:center;padding:20px;color:#6b7280;">Aucun ajustement</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { usePharmaStore } from '../stores/pharma.js'
import { useToastStore }  from '../stores/toast.js'
const store=usePharmaStore(); const toast=useToastStore()
const search=ref(''); const filterStatus=ref(''); const applying=ref(false)
const rows=ref({})
function initRows(){store.products.forEach(p=>{if(!rows.value[p.id])rows.value[p.id]={real:p.stock,note:'',dirty:false}})}
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
function autoFill(){store.products.forEach(p=>{if(rows.value[p.id]){rows.value[p.id].real=p.stock;rows.value[p.id].dirty=false}})}
async function applyOne(p){
  const row=rows.value[p.id];if(!row||row.real===undefined)return
  try{await store.applyInventory([{productId:p.id,stock:row.real,notes:row.note}]);toast.success(`"${p.name}" → ${row.real}u`);rows.value[p.id]={real:row.real,note:'',dirty:false};await store.fetchInventories({pageSize:20})}catch(e){toast.error(e.message)}
}
async function applyAll(){
  const items=store.products.filter(p=>rows.value[p.id]?.dirty&&rows.value[p.id]?.real!==p.stock).map(p=>({productId:p.id,stock:rows.value[p.id].real,notes:rows.value[p.id].note}))
  if(!items.length)return;applying.value=true
  try{await store.applyInventory(items);toast.success(`${items.length} ajustement(s) appliqué(s)`);items.forEach(i=>{rows.value[i.productId]={real:i.stock,note:'',dirty:false}});await store.fetchInventories({pageSize:20})}catch(e){toast.error(e.message)}finally{applying.value=false}
}
onMounted(async()=>{await store.fetchProducts({pageSize:100});await store.fetchInventories({pageSize:20});initRows()})
</script>
