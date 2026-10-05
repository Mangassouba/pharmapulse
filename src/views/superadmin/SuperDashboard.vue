<template>
  <div style="display:flex;flex-direction:column;gap:20px;">
    <div v-if="store.loading" style="display:flex;align-items:center;justify-content:center;gap:10px;padding:40px;color:#6b7280;">
      <div class="spinner" style="border-top-color:#7c3aed;"></div> Chargement...
    </div>
    <template v-else>
      <!-- KPIs -->
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;">
        <div class="scard scard-p skpi" style="border-top-color:#7c3aed;">
          <div style="width:40px;height:40px;border-radius:10px;background:#f5f3ff;display:flex;align-items:center;justify-content:center;font-size:1.1rem;"><Hospital size="1em" /></div>
          <div class="skpi-val" style="color:#7c3aed;">{{ s?.pharmacies?.total ?? 0 }}</div>
          <div style="font-size:.78rem;color:#6b7280;">Total pharmacies</div>
        </div>
        <div class="scard scard-p skpi" style="border-top-color:#16a34a;">
          <div style="width:40px;height:40px;border-radius:10px;background:#f0fdf4;display:flex;align-items:center;justify-content:center;font-size:1.1rem;"><CircleCheck size="1em" /></div>
          <div class="skpi-val" style="color:#16a34a;">{{ s?.pharmacies?.active ?? 0 }}</div>
          <div style="font-size:.78rem;color:#6b7280;">Pharmacies actives</div>
        </div>
        <div class="scard scard-p skpi" style="border-top-color:#dc2626;">
          <div style="width:40px;height:40px;border-radius:10px;background:#fef2f2;display:flex;align-items:center;justify-content:center;font-size:1.1rem;"><CircleX size="1em" /></div>
          <div class="skpi-val" style="color:#dc2626;">{{ s?.pharmacies?.suspended ?? 0 }}</div>
          <div style="font-size:.78rem;color:#6b7280;">Suspendues</div>
        </div>
        <div class="scard scard-p skpi" style="border-top-color:#2563eb;">
          <div style="width:40px;height:40px;border-radius:10px;background:#eff6ff;display:flex;align-items:center;justify-content:center;font-size:1.1rem;"><Users size="1em" /></div>
          <div class="skpi-val" style="color:#2563eb;">{{ s?.users?.total ?? 0 }}</div>
          <div style="font-size:.78rem;color:#6b7280;">Utilisateurs</div>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
        <!-- Recent pharmacies -->
        <div class="scard scard-p">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
            <h3 style="font-weight:700;font-size:.95rem;margin:0;">Inscriptions récentes</h3>
            <RouterLink to="/super/pharmacies" style="font-size:.8rem;color:#7c3aed;font-weight:600;">Voir tout →</RouterLink>
          </div>
          <div v-for="p in s?.recentPharmacies ?? []" :key="p.id" style="display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid #f5f3ff;">
            <div style="width:34px;height:34px;border-radius:8px;background:#f5f3ff;color:#7c3aed;font-weight:800;font-size:.85rem;display:flex;align-items:center;justify-content:center;flex-shrink:0;">{{ p.name.charAt(0) }}</div>
            <div style="flex:1;min-width:0;">
              <div style="font-weight:600;font-size:.875rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ p.name }}</div>
              <div style="font-size:.75rem;color:#6b7280;">{{ p.city || '—' }}</div>
            </div>
            <span class="badge" :class="p.status==='ACTIVE'?'badge-green':p.status==='SUSPENDED'?'badge-red':'badge-yellow'">{{ p.status }}</span>
          </div>
          <div v-if="!s?.recentPharmacies?.length" style="text-align:center;padding:20px;color:#6b7280;font-size:.85rem;">Aucune inscription récente</div>
        </div>

        <!-- Revenue + subscriptions -->
        <div class="scard scard-p">
          <h3 style="font-weight:700;font-size:.95rem;margin:0 0 14px;">Abonnements & Revenus</h3>
          <div style="display:flex;flex-direction:column;gap:10px;">
            <div style="display:flex;justify-content:space-between;align-items:center;padding:10px;background:#f9fafb;border-radius:8px;">
              <span style="font-size:.875rem;font-weight:500;">Actifs</span>
              <span style="font-family:'JetBrains Mono',monospace;font-weight:700;color:#16a34a;">{{ s?.pharmacies?.active ?? 0 }}</span>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;padding:10px;background:#fef2f2;border-radius:8px;">
              <span style="font-size:.875rem;font-weight:500;">Suspendus</span>
              <span style="font-family:'JetBrains Mono',monospace;font-weight:700;color:#dc2626;">{{ s?.pharmacies?.suspended ?? 0 }}</span>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;padding:10px;background:#fef9c3;border-radius:8px;">
              <span style="font-size:.875rem;font-weight:500;">Expirant (30j)</span>
              <span style="font-family:'JetBrains Mono',monospace;font-weight:700;color:#ca8a04;">{{ s?.subscriptions?.expiringSoon ?? 0 }}</span>
            </div>
          </div>
          <div style="margin-top:16px;padding:14px;background:#f5f3ff;border-radius:10px;text-align:center;">
            <div style="font-size:.78rem;color:#7c3aed;font-weight:600;margin-bottom:4px;">CA Abonnements (mois)</div>
            <div style="font-size:1.6rem;font-weight:800;font-family:'JetBrains Mono',monospace;color:#7c3aed;">{{ fmtPrice(s?.revenue?.thisMonth) }}</div>
          </div>
        </div>
      </div>

      <!-- Actions rapides -->
      <div class="scard scard-p">
        <h3 style="font-weight:700;font-size:.95rem;margin:0 0 14px;">Actions rapides</h3>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;">
          <RouterLink to="/super/pharmacies" style="display:flex;align-items:center;gap:10px;padding:14px;border-radius:10px;border:1px solid #ddd6fe;background:#f5f3ff;color:#7c3aed;text-decoration:none;font-weight:600;font-size:.875rem;">
            <span><Hospital size="1em" /></span> Nouvelle pharmacie
          </RouterLink>
          <RouterLink to="/super/pharmacies" style="display:flex;align-items:center;gap:10px;padding:14px;border-radius:10px;border:1px solid #fecaca;background:#fef2f2;color:#dc2626;text-decoration:none;font-weight:600;font-size:.875rem;">
            <span><TriangleAlert size="1em" /></span> Pharmacies suspendues
          </RouterLink>
          <RouterLink to="/super/utilisateurs" style="display:flex;align-items:center;gap:10px;padding:14px;border-radius:10px;border:1px solid #bfdbfe;background:#eff6ff;color:#2563eb;text-decoration:none;font-weight:600;font-size:.875rem;">
            <span><Users size="1em" /></span> Tous utilisateurs
          </RouterLink>
          <RouterLink to="/super/logs" style="display:flex;align-items:center;gap:10px;padding:14px;border-radius:10px;border:1px solid #bbf7d0;background:#f0fdf4;color:#16a34a;text-decoration:none;font-weight:600;font-size:.875rem;">
            <span><ClipboardList size="1em" /></span> Journaux activité
          </RouterLink>
        </div>
      </div>
    </template>
  </div>
</template>
<script setup>
import { Hospital, CircleCheck, CircleX, Users, TriangleAlert, ClipboardList } from 'lucide-vue-next'
import { computed } from 'vue'
import { useSuperAdminStore } from '../../stores/superAdmin.js'
const store = useSuperAdminStore()
const s = computed(() => store.stats)
function fmtPrice(v) { return Number(v||0).toLocaleString('fr-FR') + ' MRU' }
</script>
