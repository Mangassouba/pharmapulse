<template>
  <div style="display:flex;flex-direction:column;gap:16px;">
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;">
      <div class="card card-p"><div style="font-size:1.5rem;font-weight:800;font-family:'JetBrains Mono',monospace;color:#2563eb;">{{ store.recepMeta.total }}</div><div style="font-size:.78rem;color:#6b7280;">Total réceptions</div></div>
      <div class="card card-p"><div style="font-size:1.5rem;font-weight:800;font-family:'JetBrains Mono',monospace;color:#16a34a;">{{ completed }}</div><div style="font-size:.78rem;color:#6b7280;">Complétées</div></div>
      <div class="card card-p"><div style="font-size:1.5rem;font-weight:800;font-family:'JetBrains Mono',monospace;color:#ca8a04;">{{ pending }}</div><div style="font-size:.78rem;color:#6b7280;">En attente</div></div>
    </div>
    <!-- Form -->
    <div class="card card-p">
      <h3 style="font-weight:700;margin:0 0 16px;">📥 Enregistrer une réception</h3>
      <div class="form-grid form-2col" style="max-width:700px;gap:12px;margin-bottom:14px;">
        <div><label class="lbl">Fournisseur *</label><input v-model="form.supplier" class="inp" placeholder="Ex: Pharmagroupe" list="sup-list"/><datalist id="sup-list"><option v-for="s in suppliers" :key="s" :value="s"/></datalist></div>
        <div><label class="lbl">N° Facture</label><input v-model="form.invoice_number" class="inp" placeholder="FAC-2024-XXXX"/></div>
      </div>
      <!-- Items -->
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;"><span style="font-weight:600;font-size:.9rem;">Articles</span><button class="btn btn-outline btn-sm" @click="addItem">+ Ajouter</button></div>
      <div v-for="(item,i) in form.items" :key="i" style="display:flex;gap:10px;align-items:flex-end;flex-wrap:wrap;padding:12px;background:#f9fafb;border-radius:9px;border:1px solid #f3f4f6;margin-bottom:8px;">
        <div style="flex:2;min-width:180px;"><label class="lbl">Produit *</label><select v-model="item.productId" class="inp"><option value="">— Choisir —</option><option v-for="p in store.products" :key="p.id" :value="p.id">{{ p.name }} ({{ p.stock }}u)</option></select></div>
        <div style="width:80px;"><label class="lbl">Qté *</label><input v-model.number="item.quantity" type="number" min="1" class="inp"/></div>
        <div style="width:110px;"><label class="lbl">Prix achat (F)</label><input v-model.number="item.price" type="number" min="0" class="inp"/></div>
        <div style="width:120px;"><label class="lbl">N° Lot</label><input v-model="item.batchNumber" class="inp"/></div>
        <div style="width:140px;"><label class="lbl">Date péremption</label><input v-model="item.expirationDate" type="date" class="inp"/></div>
        <button class="btn btn-icon" @click="form.items.splice(i,1)" style="border-color:#fecaca;">✕</button>
      </div>
      <div v-if="formTotal>0" style="padding:12px;background:#f0fdf4;border-radius:8px;display:flex;justify-content:space-between;font-size:.875rem;"><span>Total estimé</span><strong style="color:#16a34a;font-family:'JetBrains Mono',monospace;">{{ Number(formTotal).toLocaleString('fr-FR') }} F</strong></div>
      <div v-if="formErr" class="alert alert-red" style="margin-top:12px;">❌ {{ formErr }}</div>
      <button class="btn btn-primary" style="margin-top:14px;" @click="save" :disabled="saving">{{ saving?'Enregistrement...':'📥 Enregistrer la réception' }}</button>
    </div>
    <!-- History -->
    <div class="card">
      <div style="padding:14px 18px;border-bottom:1px solid #f3f4f6;display:flex;align-items:center;justify-content:space-between;"><h3 style="font-weight:700;margin:0;font-size:.95rem;">Historique</h3><select v-model="filterStatus" class="inp" style="width:150px;" @change="fetchData"><option value="">Tous</option><option value="PENDING">En attente</option><option value="COMPLETED">Complétées</option><option value="CANCELLED">Annulées</option></select></div>
      <div v-if="store.isBusy('recep')" class="loading-box"><div class="spinner"></div></div>
      <div v-else class="tbl-wrap">
        <table class="tbl">
          <thead><tr><th>Date</th><th>Fournisseur</th><th>Articles</th><th>Total</th><th>Statut</th><th>Actions</th></tr></thead>
          <tbody>
            <tr v-for="r in store.receptions" :key="r.id">
              <td style="font-family:'JetBrains Mono',monospace;font-size:.8rem;color:#6b7280;">{{ store.fmt(r.reception_date) }}</td>
              <td style="font-weight:600;">{{ r.supplier }}</td>
              <td style="font-size:.8rem;color:#6b7280;">{{ r.details?.length ?? 0 }} produit(s)</td>
              <td style="font-family:'JetBrains Mono',monospace;font-weight:700;color:#16a34a;">{{ Number(r.total_amount||0).toLocaleString('fr-FR') }} F</td>
              <td><span class="badge" :class="r.status==='COMPLETED'?'badge-green':r.status==='PENDING'?'badge-yellow':'badge-red'">{{ {COMPLETED:'COMPLÉTÉE',PENDING:'EN ATTENTE',PARTIAL:'PARTIELLE',CANCELLED:'ANNULÉE'}[r.status] }}</span></td>
              <td>
                <div style="display:flex;gap:5px;" v-if="r.status==='PENDING'">
                  <button class="btn btn-primary btn-sm" @click="complete(r,'COMPLETED')">✅ Valider</button>
                  <button class="btn btn-outline btn-sm" @click="complete(r,'PARTIAL')">Partielle</button>
                  <button class="btn btn-danger btn-sm" @click="complete(r,'CANCELLED')">✕</button>
                </div>
                <span v-else style="font-size:.8rem;color:#6b7280;">—</span>
              </td>
            </tr>
            <tr v-if="!store.receptions.length"><td colspan="6" style="text-align:center;padding:28px;color:#6b7280;">Aucune réception</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, computed, onMounted } from 'vue'
