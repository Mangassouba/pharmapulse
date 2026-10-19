<template>
  <div style="display:flex;flex-direction:column;gap:16px;">
    <!-- Onglets -->
    <div class="sl-tabs" role="tablist">
      <button v-for="tb in tabs" :key="tb.id" role="tab" :aria-selected="tab===tb.id" class="sl-tab" :class="{ active: tab===tb.id }" @click="tab=tb.id">
        <component :is="tb.icon" size="1em" /> {{ $t(tb.label) }}
      </button>
    </div>

    <!-- Actions SuperAdmin -->
    <div v-if="tab==='admins'" class="scard">
      <div style="padding:14px 18px;border-bottom:1px solid #e9d5ff;display:flex;justify-content:space-between;align-items:center;">
        <h3 style="font-weight:700;margin:0;color:#1e1b4b;">{{ $t('super.logs.title') }}</h3>
        <span style="font-size:.8rem;color:#7c3aed;font-weight:600;">{{ $t('super.logs.count', { n: meta.total }) }}</span>
      </div>
      <div v-if="loading" class="loading-box"><div class="spinner" style="border-top-color:#7c3aed;"></div> {{ $t('common.loading') }}</div>
      <div v-else class="tbl-wrap">
        <table class="tbl s-table">
          <thead><tr><th>{{ $t('super.logs.datetime') }}</th><th>{{ $t('super.logs.admin') }}</th><th>{{ $t('common.action') }}</th><th>{{ $t('common.description') }}</th><th>{{ $t('super.logs.target') }}</th></tr></thead>
          <tbody>
            <tr v-for="log in logs" :key="log.id">
              <td style="font-family:'JetBrains Mono',monospace;font-size:.78rem;color:#6b7280;white-space:nowrap;">{{ fmtDatetime(log.createdAt) }}</td>
              <td style="font-weight:600;font-size:.875rem;">{{ log.superAdmin?.name }}</td>
              <td><span class="badge" :class="log.action.includes('DELETE')||log.action.includes('SUSPEND')?'badge-red':log.action.includes('CREATE')?'badge-green':log.action.includes('RENEW')?'badge-blue':'badge-gray'">{{ log.action }}</span></td>
              <td style="font-size:.8rem;color:#6b7280;max-width:240px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ log.description || '—' }}</td>
              <td style="font-size:.78rem;font-family:'JetBrains Mono',monospace;color:#6b7280;">{{ log.target_type ? log.target_type+'#'+log.target_id : '—' }}</td>
            </tr>
            <tr v-if="!logs.length"><td colspan="5" style="text-align:center;padding:32px;color:#6b7280;">{{ $t('super.logs.none') }}</td></tr>
          </tbody>
        </table>
      </div>
      <div v-if="meta.totalPages>1" class="pagination">
        <button class="page-btn" @click="page--;fetchData()" :disabled="page===1">‹</button>
        <span style="font-size:.85rem;color:#6b7280;">{{ page }} / {{ meta.totalPages }}</span>
        <button class="page-btn" @click="page++;fetchData()" :disabled="page>=meta.totalPages">›</button>
      </div>
    </div>

    <!-- Activité des pharmacies -->
    <div v-else class="scard">
      <div style="padding:14px 18px;border-bottom:1px solid #e9d5ff;display:flex;justify-content:space-between;align-items:center;">
        <h3 style="font-weight:700;margin:0;color:#1e1b4b;">{{ $t('super.logs.tabPharmacies') }}</h3>
        <span style="font-size:.8rem;color:#7c3aed;font-weight:600;">{{ $t('super.logs.count', { n: pMeta.total }) }}</span>
      </div>
      <div class="sl-filters">
        <select v-model="filters.pharmacyId" class="inp" @change="applyFilters" :aria-label="$t('super.logs.pharmacy')">
          <option value="">{{ $t('super.logs.allPharmacies') }}</option>
          <option v-for="ph in options.pharmacies" :key="ph.id" :value="ph.id">{{ ph.name }}{{ ph.deletedAt ? ` (${$t('super.logs.deleted')})` : '' }}</option>
        </select>
        <select v-model="filters.action" class="inp" @change="applyFilters" :aria-label="$t('common.action')">
          <option value="">{{ $t('super.logs.allActions') }}</option>
          <option v-for="a in options.actions" :key="a" :value="a">{{ $te('super.logs.actions', a) }}</option>
        </select>
        <label class="sl-date"><span>{{ $t('super.logs.from') }}</span><input v-model="filters.from" type="date" class="inp" @change="applyFilters" :max="filters.to || undefined"/></label>
        <label class="sl-date"><span>{{ $t('super.logs.to') }}</span><input v-model="filters.to" type="date" class="inp" @change="applyFilters" :min="filters.from || undefined"/></label>
        <button v-if="hasFilters" class="btn btn-sm btn-outline" @click="resetFilters"><RotateCcw size="1em" /> {{ $t('super.logs.reset') }}</button>
      </div>
      <div v-if="pLoading" class="loading-box"><div class="spinner" style="border-top-color:#7c3aed;"></div> {{ $t('common.loading') }}</div>
      <div v-else class="tbl-wrap">
        <table class="tbl s-table">
          <thead><tr><th>{{ $t('super.logs.datetime') }}</th><th>{{ $t('super.logs.pharmacy') }}</th><th>{{ $t('super.logs.user') }}</th><th>{{ $t('common.action') }}</th><th>{{ $t('super.logs.element') }}</th><th style="width:1%;"></th></tr></thead>
          <tbody>
            <template v-for="log in pLogs" :key="log.id">
              <tr>
                <td style="font-family:'JetBrains Mono',monospace;font-size:.78rem;color:#6b7280;white-space:nowrap;">{{ fmtDatetime(log.createdAt) }}</td>
                <td style="font-weight:600;font-size:.85rem;">{{ log.pharmacy?.name || '—' }}</td>
                <td style="font-size:.82rem;">
                  <template v-if="log.user">
                    <div style="font-weight:600;">{{ log.user.name }}</div>
                    <div style="color:#6b7280;font-size:.75rem;">{{ $te('roles', log.user.role) }} · {{ log.user.email }}</div>
                  </template>
                  <span v-else style="color:#9ca3af;">{{ $t('super.logs.system') }}</span>
                </td>
                <td><span class="badge" :class="actionBadge(log.action)">{{ $te('super.logs.actions', log.action) }}</span></td>
                <td style="font-size:.8rem;color:#6b7280;white-space:nowrap;">{{ $te('super.logs.entities', log.entity) }} <span style="font-family:'JetBrains Mono',monospace;">#{{ log.entity_id }}</span></td>
                <td>
                  <button v-if="hasValues(log)" class="btn btn-sm btn-outline" @click="toggle(log.id)" :aria-expanded="open.has(log.id)" :title="$t('super.logs.details')">
                    <ChevronUp v-if="open.has(log.id)" size="1em" /><ChevronDown v-else size="1em" />
                  </button>
                </td>
              </tr>
              <tr v-if="open.has(log.id)" class="sl-detail-row">
                <td colspan="6">
                  <table class="sl-diff">
                    <thead><tr><th>{{ $t('super.logs.field') }}</th><th>{{ $t('super.logs.before') }}</th><th>{{ $t('super.logs.after') }}</th></tr></thead>
                    <tbody>
                      <tr v-for="r in diffRows(log)" :key="r.key" :class="{ changed: r.changed }">
                        <td class="sl-key">{{ r.key }}</td><td>{{ r.before }}</td><td>{{ r.after }}</td>
                      </tr>
                    </tbody>
                  </table>
                  <div v-if="log.ip_address" style="margin-top:6px;font-size:.72rem;color:#9ca3af;">IP : <span class="mono-ltr">{{ log.ip_address }}</span></div>
                </td>
              </tr>
            </template>
            <tr v-if="!pLogs.length"><td colspan="6" style="text-align:center;padding:32px;color:#6b7280;">{{ $t('super.logs.none') }}</td></tr>
          </tbody>
        </table>
      </div>
      <div v-if="pMeta.totalPages>1" class="pagination">
        <button class="page-btn" @click="pPage--;fetchPharmacyLogs()" :disabled="pPage===1">‹</button>
        <span style="font-size:.85rem;color:#6b7280;">{{ pPage }} / {{ pMeta.totalPages }}</span>
        <button class="page-btn" @click="pPage++;fetchPharmacyLogs()" :disabled="pPage>=pMeta.totalPages">›</button>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { Shield, Hospital, ChevronDown, ChevronUp, RotateCcw } from 'lucide-vue-next'
