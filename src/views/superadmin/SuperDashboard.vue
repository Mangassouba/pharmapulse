<template>
  <div style="display:flex;flex-direction:column;gap:20px;">
    <div v-if="store.loading" style="display:flex;align-items:center;justify-content:center;gap:10px;padding:40px;color:#6b7280;">
      <div class="spinner" style="border-top-color:#7c3aed;"></div> {{ $t('common.loading') }}
    </div>
    <template v-else>
      <!-- KPIs -->
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;">
        <div class="scard scard-p skpi" style="border-top-color:#7c3aed;">
          <div style="width:40px;height:40px;border-radius:10px;background:#f5f3ff;display:flex;align-items:center;justify-content:center;font-size:1.1rem;"><Hospital size="1em" /></div>
          <div class="skpi-val" style="color:#7c3aed;">{{ s?.pharmacies?.total ?? 0 }}</div>
          <div style="font-size:.78rem;color:#6b7280;">{{ $t('super.dash.totalPharmacies') }}</div>
        </div>
        <div class="scard scard-p skpi" style="border-top-color:#16a34a;">
          <div style="width:40px;height:40px;border-radius:10px;background:#f0fdf4;display:flex;align-items:center;justify-content:center;font-size:1.1rem;"><CircleCheck size="1em" /></div>
          <div class="skpi-val" style="color:#16a34a;">{{ s?.pharmacies?.active ?? 0 }}</div>
          <div style="font-size:.78rem;color:#6b7280;">{{ $t('super.dash.activePharmacies') }}</div>
        </div>
        <div class="scard scard-p skpi" style="border-top-color:#dc2626;">
          <div style="width:40px;height:40px;border-radius:10px;background:#fef2f2;display:flex;align-items:center;justify-content:center;font-size:1.1rem;"><CircleX size="1em" /></div>
          <div class="skpi-val" style="color:#dc2626;">{{ s?.pharmacies?.suspended ?? 0 }}</div>
          <div style="font-size:.78rem;color:#6b7280;">{{ $t('super.dash.suspended') }}</div>
        </div>
        <div class="scard scard-p skpi" style="border-top-color:#2563eb;">
          <div style="width:40px;height:40px;border-radius:10px;background:#eff6ff;display:flex;align-items:center;justify-content:center;font-size:1.1rem;"><Users size="1em" /></div>
          <div class="skpi-val" style="color:#2563eb;">{{ s?.users?.total ?? 0 }}</div>
          <div style="font-size:.78rem;color:#6b7280;">{{ $t('nav.users') }}</div>
        </div>
      </div>

      <!-- Site visitors -->
      <div class="scard scard-p">
        <div style="display:flex;justify-content:space-between;align-items:baseline;gap:10px;flex-wrap:wrap;margin-bottom:14px;">
          <h3 style="font-weight:700;font-size:.95rem;margin:0;display:flex;align-items:center;gap:8px;"><Eye size="1em" style="color:#7c3aed;" /> {{ $t('super.dash.visitors') }}</h3>
          <span style="font-size:.75rem;color:#6b7280;">{{ $t('super.dash.visitorsHelp') }}</span>
        </div>
        <div class="visit-tiles">
          <div v-for="tile in visitTiles" :key="tile.label" class="visit-tile">
            <div class="visit-val">{{ fmtNum(tile.value) }}</div>
            <div class="visit-lbl">{{ tile.label }}</div>
          </div>
        </div>
        <div class="visit-chart-hd">
          <span>{{ $t('super.dash.visitorsPerDay') }}</span>
          <span class="visit-readout">{{ hoverDay ? `${fmtDay(hoverDay.day)} : ${$t(hoverDay.visitors > 1 ? 'super.dash.visitorsN' : 'super.dash.visitor1', { n: hoverDay.visitors })}` : '' }}</span>
        </div>
        <div class="visit-chart" @mouseleave="hoverDay = null" role="img" :aria-label="$t('super.dash.chartAria', { max: visitMax })">
          <div v-for="d in visitDaily" :key="d.day" class="visit-col" :class="{ active: hoverDay?.day === d.day }"
            @mouseenter="hoverDay = d" @click="hoverDay = d" :title="`${fmtDay(d.day)} : ${d.visitors}`">
            <div class="visit-bar" :style="{ height: d.visitors ? Math.max(4, d.visitors / visitMax * 100) + '%' : '0' }"></div>
          </div>
        </div>
        <div class="visit-axis"><span>{{ visitDaily.length ? fmtDay(visitDaily[0].day) : '' }}</span><span>{{ $t('super.dash.today') }}</span></div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
        <!-- Recent pharmacies -->
        <div class="scard scard-p">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
            <h3 style="font-weight:700;font-size:.95rem;margin:0;">{{ $t('super.dash.recentSignups') }}</h3>
            <RouterLink to="/super/pharmacies" style="font-size:.8rem;color:#7c3aed;font-weight:600;">{{ $t('common.seeAll') }}</RouterLink>
          </div>
          <div v-for="p in s?.recentPharmacies ?? []" :key="p.id" style="display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid #f5f3ff;">
            <div style="width:34px;height:34px;border-radius:8px;background:#f5f3ff;color:#7c3aed;font-weight:800;font-size:.85rem;display:flex;align-items:center;justify-content:center;flex-shrink:0;">{{ p.name.charAt(0) }}</div>
            <div style="flex:1;min-width:0;">
              <div style="font-weight:600;font-size:.875rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ p.name }}</div>
              <div style="font-size:.75rem;color:#6b7280;">{{ p.city || '—' }}</div>
            </div>
            <span class="badge" :class="p.status==='ACTIVE'?'badge-green':p.status==='SUSPENDED'?'badge-red':'badge-yellow'">{{ $te('pharmacyStatus', p.status) }}</span>
          </div>
          <div v-if="!s?.recentPharmacies?.length" style="text-align:center;padding:20px;color:#6b7280;font-size:.85rem;">{{ $t('super.dash.noSignups') }}</div>
        </div>

        <!-- Revenue + subscriptions -->
        <div class="scard scard-p">
          <h3 style="font-weight:700;font-size:.95rem;margin:0 0 14px;">{{ $t('super.dash.subsRevenue') }}</h3>
          <div style="display:flex;flex-direction:column;gap:10px;">
            <div style="display:flex;justify-content:space-between;align-items:center;padding:10px;background:#f9fafb;border-radius:8px;">
              <span style="font-size:.875rem;font-weight:500;">{{ $t('super.dash.active') }}</span>
              <span style="font-family:'JetBrains Mono',monospace;font-weight:700;color:#16a34a;">{{ s?.pharmacies?.active ?? 0 }}</span>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;padding:10px;background:#fef2f2;border-radius:8px;">
              <span style="font-size:.875rem;font-weight:500;">{{ $t('super.dash.suspendedM') }}</span>
              <span style="font-family:'JetBrains Mono',monospace;font-weight:700;color:#dc2626;">{{ s?.pharmacies?.suspended ?? 0 }}</span>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;padding:10px;background:#fef9c3;border-radius:8px;">
              <span style="font-size:.875rem;font-weight:500;">{{ $t('super.dash.expiring30') }}</span>
              <span style="font-family:'JetBrains Mono',monospace;font-weight:700;color:#ca8a04;">{{ s?.subscriptions?.expiringSoon ?? 0 }}</span>
            </div>
          </div>
          <div style="margin-top:16px;padding:14px;background:#f5f3ff;border-radius:10px;text-align:center;">
            <div style="font-size:.78rem;color:#7c3aed;font-weight:600;margin-bottom:4px;">{{ $t('super.dash.subsRevenueMonth') }}</div>
            <div style="font-size:1.6rem;font-weight:800;font-family:'JetBrains Mono',monospace;color:#7c3aed;">{{ fmtPrice(s?.revenue?.thisMonth) }}</div>
          </div>
        </div>
      </div>

      <!-- Notifications -->
      <div class="scard scard-p">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;gap:10px;flex-wrap:wrap;">
          <h3 style="font-weight:700;font-size:.95rem;margin:0;display:flex;align-items:center;gap:8px;">
            <Bell size="1em" style="color:#7c3aed;" /> {{ $t('nav.notifications') }}
            <span v-if="notifs.unread" style="background:#dc2626;color:#fff;font-size:.68rem;font-weight:700;padding:1px 8px;border-radius:99px;">{{ $t(notifs.unread > 1 ? 'super.notif.unreadN' : 'super.notif.unread1', { n: notifs.unread }) }}</span>
          </h3>
          <button v-if="notifs.unread" @click="notifs.markAllRead()" style="background:none;border:none;color:#7c3aed;font-size:.8rem;font-weight:600;cursor:pointer;padding:0;">{{ $t('super.notif.markAll') }}</button>
        </div>
        <button v-for="n in notifs.items.slice(0, 6)" :key="n.id" @click="openNotif(n)" class="dash-notif" :class="{ unread: !n.is_read }">
          <span style="width:8px;height:8px;border-radius:50%;margin-top:6px;flex-shrink:0;" :style="{ background: NOTIF_COLORS[n.type] || NOTIF_COLORS.INFO }"></span>
          <span style="flex:1;min-width:0;text-align:start;">
            <span style="display:block;font-weight:600;font-size:.85rem;color:#1e1b4b;">{{ n.title }}</span>
            <span style="display:block;font-size:.78rem;color:#4b5563;margin-top:2px;">{{ n.message }}</span>
          </span>
          <span style="font-size:.72rem;color:#9ca3af;white-space:nowrap;margin-top:2px;">{{ timeAgo(n.createdAt) }}</span>
        </button>
        <div v-if="!notifs.items.length" style="text-align:center;padding:20px;color:#6b7280;font-size:.85rem;">
          {{ $t('super.dash.noNotif') }}
        </div>
      </div>

      <!-- Actions rapides -->
      <div class="scard scard-p">
        <h3 style="font-weight:700;font-size:.95rem;margin:0 0 14px;">{{ $t('dashboard.quickActions') }}</h3>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;">
          <RouterLink to="/super/pharmacies" style="display:flex;align-items:center;gap:10px;padding:14px;border-radius:10px;border:1px solid #ddd6fe;background:#f5f3ff;color:#7c3aed;text-decoration:none;font-weight:600;font-size:.875rem;">
            <span><Hospital size="1em" /></span> {{ $t('super.dash.qa.newPharmacy') }}
          </RouterLink>
          <RouterLink to="/super/pharmacies" style="display:flex;align-items:center;gap:10px;padding:14px;border-radius:10px;border:1px solid #fecaca;background:#fef2f2;color:#dc2626;text-decoration:none;font-weight:600;font-size:.875rem;">
            <span><TriangleAlert size="1em" /></span> {{ $t('super.dash.qa.suspended') }}
          </RouterLink>
          <RouterLink to="/super/utilisateurs" style="display:flex;align-items:center;gap:10px;padding:14px;border-radius:10px;border:1px solid #bfdbfe;background:#eff6ff;color:#2563eb;text-decoration:none;font-weight:600;font-size:.875rem;">
            <span><Users size="1em" /></span> {{ $t('super.dash.qa.users') }}
          </RouterLink>
          <RouterLink to="/super/logs" style="display:flex;align-items:center;gap:10px;padding:14px;border-radius:10px;border:1px solid #bbf7d0;background:#f0fdf4;color:#16a34a;text-decoration:none;font-weight:600;font-size:.875rem;">
            <span><ClipboardList size="1em" /></span> {{ $t('super.dash.qa.logs') }}
          </RouterLink>
        </div>
      </div>
    </template>
  </div>
