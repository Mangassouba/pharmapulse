<template>
  <div style="position:relative;">
    <button class="sn-bell" @click="toggle" :aria-label="$t('super.notif.aria', { n: unread })">
      <Bell size="1.05em" />
      <span v-if="unread" class="sn-badge">{{ unread > 99 ? '99+' : unread }}</span>
    </button>

    <div v-if="open" class="sn-overlay" @click="open = false"></div>
    <div v-if="open" class="sn-panel">
      <div class="sn-head">
        <span style="font-weight:700;font-size:.875rem;color:#1e1b4b;">{{ $t('nav.notifications') }}</span>
        <button v-if="unread" class="sn-link" @click="readAll">{{ $t('super.notif.markAll') }}</button>
      </div>
      <div style="max-height:380px;overflow-y:auto;">
        <button v-for="n in items" :key="n.id" class="sn-item" :class="{ unread: !n.is_read }" @click="openItem(n)">
          <span class="sn-dot" :style="{ background: COLORS[n.type] || COLORS.INFO }"></span>
          <span style="flex:1;min-width:0;text-align:start;">
            <span class="sn-title">{{ n.title }}</span>
            <span class="sn-msg">{{ n.message }}</span>
            <span class="sn-time">{{ timeAgo(n.createdAt) }}</span>
          </span>
        </button>
        <div v-if="!items.length" style="padding:24px;text-align:center;color:#6b7280;font-size:.85rem;">{{ $t('nav.noNotifications') }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Bell } from 'lucide-vue-next'
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useSuperNotificationsStore, NOTIF_COLORS as COLORS, timeAgo } from '../stores/superNotifications.js'

const POLL_MS = 60 * 1000

const router = useRouter()
const store  = useSuperNotificationsStore()
const { items, unread } = storeToRefs(store)
const open   = ref(false)

function toggle() {
  open.value = !open.value
  if (open.value) store.load()
}

function openItem(n) {
  open.value = false
  store.markRead(n)
  if (n.link) router.push(n.link)
}

const readAll = () => store.markAllRead()

// Refresh every minute while the tab is visible
let timer
onMounted(() => {
  store.load()
  timer = setInterval(() => { if (!document.hidden) store.load() }, POLL_MS)
})
onUnmounted(() => clearInterval(timer))
</script>

<style scoped>
.sn-bell { position:relative; width:36px; height:36px; border-radius:10px; border:1px solid #ddd6fe; background:#fff; color:#7c3aed; display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:1rem; }
.sn-bell:hover { background:#f5f3ff; }
.sn-badge { position:absolute; top:-6px; inset-inline-end:-6px; min-width:18px; height:18px; padding:0 5px; border-radius:99px; background:#dc2626; color:#fff; font-size:.65rem; font-weight:700; display:flex; align-items:center; justify-content:center; box-sizing:border-box; }
.sn-overlay { position:fixed; inset:0; z-index:39; }
.sn-panel { position:absolute; top:calc(100% + 8px); inset-inline-end:0; width:340px; max-width:calc(100vw - 32px); background:#fff; border:1px solid #e9d5ff; border-radius:12px; box-shadow:0 10px 30px rgba(30,27,75,.15); z-index:40; overflow:hidden; }
.sn-head { display:flex; justify-content:space-between; align-items:center; padding:12px 16px; border-bottom:1px solid #f3e8ff; }
.sn-link { background:none; border:none; color:#7c3aed; font-size:.75rem; font-weight:600; cursor:pointer; padding:0; }
.sn-item { display:flex; gap:10px; width:100%; padding:10px 16px; border:none; border-bottom:1px solid #f5f0ff; background:#fff; cursor:pointer; font:inherit; }
.sn-item:hover { background:#faf5ff; }
.sn-item.unread { background:#f5f3ff; }
.sn-dot { width:8px; height:8px; border-radius:50%; margin-top:6px; flex-shrink:0; }
.sn-title { display:block; font-size:.8rem; font-weight:700; color:#1e1b4b; }
.sn-msg { display:block; font-size:.76rem; color:#4b5563; margin-top:2px; }
.sn-time { display:block; font-size:.68rem; color:#9ca3af; margin-top:3px; }
</style>