import { superApi } from '../../services/api.js'
import { useToastStore } from '../../stores/toast.js'
import { intlLocale } from '../../i18n/index.js'
const toast = useToastStore()
const fmtDatetime = d => new Date(d).toLocaleString(intlLocale())

const tabs = [
  { id: 'admins',     label: 'super.logs.tabAdmins',     icon: Shield },
  { id: 'pharmacies', label: 'super.logs.tabPharmacies', icon: Hospital },
]
const tab = ref('admins')

// ── Actions SuperAdmin ──
const logs = ref([]); const meta = ref({ total:0,totalPages:1 }); const loading = ref(false); const page = ref(1)
async function fetchData() {
  loading.value = true
  try { const r = await superApi.getLogs({ page:page.value, pageSize:25 }); logs.value=r.data; meta.value=r.meta } catch(e) { toast.error(e.message) } finally { loading.value=false }
}

// ── Activité des pharmacies (chargée au premier affichage de l'onglet) ──
const pLogs = ref([]); const pMeta = ref({ total:0,totalPages:1 }); const pLoading = ref(false); const pPage = ref(1)
const options = ref({ actions: [], pharmacies: [] })
const filters = ref({ pharmacyId: '', action: '', from: '', to: '' })
const open    = ref(new Set())
const hasFilters = computed(() => Object.values(filters.value).some(Boolean))
let pLoaded = false

