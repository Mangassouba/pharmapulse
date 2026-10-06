<template>
  <Teleport to="body">
    <div v-if="open" class="modal-bg" @click.self="close">
      <div class="modal" style="max-width:440px;" role="dialog" aria-labelledby="pay-title">
        <div class="modal-hd">
          <h3 id="pay-title"><Wallet size="1em" /> Paiement de l'abonnement</h3>
          <button class="btn btn-icon" @click="close" aria-label="Fermer"><X size="1em" /></button>
        </div>
        <div class="modal-bd" style="text-align:center;">
          <p style="margin:0 0 14px;font-size:.92rem;color:var(--text);">
            Bienvenue ! Veuillez payer l'abonnement au numéro :
          </p>
          <div style="display:flex;align-items:center;justify-content:center;gap:10px;margin-bottom:10px;">
            <span style="font-family:'JetBrains Mono',monospace;font-size:1.8rem;font-weight:800;letter-spacing:.06em;color:#16a34a;">{{ PAYMENT_NUMBER }}</span>
            <button class="btn btn-sm btn-outline" @click="copy" :title="copied ? 'Copié' : 'Copier le numéro'">
              <Check v-if="copied" size="1em" /><Copy v-else size="1em" /> {{ copied ? 'Copié' : 'Copier' }}
            </button>
          </div>
          <div style="display:flex;justify-content:center;gap:8px;margin-bottom:16px;">
            <span v-for="m in PAYMENT_METHODS" :key="m" style="padding:4px 12px;border-radius:99px;background:#f0fdf4;border:1px solid #bbf7d0;color:#166534;font-size:.8rem;font-weight:700;">{{ m }}</span>
          </div>
          <div style="padding:10px 14px;background:#f9fafb;border:1px solid var(--border);border-radius:8px;font-size:.85rem;color:var(--text);">
            Montant : <strong>{{ price }} / mois</strong>
          </div>
          <p v-if="trialEndLabel" style="margin:12px 0 0;font-size:.8rem;color:#6b7280;">
            Votre essai gratuit est actif jusqu'au <strong>{{ trialEndLabel }}</strong>.
            Après réception du paiement, votre abonnement sera activé par notre équipe.
          </p>
        </div>
        <div class="modal-ft">
          <button class="btn btn-primary" @click="close">J'ai compris</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { Wallet, X, Copy, Check } from 'lucide-vue-next'
import { ref, computed } from 'vue'
import { useAuthStore } from '../stores/auth.js'
import { PAYMENT_NUMBER, PAYMENT_METHODS, MONTHLY_PRICE, CURRENCY } from '../config/payment.js'

// Shown once, right after a successful registration (auth.justRegistered)
const auth   = useAuthStore()
const open   = computed(() => !!auth.justRegistered)
const copied = ref(false)

const price = `${MONTHLY_PRICE.toLocaleString('fr-FR')} ${CURRENCY}`
const trialEndLabel = computed(() => {
  const d = auth.justRegistered?.trialEnd
  return d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : ''
})

async function copy() {
  try {
    await navigator.clipboard.writeText(PAYMENT_NUMBER)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch { /* clipboard unavailable (http, old browser): the number stays readable */ }
}

function close() { auth.justRegistered = null }
</script>
