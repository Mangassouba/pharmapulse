<template>
  <div style="padding:48px 0;background:#f8fafc;min-height:70vh;">
    <div class="pub-container" style="max-width:560px;">

      <div v-if="loading" style="text-align:center;padding:60px;color:#6b7280;">
        <div style="width:28px;height:28px;border:3px solid #e5e7eb;border-top-color:#16a34a;border-radius:50%;animation:spin .6s linear infinite;margin:0 auto 12px;"></div>
        Chargement de votre commande...
      </div>

      <div v-else-if="!code" style="text-align:center;padding:60px;">
        <div style="font-size:2.5rem;margin-bottom:12px;">❓</div>
        <h3 style="font-weight:700;color:#374151;">Commande introuvable</h3>
        <RouterLink to="/" style="color:#16a34a;font-weight:600;">Retourner à l'accueil</RouterLink>
      </div>

      <div v-else style="background:white;border-radius:18px;border:1px solid #e5e7eb;padding:36px;box-shadow:0 4px 20px rgba(0,0,0,.06);">

        <!-- Icône succès -->
        <div style="text-align:center;margin-bottom:24px;">
          <div style="width:72px;height:72px;border-radius:50%;background:#f0fdf4;border:3px solid #16a34a;display:flex;align-items:center;justify-content:center;font-size:2rem;margin:0 auto 14px;">✅</div>
          <h1 style="font-weight:800;font-size:1.4rem;margin:0 0 6px;color:#111827;">Commande confirmée !</h1>
          <p style="color:#6b7280;font-size:.9rem;line-height:1.6;margin:0;">Votre commande a été enregistrée avec succès.</p>
        </div>

        <!-- Code de retrait — GRAND et VISIBLE -->
        <div style="background:linear-gradient(135deg,#f0fdf4,#dcfce7);border:2px dashed #16a34a;border-radius:16px;padding:28px 20px;text-align:center;margin-bottom:24px;">
          <div style="font-size:.78rem;color:#16a34a;font-weight:800;letter-spacing:.12em;text-transform:uppercase;margin-bottom:10px;">🎫 Votre code de retrait</div>
          <div style="font-family:'JetBrains Mono',monospace;font-size:2.6rem;font-weight:800;color:#15803d;letter-spacing:.15em;line-height:1;">{{ code }}</div>
          <div style="font-size:.78rem;color:#4ade80;font-weight:600;margin-top:10px;">
            Valide 48h · Présentez ce code à la pharmacie
          </div>
          <button @click="copyCode" style="margin-top:14px;background:#16a34a;color:white;border:none;border-radius:8px;padding:8px 20px;font-size:.82rem;font-weight:700;cursor:pointer;font-family:'Inter',sans-serif;">📋 Copier le code</button>
        </div>

        <!-- Récapitulatif si order data disponible -->
        <div v-if="orderData" style="background:#f9fafb;border-radius:12px;padding:16px;margin-bottom:20px;">
          <div style="font-weight:700;font-size:.875rem;margin-bottom:12px;color:#374151;">📋 Récapitulatif</div>
          <div v-for="row in summaryRows" :key="row.l" style="display:flex;justify-content:space-between;padding:5px 0;font-size:.85rem;border-bottom:1px solid #f3f4f6;">
            <span style="color:#6b7280;">{{ row.l }}</span>
            <strong>{{ row.v }}</strong>
          </div>
          <!-- Articles -->
          <div v-if="orderData.items?.length" style="margin-top:10px;border-top:1px solid #e5e7eb;padding-top:10px;">
            <div style="font-size:.78rem;font-weight:700;color:#6b7280;margin-bottom:6px;">Articles commandés</div>
            <div v-for="item in orderData.items" :key="item.id" style="display:flex;justify-content:space-between;font-size:.82rem;padding:3px 0;">
              <span>{{ item.product?.name }} × {{ item.quantity }}</span>
              <span style="font-family:'JetBrains Mono',monospace;font-weight:600;">{{ Number(item.total || item.price*item.quantity).toLocaleString('fr-FR') }} F</span>
            </div>
          </div>
          <!-- Total -->
          <div style="display:flex;justify-content:space-between;align-items:center;padding-top:10px;margin-top:8px;border-top:1px dashed #d1d5db;">
            <span style="font-weight:700;font-size:.9rem;">Total à payer en pharmacie</span>
            <strong style="font-size:1.2rem;color:#16a34a;font-family:'JetBrains Mono',monospace;">{{ Number(orderData.total_amount||0).toLocaleString('fr-FR') }} F</strong>
          </div>
        </div>

        <!-- Statut en temps réel -->
        <div v-if="orderData" style="margin-bottom:20px;">
          <div style="font-weight:700;font-size:.875rem;margin-bottom:10px;color:#374151;">📍 Suivi en temps réel</div>
          <div style="display:flex;align-items:center;gap:0;">
            <div v-for="(step, i) in steps" :key="i" style="flex:1;text-align:center;">
              <div :style="`width:32px;height:32px;border-radius:50%;margin:0 auto 6px;display:flex;align-items:center;justify-content:center;font-size:1rem;border:2px solid;${step.active?'background:#16a34a;border-color:#16a34a;':'background:#f3f4f6;border-color:#e5e7eb;'}`">
                <span :style="step.active?'filter:brightness(10)':''">{{ step.icon }}</span>
              </div>
              <div :style="`font-size:.68rem;font-weight:${step.current?700:500};color:${step.active?'#16a34a':'#9ca3af'};`">{{ step.label }}</div>
            </div>
          </div>
        </div>

        <!-- Infos pharmacie -->
        <div v-if="orderData?.pharmacy" style="background:#eff6ff;border-radius:10px;padding:14px;margin-bottom:20px;border:1px solid #bfdbfe;">
          <div style="font-weight:700;font-size:.875rem;color:#1e40af;margin-bottom:8px;">🏥 Votre pharmacie</div>
          <div style="font-size:.85rem;color:#1e40af;line-height:1.8;">
            <strong>{{ orderData.pharmacy.name }}</strong><br/>
            📍 {{ orderData.pharmacy.address || orderData.pharmacy.city }}<br/>
            <span v-if="orderData.pharmacy.phone">📞 {{ orderData.pharmacy.phone }}</span>
          </div>
        </div>

        <!-- Instructions -->
        <div style="background:#fefce8;border-radius:10px;padding:14px;margin-bottom:20px;border:1px solid #fef08a;font-size:.82rem;color:#78350f;line-height:1.7;">
          <strong>📌 Comment récupérer votre commande ?</strong><br/>
          1. Rendez-vous à la pharmacie durant ses heures d'ouverture<br/>
          2. Présentez ce code <strong style="font-family:'JetBrains Mono',monospace;">{{ code }}</strong> au pharmacien<br/>
          3. Payez le montant indiqué et récupérez vos médicaments<br/>
          4. Le code expire dans 48h
        </div>

        <!-- Boutons -->
        <div style="display:flex;flex-direction:column;gap:8px;">
          <button v-if="orderData" @click="downloadReceipt" style="background:#eff6ff;color:#1e40af;border:1px solid #bfdbfe;border-radius:10px;padding:11px;font-weight:700;cursor:pointer;font-family:'Inter',sans-serif;">📄 Télécharger le reçu (PDF)</button>
          <button @click="refreshStatus" style="background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0;border-radius:10px;padding:11px;font-weight:700;cursor:pointer;font-family:'Inter',sans-serif;">🔄 Actualiser le statut</button>
          <RouterLink to="/pharmacies" style="display:block;background:#16a34a;color:white;border-radius:10px;padding:12px;font-weight:700;text-decoration:none;text-align:center;">🏥 Parcourir d'autres pharmacies</RouterLink>
          <RouterLink to="/panier" style="display:block;background:#f3f4f6;color:#374151;border-radius:10px;padding:12px;font-weight:600;text-decoration:none;text-align:center;font-size:.875rem;">← Retour au panier</RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { jsPDF } from 'jspdf'
