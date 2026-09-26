<template>
  <div style="display:flex;flex-direction:column;gap:16px;">
    <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;">
      <div class="search-box" style="flex:1;max-width:280px;"><span class="search-icon">🔍</span><input v-model="search" class="inp" placeholder="Nom ou email..." @input="debouncedFetch"/></div>
      <div style="display:flex;gap:8px;"><select v-model="filterRole" class="inp" style="width:155px;" @change="fetchData"><option value="">Tous les rôles</option><option value="ADMIN">Admin</option><option value="MANAGER">Manager</option><option value="CAISSIER">Caissier</option><option value="STOCK_MANAGER">Stock Manager</option></select><button class="btn btn-primary" @click="openAdd">+ Ajouter</button></div>
    </div>
    <div class="card">
      <div v-if="loading" class="loading-box"><div class="spinner"></div></div>
      <div v-else class="tbl-wrap">
        <table class="tbl">
          <thead><tr><th>Utilisateur</th><th>Email</th><th>Rôle</th><th>Statut</th><th>Connexion</th><th style="text-align:right;">Actions</th></tr></thead>
          <tbody>
            <tr v-for="u in users" :key="u.id">
              <td><div style="display:flex;align-items:center;gap:10px;"><div style="width:32px;height:32px;border-radius:8px;background:#f0fdf4;color:#16a34a;font-weight:800;font-size:.78rem;display:flex;align-items:center;justify-content:center;">{{ u.name.slice(0,2).toUpperCase() }}</div><div style="font-weight:600;">{{ u.name }}</div></div></td>
              <td style="font-size:.85rem;color:#6b7280;">{{ u.email }}</td>
              <td><span class="badge" :class="{ADMIN:'badge-red',MANAGER:'badge-blue',CAISSIER:'badge-green',STOCK_MANAGER:'badge-purple'}[u.role]||'badge-gray'">{{ u.role }}</span></td>
              <td><span class="badge" :class="u.status==='ACTIVE'?'badge-green':u.status==='SUSPENDED'?'badge-red':'badge-gray'">{{ u.status }}</span></td>
              <td style="font-size:.78rem;color:#6b7280;font-family:'JetBrains Mono',monospace;">{{ u.last_login?store.fmt(u.last_login):'Jamais' }}</td>
              <td><div style="display:flex;gap:5px;justify-content:flex-end;"><button class="btn btn-icon btn-sm" @click="openEdit(u)">✏️</button><button class="btn btn-icon btn-sm" @click="confirmDel(u)" style="border-color:#fecaca;" :disabled="u.id===auth.user?.id">🗑️</button></div></td>
            </tr>
            <tr v-if="!users.length"><td colspan="6" style="text-align:center;padding:28px;color:#6b7280;">Aucun utilisateur</td></tr>
          </tbody>
        </table>
      </div>
      <div v-if="meta.totalPages>1" class="pagination"><button class="page-btn" @click="page--;fetchData()" :disabled="page===1">‹</button><span style="font-size:.85rem;color:#6b7280;">{{ page }} / {{ meta.totalPages }}</span><button class="page-btn" @click="page++;fetchData()" :disabled="page>=meta.totalPages">›</button></div>
    </div>
    <Teleport to="body">
      <div v-if="showModal" class="modal-bg" @click.self="showModal=false">
        <div class="modal"><div class="modal-hd"><h3>{{ editId?'Modifier':'Nouvel utilisateur' }}</h3><button class="btn btn-icon" @click="showModal=false">✕</button></div>
          <div class="modal-bd">
            <div class="form-grid form-2col" style="gap:12px;">
              <div style="grid-column:1/-1"><label class="lbl">Nom *</label><input v-model="form.name" class="inp"/></div>
              <div><label class="lbl">Email *</label><input v-model="form.email" class="inp" type="email" :disabled="!!editId"/></div>
              <div><label class="lbl">Téléphone</label><input v-model="form.phone" class="inp"/></div>
              <div v-if="!editId"><label class="lbl">Mot de passe *</label><input v-model="form.password" class="inp" type="password"/></div>
              <div><label class="lbl">Rôle *</label><select v-model="form.role" class="inp"><option value="ADMIN">Administrateur</option><option value="MANAGER">Manager</option><option value="CAISSIER">Caissier</option><option value="STOCK_MANAGER">Stock Manager</option></select></div>
              <div v-if="editId"><label class="lbl">Statut</label><select v-model="form.status" class="inp"><option value="ACTIVE">Actif</option><option value="INACTIVE">Inactif</option><option value="SUSPENDED">Suspendu</option></select></div>
            </div>
            <div v-if="formErr" class="alert alert-red" style="margin-top:12px;">❌ {{ formErr }}</div>
          </div>
          <div class="modal-ft"><button class="btn btn-outline" @click="showModal=false">Annuler</button><button class="btn btn-primary" @click="save" :disabled="saving">{{ saving?'...':editId?'Modifier':'Créer' }}</button></div>
        </div>
      </div>
    </Teleport>
    <Teleport to="body">
      <div v-if="delTarget" class="modal-bg" @click.self="delTarget=null"><div class="modal" style="max-width:380px;"><div class="modal-hd"><h3 style="color:#dc2626;">Supprimer ?</h3><button class="btn btn-icon" @click="delTarget=null">✕</button></div><div class="modal-bd"><p style="color:#6b7280;">Supprimer <strong>{{ delTarget.name }}</strong> ?</p></div><div class="modal-ft"><button class="btn btn-outline" @click="delTarget=null">Annuler</button><button class="btn btn-danger" @click="doDel">Supprimer</button></div></div></div>
    </Teleport>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue'
