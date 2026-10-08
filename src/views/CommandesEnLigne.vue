<template>
  <div style="display:flex;flex-direction:column;gap:20px;">

    <!-- Saisie du code -->
    <div class="card card-p">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:18px;">
        <div style="width:42px;height:42px;border-radius:11px;background:var(--green-l);border:1px solid var(--green-b);display:flex;align-items:center;justify-content:center;font-size:1.3rem;flex-shrink:0;"><Search size="1em" /></div>
        <div>
          <h2 style="font-weight:800;font-size:1rem;margin:0;">{{ $t('online.verifyTitle') }}</h2>
          <p style="font-size:.78rem;color:var(--gray);margin:2px 0 0;">{{ $t('online.verifyHelp') }} <strong style="font-family:'JetBrains Mono',monospace;">PH-XXXXXX</strong></p>
        </div>
      </div>

      <div style="display:flex;gap:10px;max-width:520px;flex-wrap:wrap;">
        <input
          v-model="inputCode"
          class="inp"
          :placeholder="$t('common.example', { v: 'PH-ABC123' })"
          @keyup.enter="verifyCode"
          @input="inputCode = inputCode.toUpperCase().replace(/[^A-Z0-9-]/g, '')"
          style="flex:1;min-width:200px;font-family:'JetBrains Mono',monospace;font-size:1.2rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;"
          autofocus
        />
        <button class="btn btn-primary" @click="verifyCode" :disabled="verifying || !inputCode.trim()">
          {{ verifying ? $t('online.verifying') : $t('online.verify') }}
        </button>
        <button v-if="verifiedOrder" class="btn btn-outline" @click="resetAll">↺ {{ $t('online.newCode') }}</button>
      </div>

      <div v-if="verifyError" style="margin-top:10px;padding:11px 14px;background:var(--red-l);border:1px solid var(--red-b);border-radius:9px;font-size:.875rem;color:var(--red);display:flex;align-items:center;gap:8px;">
        <CircleX size="1em" /> {{ verifyError }}
      </div>
    </div>

    <!-- Résultat vérification -->
    <Transition name="fade">
      <div v-if="verifiedOrder" class="card" style="border:2px solid var(--green);overflow:hidden;">
        <!-- Header vert -->
        <div style="padding:16px 20px;background:linear-gradient(135deg,var(--green-l),#dcfce7);border-bottom:1px solid var(--green-b);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;">
          <div style="display:flex;align-items:center;gap:12px;">
            <div style="width:44px;height:44px;border-radius:12px;background:var(--green);display:flex;align-items:center;justify-content:center;font-size:1.4rem;"><CircleCheck size="1em" /></div>
            <div>
              <div style="font-weight:800;font-size:1.05rem;color:#166534;">{{ $t('online.validCode') }}</div>
              <div style="font-size:.78rem;color:var(--green);font-weight:600;">
                {{ $t('online.source') }} {{ verifiedOrder.source === 'ONLINE' ? $t('receipt.onlineOrder') : $t('online.inStoreOrder') }}
              </div>
            </div>
          </div>
          <div style="text-align:end;">
            <div style="font-family:'JetBrains Mono',monospace;font-size:1.8rem;font-weight:800;color:#15803d;letter-spacing:.1em;">{{ verifiedOrder.pickup_code }}</div>
            <div style="font-size:.72rem;color:var(--green);font-weight:600;">{{ $t('online.expiresOn', { date: fmtDate(verifiedOrder.pickup_expires_at) }) }}</div>
          </div>
        </div>

        <!-- Info client + statut -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:0;border-bottom:1px solid #f3f4f6;">
          <div style="padding:18px 20px;border-inline-end:1px solid #f3f4f6;">
            <h3 style="font-weight:700;font-size:.875rem;margin:0 0 12px;color:#374151;"><User size="1em" /> {{ $t('online.customerInfo') }}</h3>
            <div class="detail-row"><span>{{ $t('common.name') }}</span><strong>{{ verifiedOrder.customer }}</strong></div>
            <div class="detail-row"><span>{{ $t('common.phone') }}</span><strong style="font-family:'JetBrains Mono',monospace;">{{ verifiedOrder.customer_phone }}</strong></div>
            <div v-if="verifiedOrder.customer_email" class="detail-row"><span>{{ $t('common.email') }}</span><strong>{{ verifiedOrder.customer_email }}</strong></div>
            <div class="detail-row"><span>{{ $t('online.orderDate') }}</span><strong>{{ fmtDatetime(verifiedOrder.order_date) }}</strong></div>
            <div v-if="verifiedOrder.customer_note" style="margin-top:10px;padding:10px;background:var(--yellow-l);border-radius:8px;font-size:.82rem;border:1px solid var(--yellow-b);">
              <strong style="color:#92400e;"><StickyNote size="1em" /> {{ $t('common.note') }} :</strong> {{ verifiedOrder.customer_note }}
            </div>
          </div>
          <div style="padding:18px 20px;">
            <h3 style="font-weight:700;font-size:.875rem;margin:0 0 12px;color:#374151;"><ClipboardList size="1em" /> {{ $t('online.order') }}</h3>
            <div class="detail-row">
              <span>{{ $t('common.status') }}</span>
              <span class="badge" :class="statusBadge(verifiedOrder.status)">{{ statusLabel(verifiedOrder.status) }}</span>
            </div>
            <div class="detail-row"><span>{{ $t('online.orderNumber') }}</span><strong style="font-family:'JetBrains Mono',monospace;">#{{ verifiedOrder.id }}</strong></div>
            <div style="margin-top:14px;padding:16px;background:var(--green-l);border-radius:10px;text-align:center;border:1px solid var(--green-b);">
              <div style="font-size:.75rem;color:var(--green);font-weight:700;margin-bottom:4px;">{{ $t('online.totalToCollect') }}</div>
              <div style="font-size:2rem;font-weight:800;font-family:'JetBrains Mono',monospace;color:#15803d;">
                {{ fmtNum(verifiedOrder.total_amount) }} MRU
              </div>
            </div>
          </div>
        </div>

        <!-- Articles -->
        <div style="padding:16px 20px;border-bottom:1px solid #f3f4f6;">
          <h3 style="font-weight:700;font-size:.875rem;margin:0 0 12px;color:#374151;"><Pill size="1em" /> {{ $t('online.orderedItems') }}</h3>
          <div class="tbl-wrap">
            <table class="tbl">
              <thead>
                <tr>
                  <th>{{ $t('common.product') }}</th>
                  <th style="text-align:center;">{{ $t('common.qtyShort') }}</th>
                  <th style="text-align:end;">{{ $t('online.unitPrice') }}</th>
                  <th style="text-align:end;">{{ $t('common.total') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in verifiedOrder.items" :key="item.id">
                  <td>
                    <div style="font-weight:600;">{{ item.product?.name }}</div>
                    <div style="font-size:.72rem;color:var(--gray);">{{ $te('unitTypes', item.product?.unit_type) }}</div>
                  </td>
                  <td style="text-align:center;font-family:'JetBrains Mono',monospace;font-weight:700;font-size:1rem;">{{ item.quantity }}</td>
                  <td style="text-align:end;font-family:'JetBrains Mono',monospace;">{{ fmtNum(item.price) }} MRU</td>
                  <td style="text-align:end;font-family:'JetBrains Mono',monospace;font-weight:700;color:var(--green);">{{ fmtNum(item.total || item.price * item.quantity) }} MRU</td>
                </tr>
                <tr>
                  <td colspan="3" style="text-align:end;font-weight:700;padding-top:12px;border-top:2px solid var(--border);">{{ $t('common.total') }}</td>
                  <td style="text-align:end;font-family:'JetBrains Mono',monospace;font-weight:800;color:var(--green);font-size:1.1rem;border-top:2px solid var(--border);">{{ fmtNum(verifiedOrder.total_amount) }} MRU</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Actions -->
        <div style="padding:16px 20px;background:var(--gray-l);display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;">
          <p style="font-size:.82rem;color:var(--gray);margin:0;"><Lightbulb size="1em" /> {{ $t('online.checkIdentity') }}</p>
          <div style="display:flex;gap:10px;">
            <button class="btn btn-outline" style="border-color:var(--red-b);color:var(--red);" @click="rejectOrder"><X size="1em" /> {{ $t('online.reject') }}</button>
            <button class="btn btn-primary" style="padding:10px 24px;font-size:.95rem;" @click="showValidateModal = true">
              <CircleCheck size="1em" /> {{ $t('online.validateAndCollect') }}
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Divider -->
    <div style="display:flex;align-items:center;gap:12px;">
      <div style="flex:1;height:1px;background:var(--border);"></div>
      <span style="font-size:.72rem;color:#9ca3af;font-weight:700;letter-spacing:.05em;text-transform:uppercase;">{{ $t('online.pendingDivider') }}</span>
      <div style="flex:1;height:1px;background:var(--border);"></div>
    </div>

    <!-- Liste commandes en ligne -->
    <div class="card">
      <div style="padding:14px 20px;border-bottom:1px solid #f3f4f6;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;">
        <div>
          <h3 style="font-weight:700;font-size:.95rem;margin:0;">{{ $t('online.listTitle') }}</h3>
          <p style="font-size:.78rem;color:var(--gray);margin:2px 0 0;">{{ $t('online.count', { n: ordersMeta.total || 0 }) }}</p>
        </div>
        <div style="display:flex;gap:8px;align-items:center;">
          <select v-model="filterStatus" class="inp" style="width:160px;" @change="fetchOnlineOrders">
            <option value="PENDING">{{ $t('online.filter.PENDING') }}</option>
            <option value="READY">{{ $t('online.filter.READY') }}</option>
            <option value="COMPLETED">{{ $t('online.filter.COMPLETED') }}</option>
            <option value="CANCELLED">{{ $t('online.filter.CANCELLED') }}</option>
            <option value="">{{ $t('online.filter.all') }}</option>
          </select>
          <button class="btn btn-outline btn-sm" @click="fetchOnlineOrders">↺ {{ $t('common.refresh') }}</button>
        </div>
      </div>

      <div v-if="loadingOrders" class="loading-box"><div class="spinner"></div> {{ $t('common.loading') }}</div>
      <div v-else-if="!onlineOrders.length" style="text-align:center;padding:40px;">
        <div style="font-size:2.5rem;margin-bottom:12px;"><Inbox size="1em" /></div>
        <p style="color:var(--gray);">{{ filterStatus ? $t('online.noneWithStatus', { status: $t('online.filter.' + filterStatus).toLowerCase() }) : $t('online.none') }}</p>
      </div>
      <div v-else class="tbl-wrap">
        <table class="tbl">
          <thead>
            <tr>
              <th>{{ $t('receipt.pickupCode') }}</th>
              <th>{{ $t('common.customer') }}</th>
              <th>{{ $t('common.date') }}</th>
              <th>{{ $t('common.items') }}</th>
              <th>{{ $t('common.total') }}</th>
              <th>{{ $t('common.status') }}</th>
              <th>{{ $t('common.actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="o in onlineOrders" :key="o.id"
                :style="o.status === 'PENDING' ? 'background:#f0fff4' : ''">
              <td>
                <div style="font-family:'JetBrains Mono',monospace;font-weight:800;font-size:1.1rem;color:var(--green);letter-spacing:.06em;">
                  {{ o.pickup_code || '—' }}
                </div>
                <div v-if="o.pickup_expires_at" style="font-size:.68rem;color:#9ca3af;margin-top:1px;">
                  {{ $t('online.expires', { date: fmtDate(o.pickup_expires_at) }) }}
                </div>
              </td>
              <td>
                <div style="font-weight:600;">{{ o.customer }}</div>
                <div style="font-size:.75rem;color:var(--gray);font-family:'JetBrains Mono',monospace;">{{ o.customer_phone }}</div>
              </td>
              <td style="font-size:.8rem;color:var(--gray);white-space:nowrap;">{{ fmtDatetime(o.order_date) }}</td>
              <td style="font-size:.8rem;color:var(--gray);">{{ $t('categories.productCount', { n: o.details?.length ?? o._count?.details ?? 0 }) }}</td>
              <td style="font-family:'JetBrains Mono',monospace;font-weight:700;color:var(--green);">
                {{ fmtNum(o.total_amount) }} MRU
              </td>
              <td>
                <span class="badge" :class="statusBadge(o.status)">{{ statusLabel(o.status) }}</span>
                <div v-if="o.pickup_code_used" style="font-size:.65rem;color:var(--green);font-weight:600;margin-top:2px;"><CircleCheck size="1em" /> {{ $t('online.pickedUp') }}</div>
                <div v-if="o.status === 'COMPLETED' && (o.validator || o.validated_at)" style="font-size:.68rem;color:var(--gray);margin-top:2px;">
                  <template v-if="o.validator">{{ $t('online.by') }} <strong>{{ o.validator.name }}</strong></template>
                  <template v-if="o.validated_at"> · {{ fmtDatetime(o.validated_at) }}</template>
                </div>
              </td>
              <td>
                <div style="display:flex;gap:5px;flex-wrap:wrap;">
                  <button
                    v-if="o.status === 'PENDING' || o.status === 'READY'"
                    class="btn btn-xs btn-primary"
                    @click="quickVerify(o)">
                    <Search size="1em" /> {{ $t('online.verifyAndValidate') }}
                  </button>
                  <button
                    v-if="o.status === 'PENDING'"
                    class="btn btn-xs btn-outline"
                    style="border-color:var(--blue-b);color:var(--blue);"
                    @click="markReady(o)">
                    <CircleCheck size="1em" /> {{ $t('online.markReady') }}
                  </button>
                  <button v-if="o.status === 'COMPLETED'" class="btn btn-xs btn-outline" @click="openReceipt(o, o.validator?.name)" :title="$t('sales.receiptTitle')">
                    <Printer size="1em" /> {{ $t('receipt.short') }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="ordersMeta.totalPages > 1" class="pagination">
        <button class="page-btn" @click="ordersPage--;fetchOnlineOrders()" :disabled="ordersPage === 1">‹</button>
        <span style="font-size:.85rem;color:var(--gray);">{{ ordersPage }} / {{ ordersMeta.totalPages }}</span>
        <button class="page-btn" @click="ordersPage++;fetchOnlineOrders()" :disabled="ordersPage >= ordersMeta.totalPages">›</button>
      </div>
    </div>

    <!-- Modal de validation -->
    <Teleport to="body">
      <div v-if="showValidateModal && verifiedOrder" class="modal-bg" @click.self="showValidateModal = false">
        <div class="modal">
          <div class="modal-hd">
            <h3 style="color:var(--green);"><CircleCheck size="1em" /> {{ $t('online.confirmPickup') }}</h3>
            <button class="btn btn-icon" @click="showValidateModal = false"><X size="1em" /></button>
          </div>
          <div class="modal-bd">
            <div style="background:var(--green-l);border:1px solid var(--green-b);border-radius:10px;padding:16px;margin-bottom:16px;">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                <span style="font-size:.85rem;color:var(--gray);">{{ $t('common.customer') }}</span>
                <strong>{{ verifiedOrder.customer }}</strong>
              </div>
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                <span style="font-size:.85rem;color:var(--gray);">{{ $t('common.phone') }}</span>
                <strong style="font-family:'JetBrains Mono',monospace;">{{ verifiedOrder.customer_phone }}</strong>
              </div>
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                <span style="font-size:.85rem;color:var(--gray);">{{ $t('receipt.pickupCode') }}</span>
                <strong style="font-family:'JetBrains Mono',monospace;color:var(--green);font-size:1.2rem;letter-spacing:.08em;">{{ verifiedOrder.pickup_code }}</strong>
              </div>
              <div style="display:flex;justify-content:space-between;align-items:center;padding-top:10px;border-top:1px solid var(--green-b);margin-top:6px;">
                <span style="font-weight:700;">{{ $t('online.amountToCollect') }}</span>
                <strong style="font-size:1.4rem;font-family:'JetBrains Mono',monospace;color:#15803d;">
                  {{ fmtNum(verifiedOrder.total_amount) }} MRU
                </strong>
              </div>
            </div>

            <label class="lbl">{{ $t('online.paymentMethod') }}</label>
            <select v-model="validatePayment" class="inp" style="margin-bottom:12px;">
              <option v-for="m in ['CASH','CARD','TRANSFER','INSURANCE']" :key="m" :value="m">{{ $t('paymentMethods.' + m) }}</option>
            </select>

            <label class="lbl">{{ $t('online.validationNote') }}</label>
            <input v-model="validateNote" class="inp" :placeholder="$t('online.validationNotePh')"/>

            <div style="margin-top:12px;padding:10px;background:var(--yellow-l);border-radius:8px;font-size:.8rem;color:#92400e;border:1px solid var(--yellow-b);">
              <TriangleAlert size="1em" /> {{ $t('online.irreversibleWarning') }}
            </div>
          </div>
          <div class="modal-ft">
            <button class="btn btn-outline" @click="showValidateModal = false">{{ $t('common.cancel') }}</button>
            <button class="btn btn-primary" @click="validatePickup" :disabled="validating" style="font-size:.95rem;padding:10px 24px;">
              {{ validating ? $t('online.validating') : $t('online.confirmAndCollect') }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <SaleReceipt :sale="receiptOrder" :title="$t('receipt.pickupTitle')" :subtitle="$t('receipt.onlineOrder')" @close="receiptOrder = null" />
  </div>
</template>

<script setup>
import { Search, CircleX, CircleCheck, User, StickyNote, ClipboardList, Pill, Lightbulb, X, Inbox, TriangleAlert, Printer } from 'lucide-vue-next'
import { ref, onMounted } from 'vue'
import SaleReceipt from '../components/SaleReceipt.vue'
import { useToastStore } from '../stores/toast.js'
import { useAuthStore }  from '../stores/auth.js'
import { orderApi }      from '../services/api.js'
import apiClient         from '../services/api.js'
import { t, te, fmtNum, intlLocale } from '../i18n/index.js'

const toast = useToastStore()
const auth  = useAuthStore()

// ── Reçu de retrait ───────────────────────────────────────────────
const receiptOrder = ref(null)

// Ramène une commande au format attendu par SaleReceipt
function openReceipt(o, validatorName, paymentMethod) {
  receiptOrder.value = {
    invoice_number: o.sale?.invoice_number || `CMD-${String(o.id).padStart(6, '0')}`,
    payment_method: paymentMethod,
    pickup_code:    o.pickup_code,
    order_date:     o.order_date,
    sale_date:      o.validated_at || new Date(),
    customer:       o.customer,
    user:           validatorName ? { name: validatorName } : null,
    details:        o.details || o.items || [],
    discount:       0,
    total_amount:   o.total_amount,
  }
}

// ── Code verification state ───────────────────────────────────────
const inputCode         = ref('')
const verifying         = ref(false)
const verifyError       = ref('')
const verifiedOrder     = ref(null)
const showValidateModal = ref(false)
const validateNote      = ref('')
const validatePayment   = ref('CASH')
const validating        = ref(false)

// ── Online orders list state ──────────────────────────────────────
const onlineOrders  = ref([])
const ordersMeta    = ref({ totalPages: 1, total: 0 })
const loadingOrders = ref(false)
const ordersPage    = ref(1)
const filterStatus  = ref('PENDING')

// ── Helpers ───────────────────────────────────────────────────────
const fmtDate = d => d ? new Date(d).toLocaleDateString(intlLocale()) : '—'
const fmtDatetime = d => d
  ? new Date(d).toLocaleString(intlLocale(), { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
  : '—'

const statusLabel = s => te('online.status', s)
const statusBadge = s => ({ PENDING: 'badge-yellow', READY: 'badge-blue', COMPLETED: 'badge-green', CANCELLED: 'badge-red' }[s] || 'badge-gray')

function resetAll() {
  inputCode.value = ''; verifyError.value = ''; verifiedOrder.value = null
  validateNote.value = ''; validatePayment.value = 'CASH'; showValidateModal.value = false
}

// ── Verify code ───────────────────────────────────────────────────
async function verifyCode() {
  const code = inputCode.value.trim()
  if (!code) return
  verifying.value = true; verifyError.value = ''; verifiedOrder.value = null
  try {
    // GET /api/orders/verify/:code  (pharmacy-side, requires auth token)
    const res = await apiClient.get(`/orders/verify/${code}`)
    verifiedOrder.value = res.data || res
  } catch (e) {
    if (e.status === 409) verifyError.value = t('online.err.alreadyUsed')
    else if (e.status === 410) verifyError.value = `⏰ ${t('online.err.expired')} ${e.message || ''}`
    else if (e.status === 404) verifyError.value = t('online.err.notFound')
    else verifyError.value = e.message || t('online.err.verify')
  } finally { verifying.value = false }
}

// ── Quick verify from list ────────────────────────────────────────
async function quickVerify(order) {
  inputCode.value = order.pickup_code
  await verifyCode()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// ── Validate pickup ───────────────────────────────────────────────
async function validatePickup() {
  if (!verifiedOrder.value) return
  validating.value = true
  try {
    const res = await apiClient.patch(`/orders/${verifiedOrder.value.id}/validate-pickup`, {
      note: validateNote.value,
      payment_method: validatePayment.value,
    })
    openReceipt(
      { ...verifiedOrder.value, validated_at: res.data?.validated_at, sale: res.data?.sale },
      res.data?.validator?.name || auth.user?.name,
      validatePayment.value,
    )
    const amount = fmtNum(verifiedOrder.value.total_amount)
    toast.success(t('online.validated', { code: verifiedOrder.value.pickup_code, amount }))
    showValidateModal.value = false
    resetAll()
    await fetchOnlineOrders()
  } catch (e) {
    toast.error(e.message || t('online.err.validate'))
  } finally { validating.value = false }
}

// ── Mark ready ────────────────────────────────────────────────────
async function markReady(order) {
  try {
    await orderApi.updateStatus(order.id, { status: 'READY' })
    toast.success(t('online.markedReady', { code: order.pickup_code }))
    await fetchOnlineOrders()
  } catch (e) { toast.error(e.message) }
}

// ── Reject order ──────────────────────────────────────────────────
async function rejectOrder() {
  if (!verifiedOrder.value) return
  if (!confirm(t('online.rejectConfirm', { code: verifiedOrder.value.pickup_code, customer: verifiedOrder.value.customer }))) return
  try {
    await orderApi.updateStatus(verifiedOrder.value.id, { status: 'CANCELLED' })
    toast.warning(t('online.rejected'))
    resetAll()
    await fetchOnlineOrders()
  } catch (e) { toast.error(e.message) }
}

// ── Fetch online orders list ──────────────────────────────────────
async function fetchOnlineOrders() {
  loadingOrders.value = true
  try {
    const params = {
      page:     ordersPage.value,
      pageSize: 15,
      source:   'ONLINE',
    }
    if (filterStatus.value) params.status = filterStatus.value
    const r = await orderApi.list(params)
    onlineOrders.value = r.data || []
    ordersMeta.value   = r.meta || { totalPages: 1, total: 0 }
  } catch (e) { toast.error(e.message || t('common.loadError')) }
  finally { loadingOrders.value = false }
}

onMounted(fetchOnlineOrders)
</script>

<style scoped>
.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 7px 0;
  border-bottom: 1px solid #f3f4f6;
  font-size: .875rem;
}
.detail-row span { color: var(--gray); }
.fade-enter-active, .fade-leave-active { transition: all .25s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(-8px); }
</style>
