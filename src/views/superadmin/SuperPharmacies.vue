<template>
  <div style="display:flex;flex-direction:column;gap:16px;">
    <!-- Toolbar -->
    <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;">
      <div class="search-box" style="flex:1;max-width:300px;"><span class="search-icon"><Search size="1em" /></span><input v-model="search" class="inp" :placeholder="$t('super.ph.searchPh')" @input="debouncedFetch" style="border-color:#ddd6fe;" onfocus="this.style.borderColor='#7c3aed'" onblur="this.style.borderColor='#ddd6fe'"/></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <select v-model="filterStatus" class="inp" style="width:155px;border-color:#ddd6fe;" @change="fetchData">
          <option value="">{{ $t('common.allStatuses') }}</option><option v-for="s in ['ACTIVE','SUSPENDED','INACTIVE','PENDING']" :key="s" :value="s">{{ $t('pharmacyStatus.' + s) }}</option>
          <option value="DELETED">{{ $t('super.ph.deletedFilter') }}</option>
        </select>
        <button class="btn btn-purple" @click="openCreate">+ {{ $t('super.dash.qa.newPharmacy') }}</button>
      </div>
    </div>

    <!-- Stats -->
    <div style="display:flex;gap:8px;flex-wrap:wrap;">
      <span style="padding:6px 12px;border-radius:99px;background:#f5f3ff;color:#7c3aed;font-size:.78rem;font-weight:700;"><Hospital size="1em" /> {{ $t('super.ph.countTotal', { n: meta.total }) }}</span>
      <span style="padding:6px 12px;border-radius:99px;background:#f0fdf4;color:#16a34a;font-size:.78rem;font-weight:700;"><CircleCheck size="1em" /> {{ $t('super.ph.countActive', { n: countBy('ACTIVE') }) }}</span>
      <span style="padding:6px 12px;border-radius:99px;background:#fef2f2;color:#dc2626;font-size:.78rem;font-weight:700;"><CircleX size="1em" /> {{ $t('super.ph.countSuspended', { n: countBy('SUSPENDED') }) }}</span>
    </div>

    <!-- Table -->
    <div class="scard">
      <div v-if="loading" class="loading-box"><div class="spinner" style="border-top-color:#7c3aed;"></div> {{ $t('common.loading') }}</div>
      <div v-else class="tbl-wrap">
        <table class="tbl" style="font-size:.875rem;">
          <thead style="background:#faf5ff;"><tr><th style="color:#7c3aed;">{{ $t('receipt.pharmacy') }}</th><th style="color:#7c3aed;">{{ $t('settings.location') }}</th><th style="color:#7c3aed;">{{ $t('super.ph.plan') }}</th><th style="color:#7c3aed;">{{ $t('super.ph.subEnd') }}</th><th style="color:#7c3aed;">{{ $t('nav.users') }}</th><th style="color:#7c3aed;">{{ $t('common.status') }}</th><th style="color:#7c3aed;">{{ $t('common.actions') }}</th></tr></thead>
          <tbody>
            <tr v-for="p in pharmacies" :key="p.id" style="border-bottom:1px solid #f5f0ff;">
              <td>
                <div style="display:flex;align-items:center;gap:10px;">
                  <div style="width:34px;height:34px;border-radius:8px;background:#f5f3ff;color:#7c3aed;font-weight:800;font-size:.85rem;display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden;" :style="pharmacyLogoUrl(p) ? 'background:#fff;border:1px solid #ede9fe;' : ''">
                    <img v-if="pharmacyLogoUrl(p)" :src="pharmacyLogoUrl(p)" :alt="p.name" loading="lazy" style="width:100%;height:100%;object-fit:contain;"/>
                    <template v-else>{{ p.name.charAt(0) }}</template>
                  </div>
                  <div><div style="font-weight:600;">{{ p.name }}</div><div style="font-size:.72rem;color:#6b7280;">{{ p.email||'—' }}</div></div>
                </div>
              </td>
              <td style="font-size:.85rem;">{{ [p.city,p.country].filter(Boolean).join(', ')||'—' }}</td>
              <td>
                <span style="padding:2px 8px;border-radius:99px;font-size:.7rem;font-weight:700;font-family:'JetBrains Mono',monospace;" :style="planStyle(p.subscription?.plan)">{{ p.subscription?.plan||$t('super.ph.noPlan') }}</span>
              </td>
              <td style="font-family:'JetBrains Mono',monospace;font-size:.8rem;" :style="{color:isExpired(p.subscription?.end_date)?'#dc2626':'#6b7280'}">
                {{ p.subscription?.end_date ? fmtDate(p.subscription.end_date) : '—' }}
                <span v-if="isExpired(p.subscription?.end_date)" style="font-size:.65rem;font-weight:700;"> <TriangleAlert size="1em" />{{ $t('super.ph.expired') }}</span>
              </td>
              <td style="font-family:'JetBrains Mono',monospace;font-weight:700;text-align:center;">{{ p._count?.users??0 }}</td>
              <td>
                <span v-if="p.deletedAt" class="badge badge-gray" :title="fmtDate(p.deletedAt)"><Trash2 size="1em" /> {{ $t('super.ph.deletedOn', { date: fmtDate(p.deletedAt) }) }}</span>
                <span v-else class="badge" :class="p.status==='ACTIVE'?'badge-green':p.status==='SUSPENDED'?'badge-red':p.status==='PENDING'?'badge-yellow':'badge-gray'">{{ $te('pharmacyStatus', p.status) }}</span>
              </td>
              <td>
                <div style="display:flex;gap:4px;flex-wrap:wrap;">
                  <button class="btn btn-xs btn-outline" @click="openDetail(p)"><Eye size="1em" /> {{ $t('super.ph.detail') }}</button>
                  <button v-if="p.deletedAt" class="btn btn-xs" style="background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0;" @click="openRestore(p)"><RotateCcw size="1em" /> {{ $t('super.ph.restore') }}</button>
                  <template v-else>
                  <button v-if="p.status!=='ACTIVE'" class="btn btn-xs" style="background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0;" @click="setStatus(p,'ACTIVE')"><CircleCheck size="1em" /> {{ $t('super.ph.activate') }}</button>
                  <button v-if="p.status==='ACTIVE'" class="btn btn-xs" style="background:#fef2f2;color:#dc2626;border:1px solid #fecaca;" @click="openSuspend(p)"><Ban size="1em" /> {{ $t('super.ph.suspend') }}</button>
                  <button class="btn btn-xs" style="background:#f5f3ff;color:#7c3aed;border:1px solid #ddd6fe;" @click="openRenew(p)"><RefreshCw size="1em" /> {{ $t('super.ph.renew') }}</button>
                  <button class="btn btn-xs" style="background:#fff;color:#dc2626;border:1px solid #fecaca;" @click="openDelete(p)"><Trash2 size="1em" /> {{ $t('super.ph.delete') }}</button>
                  </template>
                </div>
              </td>
            </tr>
            <tr v-if="!pharmacies.length"><td colspan="7" style="text-align:center;padding:32px;color:#6b7280;">{{ $t('super.ph.none') }}</td></tr>
          </tbody>
        </table>
      </div>
      <div v-if="meta.totalPages>1" class="pagination">
        <button class="page-btn" @click="page--;fetchData()" :disabled="page===1">‹</button>
        <span style="font-size:.85rem;color:#6b7280;">{{ page }} / {{ meta.totalPages }}</span>
        <button class="page-btn" @click="page++;fetchData()" :disabled="page>=meta.totalPages">›</button>
      </div>
    </div>

    <!-- ── DETAIL MODAL ── -->
    <Teleport to="body">
      <div v-if="detailPh" class="modal-bg" @click.self="detailPh=null">
        <div class="modal" style="max-width:680px;">
          <div class="modal-hd"><h3 style="display:flex;align-items:center;gap:8px;"><img v-if="pharmacyLogoUrl(detailPh)" :src="pharmacyLogoUrl(detailPh)" alt="" style="width:28px;height:28px;object-fit:contain;border-radius:6px;border:1px solid #ede9fe;background:#fff;"/><Hospital v-else size="1em" /> {{ detailPh.name }}</h3><button class="btn btn-icon" @click="detailPh=null"><X size="1em" /></button></div>
          <div class="modal-bd">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;">
              <div>
                <h4 style="font-weight:700;font-size:.875rem;margin:0 0 10px;padding-bottom:6px;border-bottom:1px solid #f3f4f6;">{{ $t('super.ph.info') }}</h4>
                <div v-for="row in phInfo" :key="row.l" style="display:flex;justify-content:space-between;padding:5px 0;font-size:.85rem;border-bottom:1px solid #f9fafb;"><span style="color:#6b7280;">{{ row.l }}</span><strong>{{ row.v }}</strong></div>
              </div>
              <div>
                <h4 style="font-weight:700;font-size:.875rem;margin:0 0 10px;padding-bottom:6px;border-bottom:1px solid #f3f4f6;">{{ $t('super.ph.subscription') }}</h4>
                <div style="display:flex;justify-content:space-between;padding:5px 0;font-size:.85rem;border-bottom:1px solid #f9fafb;"><span style="color:#6b7280;">{{ $t('super.ph.plan') }}</span><strong style="color:#7c3aed;">{{ detailPh.subscription?.plan||'—' }}</strong></div>
                <div style="display:flex;justify-content:space-between;padding:5px 0;font-size:.85rem;border-bottom:1px solid #f9fafb;"><span style="color:#6b7280;">{{ $t('common.status') }}</span><span class="badge" :class="detailPh.subscription?.status==='ACTIVE'?'badge-green':'badge-red'" style="font-size:.7rem;">{{ detailPh.subscription?.status ? $te('subscriptionStatus', detailPh.subscription.status) : '—' }}</span></div>
                <div style="display:flex;justify-content:space-between;padding:5px 0;font-size:.85rem;border-bottom:1px solid #f9fafb;"><span style="color:#6b7280;">{{ $t('settings.end') }}</span><strong :style="{color:isExpired(detailPh.subscription?.end_date)?'#dc2626':'inherit'}">{{ detailPh.subscription?.end_date?fmtDate(detailPh.subscription.end_date):'—' }}</strong></div>
              </div>
            </div>
            <!-- Users -->
            <h4 style="font-weight:700;font-size:.875rem;margin:0 0 8px;">{{ $t('nav.users') }} ({{ detailPh.users?.length??0 }})</h4>
            <table class="tbl" style="font-size:.82rem;margin-bottom:14px;">
              <thead><tr><th>{{ $t('common.name') }}</th><th>{{ $t('common.email') }}</th><th>{{ $t('users.role') }}</th><th>{{ $t('common.status') }}</th><th>{{ $t('users.lastLogin') }}</th></tr></thead>
              <tbody>
                <tr v-for="u in detailPh.users" :key="u.id">
                  <td style="font-weight:600;">{{ u.name }}</td>
                  <td style="color:#6b7280;">{{ u.email }}</td>
                  <td><span class="badge" :class="{ADMIN:'badge-red',MANAGER:'badge-blue',CAISSIER:'badge-green',STOCK_MANAGER:'badge-purple'}[u.role]||'badge-gray'" style="font-size:.65rem;">{{ $te('roles', u.role) }}</span></td>
                  <td><span class="badge" :class="u.status==='ACTIVE'?'badge-green':'badge-red'" style="font-size:.65rem;">{{ $te('userStatus', u.status) }}</span></td>
                  <td style="color:#6b7280;font-family:'JetBrains Mono',monospace;font-size:.75rem;">{{ u.last_login?fmtDate(u.last_login):$t('users.never') }}</td>
                </tr>
              </tbody>
            </table>
            <!-- Payments -->
            <div v-if="detailPh.subscription?.payments?.length">
              <h4 style="font-weight:700;font-size:.875rem;margin:0 0 8px;">{{ $t('super.ph.paymentHistory') }}</h4>
              <table class="tbl" style="font-size:.82rem;">
                <thead><tr><th>{{ $t('common.date') }}</th><th>{{ $t('super.ph.amount') }}</th><th>{{ $t('super.ph.method') }}</th><th>{{ $t('super.ph.period') }}</th></tr></thead>
                <tbody>
                  <tr v-for="pay in detailPh.subscription.payments" :key="pay.id">
                    <td style="font-family:'JetBrains Mono',monospace;font-size:.78rem;color:#6b7280;">{{ fmtDate(pay.paid_at) }}</td>
                    <td style="font-family:'JetBrains Mono',monospace;font-weight:700;color:#7c3aed;">{{ fmtNum(pay.amount) }} {{ pay.currency || 'MRU' }}</td>
                    <td>{{ $te('paymentMethods', pay.method) }}</td>
                    <td style="font-size:.75rem;color:#6b7280;">{{ fmtDate(pay.period_start) }} → {{ fmtDate(pay.period_end) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div class="modal-ft"><button class="btn btn-outline" @click="detailPh=null">{{ $t('common.close') }}</button><button class="btn btn-purple" @click="openRenew(detailPh);detailPh=null"><RefreshCw size="1em" /> {{ $t('super.ph.renew') }}</button></div>
        </div>
      </div>
    </Teleport>

    <!-- ── CREATE MODAL ── -->
    <Teleport to="body">
      <div v-if="showCreate" class="modal-bg" @click.self="showCreate=false">
        <div class="modal" style="max-width:580px;">
          <div class="modal-hd"><h3><Hospital size="1em" /> {{ $t('super.dash.qa.newPharmacy') }}</h3><button class="btn btn-icon" @click="showCreate=false"><X size="1em" /></button></div>
          <div class="modal-bd">
            <h4 style="font-size:.875rem;font-weight:700;margin:0 0 10px;padding-bottom:6px;border-bottom:1px solid #f3f4f6;">{{ $t('receipt.pharmacy') }}</h4>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:11px;margin-bottom:14px;">
              <div><label class="lbl">{{ $t('super.ph.nameReq') }}</label><input v-model="cForm.pharmacyName" class="inp" :placeholder="$t('super.ph.namePh')"/></div>
              <div><label class="lbl">{{ $t('super.ph.license') }}</label><input v-model="cForm.pharmacyLicense" class="inp" placeholder="LIC-2024-XXXXX"/></div>
              <div><label class="lbl">{{ $t('common.email') }}</label><input v-model="cForm.pharmacyEmail" class="inp" type="email"/></div>
              <div><label class="lbl">{{ $t('common.phone') }}</label><input v-model="cForm.pharmacyPhone" class="inp"/></div>
              <div><label class="lbl">{{ $t('common.city') }}</label><input v-model="cForm.pharmacyCity" class="inp" :placeholder="$t('super.ph.cityPh')"/></div>
              <div><label class="lbl">{{ $t('common.country') }}</label><input v-model="cForm.pharmacyCountry" class="inp" :placeholder="$t('super.ph.countryPh')"/></div>
            </div>
            <h4 style="font-size:.875rem;font-weight:700;margin:0 0 10px;padding-bottom:6px;border-bottom:1px solid #f3f4f6;">{{ $t('roles.ADMIN') }}</h4>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:11px;margin-bottom:14px;">
              <div><label class="lbl">{{ $t('super.ph.adminName') }}</label><input v-model="cForm.adminName" class="inp"/></div>
              <div><label class="lbl">{{ $t('super.ph.adminEmail') }}</label><input v-model="cForm.adminEmail" class="inp" type="email"/></div>
              <div style="grid-column:1/-1"><label class="lbl">{{ $t('auth.passwordMin') }}</label><input v-model="cForm.adminPassword" class="inp" type="password"/></div>
            </div>
            <h4 style="font-size:.875rem;font-weight:700;margin:0 0 10px;padding-bottom:6px;border-bottom:1px solid #f3f4f6;">{{ $t('super.ph.subscription') }}</h4>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:11px;">
              <div style="grid-column:1/-1"><label class="lbl">{{ $t('super.ph.trialDays') }}</label><input v-model.number="cForm.trialDays" type="number" min="0" max="90" class="inp"/></div>
            </div>
            <div v-if="cErr" class="alert alert-red" style="margin-top:12px;"><CircleX size="1em" /> {{ cErr }}</div>
          </div>
          <div class="modal-ft"><button class="btn btn-outline" @click="showCreate=false">{{ $t('common.cancel') }}</button><button class="btn btn-purple" @click="doCreate" :disabled="cSaving">{{ cSaving?$t('auth.creating'):$t('super.ph.create') }}</button></div>
        </div>
      </div>
    </Teleport>

    <!-- ── SUSPEND MODAL ── -->
    <Teleport to="body">
      <div v-if="suspendTarget" class="modal-bg" @click.self="suspendTarget=null">
        <div class="modal" style="max-width:400px;">
          <div class="modal-hd"><h3 style="color:#dc2626;"><Ban size="1em" /> {{ $t('super.ph.suspend') }}</h3><button class="btn btn-icon" @click="suspendTarget=null"><X size="1em" /></button></div>
          <div class="modal-bd">
            <p style="color:#6b7280;margin-bottom:12px;font-size:.875rem;">{{ $t('super.ph.suspend') }} <strong>{{ suspendTarget.name }}</strong>. {{ $t('super.ph.suspendHelp') }}</p>
            <label class="lbl">{{ $t('super.ph.reason') }} *</label><textarea v-model="suspendReason" class="inp" rows="3" :placeholder="$t('super.ph.reasonPh')"></textarea>
          </div>
          <div class="modal-ft"><button class="btn btn-outline" @click="suspendTarget=null">{{ $t('common.cancel') }}</button><button class="btn btn-danger" @click="doSuspend" :disabled="!suspendReason.trim()||sSaving">{{ sSaving?'...':$t('common.confirm') }}</button></div>
        </div>
      </div>
    </Teleport>

    <!-- ── DELETE MODAL ── -->
    <Teleport to="body">
      <div v-if="deleteTarget" class="modal-bg" @click.self="deleteTarget=null">
        <div class="modal" style="max-width:440px;">
          <div class="modal-hd"><h3 style="color:#dc2626;"><Trash2 size="1em" /> {{ $t('super.ph.deleteTitle') }}</h3><button class="btn btn-icon" @click="deleteTarget=null"><X size="1em" /></button></div>
          <div class="modal-bd">
            <div style="padding:10px 12px;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;color:#991b1b;font-size:.85rem;margin-bottom:10px;">
              <TriangleAlert size="1em" /> {{ $t('super.ph.deleteWarn', { name: '« ' + deleteTarget.name + ' »', n: deleteTarget._count?.users ?? 0 }) }}
            </div>
            <p style="color:#6b7280;font-size:.82rem;margin-bottom:14px;">{{ $t('super.ph.deleteKept') }}</p>
            <label class="lbl">{{ $t('super.ph.deleteType') }} <strong style="color:#111827;">{{ deleteTarget.name }}</strong></label>
            <input v-model="deleteName" class="inp" autocomplete="off" @keyup.enter="deleteNameOk && doDelete()"/>
            <div v-if="dErr" class="alert alert-red" style="margin-top:10px;">{{ dErr }}</div>
          </div>
          <div class="modal-ft"><button class="btn btn-outline" @click="deleteTarget=null">{{ $t('common.cancel') }}</button><button class="btn btn-danger" @click="doDelete" :disabled="!deleteNameOk||dSaving">{{ dSaving?'...':$t('super.ph.deleteConfirm') }}</button></div>
        </div>
      </div>
    </Teleport>

    <!-- ── RESTORE MODAL ── -->
    <Teleport to="body">
      <div v-if="restoreTarget" class="modal-bg" @click.self="restoreTarget=null">
        <div class="modal" style="max-width:420px;">
          <div class="modal-hd"><h3 style="color:#16a34a;"><RotateCcw size="1em" /> {{ $t('super.ph.restoreTitle') }}</h3><button class="btn btn-icon" @click="restoreTarget=null"><X size="1em" /></button></div>
          <div class="modal-bd">
            <p style="font-size:.875rem;margin-bottom:8px;"><strong>{{ restoreTarget.name }}</strong> — {{ $t('super.ph.deletedOn', { date: fmtDate(restoreTarget.deletedAt) }) }}</p>
            <p style="color:#6b7280;font-size:.85rem;">{{ $t('super.ph.restoreHelp') }}</p>
            <div v-if="rsErr" class="alert alert-red" style="margin-top:10px;">{{ rsErr }}</div>
          </div>
          <div class="modal-ft"><button class="btn btn-outline" @click="restoreTarget=null">{{ $t('common.cancel') }}</button><button class="btn" style="background:#16a34a;color:#fff;" @click="doRestore" :disabled="rsSaving">{{ rsSaving?'...':$t('super.ph.restore') }}</button></div>
        </div>
      </div>
    </Teleport>

    <!-- ── RENEW MODAL ── -->
    <Teleport to="body">
      <div v-if="renewTarget" class="modal-bg" @click.self="renewTarget=null">
        <div class="modal" style="max-width:440px;">
          <div class="modal-hd"><h3 style="color:#7c3aed;"><RefreshCw size="1em" /> {{ $t('super.ph.renewTitle') }}</h3><button class="btn btn-icon" @click="renewTarget=null"><X size="1em" /></button></div>
          <div class="modal-bd">
            <p style="color:#6b7280;margin-bottom:14px;font-size:.875rem;">{{ $t('receipt.pharmacy') }} : <strong>{{ renewTarget.name }}</strong></p>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:11px;">
              <div><label class="lbl">{{ $t('super.ph.duration') }}</label><select v-model.number="rForm.months" class="inp"><option v-for="m in DURATIONS" :key="m" :value="m">{{ $t('super.ph.months', { n: m }) }} — {{ fmtMRU(m * MONTHLY_PRICE) }}</option></select></div>
              <div><label class="lbl">{{ $t('online.paymentMethod') }}</label><select v-model="rForm.method" class="inp"><option v-for="m in ['CASH','CARD','TRANSFER','MOBILE_MONEY']" :key="m" :value="m">{{ $t('paymentMethods.' + m) }}</option></select></div>
              <div style="grid-column:1/-1"><label class="lbl">{{ $t('super.ph.paymentRef') }}</label><input v-model="rForm.reference" class="inp" placeholder="BANKILY-2024-XXXX"/></div>
            </div>
            <div style="margin-top:12px;padding:10px;background:#f5f3ff;border-radius:8px;font-size:.82rem;color:#7c3aed;">
              <strong>{{ $t('common.total') }} :</strong> {{ $t('super.ph.months', { n: rForm.months }) }} × {{ fmtMRU(MONTHLY_PRICE) }} = <strong>{{ fmtMRU(renewTotal) }}</strong> —
              <strong>{{ $t('super.ph.newExpiry') }}</strong> {{ renewExpiry }}
            </div>
          </div>
          <div class="modal-ft"><button class="btn btn-outline" @click="renewTarget=null">{{ $t('common.cancel') }}</button><button class="btn btn-purple" @click="doRenew" :disabled="rSaving">{{ rSaving?'...':$t('super.ph.validateRenew') }}</button></div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { Search, Hospital, CircleCheck, CircleX, TriangleAlert, Eye, Ban, RefreshCw, X, Trash2, RotateCcw } from 'lucide-vue-next'
import { ref, computed, onMounted } from 'vue'
import { superApi }         from '../../services/api.js'
import { useToastStore }    from '../../stores/toast.js'
import { useSuperAdminStore } from '../../stores/superAdmin.js'
import { formatDutyDays, formatDutyHours } from '../../utils/duty.js'
import { pharmacyLogoUrl } from '../../utils/logo.js'
import { t, fmtNum, intlLocale } from '../../i18n/index.js'

const toast      = useToastStore()
const superStore = useSuperAdminStore()

const pharmacies = ref([]); const meta = ref({ total:0, totalPages:1 }); const loading = ref(false)
const search = ref(''); const filterStatus = ref(''); const page = ref(1)
const detailPh = ref(null)
const showCreate = ref(false); const cSaving = ref(false); const cErr = ref('')
const suspendTarget = ref(null); const suspendReason = ref(''); const sSaving = ref(false)
const renewTarget = ref(null); const rSaving = ref(false)

const cForm = ref({ pharmacyName:'',pharmacyLicense:'',pharmacyEmail:'',pharmacyPhone:'',pharmacyCity:'',pharmacyCountry:'Mauritanie',adminName:'',adminEmail:'',adminPassword:'',trialDays:30 })
const rForm = ref({ months:12, method:'CASH', reference:'' })

// Subscription pricing — keep in sync with pharmapulse-api/src/utils/subscription.js
const MONTHLY_PRICE = 1500
const DURATIONS     = [1, 2, 5, 8, 12]
const fmtMRU        = v => fmtNum(v) + ' MRU'
const renewTotal    = computed(() => rForm.value.months * MONTHLY_PRICE)

const renewExpiry = computed(() => {
  const d = new Date(); d.setDate(d.getDate() + rForm.value.months * 30)
  return d.toLocaleDateString(intlLocale())
})

const fmtDate    = d => new Date(d).toLocaleDateString(intlLocale())
const isExpired  = d => d && new Date(d) < new Date()
const countBy    = s => pharmacies.value.filter(p => p.status === s).length
const planStyle  = p => {
  const m = { FREE:'background:#f9fafb;color:#6b7280', STARTER:'background:#eff6ff;color:#2563eb', PRO:'background:#f5f3ff;color:#7c3aed', ENTERPRISE:'background:#fefce8;color:#ca8a04' }
  return m[p] || 'background:#f9fafb;color:#6b7280'
}
const phInfo = computed(() => detailPh.value ? [
  { l:t('common.email'),     v: detailPh.value.email||'—' },
  { l:t('common.phone'),     v: detailPh.value.phone||'—' },
  { l:t('common.city'),      v: detailPh.value.city||'—' },
  { l:t('common.country'),   v: detailPh.value.country||'—' },
  { l:t('super.ph.licenseShort'), v: detailPh.value.license_number||'—' },
  { l:t('settings.duty'),    v: detailPh.value.duty_days?.length ? formatDutyDays(detailPh.value.duty_days) + ' · ' + formatDutyHours(detailPh.value) : '—' },
] : [])

let dt; function debouncedFetch() { clearTimeout(dt); dt = setTimeout(fetchData, 380) }

async function fetchData() {
  loading.value = true
  try {
    const deleted = filterStatus.value === 'DELETED'
    const r = await superApi.listPharmacies({ page: page.value, pageSize: 20, search: search.value || undefined, status: deleted ? undefined : filterStatus.value || undefined, deleted: deleted || undefined })
    pharmacies.value = r.data; meta.value = r.meta
  } catch(e) { toast.error(e.message) } finally { loading.value = false }
}

async function openDetail(p) {
  try { const r = await superApi.getPharmacy(p.id); detailPh.value = r.data } catch(e) { toast.error(e.message) }
}

function openCreate() {
  Object.assign(cForm.value, { pharmacyName:'',pharmacyLicense:'',pharmacyEmail:'',pharmacyPhone:'',pharmacyCity:'',pharmacyCountry:'Mauritanie',adminName:'',adminEmail:'',adminPassword:'',trialDays:30 })
  cErr.value = ''; showCreate.value = true
}

async function doCreate() {
  cErr.value = ''
  if (!cForm.value.pharmacyName || !cForm.value.adminName || !cForm.value.adminEmail || !cForm.value.adminPassword) { cErr.value = t('super.ph.missingFields'); return }
  if (cForm.value.adminPassword.length < 6) { cErr.value = t('auth.passwordMin6'); return }
  cSaving.value = true
  try {
    await superApi.createPharmacy(cForm.value)
    toast.success(t('super.ph.created')); showCreate.value = false
    await Promise.all([fetchData(), superStore.fetchStats()])
  } catch(e) { cErr.value = e.message } finally { cSaving.value = false }
}

async function setStatus(p, status) {
  try {
    await superApi.setStatus(p.id, { status })
    toast.success(status === 'ACTIVE' ? t('super.ph.activated') : t('super.ph.modified'))
    await Promise.all([fetchData(), superStore.fetchStats()])
  } catch(e) { toast.error(e.message) }
}

function openSuspend(p) { suspendTarget.value = p; suspendReason.value = '' }
async function doSuspend() {
  sSaving.value = true
  try {
    await superApi.setStatus(suspendTarget.value.id, { status: 'SUSPENDED', reason: suspendReason.value })
    toast.success(t('super.ph.suspended')); suspendTarget.value = null
    await Promise.all([fetchData(), superStore.fetchStats()])
  } catch(e) { toast.error(e.message) } finally { sSaving.value = false }
}

// Deletion: the exact name must be typed again (same check on the API)
const deleteTarget = ref(null); const deleteName = ref(''); const dSaving = ref(false); const dErr = ref('')
const deleteNameOk = computed(() => !!deleteTarget.value && deleteName.value.trim() === deleteTarget.value.name.trim())
function openDelete(p) { deleteTarget.value = p; deleteName.value = ''; dErr.value = '' }
async function doDelete() {
  dSaving.value = true; dErr.value = ''
  try {
    await superApi.deletePharmacy(deleteTarget.value.id, deleteName.value.trim())
    toast.success(t('super.ph.deleted')); deleteTarget.value = null
    await Promise.all([fetchData(), superStore.fetchStats()])
  } catch(e) { dErr.value = e.message } finally { dSaving.value = false }
}

// Restore a deleted pharmacy (the API reactivates only the accounts the deletion deactivated)
const restoreTarget = ref(null); const rsSaving = ref(false); const rsErr = ref('')
function openRestore(p) { restoreTarget.value = p; rsErr.value = '' }
async function doRestore() {
  rsSaving.value = true; rsErr.value = ''
  try {
    const r = await superApi.restorePharmacy(restoreTarget.value.id)
    toast.success(r.message || t('super.ph.restored')); restoreTarget.value = null
    await Promise.all([fetchData(), superStore.fetchStats()])
  } catch(e) { rsErr.value = e.message } finally { rsSaving.value = false }
}

function openRenew(p) {
  renewTarget.value = p
  rForm.value = { months: 12, method: 'CASH', reference: '' }
}
async function doRenew() {
  rSaving.value = true
  try {
    await superApi.renew(renewTarget.value.id, rForm.value)
    toast.success(t('super.ph.renewed')); renewTarget.value = null
    await Promise.all([fetchData(), superStore.fetchStats()])
  } catch(e) { toast.error(e.message) } finally { rSaving.value = false }
}

onMounted(fetchData)
</script>