import { useCartStore } from '../../stores/cart.js'
import { useToastStore } from '../../stores/toast.js'

const route     = useRoute()
const cartStore = useCartStore()
const toast     = useToastStore()

const code      = ref(route.query.code || '')
const orderData = ref(null)
const loading   = ref(false)

// Récapitulatif lignes
const summaryRows = computed(() => {
  if (!orderData.value) return []
  return [
    { l: 'N° Commande',  v: `#${orderData.value.id}`                },
    { l: 'Client',       v: orderData.value.customer                 },
    { l: 'Téléphone',    v: orderData.value.customer_phone           },
    { l: 'Pharmacie',    v: orderData.value.pharmacy?.name || '—'   },
    { l: 'Date commande',v: orderData.value.order_date
        ? new Date(orderData.value.order_date).toLocaleString('fr-FR')
        : '—'
    },
  ].filter(r => r.v)
})

// Étapes de suivi
const statusOrder = ['PENDING', 'READY', 'COMPLETED']
const steps = computed(() => {
  const current = orderData.value?.status || 'PENDING'
  const idx     = statusOrder.indexOf(current)
  return [
    { icon: '📋', label: 'Reçue',     active: idx >= 0, current: current === 'PENDING' },
    { icon: '✅', label: 'Prête',     active: idx >= 1, current: current === 'READY'   },
    { icon: '🏥', label: 'Récupérée', active: idx >= 2, current: current === 'COMPLETED'},
  ]
})

