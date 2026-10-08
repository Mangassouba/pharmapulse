<template>
  <Teleport to="body">
    <div v-if="sale" class="modal-bg" @click.self="$emit('close')">
      <div class="modal" style="max-width:420px;">
        <div class="modal-hd">
          <h3><Receipt size="1em" /> {{ title || $t('receipt.title') }}</h3>
          <button class="btn btn-icon" @click="$emit('close')"><X size="1em" /></button>
        </div>
        <div class="modal-bd" style="background:#f3f4f6;display:flex;justify-content:center;">
          <div ref="ticket" class="ticket">
            <div class="t-center">
              <img v-if="logoUrl" :src="logoUrl" alt="" class="t-logo"/>
              <div class="t-shop">{{ pharmacy?.name || $t('receipt.pharmacy') }}</div>
              <div v-if="pharmacyLine" class="t-muted">{{ pharmacyLine }}</div>
              <div v-if="pharmacy?.phone" class="t-muted">{{ $t('receipt.phone') }} {{ pharmacy.phone }}</div>
            </div>
            <div class="t-sep"></div>
            <div v-if="subtitle" class="t-center" style="font-weight:700;margin-bottom:4px;">{{ subtitle }}</div>
            <div class="t-row"><span>{{ $t('receipt.number') }}</span><span class="t-mono">{{ sale.invoice_number }}</span></div>
            <div v-if="sale.pickup_code" class="t-row"><span>{{ $t('receipt.pickupCode') }}</span><span class="t-mono">{{ sale.pickup_code }}</span></div>
            <div v-if="sale.order_date" class="t-row"><span>{{ $t('receipt.orderedOn') }}</span><span>{{ fmtDate(sale.order_date) }}</span></div>
            <div class="t-row"><span>{{ sale.order_date ? $t('receipt.pickedUpOn') : $t('common.date') }}</span><span>{{ fmtDate(sale.sale_date) }}</span></div>
            <div class="t-row"><span>{{ $t('common.customer') }}</span><span>{{ sale.customer || $t('receipt.walkIn') }}</span></div>
            <div v-if="sale.user?.name" class="t-row"><span>{{ $t('receipt.seller') }}</span><span>{{ sale.user.name }}</span></div>
            <div class="t-sep"></div>
            <table class="t-items">
              <thead><tr><th style="text-align:start;">{{ $t('receipt.item') }}</th><th>{{ $t('common.qtyShort') }}</th><th style="text-align:end;">{{ $t('common.total') }}</th></tr></thead>
              <tbody>
                <template v-for="d in sale.details" :key="d.id">
                  <tr><td colspan="3" class="t-item-name">{{ d.product?.name || $t('common.product') }}</td></tr>
                  <tr class="t-item-line">
                    <td class="t-muted">{{ money(d.price) }} × {{ Number(d.quantity) }}</td>
                    <td></td>
                    <td style="text-align:end;" class="t-mono">{{ money(d.total ?? d.price * d.quantity) }}</td>
                  </tr>
                </template>
              </tbody>
            </table>
            <div class="t-sep"></div>
            <div class="t-row"><span>{{ $t('receipt.subtotal') }}</span><span class="t-mono">{{ money(subtotal) }}</span></div>
            <div v-if="Number(sale.discount) > 0" class="t-row"><span>{{ $t('receipt.discount') }}</span><span class="t-mono">−{{ money(sale.discount) }}</span></div>
            <div v-if="Number(sale.tax) > 0" class="t-row"><span>{{ $t('receipt.tax') }}</span><span class="t-mono">{{ money(sale.tax) }}</span></div>
            <div class="t-row t-total"><span>{{ $t('receipt.totalCaps') }}</span><span class="t-mono">{{ money(sale.total_amount) }}</span></div>
            <div v-if="sale.payment_method" class="t-row"><span>{{ $t('receipt.payment') }}</span><span>{{ $te('paymentMethods', sale.payment_method) }}</span></div>
            <div class="t-sep"></div>
            <div class="t-center t-muted">{{ $t('receipt.thanks') }}<br/>{{ $t('receipt.keep') }}</div>
          </div>
        </div>
        <div class="modal-ft">
          <button class="btn btn-outline" @click="$emit('close')">{{ $t('common.close') }}</button>
          <button class="btn btn-primary" @click="print"><Printer size="1em" /> {{ $t('common.print') }}</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { Receipt, Printer, X } from 'lucide-vue-next'
