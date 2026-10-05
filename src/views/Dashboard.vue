<template>
  <div style="display:flex;flex-direction:column;gap:20px;">
    <div v-if="store.isBusy('dash')" class="loading-box"><div class="spinner"></div> Chargement...</div>
    <template v-else>
      <div class="kpi-grid">
        <div class="card kpi-card"><div class="kpi-icon" style="background:#f0fdf4;color:#16a34a;"><Banknote size="1em" /></div><div class="kpi-value" style="color:#16a34a;">{{ fmtP(d?.sales?.caToday) }}</div><div class="kpi-label">CA Aujourd'hui</div></div>
        <div class="card kpi-card"><div class="kpi-icon" style="background:#fefce8;color:#ca8a04;"><Calendar size="1em" /></div><div class="kpi-value" style="color:#ca8a04;">{{ fmtP(d?.sales?.caMonth) }}</div><div class="kpi-label">CA Ce Mois</div></div>
        <div class="card kpi-card"><div class="kpi-icon" style="background:#eff6ff;color:#2563eb;"><Package size="1em" /></div><div class="kpi-value" style="color:#2563eb;">{{ d?.products?.total ?? 0 }}</div><div class="kpi-label">Produits</div></div>
        <div class="card kpi-card" @click="$router.push('/app/alertes')" style="cursor:pointer;"><div class="kpi-icon" style="background:#fef2f2;color:#dc2626;"><Siren size="1em" /></div><div class="kpi-value" style="color:#dc2626;">{{ store.alertCount }}</div><div class="kpi-label">Alertes</div></div>
      </div>

      <div v-if="d?.alerts?.outOfStock?.length" class="alert alert-red"><Siren size="1em" /> <strong>{{ d.alerts.outOfStock.length }} produit(s) en rupture !</strong> <RouterLink to="/alertes" style="margin-left:auto;color:inherit;font-weight:700;">Voir →</RouterLink></div>
      <div v-else-if="d?.alerts?.lowStock?.length" class="alert alert-yellow"><TriangleAlert size="1em" /> <strong>{{ d.alerts.lowStock.length }} produit(s) sous le seuil</strong> <RouterLink to="/alertes" style="margin-left:auto;color:inherit;font-weight:700;">Voir →</RouterLink></div>

      <div style="display:grid;grid-template-columns:3fr 2fr;gap:16px;">
        <div class="card card-p">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
            <h3 style="font-weight:700;font-size:.95rem;margin:0;">CA — 7 derniers jours</h3>
          </div>
          <canvas ref="chartRef" style="max-height:200px;"></canvas>
        </div>
        <div class="card card-p">
          <h3 style="font-weight:700;font-size:.95rem;margin:0 0 14px;">Actions rapides</h3>
          <div style="display:flex;flex-direction:column;gap:8px;">
            <RouterLink to="/app/ventes"    style="display:flex;align-items:center;gap:10px;padding:11px;border-radius:9px;border:1px solid #bbf7d0;background:#f0fdf4;color:#166534;text-decoration:none;font-weight:600;font-size:.875rem;"><span><Banknote size="1em" /></span><div><strong style="display:block;">Nouvelle vente</strong><span style="font-weight:400;font-size:.78rem;color:#16a34a;">Enregistrer une vente</span></div></RouterLink>
            <RouterLink to="/app/reception" style="display:flex;align-items:center;gap:10px;padding:11px;border-radius:9px;border:1px solid #bfdbfe;background:#eff6ff;color:#1e40af;text-decoration:none;font-weight:600;font-size:.875rem;"><span><PackagePlus size="1em" /></span><div><strong style="display:block;">Réception stock</strong><span style="font-weight:400;font-size:.78rem;color:#2563eb;">Ajouter une livraison</span></div></RouterLink>
            <RouterLink to="/app/inventaire" style="display:flex;align-items:center;gap:10px;padding:11px;border-radius:9px;border:1px solid #e9d5ff;background:#f5f3ff;color:#5b21b6;text-decoration:none;font-weight:600;font-size:.875rem;"><span><ClipboardList size="1em" /></span><div><strong style="display:block;">Inventaire</strong><span style="font-weight:400;font-size:.78rem;color:#7c3aed;">Corriger les stocks</span></div></RouterLink>
            <RouterLink to="/app/produits"  style="display:flex;align-items:center;gap:10px;padding:11px;border-radius:9px;border:1px solid #fecaca;background:#fef2f2;color:#991b1b;text-decoration:none;font-weight:600;font-size:.875rem;"><span><Package size="1em" /></span><div><strong style="display:block;">Ajouter produit</strong><span style="font-weight:400;font-size:.78rem;color:#dc2626;">Nouveau médicament</span></div></RouterLink>
          </div>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:3fr 2fr;gap:16px;">
        <div class="card card-p">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
            <h3 style="font-weight:700;font-size:.95rem;margin:0;">Mouvements récents</h3>
            <RouterLink to="/app/mouvements" style="font-size:.8rem;color:#16a34a;font-weight:600;">Voir tout →</RouterLink>
          </div>
          <div class="tbl-wrap">
            <table class="tbl">
              <thead><tr><th>Date</th><th>Produit</th><th>Type</th><th>Qté</th></tr></thead>
              <tbody>
                <tr v-for="m in d?.movements?.recentMovements??[]" :key="m.id">
                  <td style="font-family:'JetBrains Mono',monospace;font-size:.8rem;color:#6b7280;">{{ store.fmt(m.movement_date) }}</td>
                  <td style="max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:.875rem;">{{ m.product?.name }}</td>
                  <td><span class="badge" :class="m.type==='ENTRY'?'badge-blue':m.type==='SALE'?'badge-yellow':'badge-purple'" style="font-size:.65rem;">{{ m.type==='ENTRY'?'ENTRÉE':m.type==='SALE'?'SORTIE':'AJUST.' }}</span></td>
                  <td style="font-family:'JetBrains Mono',monospace;font-weight:700;font-size:.9rem;" :style="{color:m.quantity>0?'#16a34a':'#dc2626'}">{{ m.quantity>0?'+':'' }}{{ m.quantity }}</td>
                </tr>
                <tr v-if="!d?.movements?.recentMovements?.length"><td colspan="4" style="text-align:center;color:#6b7280;padding:16px;">Aucun mouvement</td></tr>
              </tbody>
            </table>
          </div>
        </div>
        <div class="card card-p">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
            <h3 style="font-weight:700;font-size:.95rem;margin:0;">Stock critique</h3>
            <RouterLink to="/app/alertes" style="font-size:.8rem;color:#16a34a;font-weight:600;">Voir →</RouterLink>
          </div>
          <div style="display:flex;flex-direction:column;gap:8px;">
            <div v-for="p in store.alerts.slice(0,5)" :key="p.id" style="display:flex;align-items:center;justify-content:space-between;padding:9px;background:#f9fafb;border-radius:8px;border:1px solid #f3f4f6;">
              <div><div style="font-weight:600;font-size:.875rem;">{{ p.name }}</div><div style="font-size:.72rem;color:#6b7280;">{{ p.category?.name }}</div></div>
              <div style="text-align:right;"><div style="font-family:'JetBrains Mono',monospace;font-weight:700;" :style="{color:p.stock===0?'#dc2626':'#ca8a04'}">{{ p.stock }}u</div><span class="badge" :class="p.stock===0?'badge-red':'badge-yellow'" style="font-size:.65rem;">{{ p.stock===0?'RUPTURE':'FAIBLE' }}</span></div>
            </div>
            <div v-if="!store.alerts.length" style="text-align:center;padding:16px;color:#6b7280;font-size:.875rem;"><CircleCheck size="1em" /> Tous les stocks OK</div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
