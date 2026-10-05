<template>
  <div class="pub-page">
    <div class="pub-container">
      <h1 class="pn-title"><ShoppingCart size="1em" /> Mon Panier</h1>

      <!-- Empty cart -->
      <div v-if="!cartStore.items.length" class="pn-empty">
        <div style="font-size:3.5rem;margin-bottom:16px;"><ShoppingCart size="1em" /></div>
        <h3 style="font-weight:700;font-size:1.1rem;margin-bottom:8px;">Votre panier est vide</h3>
        <p style="color:#6b7280;margin-bottom:20px;">Ajoutez des produits depuis les pharmacies disponibles.</p>
        <RouterLink to="/pharmacies" style="display:inline-flex;align-items:center;gap:8px;background:#16a34a;color:white;border-radius:10px;padding:12px 24px;text-decoration:none;font-weight:700;">
          <Hospital size="1em" /> Voir les pharmacies
        </RouterLink>
      </div>

      <div v-else class="pn-layout">
        <!-- Cart items grouped by pharmacy -->
        <div style="display:flex;flex-direction:column;gap:16px;min-width:0;">
          <div v-for="group in cartStore.byPharmacy" :key="group.pharmacyId" style="background:white;border-radius:14px;border:1px solid #e5e7eb;overflow:hidden;">
            <div style="padding:14px 18px;background:#f9fafb;border-bottom:1px solid #e5e7eb;display:flex;align-items:center;gap:10px;">
              <span style="font-size:1.1rem;"><Hospital size="1em" /></span>
              <div>
                <div style="font-weight:700;font-size:.95rem;">{{ group.pharmacyName }}</div>
                <div style="font-size:.75rem;color:#6b7280;">Retrait en pharmacie</div>
              </div>
            </div>
            <div class="pn-items">
              <div v-for="item in group.items" :key="item.idx" class="pn-item">
                <div class="pn-item-icon"><Pill size="1em" /></div>
                <div class="pn-item-info">
                  <div style="font-weight:600;font-size:.9rem;">{{ item.product.name }}</div>
                  <div style="font-size:.75rem;color:#6b7280;">{{ item.product.unit_type }}</div>
                </div>
                <div class="pn-item-qty">
                  <button @click="cartStore.updateQty(item.idx, item.qty-1)" style="width:30px;height:30px;border:none;background:#f9fafb;cursor:pointer;font-weight:700;">−</button>
                  <span style="width:28px;text-align:center;font-family:'JetBrains Mono',monospace;font-weight:700;font-size:.85rem;">{{ item.qty }}</span>
                  <button @click="cartStore.updateQty(item.idx, item.qty+1)" :disabled="item.qty>=item.product.stock" style="width:30px;height:30px;border:none;background:#f9fafb;cursor:pointer;font-weight:700;" :style="item.qty>=item.product.stock?'opacity:.4;cursor:not-allowed':''">+</button>
                </div>
                <div class="pn-item-price">
                  {{ Number(item.qty * Number(item.product.sale_price)).toLocaleString('fr-FR') }} MRU
                </div>
                <button @click="cartStore.removeItem(item.idx)" class="pn-item-del" title="Supprimer" aria-label="Supprimer"><Trash2 size="1em" /></button>
              </div>
            </div>
          </div>
        </div>

        <!-- Order summary + checkout -->
        <div class="pn-summary">
          <div style="background:white;border-radius:14px;border:1px solid #e5e7eb;overflow:hidden;">
            <div style="padding:18px;border-bottom:1px solid #f3f4f6;">
              <h3 style="font-weight:700;margin:0 0 14px;font-size:1rem;">Récapitulatif</h3>
              <div v-for="group in cartStore.byPharmacy" :key="group.pharmacyId" style="margin-bottom:10px;">
                <div style="font-size:.8rem;color:#6b7280;font-weight:600;margin-bottom:4px;">{{ group.pharmacyName }}</div>
                <div v-for="item in group.items" :key="item.idx" style="display:flex;justify-content:space-between;gap:10px;font-size:.85rem;margin-bottom:3px;">
                  <span style="min-width:0;overflow-wrap:anywhere;">{{ item.product.name }} ×{{ item.qty }}</span>
                  <span style="font-family:'JetBrains Mono',monospace;font-weight:600;white-space:nowrap;">{{ Number(item.qty*Number(item.product.sale_price)).toLocaleString('fr-FR') }} MRU</span>
                </div>
              </div>
              <div style="border-top:1px dashed #e5e7eb;margin-top:12px;padding-top:12px;display:flex;justify-content:space-between;font-weight:800;font-size:1.05rem;">
                <span>Total</span>
                <span style="color:#16a34a;font-family:'JetBrains Mono',monospace;">{{ Number(cartStore.totalAmount).toLocaleString('fr-FR') }} MRU</span>
              </div>
            </div>

            <div style="padding:18px;">
              <h3 style="font-weight:700;margin:0 0 14px;font-size:.95rem;">Vos coordonnées</h3>
              <div style="display:flex;flex-direction:column;gap:10px;">
                <div>
                  <label style="display:block;font-size:.78rem;font-weight:600;color:#374151;margin-bottom:4px;">Nom complet *</label>
                  <input v-model="form.name" style="width:100%;padding:9px 12px;border:1px solid #d1d5db;border-radius:8px;font-size:.875rem;outline:none;font-family:'Inter',sans-serif;box-sizing:border-box;" placeholder="Ex: Fatou Sarr" onfocus="this.style.borderColor='#16a34a'" onblur="this.style.borderColor='#d1d5db'"/>
                </div>
                <div>
                  <label style="display:block;font-size:.78rem;font-weight:600;color:#374151;margin-bottom:4px;">Téléphone *</label>
                  <input v-model="form.phone" type="tel" inputmode="tel" style="width:100%;padding:9px 12px;border:1px solid #d1d5db;border-radius:8px;font-size:.875rem;outline:none;font-family:'Inter',sans-serif;box-sizing:border-box;" placeholder="+222 22 00 00 00" onfocus="this.style.borderColor='#16a34a'" onblur="this.style.borderColor='#d1d5db'"/>
                </div>
                <div>
                  <label style="display:block;font-size:.78rem;font-weight:600;color:#374151;margin-bottom:4px;">Email (pour la confirmation)</label>
                  <input v-model="form.email" type="email" style="width:100%;padding:9px 12px;border:1px solid #d1d5db;border-radius:8px;font-size:.875rem;outline:none;font-family:'Inter',sans-serif;box-sizing:border-box;" placeholder="email@exemple.com" onfocus="this.style.borderColor='#16a34a'" onblur="this.style.borderColor='#d1d5db'"/>
                </div>
                <div>
                  <label style="display:block;font-size:.78rem;font-weight:600;color:#374151;margin-bottom:4px;">Note pour la pharmacie</label>
                  <textarea v-model="form.note" rows="2" style="width:100%;padding:9px 12px;border:1px solid #d1d5db;border-radius:8px;font-size:.875rem;outline:none;font-family:'Inter',sans-serif;box-sizing:border-box;resize:none;" placeholder="Heure de passage prévue, remarques..." onfocus="this.style.borderColor='#16a34a'" onblur="this.style.borderColor='#d1d5db'"></textarea>
                </div>
              </div>

              <div v-if="formError" style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:10px 12px;font-size:.85rem;color:#dc2626;margin-top:10px;"><CircleX size="1em" /> {{ formError }}</div>

              <button @click="placeOrder" :disabled="placing" style="width:100%;margin-top:16px;padding:13px;background:#16a34a;color:white;border:none;border-radius:10px;font-size:.95rem;font-weight:700;cursor:pointer;transition:background .12s;font-family:'Inter',sans-serif;" :style="placing?'opacity:.7;cursor:not-allowed':''" onmouseover="if(!this.disabled)this.style.background='#15803d'" onmouseout="this.style.background='#16a34a'">
                {{ placing ? 'Validation en cours...' : 'Confirmer la commande' }}
              </button>

              <div style="margin-top:12px;padding:10px;background:#f0fdf4;border-radius:8px;font-size:.78rem;color:#166534;line-height:1.6;">
                <Hospital size="1em" /> <strong>Retrait en pharmacie :</strong> Vous recevrez un code de confirmation. Présentez-le à la pharmacie pour récupérer et payer votre commande.
              </div>
            </div>
          </div>

          <button @click="cartStore.clearCart()" style="width:100%;margin-top:10px;padding:10px;background:transparent;color:#dc2626;border:1px solid #fecaca;border-radius:10px;font-size:.875rem;font-weight:600;cursor:pointer;transition:all .12s;" onmouseover="this.style.background='#fef2f2'" onmouseout="this.style.background='transparent'">
            <Trash2 size="1em" /> Vider le panier
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ShoppingCart, Hospital, Pill, Trash2, CircleX } from 'lucide-vue-next'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '../../stores/cart.js'
import { useToastStore } from '../../stores/toast.js'

