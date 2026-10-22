<template>
  <div style="display:grid;grid-template-columns:1fr 300px;grid-template-rows:auto auto;gap:16px;">
    <!-- Catalogue -->
    <div class="card" style="display:flex;flex-direction:column;height:80vh;overflow:hidden;">
      <div style="padding:12px;border-bottom:1px solid #f3f4f6;">
        <div class="search-box"><span class="search-icon"><Search size="1em" /></span><input v-model="search" class="inp" :placeholder="$t('sales.searchPh')" @input="debouncedFetch"/></div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px;">
          <button v-for="c in [{id:'',name:$t('common.all')}, ...store.categories]" :key="c.id" @click="filterCat=c.id;fetchProds()" :class="filterCat===c.id?'btn btn-primary btn-xs':'btn btn-outline btn-xs'">{{ c.name }}</button>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;padding:12px;overflow-y:auto;flex:1;">
        <div v-if="store.isBusy('prods')" style="grid-column:1/-1;" class="loading-box"><div class="spinner"></div></div>
        <div v-for="p in store.products" :key="p.id" @click="p.stock>0&&addToCart(p)" :style="`border:1px solid ${p.stock===0?'#fecaca':'#e5e7eb'};border-radius:10px;padding:12px;cursor:${p.stock===0?'not-allowed':'pointer'};background:#fff;opacity:${p.stock===0?.5:1};transition:box-shadow .12s;min-width:0;overflow-wrap:anywhere;`" onmouseover="if(this.style.opacity!=='0.5')this.style.boxShadow='0 4px 12px rgba(0,0,0,.1)'" onmouseout="this.style.boxShadow='none'">
          <div style="display:flex;justify-content:center;margin-bottom:8px;"><ProductImage :product="p" :size="64"/></div>
          <!-- flex-wrap: a long multi-unit stock badge drops below the name instead of squeezing it -->
          <div style="display:flex;flex-wrap:wrap;align-items:flex-start;justify-content:space-between;gap:4px;margin-bottom:8px;">
            <div style="flex:1 1 7rem;min-width:0;"><div style="font-weight:700;font-size:.82rem;line-height:1.3;">{{ p.name }}</div><div style="font-size:.7rem;color:#6b7280;margin-top:2px;">{{ p.category?.name }}</div></div>
            <span class="badge" :class="p.stock===0?'badge-red':p.stock<p.threshold?'badge-yellow':'badge-green'" style="font-size:.62rem;max-width:100%;white-space:normal;border-radius:8px;">{{ p.stock===0?'0':fmtStock(p) }}</span>
          </div>
          <div style="font-family:'JetBrains Mono',monospace;font-weight:700;color:#16a34a;font-size:.9rem;">{{ fmtMoney(p.sale_price) }}<span v-if="sellableUnits(p).length>1" style="font-family:inherit;font-weight:500;font-size:.7rem;color:#6b7280;"> / {{ $te('unitTypes', mainUnitOf(p).unit) }}</span></div>
          <!-- Vente au détail : un bouton par autre unité vendue (plaquette, comprimé…) -->
          <div v-if="sellableUnits(p).length>1&&p.stock>0" style="display:flex;flex-wrap:wrap;gap:4px;margin-top:6px;">
            <button v-for="u in sellableUnits(p).filter(u=>!u.is_main)" :key="u.unit" class="btn btn-outline btn-xs" style="white-space:normal;text-align:start;max-width:100%;" @click.stop="addToCart(p,u)">+ {{ $te('unitTypes', u.unit) }} · {{ fmtMoney(unitPrice(p,u)) }}</button>
          </div>
        </div>
        <div v-if="!store.products.length&&!store.isBusy('prods')" style="grid-column:1/-1;text-align:center;padding:28px;color:#6b7280;">{{ $t('products.none') }}</div>
      </div>
    </div>

    <!-- Cart -->
    <div class="card" style="display:flex;flex-direction:column;height:80vh;position:sticky;top:76px;">
      <div style="padding:12px 14px;border-bottom:1px solid #f3f4f6;display:flex;align-items:center;justify-content:space-between;"><span style="font-weight:700;"><ShoppingCart size="1em" /> {{ $t('pub.cart') }}</span><button v-if="cart.length" class="btn btn-icon" @click="cart=[]"><Trash2 size="1em" /></button></div>
      <div style="padding:12px;">
        <label class="lbl">{{ $t('common.customer') }}</label><input v-model="client" class="inp" :placeholder="$t('sales.customerName')" style="margin-bottom:8px;"/>
        <div style="display:flex;gap:8px;"><div style="flex:1;"><label class="lbl">{{ $t('receipt.payment') }}</label><select v-model="paymentMethod" class="inp"><option v-for="m in ['CASH','CARD','TRANSFER','INSURANCE']" :key="m" :value="m">{{ $t('paymentMethods.' + m) }}</option></select></div><div style="width:100px;"><label class="lbl">{{ $t('sales.discountCurrency', { currency: currentCurrency() }) }}</label><input v-model.number="discount" type="number" min="0" class="inp"/></div></div>
      </div>
      <div style="flex:1;overflow-y:auto;padding:0 12px;">
        <div v-if="!cart.length" style="text-align:center;padding:24px;color:#6b7280;font-size:.85rem;">{{ $t('sales.clickProduct') }}</div>
        <div v-for="(item,i) in cart" :key="item.key" style="border:1px solid #f3f4f6;border-radius:8px;padding:10px;margin-bottom:8px;">
          <div style="font-weight:600;font-size:.875rem;margin-bottom:6px;">{{ item.name }}<span v-if="item.showUnit" style="font-weight:400;font-size:.75rem;color:#6b7280;"> · {{ $te('unitTypes', item.unit) }} ({{ fmtMoney(item.price) }})</span></div>
          <div style="display:flex;align-items:center;justify-content:space-between;">
            <div style="display:flex;align-items:center;gap:6px;">
              <button @click="decQ(i)" style="width:26px;height:26px;border-radius:6px;border:1px solid #e5e7eb;background:#f9fafb;cursor:pointer;font-weight:700;">−</button>
              <span style="font-family:'JetBrains Mono',monospace;font-weight:700;min-width:20px;text-align:center;">{{ item.qty }}</span>
              <button @click="incQ(i)" style="width:26px;height:26px;border-radius:6px;border:1px solid #e5e7eb;background:#f9fafb;cursor:pointer;font-weight:700;">+</button>
            </div>
            <div style="font-family:'JetBrains Mono',monospace;font-weight:700;color:#16a34a;">{{ fmtMoney(item.qty*item.price) }}</div>
            <button class="btn btn-icon" @click="cart.splice(i,1)" style="border-color:#fecaca;width:24px;height:24px;font-size:.7rem;"><X size="1em" /></button>
          </div>
        </div>
      </div>
      <div style="padding:12px;border-top:1px solid #f3f4f6;">
        <div style="display:flex;justify-content:space-between;font-size:.875rem;color:#6b7280;margin-bottom:4px;"><span>{{ $t('receipt.subtotal') }}</span><span style="font-family:'JetBrains Mono',monospace;">{{ fmtMoney(subtotal) }}</span></div>
        <div v-if="discount>0" style="display:flex;justify-content:space-between;font-size:.875rem;color:#dc2626;margin-bottom:4px;"><span>{{ $t('receipt.discount') }}</span><span style="font-family:'JetBrains Mono',monospace;">−{{ fmtMoney(discount) }}</span></div>
        <div style="display:flex;justify-content:space-between;font-weight:700;padding-top:8px;border-top:1px dashed #e5e7eb;"><span>{{ $t('common.total') }}</span><span style="font-family:'JetBrains Mono',monospace;font-size:1.2rem;color:#16a34a;">{{ fmtMoney(total) }}</span></div>
      </div>
      <div style="padding:10px 12px;display:flex;gap:8px;">
        <button class="btn btn-outline btn-sm" @click="cart=[]" :disabled="!cart.length">{{ $t('common.cancel') }}</button>
        <button class="btn btn-primary" style="flex:1;justify-content:center;" @click="confirmSale" :disabled="!cart.length||saving">{{ saving?'...':$t('common.validate') }}</button>
      </div>
    </div>

    <!-- Historique -->
    <div class="card" style="grid-column:1;">
      <div style="padding:14px 18px;border-bottom:1px solid #f3f4f6;display:flex;align-items:center;justify-content:space-between;"><h3 style="font-weight:700;margin:0;font-size:.95rem;">{{ $t('sales.history') }}</h3><span style="font-family:'JetBrains Mono',monospace;font-size:.8rem;color:#16a34a;font-weight:700;">{{ $t('sales.totalRevenue') }} {{ fmtMoney(caTotal) }}</span></div>
      <div v-if="store.isBusy('sales')" class="loading-box"><div class="spinner"></div></div>
      <div v-else class="tbl-wrap">
        <table class="tbl">
          <thead><tr><th>{{ $t('common.date') }}</th><th>{{ $t('sales.invoice') }}</th><th>{{ $t('common.customer') }}</th><th>{{ $t('receipt.payment') }}</th><th>{{ $t('common.items') }}</th><th style="text-align:end;">{{ $t('common.total') }}</th><th></th></tr></thead>
          <tbody>
            <tr v-for="s in store.sales" :key="s.id">
              <td style="font-family:'JetBrains Mono',monospace;font-size:.8rem;color:#6b7280;">{{ store.fmt(s.sale_date) }}</td>
              <td style="font-family:'JetBrains Mono',monospace;font-size:.78rem;color:#2563eb;">{{ s.invoice_number }}<span v-if="s.invoice_number?.startsWith('CMD-')" class="badge badge-green" style="font-size:.6rem;margin-inline-start:6px;font-family:inherit;"><Globe size="1em" /> {{ $t('sales.online') }}</span></td>
              <td>{{ s.customer || $t('sales.counter') }}</td>
              <td><span class="badge badge-blue" style="font-size:.65rem;">{{ $te('paymentMethods', s.payment_method) }}</span></td>
              <td style="font-size:.8rem;color:#6b7280;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ s.details?.map(d=>d.product?.name).join(', ') }}</td>
              <td style="text-align:end;font-family:'JetBrains Mono',monospace;font-weight:700;color:#16a34a;">{{ fmtMoney(s.total_amount) }}</td>
              <td style="text-align:end;"><button class="btn btn-outline btn-xs" @click="receiptSale=s" :title="$t('sales.receiptTitle')"><Printer size="1em" /> {{ $t('receipt.short') }}</button></td>
            </tr>
            <tr v-if="!store.sales.length"><td colspan="7" style="text-align:center;padding:24px;color:#6b7280;">{{ $t('sales.none') }}</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <SaleReceipt :sale="receiptSale" @close="receiptSale=null" />
  </div>
