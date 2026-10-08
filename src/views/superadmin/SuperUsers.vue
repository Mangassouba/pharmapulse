<template>
  <div style="display:flex;flex-direction:column;gap:16px;">
    <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;">
      <div class="search-box" style="flex:1;max-width:300px;"><span class="search-icon"><Search size="1em" /></span><input v-model="search" class="inp" :placeholder="$t('users.searchPh')" @input="debouncedFetch"/></div>
      <div style="display:flex;gap:8px;">
        <select v-model="filterRole" class="inp" style="width:160px;" @change="fetchData"><option value="">{{ $t('users.allRoles') }}</option><option v-for="r in ['ADMIN','MANAGER','CAISSIER','STOCK_MANAGER']" :key="r" :value="r">{{ $t('roles.' + r) }}</option></select>
        <select v-model="filterStatus" class="inp" style="width:140px;" @change="fetchData"><option value="">{{ $t('common.allStatuses') }}</option><option v-for="s in ['ACTIVE','INACTIVE','SUSPENDED']" :key="s" :value="s">{{ $t('userStatus.' + s) }}</option></select>
      </div>
    </div>
    <div style="font-size:.82rem;color:#6b7280;"><Users size="1em" /> {{ $t('super.users.count', { n: meta.total }) }}</div>
    <div class="scard">
      <div v-if="loading" class="loading-box"><div class="spinner" style="border-top-color:#7c3aed;"></div> {{ $t('common.loading') }}</div>
      <div v-else class="tbl-wrap">
        <table class="tbl s-table">
          <thead><tr><th>{{ $t('users.user') }}</th><th>{{ $t('common.email') }}</th><th>{{ $t('receipt.pharmacy') }}</th><th>{{ $t('users.role') }}</th><th>{{ $t('common.status') }}</th><th>{{ $t('users.lastLoginFull') }}</th></tr></thead>
          <tbody>
            <tr v-for="u in users" :key="u.id">
              <td><div style="display:flex;align-items:center;gap:10px;"><div style="width:32px;height:32px;border-radius:8px;background:#f5f3ff;color:#7c3aed;font-weight:800;font-size:.78rem;display:flex;align-items:center;justify-content:center;">{{ u.name.slice(0,2).toUpperCase() }}</div><span style="font-weight:600;">{{ u.name }}</span></div></td>
              <td style="font-size:.85rem;color:#6b7280;">{{ u.email }}</td>
              <td><div style="font-weight:600;font-size:.85rem;">{{ u.pharmacy?.name }}</div><span class="badge" :class="u.pharmacy?.status==='ACTIVE'?'badge-green':'badge-red'" style="font-size:.65rem;">{{ $te('pharmacyStatus', u.pharmacy?.status) }}</span></td>
              <td><span class="badge" :class="roleClass(u.role)">{{ $te('roles', u.role) }}</span></td>
              <td><span class="badge" :class="u.status==='ACTIVE'?'badge-green':u.status==='SUSPENDED'?'badge-red':'badge-gray'">{{ $te('userStatus', u.status) }}</span></td>
              <td style="font-size:.78rem;color:#6b7280;font-family:'JetBrains Mono',monospace;">{{ u.last_login ? fmt(u.last_login) : $t('users.never') }}</td>
            </tr>
            <tr v-if="!users.length"><td colspan="6" style="text-align:center;padding:32px;color:#6b7280;">{{ $t('users.none') }}</td></tr>
          </tbody>
        </table>
      </div>
      <div v-if="meta.totalPages>1" class="pagination">
        <button class="page-btn" @click="page--;fetchData()" :disabled="page===1">‹</button>
        <span style="font-size:.85rem;color:#6b7280;">{{ page }} / {{ meta.totalPages }}</span>
        <button class="page-btn" @click="page++;fetchData()" :disabled="page>=meta.totalPages">›</button>
      </div>
    </div>
  </div>
</template>
<script setup>
import { Search, Users } from 'lucide-vue-next'
import { ref, onMounted } from 'vue'
import { superApi } from '../../services/api.js'
import { useToastStore } from '../../stores/toast.js'
import { fmtDate } from '../../i18n/index.js'
const toast = useToastStore()
const users = ref([]); const meta = ref({ total:0,totalPages:1 }); const loading = ref(false)
const search = ref(''); const filterRole = ref(''); const filterStatus = ref(''); const page = ref(1)
const fmt = d => fmtDate(d)
const roleClass = r => ({ ADMIN:'badge-red', MANAGER:'badge-blue', CAISSIER:'badge-green', STOCK_MANAGER:'badge-purple' }[r]||'badge-gray')
let dt; function debouncedFetch() { clearTimeout(dt); dt=setTimeout(fetchData,380) }
async function fetchData() {
  loading.value = true
  try { const r = await superApi.listUsers({ page:page.value, pageSize:20, search:search.value||undefined, role:filterRole.value||undefined, status:filterStatus.value||undefined }); users.value=r.data; meta.value=r.meta } catch(e) { toast.error(e.message) } finally { loading.value=false }
}
onMounted(fetchData)
</script>
