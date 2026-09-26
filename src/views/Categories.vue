<template>
  <div style="display:flex;flex-direction:column;gap:16px;max-width:700px;">
    <div style="display:flex;justify-content:space-between;align-items:center;"><div><h2 style="font-weight:800;font-size:1.05rem;margin:0;">Catégories de produits</h2><p style="font-size:.8rem;color:#6b7280;margin:3px 0 0;">{{ store.categories.length }} catégorie(s)</p></div><button class="btn btn-primary" @click="openAdd">+ Nouvelle catégorie</button></div>
    <div class="card">
      <div v-if="loading" class="loading-box"><div class="spinner"></div></div>
      <div v-else>
        <div v-for="(cat,i) in store.categories" :key="cat.id" style="display:flex;align-items:center;justify-content:space-between;padding:14px 18px;" :style="i<store.categories.length-1?'border-bottom:1px solid #f3f4f6':''">
          <div style="display:flex;align-items:center;gap:12px;"><div style="width:36px;height:36px;border-radius:9px;background:#f0fdf4;display:flex;align-items:center;justify-content:center;font-weight:800;color:#16a34a;font-size:.9rem;">{{ cat.name.charAt(0) }}</div><div><div style="font-weight:700;">{{ cat.name }}</div><div style="font-size:.78rem;color:#6b7280;">{{ cat.description||'Aucune description' }}</div></div></div>
          <div style="display:flex;align-items:center;gap:10px;"><span style="font-size:.78rem;color:#6b7280;">{{ cat._count?.produit??0 }} produit(s)</span><button class="btn btn-icon btn-sm" @click="openEdit(cat)">✏️</button><button class="btn btn-icon btn-sm" @click="confirmDel(cat)" style="border-color:#fecaca;" :disabled="(cat._count?.produit??0)>0">🗑️</button></div>
        </div>
        <div v-if="!store.categories.length" class="loading-box" style="color:#6b7280;">Aucune catégorie</div>
      </div>
    </div>
    <Teleport to="body">
      <div v-if="showModal" class="modal-bg" @click.self="showModal=false">
        <div class="modal" style="max-width:400px;">
          <div class="modal-hd"><h3>{{ editId?'Modifier':'Nouvelle catégorie' }}</h3><button class="btn btn-icon" @click="showModal=false">✕</button></div>
          <div class="modal-bd">
            <div class="form-grid" style="gap:12px;"><div><label class="lbl">Nom *</label><input v-model="form.name" class="inp" @keyup.enter="save"/></div><div><label class="lbl">Description</label><textarea v-model="form.description" class="inp" rows="2"></textarea></div></div>
            <div v-if="formErr" class="alert alert-red" style="margin-top:10px;">❌ {{ formErr }}</div>
          </div>
          <div class="modal-ft"><button class="btn btn-outline" @click="showModal=false">Annuler</button><button class="btn btn-primary" @click="save" :disabled="saving">{{ saving?'...':editId?'Modifier':'Créer' }}</button></div>
        </div>
      </div>
    </Teleport>
    <Teleport to="body">
      <div v-if="delTarget" class="modal-bg" @click.self="delTarget=null">
        <div class="modal" style="max-width:380px;"><div class="modal-hd"><h3 style="color:#dc2626;">Supprimer ?</h3><button class="btn btn-icon" @click="delTarget=null">✕</button></div><div class="modal-bd"><p style="color:#6b7280;">Supprimer la catégorie <strong>{{ delTarget.name }}</strong> ?</p></div><div class="modal-ft"><button class="btn btn-outline" @click="delTarget=null">Annuler</button><button class="btn btn-danger" @click="doDel">Supprimer</button></div></div>
      </div>
    </Teleport>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue'
import { usePharmaStore } from '../stores/pharma.js'
import { useToastStore }  from '../stores/toast.js'
const store=usePharmaStore(); const toast=useToastStore()
const loading=ref(false); const showModal=ref(false); const editId=ref(null); const saving=ref(false); const formErr=ref(''); const delTarget=ref(null)
const form=ref({name:'',description:''})
function openAdd(){editId.value=null;form.value={name:'',description:''};formErr.value='';showModal.value=true}
function openEdit(c){editId.value=c.id;form.value={name:c.name,description:c.description||''};formErr.value='';showModal.value=true}
async function save(){formErr.value='';if(!form.value.name.trim()){formErr.value='Nom obligatoire';return}saving.value=true;try{if(editId.value){await store.updateCategory(editId.value,form.value);toast.success('Mise à jour.')}else{await store.createCategory(form.value);toast.success('Catégorie créée.')}showModal.value=false}catch(e){formErr.value=e.message}finally{saving.value=false}}
function confirmDel(c){if((c._count?.produit??0)>0)return;delTarget.value=c}
async function doDel(){try{await store.deleteCategory(delTarget.value.id);toast.success('Supprimée.')}catch(e){toast.error(e.message)}delTarget.value=null}
onMounted(async()=>{loading.value=true;await store.fetchCategories();loading.value=false})
</script>
