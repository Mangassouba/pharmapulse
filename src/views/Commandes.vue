<template>
  <div style="display:flex;flex-direction:column;gap:16px;">
    <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;">
      <div class="search-box" style="flex:1;max-width:280px;"><span class="search-icon">🔍</span><input v-model="search" class="inp" placeholder="Client..." @input="debouncedFetch"/></div>
      <div style="display:flex;gap:8px;"><select v-model="filterStatus" class="inp" style="width:155px;" @change="fetchData"><option value="">Tous statuts</option><option value="PENDING">En attente</option><option value="CONFIRMED">Confirmée</option><option value="SHIPPED">Expédiée</option><option value="DELIVERED">Livrée</option><option value="CANCELLED">Annulée</option></select><button class="btn btn-primary" @click="openAdd">+ Nouvelle commande</button></div>
    </div>
    <div class="card">
      <div v-if="loading" class="loading-box"><div class="spinner"></div></div>
      <div v-else class="tbl-wrap">
        <table class="tbl">
          <thead><tr><th>Date</th><th>Client</th><th>Articles</th><th>Total</th><th>Livraison</th><th>Statut</th><th>Actions</th></tr></thead>
          <tbody>
            <tr v-for="o in orders" :key="o.id">
              <td style="font-family:'JetBrains Mono',monospace;font-size:.8rem;color:#6b7280;">{{ store.fmt(o.order_date) }}</td>
              <td style="font-weight:600;">{{ o.customer }}</td>
              <td style="font-size:.8rem;color:#6b7280;">{{ o.details?.length ?? 0 }} art.</td>
              <td style="font-family:'JetBrains Mono',monospace;font-weight:700;color:#16a34a;">{{ Number(o.total_amount||0).toLocaleString('fr-FR') }} F</td>
              <td style="font-family:'JetBrains Mono',monospace;font-size:.8rem;color:#6b7280;">{{ o.delivery_date?store.fmt(o.delivery_date):'—' }}</td>
              <td><span class="badge" :class="{PENDING:'badge-yellow',CONFIRMED:'badge-blue',SHIPPED:'badge-purple',DELIVERED:'badge-green',CANCELLED:'badge-red'}[o.status]">{{ {PENDING:'EN ATTENTE',CONFIRMED:'CONFIRMÉE',SHIPPED:'EXPÉDIÉE',DELIVERED:'LIVRÉE',CANCELLED:'ANNULÉE'}[o.status] }}</span></td>
              <td>
                <div style="display:flex;gap:5px;" v-if="o.status!=='CANCELLED'&&o.status!=='DELIVERED'">
                  <select class="inp" style="width:140px;font-size:.78px;padding:4px 8px;" @change="updateStatus(o,$event.target.value)"><option value="">Changer statut...</option><option v-for="s in nextStatuses(o.status)" :key="s.v" :value="s.v">{{ s.l }}</option></select>
                  <button v-if="o.status==='PENDING'" class="btn btn-danger btn-xs" @click="cancelOrder(o)">✕</button>
                </div>
              </td>
            </tr>
            <tr v-if="!orders.length"><td colspan="7" style="text-align:center;padding:28px;color:#6b7280;">Aucune commande</td></tr>
          </tbody>
        </table>
      </div>
      <div v-if="meta.totalPages>1" class="pagination">
        <button class="page-btn" @click="page--;fetchData()" :disabled="page===1">‹</button>
        <span style="font-size:.85rem;color:#6b7280;">{{ page }} / {{ meta.totalPages }}</span>
        <button class="page-btn" @click="page++;fetchData()" :disabled="page>=meta.totalPages">›</button>
      </div>
    </div>
    <Teleport to="body">
      <div v-if="showModal" class="modal-bg" @click.self="showModal=false">
        <div class="modal">
          <div class="modal-hd"><h3>Nouvelle commande</h3><button class="btn btn-icon" @click="showModal=false">✕</button></div>
          <div class="modal-bd">
            <div class="form-grid form-2col" style="gap:12px;margin-bottom:14px;">
              <div><label class="lbl">Client *</label><input v-model="form.customer" class="inp"/></div>
              <div><label class="lbl">Téléphone</label><input v-model="form.customer_phone" class="inp"/></div>
              <div><label class="lbl">Email</label><input v-model="form.customer_email" class="inp" type="email"/></div>
              <div><label class="lbl">Date livraison</label><input v-model="form.delivery_date" type="date" class="inp"/></div>
            </div>
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;"><span style="font-weight:600;font-size:.875rem;">Articles</span><button class="btn btn-outline btn-sm" @click="form.items.push({productId:'',quantity:1,price:0})">+</button></div>
            <div v-for="(item,i) in form.items" :key="i" style="display:flex;gap:8px;margin-bottom:8px;align-items:flex-end;">
              <div style="flex:2;"><select v-model="item.productId" class="inp" @change="autofillPrice(item)"><option value="">— Produit —</option><option v-for="p in store.products" :key="p.id" :value="p.id">{{ p.name }}</option></select></div>
              <div style="width:75px;"><input v-model.number="item.quantity" type="number" min="1" class="inp" placeholder="Qté"/></div>
              <div style="width:100px;"><input v-model.number="item.price" type="number" min="0" class="inp" placeholder="Prix"/></div>
              <button class="btn btn-icon" @click="form.items.splice(i,1)" style="border-color:#fecaca;">✕</button>
            </div>
            <div style="text-align:right;font-family:'JetBrains Mono',monospace;font-weight:700;color:#16a34a;margin-top:8px;">Total : {{ Number(formTotal).toLocaleString('fr-FR') }} F</div>
            <div v-if="formErr" class="alert alert-red" style="margin-top:10px;">❌ {{ formErr }}</div>
          </div>
          <div class="modal-ft"><button class="btn btn-outline" @click="showModal=false">Annuler</button><button class="btn btn-primary" @click="save" :disabled="saving">{{ saving?'...':'Créer la commande' }}</button></div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
