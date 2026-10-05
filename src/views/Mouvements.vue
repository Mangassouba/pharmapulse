<template>
  <div style="display:flex;flex-direction:column;gap:16px;">
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;">
      <div class="card card-p"><div style="font-size:1.4rem;font-weight:800;font-family:'JetBrains Mono',monospace;color:#2563eb;">{{ mvStats.totalEntries??'—' }}</div><div style="font-size:.78rem;color:#6b7280;">Unités entrées</div></div>
      <div class="card card-p"><div style="font-size:1.4rem;font-weight:800;font-family:'JetBrains Mono',monospace;color:#ca8a04;">{{ mvStats.totalSales??'—' }}</div><div style="font-size:.78rem;color:#6b7280;">Unités sorties</div></div>
      <div class="card card-p"><div style="font-size:1.4rem;font-weight:800;font-family:'JetBrains Mono',monospace;color:#7c3aed;">{{ mvStats.totalAdjustments??'—' }}</div><div style="font-size:.78rem;color:#6b7280;">Ajustements</div></div>
      <div class="card card-p"><div style="font-size:1.4rem;font-weight:800;font-family:'JetBrains Mono',monospace;color:#16a34a;">{{ store.movMeta.total }}</div><div style="font-size:.78rem;color:#6b7280;">Total mouvements</div></div>
    </div>
    <div class="card card-p" style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;">
      <div class="search-box" style="flex:1;min-width:200px;"><span class="search-icon"><Search size="1em" /></span><input v-model="search" class="inp" placeholder="Produit..." @input="debouncedFetch"/></div>
      <select v-model="filterType" class="inp" style="width:150px;" @change="fetchData"><option value="">Tous types</option><option value="ENTRY">Entrées</option><option value="SALE">Sorties</option><option value="INVENTORY">Inventaire</option></select>
      <select v-model="filterProd" class="inp" style="width:190px;" @change="fetchData"><option value="">Tous produits</option><option v-for="p in store.products" :key="p.id" :value="p.id">{{ p.name }}</option></select>
      <input v-model="dateFrom" type="date" class="inp" style="width:145px;" @change="fetchData"/>
      <input v-model="dateTo"   type="date" class="inp" style="width:145px;" @change="fetchData"/>
      <button class="btn btn-outline btn-sm" @click="reset">↺ Réinit.</button>
    </div>
    <div class="card">
      <div v-if="store.isBusy('mov')" class="loading-box"><div class="spinner"></div></div>
      <div v-else class="tbl-wrap">
        <table class="tbl">
          <thead><tr><th>Date</th><th>Produit</th><th>Type</th><th>Quantité</th><th>Stock avant</th><th>Stock après</th><th>Motif</th></tr></thead>
          <tbody>
            <tr v-for="m in store.movements" :key="m.id">
              <td style="font-family:'JetBrains Mono',monospace;font-size:.8rem;color:#6b7280;white-space:nowrap;">{{ store.fmt(m.movement_date) }}</td>
              <td style="font-weight:500;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ m.product?.name }}</td>
              <td><span class="badge" :class="m.type==='ENTRY'?'badge-blue':m.type==='SALE'?'badge-yellow':'badge-purple'" style="font-size:.67rem;">{{ {ENTRY:'ENTRÉE',SALE:'SORTIE',INVENTORY:'INVENTAIRE',ADJUSTMENT:'AJUSTEMENT'}[m.type] }}</span></td>
              <td style="font-family:'JetBrains Mono',monospace;font-weight:700;" :style="{color:m.quantity>0?'#16a34a':'#dc2626'}">{{ m.quantity>0?'+':'' }}{{ m.quantity }}</td>
              <td style="font-family:'JetBrains Mono',monospace;font-size:.8rem;color:#6b7280;">{{ m.previous_stock??'—' }}</td>
              <td style="font-family:'JetBrains Mono',monospace;font-size:.8rem;font-weight:600;">{{ m.new_stock??'—' }}</td>
              <td style="font-size:.8rem;color:#6b7280;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ m.reason||'—' }}</td>
            </tr>
            <tr v-if="!store.movements.length"><td colspan="7" style="text-align:center;padding:28px;color:#6b7280;">Aucun mouvement</td></tr>
          </tbody>
        </table>
      </div>
      <div v-if="store.movMeta.totalPages>1" class="pagination">
        <button class="page-btn" @click="page--;fetchData()" :disabled="page===1">‹</button>
        <span style="font-size:.85rem;color:#6b7280;">{{ page }} / {{ store.movMeta.totalPages }}</span>
        <button class="page-btn" @click="page++;fetchData()" :disabled="page>=store.movMeta.totalPages">›</button>
      </div>
    </div>
  </div>
</template>
<script setup>
import { Search } from 'lucide-vue-next'
import { ref, onMounted } from 'vue'
import { usePharmaStore } from '../stores/pharma.js'
import { movementApi } from '../services/api.js'
const store=usePharmaStore()
const search=ref(''); const filterType=ref(''); const filterProd=ref(''); const dateFrom=ref(''); const dateTo=ref(''); const page=ref(1); const mvStats=ref({})
function reset(){search.value='';filterType.value='';filterProd.value='';dateFrom.value='';dateTo.value='';page.value=1;fetchData()}
let dt; function debouncedFetch(){clearTimeout(dt);dt=setTimeout(fetchData,380)}
async function fetchData(){await store.fetchMovements({page:page.value,pageSize:20,type:filterType.value||undefined,productId:filterProd.value||undefined,search:search.value||undefined,dateFrom:dateFrom.value||undefined,dateTo:dateTo.value||undefined})}
onMounted(async()=>{await store.fetchProducts({pageSize:100});fetchData();try{const r=await movementApi.stats();mvStats.value=r.data}catch{}})
</script>