</template>
<script setup>
import { Hospital, CircleCheck, CircleX, Users, TriangleAlert, ClipboardList, Bell, Eye } from 'lucide-vue-next'
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSuperAdminStore } from '../../stores/superAdmin.js'
import { useSuperNotificationsStore, NOTIF_COLORS, timeAgo } from '../../stores/superNotifications.js'
import { t, fmtNum, intlLocale } from '../../i18n/index.js'
const store  = useSuperAdminStore()
const notifs = useSuperNotificationsStore() // shared with the header bell: reading here updates its badge
const router = useRouter()
const s = computed(() => store.stats)
function fmtPrice(v) { return fmtNum(v) + ' MRU' }

const v = computed(() => s.value?.visitors)
const visitTiles = computed(() => [
  { label: t('super.dash.today'),  value: v.value?.today ?? 0 },
  { label: t('super.dash.last7'),  value: v.value?.last7 ?? 0 },
  { label: t('super.dash.last30'), value: v.value?.last30 ?? 0 },
  { label: t('super.dash.allTime'), value: v.value?.total ?? 0 },
])
const visitDaily = computed(() => v.value?.daily ?? [])
const visitMax   = computed(() => Math.max(1, ...visitDaily.value.map(d => d.visitors)))
const hoverDay   = ref(null)
// 'YYYY-MM-DD' (UTC day) → '7 oct.'
function fmtDay(day) { return new Date(day + 'T00:00:00Z').toLocaleDateString(intlLocale(), { day: 'numeric', month: 'short', timeZone: 'UTC' }) }