</template>
<script setup>
import { Search, ShoppingCart, Trash2, X, Printer, Globe } from 'lucide-vue-next'
import SaleReceipt from '../components/SaleReceipt.vue'
import ProductImage from '../components/ProductImage.vue'
import { ref, computed, onMounted } from 'vue'
import { usePharmaStore } from '../stores/pharma.js'
import { useToastStore }  from '../stores/toast.js'
import { saleApi } from '../services/api.js'
import { t } from '../i18n/index.js'
import { fmtMoney, currentCurrency } from '../utils/money.js'
import { fmtStock, mainUnitOf, sellableUnits, unitPrice } from '../utils/units.js'
const store=usePharmaStore(); const toast=useToastStore()
const search=ref(''); const filterCat=ref(''); const cart=ref([]); const client=ref(''); const paymentMethod=ref('CASH'); const discount=ref(0); const saving=ref(false); const caTotal=ref(0); const receiptSale=ref(null)
const subtotal = computed(() => cart.value.reduce((s,i)=>s+i.qty*i.price,0))
const total    = computed(() => Math.max(0,subtotal.value-discount.value))
// Une ligne par produit et par unité (1 boîte + 2 plaquettes = 2 lignes) ; size = unités de base dans l'unité.
// Le stock (en unités de base) est vérifié sur toutes les lignes du produit.
const usedStock = pid => cart.value.filter(i=>i.pid===pid).reduce((s,i)=>s+i.qty*i.size,0)
const fits = (p, size) => usedStock(p.id) + size <= Number(p.stock)
function addToCart(p, u=mainUnitOf(p)) {
  if(!fits(p,u.base_quantity)){toast.warning(t('sales.insufficientStock'));return}
  const key=`${p.id}:${u.unit}`; const ex=cart.value.find(i=>i.key===key)
  if(ex) ex.qty++
  else cart.value.push({key,pid:p.id,name:p.name,unit:u.unit,size:u.base_quantity,price:unitPrice(p,u),qty:1,showUnit:sellableUnits(p).length>1})
}
function incQ(i) { const it=cart.value[i]; const p=store.products.find(p=>p.id===it.pid); if(!p||!fits(p,it.size)){toast.warning(t('sales.maxStock'));return}; it.qty++ }
function decQ(i) { if(cart.value[i].qty<=1)cart.value.splice(i,1); else cart.value[i].qty-- }
let dt; function debouncedFetch(){clearTimeout(dt);dt=setTimeout(fetchProds,350)}
async function fetchProds() { await store.fetchProducts({pageSize:100,search:search.value||undefined,categoryId:filterCat.value||undefined}) }
async function fetchSales() { await store.fetchSales({pageSize:20}); try{const r=await saleApi.stats();caTotal.value=r.data?.caMonth??0}catch{} }
async function confirmSale() {
  if(!cart.value.length)return; saving.value=true
  try { const r=await store.createSale({items:cart.value.map(i=>({productId:i.pid,quantity:i.qty,price:i.price,unit:i.unit})),customer:client.value||t('receipt.walkIn'),payment_method:paymentMethod.value,discount:discount.value}); receiptSale.value=r.data; toast.success(`${t('sales.saved')} — ${fmtMoney(total.value)}`); cart.value=[]; client.value=''; discount.value=0; fetchSales() } catch(e){toast.error(e.message)} finally{saving.value=false}
}
onMounted(async()=>{await store.fetchCategories(); await Promise.all([fetchProds(),fetchSales()])})
</script>