async function fetchPharmacyLogs() {
  pLoading.value = true
  open.value = new Set()
  try {
    const params = { page: pPage.value, pageSize: 25 }
    for (const [k, v] of Object.entries(filters.value)) if (v) params[k] = v
    const r = await superApi.getPharmacyLogs(params)
    pLogs.value = r.data; pMeta.value = r.meta
  } catch(e) { toast.error(e.message) } finally { pLoading.value = false }
}
async function fetchFilterOptions() {
  try { const r = await superApi.getPharmacyLogFilters(); options.value = r.data } catch(e) { toast.error(e.message) }
}
function applyFilters() { pPage.value = 1; fetchPharmacyLogs() }
function resetFilters() { filters.value = { pharmacyId: '', action: '', from: '', to: '' }; applyFilters() }

watch(tab, t => {
  if (t === 'pharmacies' && !pLoaded) { pLoaded = true; fetchFilterOptions(); fetchPharmacyLogs() }
})

function actionBadge(a) {
  if (a.includes('DELETE')) return 'badge-red'
  if (a === 'CREATE' || a === 'REGISTER' || a === 'COMPLETE_RECEPTION') return 'badge-green'
  if (a.includes('UPDATE') || a === 'IMPORT_PRODUCTS' || a === 'INVENTORY') return 'badge-blue'
  return 'badge-gray'
}

// Détail avant / après : une ligne par champ présent dans l'un ou l'autre
const isObj = v => v && typeof v === 'object' && !Array.isArray(v)
const hasValues = l => (isObj(l.old_values) && Object.keys(l.old_values).length) || (isObj(l.new_values) && Object.keys(l.new_values).length)
const show = v => v === undefined ? '' : v === null ? '—' : typeof v === 'object' ? JSON.stringify(v) : String(v)
function diffRows(l) {
  const o = isObj(l.old_values) ? l.old_values : {}
  const n = isObj(l.new_values) ? l.new_values : {}
  return [...new Set([...Object.keys(o), ...Object.keys(n)])].map(key => ({
    key, before: show(o[key]), after: show(n[key]),
    changed: key in o && key in n && JSON.stringify(o[key]) !== JSON.stringify(n[key]),
  }))
}
function toggle(id) {
  const s = new Set(open.value)
  s.has(id) ? s.delete(id) : s.add(id)
  open.value = s
}

onMounted(fetchData)
</script>

<style scoped>
.sl-tabs { display: flex; gap: 6px; flex-wrap: wrap; }
.sl-tab { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 99px; border: 1px solid #e9d5ff; background: #fff; color: #6b21a8; font-size: .85rem; font-weight: 600; cursor: pointer; transition: all .15s; }
.sl-tab:hover { background: #faf5ff; }
.sl-tab.active { background: #7c3aed; border-color: #7c3aed; color: #fff; }
.sl-filters { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; padding: 12px 18px; border-bottom: 1px solid #f3e8ff; }
.sl-filters > select { flex: 1 1 180px; max-width: 260px; }
.sl-date { display: inline-flex; align-items: center; gap: 6px; font-size: .8rem; color: #6b7280; }
.sl-date .inp { width: auto; }
.sl-detail-row > td { background: #faf5ff; }
.sl-diff { width: 100%; border-collapse: collapse; font-size: .78rem; background: #fff; border: 1px solid #f3e8ff; border-radius: 8px; }
.sl-diff th { text-align: start; padding: 6px 10px; color: #6b7280; font-weight: 600; border-bottom: 1px solid #f3e8ff; }
.sl-diff td { padding: 5px 10px; border-bottom: 1px solid #faf5ff; word-break: break-word; vertical-align: top; }
.sl-diff .sl-key { font-family: 'JetBrains Mono', monospace; color: #4c1d95; white-space: nowrap; }
.sl-diff tr.changed td { background: #fefce8; }
@media (max-width: 560px) {
  .sl-filters > select { max-width: none; flex-basis: 100%; }
  .sl-date { flex: 1 1 45%; }
  .sl-date .inp { flex: 1; min-width: 0; }
}
</style>