<script setup>
import { Banknote, Calendar, Package, Siren, TriangleAlert, PackagePlus, ClipboardList, CircleCheck } from 'lucide-vue-next'
import { ref, computed, onMounted, watch } from 'vue'
import { Chart, registerables } from 'chart.js'
import { usePharmaStore } from '../stores/pharma.js'
Chart.register(...registerables)
const store = usePharmaStore()
const chartRef = ref(null)
let chartInst = null
const d = computed(() => store.dashboard)
const fmtP = v => Number(v||0).toLocaleString('fr-FR') + ' MRU'
function buildChart() {
  if (!chartRef.value || !d.value) return
  if (chartInst) { chartInst.destroy(); chartInst = null }
  const last7 = d.value.sales?.last7days ?? []
  chartInst = new Chart(chartRef.value, {
    type:'bar',
    data:{ labels:last7.map(x=>new Date(x.date).toLocaleDateString('fr-FR',{weekday:'short',day:'numeric'})), datasets:[{ label:'CA (MRU)', data:last7.map(x=>parseFloat(x.total)), backgroundColor:'rgba(22,163,74,.12)', borderColor:'#16a34a', borderWidth:2, borderRadius:7, borderSkipped:false }] },
    options:{ responsive:true, maintainAspectRatio:true, plugins:{ legend:{ display:false } }, scales:{ x:{ grid:{ display:false }, ticks:{ font:{ family:'Inter', size:11 }, color:'#6b7280' } }, y:{ grid:{ color:'rgba(0,0,0,.04)' }, ticks:{ font:{ family:'JetBrains Mono', size:10 }, color:'#6b7280' } } } }
  })
}
onMounted(async () => { await store.fetchDashboard(); setTimeout(buildChart,100) })
watch(d, () => setTimeout(buildChart,100))
</script>
