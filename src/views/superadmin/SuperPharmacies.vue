<template>
  <div style="display:flex;flex-direction:column;gap:16px;">
    <!-- Toolbar -->
    <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;">
      <div class="search-box" style="flex:1;max-width:300px;"><span class="search-icon"><Search size="1em" /></span><input v-model="search" class="inp" placeholder="Rechercher une pharmacie..." @input="debouncedFetch" style="border-color:#ddd6fe;" onfocus="this.style.borderColor='#7c3aed'" onblur="this.style.borderColor='#ddd6fe'"/></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <select v-model="filterStatus" class="inp" style="width:155px;border-color:#ddd6fe;" @change="fetchData">
          <option value="">Tous les statuts</option><option value="ACTIVE">Active</option><option value="SUSPENDED">Suspendue</option><option value="INACTIVE">Inactive</option><option value="PENDING">En attente</option>
        </select>
        <button class="btn btn-purple" @click="openCreate">+ Nouvelle pharmacie</button>
      </div>
    </div>

    <!-- Stats -->
    <div style="display:flex;gap:8px;flex-wrap:wrap;">
      <span style="padding:6px 12px;border-radius:99px;background:#f5f3ff;color:#7c3aed;font-size:.78rem;font-weight:700;"><Hospital size="1em" /> {{ meta.total }} pharmacies</span>
      <span style="padding:6px 12px;border-radius:99px;background:#f0fdf4;color:#16a34a;font-size:.78rem;font-weight:700;"><CircleCheck size="1em" /> {{ countBy('ACTIVE') }} actives</span>
      <span style="padding:6px 12px;border-radius:99px;background:#fef2f2;color:#dc2626;font-size:.78rem;font-weight:700;"><CircleX size="1em" /> {{ countBy('SUSPENDED') }} suspendues</span>
    </div>

    <!-- Table -->
    <div class="scard">
      <div v-if="loading" class="loading-box"><div class="spinner" style="border-top-color:#7c3aed;"></div> Chargement...</div>
      <div v-else class="tbl-wrap">
        <table class="tbl" style="font-size:.875rem;">
          <thead style="background:#faf5ff;"><tr><th style="color:#7c3aed;">Pharmacie</th><th style="color:#7c3aed;">Localisation</th><th style="color:#7c3aed;">Plan</th><th style="color:#7c3aed;">Fin abonnement</th><th style="color:#7c3aed;">Utilisateurs</th><th style="color:#7c3aed;">Statut</th><th style="color:#7c3aed;">Actions</th></tr></thead>
          <tbody>
            <tr v-for="p in pharmacies" :key="p.id" style="border-bottom:1px solid #f5f0ff;">
              <td>
                <div style="display:flex;align-items:center;gap:10px;">
                  <div style="width:34px;height:34px;border-radius:8px;background:#f5f3ff;color:#7c3aed;font-weight:800;font-size:.85rem;display:flex;align-items:center;justify-content:center;flex-shrink:0;">{{ p.name.charAt(0) }}</div>
                  <div><div style="font-weight:600;">{{ p.name }}</div><div style="font-size:.72rem;color:#6b7280;">{{ p.email||'—' }}</div></div>
                </div>
              </td>
              <td style="font-size:.85rem;">{{ [p.city,p.country].filter(Boolean).join(', ')||'—' }}</td>
              <td>
                <span style="padding:2px 8px;border-radius:99px;font-size:.7rem;font-weight:700;font-family:'JetBrains Mono',monospace;" :style="planStyle(p.subscription?.plan)">{{ p.subscription?.plan||'AUCUN' }}</span>
              </td>
              <td style="font-family:'JetBrains Mono',monospace;font-size:.8rem;" :style="{color:isExpired(p.subscription?.end_date)?'#dc2626':'#6b7280'}">
                {{ p.subscription?.end_date ? fmtDate(p.subscription.end_date) : '—' }}
                <span v-if="isExpired(p.subscription?.end_date)" style="font-size:.65rem;font-weight:700;"> <TriangleAlert size="1em" />EXPIRÉ</span>
              </td>
              <td style="font-family:'JetBrains Mono',monospace;font-weight:700;text-align:center;">{{ p._count?.users??0 }}</td>
              <td>
                <span class="badge" :class="p.status==='ACTIVE'?'badge-green':p.status==='SUSPENDED'?'badge-red':p.status==='PENDING'?'badge-yellow':'badge-gray'">{{ p.status }}</span>
              </td>
              <td>
                <div style="display:flex;gap:4px;flex-wrap:wrap;">
                  <button class="btn btn-xs btn-outline" @click="openDetail(p)"><Eye size="1em" /> Détail</button>
                  <button v-if="p.status!=='ACTIVE'" class="btn btn-xs" style="background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0;" @click="setStatus(p,'ACTIVE')"><CircleCheck size="1em" /> Activer</button>
                  <button v-if="p.status==='ACTIVE'" class="btn btn-xs" style="background:#fef2f2;color:#dc2626;border:1px solid #fecaca;" @click="openSuspend(p)"><Ban size="1em" /> Suspendre</button>
                  <button class="btn btn-xs" style="background:#f5f3ff;color:#7c3aed;border:1px solid #ddd6fe;" @click="openRenew(p)"><RefreshCw size="1em" /> Renouveler</button>
                </div>
              </td>
            </tr>
            <tr v-if="!pharmacies.length"><td colspan="7" style="text-align:center;padding:32px;color:#6b7280;">Aucune pharmacie trouvée</td></tr>
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
          <div class="modal-hd"><h3><Hospital size="1em" /> {{ detailPh.name }}</h3><button class="btn btn-icon" @click="detailPh=null"><X size="1em" /></button></div>
          <div class="modal-bd">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;">
              <div>
                <h4 style="font-weight:700;font-size:.875rem;margin:0 0 10px;padding-bottom:6px;border-bottom:1px solid #f3f4f6;">Informations</h4>
                <div v-for="row in phInfo" :key="row.l" style="display:flex;justify-content:space-between;padding:5px 0;font-size:.85rem;border-bottom:1px solid #f9fafb;"><span style="color:#6b7280;">{{ row.l }}</span><strong>{{ row.v }}</strong></div>
              </div>
              <div>
                <h4 style="font-weight:700;font-size:.875rem;margin:0 0 10px;padding-bottom:6px;border-bottom:1px solid #f3f4f6;">Abonnement</h4>
                <div style="display:flex;justify-content:space-between;padding:5px 0;font-size:.85rem;border-bottom:1px solid #f9fafb;"><span style="color:#6b7280;">Plan</span><strong style="color:#7c3aed;">{{ detailPh.subscription?.plan||'—' }}</strong></div>
                <div style="display:flex;justify-content:space-between;padding:5px 0;font-size:.85rem;border-bottom:1px solid #f9fafb;"><span style="color:#6b7280;">Statut</span><span class="badge" :class="detailPh.subscription?.status==='ACTIVE'?'badge-green':'badge-red'" style="font-size:.7rem;">{{ detailPh.subscription?.status||'—' }}</span></div>
                <div style="display:flex;justify-content:space-between;padding:5px 0;font-size:.85rem;border-bottom:1px solid #f9fafb;"><span style="color:#6b7280;">Fin</span><strong :style="{color:isExpired(detailPh.subscription?.end_date)?'#dc2626':'inherit'}">{{ detailPh.subscription?.end_date?fmtDate(detailPh.subscription.end_date):'—' }}</strong></div>
              </div>
            </div>
            <!-- Users -->
            <h4 style="font-weight:700;font-size:.875rem;margin:0 0 8px;">Utilisateurs ({{ detailPh.users?.length??0 }})</h4>
            <table class="tbl" style="font-size:.82rem;margin-bottom:14px;">
              <thead><tr><th>Nom</th><th>Email</th><th>Rôle</th><th>Statut</th><th>Connexion</th></tr></thead>
              <tbody>
                <tr v-for="u in detailPh.users" :key="u.id">
                  <td style="font-weight:600;">{{ u.name }}</td>
                  <td style="color:#6b7280;">{{ u.email }}</td>
                  <td><span class="badge" :class="{ADMIN:'badge-red',MANAGER:'badge-blue',CAISSIER:'badge-green',STOCK_MANAGER:'badge-purple'}[u.role]||'badge-gray'" style="font-size:.65rem;">{{ u.role }}</span></td>
                  <td><span class="badge" :class="u.status==='ACTIVE'?'badge-green':'badge-red'" style="font-size:.65rem;">{{ u.status }}</span></td>
                  <td style="color:#6b7280;font-family:'JetBrains Mono',monospace;font-size:.75rem;">{{ u.last_login?fmtDate(u.last_login):'Jamais' }}</td>
                </tr>
              </tbody>
            </table>
            <!-- Payments -->
            <div v-if="detailPh.subscription?.payments?.length">
              <h4 style="font-weight:700;font-size:.875rem;margin:0 0 8px;">Historique paiements</h4>
              <table class="tbl" style="font-size:.82rem;">
                <thead><tr><th>Date</th><th>Montant</th><th>Méthode</th><th>Période</th></tr></thead>
                <tbody>
                  <tr v-for="pay in detailPh.subscription.payments" :key="pay.id">
                    <td style="font-family:'JetBrains Mono',monospace;font-size:.78rem;color:#6b7280;">{{ fmtDate(pay.paid_at) }}</td>
                    <td style="font-family:'JetBrains Mono',monospace;font-weight:700;color:#7c3aed;">{{ Number(pay.amount).toLocaleString('fr-FR') }} {{ pay.currency || 'MRU' }}</td>
                    <td>{{ pay.method }}</td>
                    <td style="font-size:.75rem;color:#6b7280;">{{ fmtDate(pay.period_start) }} → {{ fmtDate(pay.period_end) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div class="modal-ft"><button class="btn btn-outline" @click="detailPh=null">Fermer</button><button class="btn btn-purple" @click="openRenew(detailPh);detailPh=null"><RefreshCw size="1em" /> Renouveler</button></div>
        </div>
      </div>
    </Teleport>

    <!-- ── CREATE MODAL ── -->
    <Teleport to="body">
      <div v-if="showCreate" class="modal-bg" @click.self="showCreate=false">
        <div class="modal" style="max-width:580px;">
          <div class="modal-hd"><h3><Hospital size="1em" /> Nouvelle pharmacie</h3><button class="btn btn-icon" @click="showCreate=false"><X size="1em" /></button></div>
          <div class="modal-bd">
            <h4 style="font-size:.875rem;font-weight:700;margin:0 0 10px;padding-bottom:6px;border-bottom:1px solid #f3f4f6;">Pharmacie</h4>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:11px;margin-bottom:14px;">
              <div><label class="lbl">Nom *</label><input v-model="cForm.pharmacyName" class="inp" placeholder="Pharmacie XYZ"/></div>
              <div><label class="lbl">Numéro de licence</label><input v-model="cForm.pharmacyLicense" class="inp" placeholder="LIC-2024-XXXXX"/></div>
              <div><label class="lbl">Email</label><input v-model="cForm.pharmacyEmail" class="inp" type="email"/></div>
              <div><label class="lbl">Téléphone</label><input v-model="cForm.pharmacyPhone" class="inp"/></div>
              <div><label class="lbl">Ville</label><input v-model="cForm.pharmacyCity" class="inp" placeholder="Nouakchott"/></div>
              <div><label class="lbl">Pays</label><input v-model="cForm.pharmacyCountry" class="inp" placeholder="Mauritanie"/></div>
            </div>
            <h4 style="font-size:.875rem;font-weight:700;margin:0 0 10px;padding-bottom:6px;border-bottom:1px solid #f3f4f6;">Administrateur</h4>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:11px;margin-bottom:14px;">
              <div><label class="lbl">Nom admin *</label><input v-model="cForm.adminName" class="inp"/></div>
              <div><label class="lbl">Email admin *</label><input v-model="cForm.adminEmail" class="inp" type="email"/></div>
              <div style="grid-column:1/-1"><label class="lbl">Mot de passe * (min. 6)</label><input v-model="cForm.adminPassword" class="inp" type="password"/></div>
            </div>
            <h4 style="font-size:.875rem;font-weight:700;margin:0 0 10px;padding-bottom:6px;border-bottom:1px solid #f3f4f6;">Abonnement</h4>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:11px;">
              <div style="grid-column:1/-1"><label class="lbl">Période d'essai gratuite (jours)</label><input v-model.number="cForm.trialDays" type="number" min="0" max="90" class="inp"/></div>
            </div>
            <div v-if="cErr" class="alert alert-red" style="margin-top:12px;"><CircleX size="1em" /> {{ cErr }}</div>
          </div>
          <div class="modal-ft"><button class="btn btn-outline" @click="showCreate=false">Annuler</button><button class="btn btn-purple" @click="doCreate" :disabled="cSaving">{{ cSaving?'Création...':'Créer la pharmacie' }}</button></div>
        </div>
      </div>
    </Teleport>

    <!-- ── SUSPEND MODAL ── -->
    <Teleport to="body">
      <div v-if="suspendTarget" class="modal-bg" @click.self="suspendTarget=null">
        <div class="modal" style="max-width:400px;">
          <div class="modal-hd"><h3 style="color:#dc2626;"><Ban size="1em" /> Suspendre</h3><button class="btn btn-icon" @click="suspendTarget=null"><X size="1em" /></button></div>
          <div class="modal-bd">
            <p style="color:#6b7280;margin-bottom:12px;font-size:.875rem;">Suspendre <strong>{{ suspendTarget.name }}</strong>. Les utilisateurs ne pourront plus se connecter.</p>
            <label class="lbl">Raison *</label><textarea v-model="suspendReason" class="inp" rows="3" placeholder="Ex: Abonnement non payé depuis 30 jours..."></textarea>
          </div>
          <div class="modal-ft"><button class="btn btn-outline" @click="suspendTarget=null">Annuler</button><button class="btn btn-danger" @click="doSuspend" :disabled="!suspendReason.trim()||sSaving">{{ sSaving?'...':'Confirmer' }}</button></div>
        </div>
      </div>
    </Teleport>

    <!-- ── RENEW MODAL ── -->
    <Teleport to="body">
      <div v-if="renewTarget" class="modal-bg" @click.self="renewTarget=null">
        <div class="modal" style="max-width:440px;">
          <div class="modal-hd"><h3 style="color:#7c3aed;"><RefreshCw size="1em" /> Renouveler l'abonnement</h3><button class="btn btn-icon" @click="renewTarget=null"><X size="1em" /></button></div>
          <div class="modal-bd">
            <p style="color:#6b7280;margin-bottom:14px;font-size:.875rem;">Pharmacie : <strong>{{ renewTarget.name }}</strong></p>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:11px;">
              <div><label class="lbl">Durée</label><select v-model.number="rForm.months" class="inp"><option v-for="m in DURATIONS" :key="m" :value="m">{{ m }} mois — {{ fmtMRU(m * MONTHLY_PRICE) }}</option></select></div>
              <div><label class="lbl">Mode de paiement</label><select v-model="rForm.method" class="inp"><option value="CASH">Espèces</option><option value="CARD">Carte</option><option value="TRANSFER">Virement</option><option value="MOBILE_MONEY">Mobile Money</option></select></div>
              <div style="grid-column:1/-1"><label class="lbl">Référence paiement</label><input v-model="rForm.reference" class="inp" placeholder="BANKILY-2024-XXXX"/></div>
            </div>
            <div style="margin-top:12px;padding:10px;background:#f5f3ff;border-radius:8px;font-size:.82rem;color:#7c3aed;">
              <strong>Total :</strong> {{ rForm.months }} mois × {{ fmtMRU(MONTHLY_PRICE) }} = <strong>{{ fmtMRU(renewTotal) }}</strong> —
              <strong>Nouvelle échéance :</strong> {{ renewExpiry }}
            </div>
          </div>
          <div class="modal-ft"><button class="btn btn-outline" @click="renewTarget=null">Annuler</button><button class="btn btn-purple" @click="doRenew" :disabled="rSaving">{{ rSaving?'...':'Valider le renouvellement' }}</button></div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { Search, Hospital, CircleCheck, CircleX, TriangleAlert, Eye, Ban, RefreshCw, X } from 'lucide-vue-next'
import { ref, computed, onMounted } from 'vue'
import { superApi }         from '../../services/api.js'
import { useToastStore }    from '../../stores/toast.js'
import { useSuperAdminStore } from '../../stores/superAdmin.js'
import { formatDutyDays, formatDutyHours } from '../../utils/duty.js'

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
const fmtMRU        = v => Number(v || 0).toLocaleString('fr-FR') + ' MRU'
const renewTotal    = computed(() => rForm.value.months * MONTHLY_PRICE)

const renewExpiry = computed(() => {
  const d = new Date(); d.setDate(d.getDate() + rForm.value.months * 30)
  return d.toLocaleDateString('fr-FR')
})

const fmtDate    = d => new Date(d).toLocaleDateString('fr-FR')
const isExpired  = d => d && new Date(d) < new Date()
const countBy    = s => pharmacies.value.filter(p => p.status === s).length
const planStyle  = p => {
  const m = { FREE:'background:#f9fafb;color:#6b7280', STARTER:'background:#eff6ff;color:#2563eb', PRO:'background:#f5f3ff;color:#7c3aed', ENTERPRISE:'background:#fefce8;color:#ca8a04' }
  return m[p] || 'background:#f9fafb;color:#6b7280'
}
const phInfo = computed(() => detailPh.value ? [
  { l:'Email',    v: detailPh.value.email||'—' },
  { l:'Téléphone',v: detailPh.value.phone||'—' },
  { l:'Ville',    v: detailPh.value.city||'—' },
  { l:'Pays',     v: detailPh.value.country||'—' },
  { l:'Licence',  v: detailPh.value.license_number||'—' },
  { l:'Garde',    v: detailPh.value.duty_days?.length ? formatDutyDays(detailPh.value.duty_days) + ' · ' + formatDutyHours(detailPh.value) : '—' },
] : [])

let dt; function debouncedFetch() { clearTimeout(dt); dt = setTimeout(fetchData, 380) }

async function fetchData() {
  loading.value = true
  try {
    const r = await superApi.listPharmacies({ page: page.value, pageSize: 20, search: search.value || undefined, status: filterStatus.value || undefined })
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
  if (!cForm.value.pharmacyName || !cForm.value.adminName || !cForm.value.adminEmail || !cForm.value.adminPassword) { cErr.value = 'Champs obligatoires manquants.'; return }
  if (cForm.value.adminPassword.length < 6) { cErr.value = 'Mot de passe min. 6 caractères.'; return }
  cSaving.value = true
  try {
    await superApi.createPharmacy(cForm.value)
    toast.success('Pharmacie créée avec succès !'); showCreate.value = false
    await Promise.all([fetchData(), superStore.fetchStats()])
  } catch(e) { cErr.value = e.message } finally { cSaving.value = false }
}

async function setStatus(p, status) {
  try {
    await superApi.setStatus(p.id, { status })
    toast.success(`Pharmacie ${status === 'ACTIVE' ? 'activée' : 'modifiée'}.`)
    await Promise.all([fetchData(), superStore.fetchStats()])
  } catch(e) { toast.error(e.message) }
}

function openSuspend(p) { suspendTarget.value = p; suspendReason.value = '' }
async function doSuspend() {
  sSaving.value = true
  try {
    await superApi.setStatus(suspendTarget.value.id, { status: 'SUSPENDED', reason: suspendReason.value })
    toast.success('Pharmacie suspendue.'); suspendTarget.value = null
    await Promise.all([fetchData(), superStore.fetchStats()])
  } catch(e) { toast.error(e.message) } finally { sSaving.value = false }
}

function openRenew(p) {
  renewTarget.value = p
  rForm.value = { months: 12, method: 'CASH', reference: '' }
}
async function doRenew() {
  rSaving.value = true
  try {
    await superApi.renew(renewTarget.value.id, rForm.value)
    toast.success('Abonnement renouvelé !'); renewTarget.value = null
    await Promise.all([fetchData(), superStore.fetchStats()])
  } catch(e) { toast.error(e.message) } finally { rSaving.value = false }
}

onMounted(fetchData)
</script>
