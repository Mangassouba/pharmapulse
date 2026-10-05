<template>
  <div style="display:flex;flex-direction:column;gap:16px;">
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;">
      <div class="card card-p" style="border-top:3px solid #dc2626;"><div style="font-size:1.6rem;font-weight:800;font-family:'JetBrains Mono',monospace;color:#dc2626;">{{ outOfStock.length }}</div><div style="font-size:.78rem;color:#6b7280;">Ruptures totales</div></div>
      <div class="card card-p" style="border-top:3px solid #ca8a04;"><div style="font-size:1.6rem;font-weight:800;font-family:'JetBrains Mono',monospace;color:#ca8a04;">{{ lowStock.length }}</div><div style="font-size:.78rem;color:#6b7280;">Stocks faibles</div></div>
      <div class="card card-p" style="border-top:3px solid #16a34a;"><div style="font-size:1.6rem;font-weight:800;font-family:'JetBrains Mono',monospace;color:#16a34a;">{{ okProducts.length }}</div><div style="font-size:.78rem;color:#6b7280;">Produits OK</div></div>
      <div class="card card-p" style="border-top:3px solid #2563eb;"><div style="font-size:1.6rem;font-weight:800;font-family:'JetBrains Mono',monospace;color:#2563eb;">{{ expiringBatches.length }}</div><div style="font-size:.78rem;color:#6b7280;">Lots expirant (30j)</div></div>
    </div>
    <div v-if="!store.alertCount&&!expiringBatches.length" class="card card-p" style="text-align:center;padding:40px;"><div style="font-size:3rem;margin-bottom:12px;"><CircleCheck size="1em" /></div><h3 style="font-weight:700;color:#16a34a;">Tous les stocks sont en ordre !</h3><p style="color:#6b7280;margin-top:6px;">Aucune alerte active.</p></div>
    <!-- Ruptures -->
    <div v-if="outOfStock.length" class="card">
      <div style="padding:14px 18px;border-bottom:1px solid #fecaca;background:#fef2f2;display:flex;align-items:center;justify-content:space-between;"><div><h3 style="font-weight:700;color:#dc2626;margin:0;"><Siren size="1em" /> Ruptures de Stock ({{ outOfStock.length }})</h3><p style="font-size:.78rem;color:#6b7280;margin:2px 0 0;">Réapprovisionnement urgent requis</p></div><RouterLink to="/app/reception" class="btn btn-primary btn-sm" style="text-decoration:none;"><PackagePlus size="1em" /> Réceptionner</RouterLink></div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px;padding:16px;">
        <div v-for="p in outOfStock" :key="p.id" style="border:1px solid #fecaca;border-radius:10px;padding:14px;background:#fffafa;">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px;"><div><div style="font-weight:700;">{{ p.name }}</div><div style="font-size:.72rem;color:#6b7280;">{{ p.category?.name }}</div></div><span class="badge badge-red">RUPTURE</span></div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">
            <div style="background:#fef2f2;border-radius:7px;padding:8px;"><div style="font-size:.68rem;color:#6b7280;">Stock</div><div style="font-family:'JetBrains Mono',monospace;font-weight:700;color:#dc2626;">0</div></div>
            <div style="background:#f9fafb;border-radius:7px;padding:8px;"><div style="font-size:.68rem;color:#6b7280;">Seuil min</div><div style="font-family:'JetBrains Mono',monospace;font-weight:700;">{{ p.threshold }}</div></div>
          </div>
        </div>
      </div>
    </div>
    <!-- Stock faible -->
    <div v-if="lowStock.length" class="card">
      <div style="padding:14px 18px;border-bottom:1px solid #fef08a;background:#fefce8;"><h3 style="font-weight:700;color:#ca8a04;margin:0;"><TriangleAlert size="1em" /> Stocks Faibles ({{ lowStock.length }})</h3></div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px;padding:16px;">
        <div v-for="p in lowStock" :key="p.id" style="border:1px solid #fef08a;border-radius:10px;padding:14px;background:#fefce8;">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px;"><div><div style="font-weight:700;">{{ p.name }}</div><div style="font-size:.72rem;color:#6b7280;">{{ p.category?.name }}</div></div><span class="badge badge-yellow">FAIBLE</span></div>
          <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:4px;font-size:.78rem;">
            <div style="background:#f9fafb;border-radius:6px;padding:6px;text-align:center;"><div style="color:#6b7280;font-size:.65rem;">Stock</div><div style="font-weight:700;color:#ca8a04;font-family:'JetBrains Mono',monospace;">{{ p.stock }}</div></div>
            <div style="background:#f9fafb;border-radius:6px;padding:6px;text-align:center;"><div style="color:#6b7280;font-size:.65rem;">Min</div><div style="font-weight:700;font-family:'JetBrains Mono',monospace;">{{ p.threshold }}</div></div>
            <div style="background:#f9fafb;border-radius:6px;padding:6px;text-align:center;"><div style="color:#6b7280;font-size:.65rem;">Manque</div><div style="font-weight:700;color:#dc2626;font-family:'JetBrains Mono',monospace;">{{ p.threshold-p.stock }}</div></div>
            <div style="background:#f9fafb;border-radius:6px;padding:6px;text-align:center;"><div style="color:#6b7280;font-size:.65rem;">Couv.</div><div style="font-weight:700;font-family:'JetBrains Mono',monospace;">{{ Math.round((p.stock/p.threshold)*100) }}%</div></div>
          </div>
          <div class="progress" style="margin-top:8px;"><div class="progress-fill" :style="{width:Math.min(100,Math.round((p.stock/p.threshold)*100))+'%',background:'#ca8a04'}"></div></div>
        </div>
      </div>
    </div>
    <!-- Lots -->
    <div v-if="expiringBatches.length" class="card">
      <div style="padding:14px 18px;border-bottom:1px solid #bfdbfe;background:#eff6ff;display:flex;align-items:center;justify-content:space-between;"><div><h3 style="font-weight:700;color:#2563eb;margin:0;"><CalendarClock size="1em" /> Lots expirant dans 30 jours</h3></div><RouterLink to="/app/lots" style="font-size:.8rem;color:#2563eb;font-weight:600;">Voir les lots →</RouterLink></div>
      <div class="tbl-wrap">
        <table class="tbl"><thead><tr><th>Produit</th><th>N° Lot</th><th>Quantité</th><th>Péremption</th><th>Jours restants</th></tr></thead>
          <tbody>
            <tr v-for="b in expiringBatches" :key="b.id"><td style="font-weight:600;">{{ b.product?.name }}</td><td style="font-family:'JetBrains Mono',monospace;font-size:.8rem;">{{ b.number }}</td><td style="font-family:'JetBrains Mono',monospace;">{{ b.quantity }}</td><td style="font-family:'JetBrains Mono',monospace;font-size:.8rem;color:#dc2626;">{{ store.fmt(b.expiration_date) }}</td><td><span class="badge" :class="daysLeft(b.expiration_date)<7?'badge-red':'badge-yellow'">{{ daysLeft(b.expiration_date) }}j</span></td></tr>
          </tbody>
        </table>
      </div>
    </div>
    <!-- Tableau santé -->
    <div class="card">
      <div style="padding:12px 18px;border-bottom:1px solid #f3f4f6;"><h3 style="font-weight:700;margin:0;font-size:.9rem;">Santé globale du stock</h3></div>
      <div class="tbl-wrap">
        <table class="tbl"><thead><tr><th>Produit</th><th>Stock</th><th>Min</th><th>Couverture</th><th>Statut</th></tr></thead>
          <tbody>
            <tr v-for="p in sortedProds" :key="p.id">
              <td><div style="font-weight:600;">{{ p.name }}</div><div style="font-size:.72rem;color:#6b7280;">{{ p.category?.name }}</div></td>
              <td style="font-family:'JetBrains Mono',monospace;font-weight:700;" :style="{color:p.stock===0?'#dc2626':p.stock<p.threshold?'#ca8a04':'#16a34a'}">{{ p.stock }}</td>
              <td style="font-family:'JetBrains Mono',monospace;color:#6b7280;">{{ p.threshold }}</td>
              <td style="min-width:120px;"><div style="display:flex;align-items:center;gap:8px;"><div class="progress" style="flex:1;"><div class="progress-fill" :style="{width:Math.min(100,p.stock===0?0:Math.round((p.stock/p.threshold)*100))+'%',background:p.stock===0?'#dc2626':p.stock<p.threshold?'#ca8a04':'#16a34a'}"></div></div><span style="font-size:.72rem;font-family:'JetBrains Mono',monospace;color:#6b7280;width:32px;">{{ p.stock===0?0:Math.min(100,Math.round((p.stock/p.threshold)*100)) }}%</span></div></td>
              <td><span class="badge" :class="p.stock===0?'badge-red':p.stock<p.threshold?'badge-yellow':'badge-green'">{{ p.stock===0?'RUPTURE':p.stock<p.threshold?'FAIBLE':'OK' }}</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
<script setup>
import { CircleCheck, Siren, PackagePlus, TriangleAlert, CalendarClock } from 'lucide-vue-next'
import { ref, computed, onMounted } from 'vue'
import { usePharmaStore } from '../stores/pharma.js'
import { batchApi } from '../services/api.js'
const store=usePharmaStore()
const expiringBatches=ref([])
const outOfStock=computed(()=>store.products.filter(p=>p.stock===0))
const lowStock=computed(()=>store.products.filter(p=>p.stock>0&&p.stock<p.threshold))
const okProducts=computed(()=>store.products.filter(p=>p.stock>=p.threshold))
const sortedProds=computed(()=>[...store.products].sort((a,b)=>{const sa=a.stock===0?0:a.stock<a.threshold?1:2,sb=b.stock===0?0:b.stock<b.threshold?1:2;return sa-sb}))
const daysLeft=d=>Math.max(0,Math.floor((new Date(d)-new Date())/86400000))
onMounted(async()=>{await store.fetchProducts({pageSize:100});try{const r=await batchApi.expiring();expiringBatches.value=r.data||[]}catch{}})
</script>