const cartStore = useCartStore()
const toast     = useToastStore()
const router    = useRouter()

const placing   = ref(false)
const formError = ref('')
const form = ref({ name: '', phone: '', email: '', note: '' })

async function placeOrder() {
  formError.value = ''
  if (!form.value.name.trim())  { formError.value = 'Votre nom est obligatoire.'; return }
  if (!form.value.phone.trim()) { formError.value = 'Votre téléphone est obligatoire.'; return }

  placing.value = true
  try {
    // One order per pharmacy
    const orders = []
    for (const group of cartStore.byPharmacy) {
      const res = await cartStore.placeOrder({
        customerName:  form.value.name,
        customerPhone: form.value.phone,
        customerEmail: form.value.email,
        note:          form.value.note,
        pharmacyId:    group.pharmacyId,
        items: group.items.map(i => ({
          productId: i.product.id,
          quantity:  i.qty,
          price:     Number(i.product.sale_price),
        }))
      })
      orders.push(res.data)
    }

    cartStore.clearCart()
    // Redirect to confirmation with first order code
    // const code = orders[0]?.code || orders[0]?.id
    const code = orders[0]?.pickup_code
    router.push({ path: '/confirmation', query: { code } })
  } catch (e) {
    formError.value = e.message || 'Erreur lors de la validation. Réessayez.'
  } finally { placing.value = false }
}
</script>