function openNotif(n) {
  notifs.markRead(n)
  if (n.link) router.push(n.link)
}
onMounted(() => notifs.load())
</script>

<style scoped>
.dash-notif { display:flex; gap:10px; width:100%; padding:10px; border:none; border-bottom:1px solid #f5f3ff; background:#fff; border-radius:8px; cursor:pointer; font:inherit; }
.dash-notif:hover { background:#faf5ff; }
.dash-notif.unread { background:#f5f3ff; }

.visit-tiles { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; margin-bottom:18px; }
.visit-tile { padding:12px; background:#f9fafb; border-radius:10px; }
.visit-val { font-family:'JetBrains Mono',monospace; font-size:1.4rem; font-weight:800; color:#111827; }
.visit-lbl { font-size:.75rem; color:#6b7280; margin-top:2px; }
.visit-chart-hd { display:flex; justify-content:space-between; gap:10px; font-size:.75rem; color:#6b7280; margin-bottom:8px; min-height:1.2em; }
.visit-readout { font-weight:700; color:#111827; }
.visit-chart { display:flex; align-items:flex-end; gap:2px; height:120px; border-bottom:1px solid #e5e7eb; }
.visit-col { flex:1; height:100%; display:flex; align-items:flex-end; cursor:default; }
.visit-bar { width:100%; background:#7c3aed; border-radius:4px 4px 0 0; opacity:.85; transition:opacity .1s; }
.visit-col.active .visit-bar, .visit-col:hover .visit-bar { opacity:1; background:#5b21b6; }
.visit-axis { display:flex; justify-content:space-between; font-size:.7rem; color:#9ca3af; margin-top:6px; }
@media (max-width: 640px) { .visit-tiles { grid-template-columns:repeat(2,1fr); } }
</style>