import { ref, computed } from 'vue'
import { useAuthStore } from '../stores/auth.js'
import { pharmacyLogoUrl } from '../utils/logo.js'
import { t, fmtNum, fmtDateTime, locale, isRtl } from '../i18n/index.js'

// `sale` : une vente, ou une commande en ligne ramenée au même format (voir CommandesEnLigne.vue)
const props = defineProps({
  sale:     { type: Object, default: null },
  title:    { type: String, default: '' }, // défaut : t('receipt.title')
  subtitle: { type: String, default: '' },
})
defineEmits(['close'])

const auth     = useAuthStore()
const ticket   = ref(null)
const pharmacy = computed(() => auth.user?.pharmacy)
const logoUrl  = computed(() => pharmacyLogoUrl(pharmacy.value))
const pharmacyLine = computed(() => [pharmacy.value?.address, pharmacy.value?.city].filter(Boolean).join(', '))
const subtotal = computed(() => (props.sale?.details || []).reduce((s, d) => s + Number(d.total ?? d.price * d.quantity), 0))

const money   = v => `${fmtNum(v, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MRU`
const fmtDate = d => fmtDateTime(d || new Date(), { dateStyle: 'short', timeStyle: 'short' })

// Imprime uniquement le ticket, dans une iframe isolée des styles de l'application
function print() {
  const frame = document.createElement('iframe')
  frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;'
  document.body.appendChild(frame)
  const doc = frame.contentDocument
  doc.open()
  doc.write(`<!doctype html><html lang="${locale.value}" dir="${isRtl() ? 'rtl' : 'ltr'}"><head><meta charset="utf-8"><title>${t('receipt.short')} ${props.sale.invoice_number}</title>
    <style>@page{size:80mm auto;margin:4mm}body{margin:0}${TICKET_CSS}</style></head>
    <body>${ticket.value.outerHTML}</body></html>`)
  doc.close()
  frame.contentWindow.focus()
  // Wait for the logo (if any) so it is not missing from the printed ticket
  const images = [...doc.images].map(img => img.complete ? null : new Promise(r => { img.onload = img.onerror = r }))
  Promise.all(images).then(() => setTimeout(() => {
    frame.contentWindow.print()
    setTimeout(() => frame.remove(), 1000)
  }, 100))
}

const TICKET_CSS = `
.ticket{width:72mm;background:#fff;color:#111;font-family:'Courier New',monospace;font-size:12px;line-height:1.45;padding:12px;box-sizing:border-box}
.t-center{text-align:center}
.t-shop{font-size:15px;font-weight:700;text-transform:uppercase;margin-bottom:2px}
.t-logo{display:block;max-width:40mm;max-height:20mm;margin:0 auto 6px;object-fit:contain}
.t-muted{color:#555;font-size:11px}
.t-mono{font-family:'Courier New',monospace;white-space:nowrap}
.t-sep{border-top:1px dashed #999;margin:8px 0}
.t-row{display:flex;justify-content:space-between;gap:8px}
.t-row span:last-child{text-align:end}
.t-total{font-size:15px;font-weight:700;margin:4px 0}
.t-items{width:100%;border-collapse:collapse;font-size:12px}
.t-items th{font-size:11px;font-weight:700;border-bottom:1px solid #ccc;padding-bottom:3px}
.t-item-name{font-weight:700;padding-top:4px}
`
</script>

<style>
.ticket{width:72mm;background:#fff;color:#111;font-family:'Courier New',monospace;font-size:12px;line-height:1.45;padding:12px;box-sizing:border-box;box-shadow:0 2px 10px rgba(0,0,0,.12)}
.ticket .t-center{text-align:center}
.ticket .t-shop{font-size:15px;font-weight:700;text-transform:uppercase;margin-bottom:2px}
.ticket .t-logo{display:block;max-width:40mm;max-height:20mm;margin:0 auto 6px;object-fit:contain}
.ticket .t-muted{color:#555;font-size:11px}
.ticket .t-mono{font-family:'Courier New',monospace;white-space:nowrap}
.ticket .t-sep{border-top:1px dashed #999;margin:8px 0}
.ticket .t-row{display:flex;justify-content:space-between;gap:8px}
.ticket .t-row span:last-child{text-align:end}
.ticket .t-total{font-size:15px;font-weight:700;margin:4px 0}
.ticket .t-items{width:100%;border-collapse:collapse;font-size:12px}
.ticket .t-items th{font-size:11px;font-weight:700;border-bottom:1px solid #ccc;padding-bottom:3px}
.ticket .t-item-name{font-weight:700;padding-top:4px}
</style>