async function loadOrder() {
  if (!code.value) return
  loading.value = true
  try {
    const res = await cartStore.trackOrder(code.value)
    orderData.value = res.data || res
  } catch (e) {
    // Code invalide — pas bloquant, le code est affiché quand même
    console.warn('Could not load order data:', e.message)
  } finally { loading.value = false }
}

async function refreshStatus() {
  await loadOrder()
  toast.success('Statut actualisé.')
}

function fmt(n) { return Number(n || 0).toLocaleString('fr-FR') + ' F' }

function downloadReceipt() {
  const o = orderData.value
  if (!o) return

  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const marginX = 18
  let y = 20

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text(o.pharmacy?.name || 'Pharmacie', marginX, y)
  y += 7

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(90)
  const pharmaLine = [o.pharmacy?.address || o.pharmacy?.city, o.pharmacy?.phone ? `Tél: ${o.pharmacy.phone}` : null]
    .filter(Boolean).join('  ·  ')
  if (pharmaLine) { doc.text(pharmaLine, marginX, y); y += 8 } else { y += 4 }

  doc.setDrawColor(220)
  doc.line(marginX, y, pageWidth - marginX, y)
  y += 9

  doc.setTextColor(20)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.text('Reçu de commande', marginX, y)
  y += 9

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  const infoRows = [
    ['N° Commande',   `#${o.id}`],
    ['Code de retrait', o.pickup_code || code.value],
    ['Date',          o.order_date ? new Date(o.order_date).toLocaleString('fr-FR') : '—'],
    ['Client',        o.customer || '—'],
    ['Téléphone',     o.customer_phone || '—'],
  ]
  infoRows.forEach(([label, value]) => {
    doc.setTextColor(107)
    doc.text(label, marginX, y)
    doc.setTextColor(20)
    doc.text(String(value), pageWidth - marginX, y, { align: 'right' })
    y += 6
  })
  y += 4

  doc.setDrawColor(220)
  doc.line(marginX, y, pageWidth - marginX, y)
  y += 8

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text('Article', marginX, y)
  doc.text('Qté', pageWidth - marginX - 55, y, { align: 'right' })
  doc.text('Prix unit.', pageWidth - marginX - 28, y, { align: 'right' })
  doc.text('Total', pageWidth - marginX, y, { align: 'right' })
  y += 4
  doc.setDrawColor(230)
  doc.line(marginX, y, pageWidth - marginX, y)
  y += 6

  doc.setFont('helvetica', 'normal')
  ;(o.items || []).forEach(item => {
    if (y > 270) { doc.addPage(); y = 20 }
    const name = item.product?.name || '—'
    const lines = doc.splitTextToSize(name, 90)
    doc.text(lines, marginX, y)
    doc.text(String(item.quantity), pageWidth - marginX - 55, y, { align: 'right' })
    doc.text(fmt(item.price), pageWidth - marginX - 28, y, { align: 'right' })
    doc.text(fmt(item.total || item.price * item.quantity), pageWidth - marginX, y, { align: 'right' })
    y += Math.max(6, lines.length * 5)
  })

  y += 2
  doc.setDrawColor(220)
  doc.line(marginX, y, pageWidth - marginX, y)
  y += 10

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text('Total à payer en pharmacie', marginX, y)
  doc.setTextColor(22, 163, 74)
  doc.text(fmt(o.total_amount), pageWidth - marginX, y, { align: 'right' })
  y += 14

  doc.setTextColor(120)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.text('Présentez ce reçu et le code de retrait au pharmacien pour récupérer votre commande.', marginX, y)
  y += 5
  doc.text('Le code de retrait est valide 48h après la commande.', marginX, y)

  doc.save(`recu-commande-${o.pickup_code || code.value}.pdf`)
}

function copyCode() {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(code.value)
    toast.success('Code copié dans le presse-papiers !')
  } else {
    toast.warning('Copie non supportée — notez le code manuellement.')
  }
}

onMounted(loadOrder)
</script>

<style scoped>
@keyframes spin { to { transform: rotate(360deg); } }
</style>