<style scoped>
.pub-page { padding: 32px 0; }
.pn-title { font-weight: 800; font-size: 1.6rem; margin-bottom: 24px; display: flex; align-items: center; gap: 10px; }
.pn-empty { text-align: center; padding: 60px 20px; background: white; border-radius: 16px; border: 1px solid #e5e7eb; }
.pn-layout { display: grid; grid-template-columns: minmax(0, 1fr) 360px; gap: 24px; align-items: start; }
.pn-summary { position: sticky; top: 80px; }
.pn-items { padding: 12px 16px; display: flex; flex-direction: column; gap: 10px; }
.pn-item { display: flex; align-items: center; gap: 12px; padding: 12px; background: #f9fafb; border-radius: 10px; }
.pn-item-icon { width: 40px; height: 40px; border-radius: 10px; background: #f0fdf4; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; flex-shrink: 0; }
.pn-item-info { flex: 1; min-width: 0; overflow-wrap: anywhere; }
.pn-item-qty { display: flex; align-items: center; gap: 6px; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; flex-shrink: 0; background: #f9fafb; }
.pn-item-price { font-family: 'JetBrains Mono', monospace; font-weight: 700; color: #16a34a; min-width: 90px; text-align: right; white-space: nowrap; }
.pn-item-del { color: #dc2626; background: none; border: none; cursor: pointer; font-size: 1.1rem; padding: 4px; display: flex; flex-shrink: 0; }

@media (max-width: 900px) {
  .pn-layout { grid-template-columns: minmax(0, 1fr); gap: 16px; }
  .pn-summary { position: static; }
}
@media (max-width: 560px) {
  .pub-page { padding: 20px 0; }
  .pn-title { font-size: 1.3rem; margin-bottom: 16px; }
  .pn-empty { padding: 40px 16px; }
  .pn-items { padding: 10px; }
  /* Ligne article sur 2 niveaux : infos en haut, quantité + prix en bas */
  .pn-item {
    display: grid;
    grid-template-columns: 40px minmax(0, 1fr) auto;
    grid-template-areas: "icon info del" "qty qty price";
    gap: 10px;
    padding: 10px;
  }
  .pn-item-icon  { grid-area: icon; }
  .pn-item-info  { grid-area: info; }
  .pn-item-del   { grid-area: del; align-self: start; }
  .pn-item-qty   { grid-area: qty; justify-self: start; }
  .pn-item-price { grid-area: price; align-self: center; min-width: 0; }
}
</style>