<script setup>
import { ref, computed, onMounted } from 'vue'
import { usePharmaStore } from '../stores/pharma.js'
import { useToastStore }  from '../stores/toast.js'
import { orderApi } from '../services/api.js'
const store=usePharmaStore(); const toast=useToastStore()
const orders=ref([]); const meta=ref({totalPages:1}); const loading=ref(false)
const search=ref(''); const filterStatus=ref(''); const page=ref(1); const showModal=ref(false); const saving=ref(false); const formErr=ref('')
const form=ref({customer:'',customer_phone:'',customer_email:'',delivery_date:'',items:[{productId:'',quantity:1,price:0}]})
const formTotal=computed(()=>form.value.items.reduce((s,i)=>s+(i.quantity||0)*(i.price||0),0))
const nextStatuses=s=>({PENDING:[{v:'CONFIRMED',l:'Confirmer'},{v:'SHIPPED',l:'Expédier'}],CONFIRMED:[{v:'SHIPPED',l:'Expédier'}],SHIPPED:[{v:'DELIVERED',l:'Livré'}]}[s]||[])
function autofillPrice(item){const p=store.products.find(p=>p.id===item.productId);if(p)item.price=Number(p.sale_price)}
let dt; function debouncedFetch(){clearTimeout(dt);dt=setTimeout(fetchData,380)}
async function fetchData(){loading.value=true;try{const r=await orderApi.list({page:page.value,pageSize:20,status:filterStatus.value||undefined,search:search.value||undefined});orders.value=r.data;meta.value=r.meta}catch(e){toast.error(e.message)}finally{loading.value=false}}
function openAdd(){form.value={customer:'',customer_phone:'',customer_email:'',delivery_date:'',items:[{productId:'',quantity:1,price:0}]};formErr.value='';showModal.value=true}
async function save(){formErr.value='';if(!form.value.customer.trim()){formErr.value='Client requis';return}const items=form.value.items.filter(i=>i.productId&&i.quantity>0);if(!items.length){formErr.value='Au moins un article';return}saving.value=true;try{await orderApi.create({...form.value,items});toast.success('Commande créée.');showModal.value=false;fetchData()}catch(e){formErr.value=e.message}finally{saving.value=false}}
async function updateStatus(o,status){if(!status)return;try{await orderApi.updateStatus(o.id,{status});toast.success('Statut mis à jour.');fetchData()}catch(e){toast.error(e.message)}}
async function cancelOrder(o){try{await orderApi.delete(o.id);toast.success('Annulée.');fetchData()}catch(e){toast.error(e.message)}}
onMounted(async()=>{await store.fetchProducts({pageSize:100});fetchData()})
</script>
