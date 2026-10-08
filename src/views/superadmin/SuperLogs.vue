<template>
  <div style="display:flex;flex-direction:column;gap:16px;">
    <div class="scard">
      <div style="padding:14px 18px;border-bottom:1px solid #e9d5ff;display:flex;justify-content:space-between;align-items:center;">
        <h3 style="font-weight:700;margin:0;color:#1e1b4b;">{{ $t('super.logs.title') }}</h3>
        <span style="font-size:.8rem;color:#7c3aed;font-weight:600;">{{ $t('super.logs.count', { n: meta.total }) }}</span>
      </div>
      <div v-if="loading" class="loading-box"><div class="spinner" style="border-top-color:#7c3aed;"></div> {{ $t('common.loading') }}</div>
      <div v-else class="tbl-wrap">
        <table class="tbl s-table">
          <thead><tr><th>{{ $t('super.logs.datetime') }}</th><th>{{ $t('super.logs.admin') }}</th><th>{{ $t('common.action') }}</th><th>{{ $t('common.description') }}</th><th>{{ $t('super.logs.target') }}</th></tr></thead>
          <tbody>
            <tr v-for="log in logs" :key="log.id">
              <td style="font-family:'JetBrains Mono',monospace;font-size:.78rem;color:#6b7280;white-space:nowrap;">{{ fmtDatetime(log.createdAt) }}</td>
              <td style="font-weight:600;font-size:.875rem;">{{ log.superAdmin?.name }}</td>
              <td><span class="badge" :class="log.action.includes('DELETE')||log.action.includes('SUSPEND')?'badge-red':log.action.includes('CREATE')?'badge-green':log.action.includes('RENEW')?'badge-blue':'badge-gray'">{{ log.action }}</span></td>
              <td style="font-size:.8rem;color:#6b7280;max-width:240px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ log.description || '—' }}</td>
              <td style="font-size:.78rem;font-family:'JetBrains Mono',monospace;color:#6b7280;">{{ log.target_type ? log.target_type+'#'+log.target_id : '—' }}</td>
            </tr>
            <tr v-if="!logs.length"><td colspan="5" style="text-align:center;padding:32px;color:#6b7280;">{{ $t('super.logs.none') }}</td></tr>
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
import { ref, onMounted } from 'vue'
import { superApi } from '../../services/api.js'
import { useToastStore } from '../../stores/toast.js'
import { intlLocale } from '../../i18n/index.js'
const toast = useToastStore()
const logs = ref([]); const meta = ref({ total:0,totalPages:1 }); const loading = ref(false); const page = ref(1)
const fmtDatetime = d => new Date(d).toLocaleString(intlLocale())
async function fetchData() {
  loading.value = true
  try { const r = await superApi.getLogs({ page:page.value, pageSize:25 }); logs.value=r.data; meta.value=r.meta } catch(e) { toast.error(e.message) } finally { loading.value=false }
}
onMounted(fetchData)
</script>