import { usePharmaStore } from '../stores/pharma.js'
import { useToastStore }  from '../stores/toast.js'
const store=usePharmaStore(); const toast=useToastStore()
const saving=ref(false); const formErr=ref(''); const filterStatus=ref('')
const suppliers=['Pharmagroupe Sénégal','MedDist Dakar','SanofiDist','CAMES Pharma','LABOREX']
const emptyItem = () => ({ productId:'',quantity:1,price:0,batchNumber:'',expirationDate:'' })
const form = ref({ supplier:'', invoice_number:'', items:[emptyItem()] })
const completed = computed(() => store.receptions.filter(r=>r.status==='COMPLETED').length)
const pending   = computed(() => store.receptions.filter(r=>r.status==='PENDING').length)
const formTotal = computed(() => form.value.items.reduce((s,i)=>s+(i.quantity||0)*(i.price||0),0))
function addItem() { form.value.items.push(emptyItem()) }
async function fetchData() { await store.fetchReceptions({ status:filterStatus.value||undefined, pageSize:20 }) }
async function save() {
  formErr.value=''
  if (!form.value.supplier.trim()) { formErr.value='Fournisseur obligatoire'; return }
  const items=form.value.items.filter(i=>i.productId&&i.quantity>0)
  if (!items.length) { formErr.value='Ajoutez au moins un produit'; return }
  saving.value=true
  try { await store.createReception({...form.value,items}); toast.success('Réception enregistrée !'); form.value={supplier:'',invoice_number:'',items:[emptyItem()]}; fetchData() } catch(e) { formErr.value=e.message } finally { saving.value=false }
}
async function complete(r,status) {
  try { await store.completeReception(r.id,status); toast.success(status==='COMPLETED'?'Stocks mis à jour !':status==='CANCELLED'?'Annulée':'Partielle enregistrée'); fetchData() } catch(e) { toast.error(e.message) }
}
onMounted(async () => { await store.fetchProducts({pageSize:100}); fetchData() })
</script>