import { usePharmaStore } from '../stores/pharma.js'
import { useAuthStore }   from '../stores/auth.js'
import { useToastStore }  from '../stores/toast.js'
import { userApi } from '../services/api.js'
const store=usePharmaStore(); const auth=useAuthStore(); const toast=useToastStore()
const users=ref([]); const meta=ref({totalPages:1}); const loading=ref(false)
const search=ref(''); const filterRole=ref(''); const page=ref(1)
const showModal=ref(false); const editId=ref(null); const saving=ref(false); const formErr=ref(''); const delTarget=ref(null)
const form=ref({name:'',email:'',password:'',role:'CAISSIER',phone:'',status:'ACTIVE'})
let dt; function debouncedFetch(){clearTimeout(dt);dt=setTimeout(fetchData,380)}
async function fetchData(){loading.value=true;try{const r=await userApi.list({page:page.value,pageSize:20,search:search.value||undefined,role:filterRole.value||undefined});users.value=r.data;meta.value=r.meta}catch(e){toast.error(e.message)}finally{loading.value=false}}
function openAdd(){editId.value=null;form.value={name:'',email:'',password:'',role:'CAISSIER',phone:'',status:'ACTIVE'};formErr.value='';showModal.value=true}
function openEdit(u){editId.value=u.id;form.value={name:u.name,email:u.email,role:u.role,phone:u.phone||'',status:u.status};formErr.value='';showModal.value=true}
async function save(){formErr.value='';if(!form.value.name){formErr.value='Nom requis';return}if(!editId.value&&(!form.value.email||!form.value.password)){formErr.value='Email et mot de passe requis';return}saving.value=true;try{if(editId.value){await userApi.update(editId.value,{name:form.value.name,role:form.value.role,phone:form.value.phone,status:form.value.status});toast.success('Mis à jour.')}else{await userApi.create(form.value);toast.success('Créé.')}showModal.value=false;fetchData()}catch(e){formErr.value=e.message}finally{saving.value=false}}
function confirmDel(u){if(u.id===auth.user?.id)return;delTarget.value=u}
async function doDel(){try{await userApi.delete(delTarget.value.id);toast.success('Supprimé.');fetchData()}catch(e){toast.error(e.message)}delTarget.value=null}
onMounted(fetchData)
</script>
