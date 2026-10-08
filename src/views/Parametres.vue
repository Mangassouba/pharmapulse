<template>
  <div style="display:flex;flex-direction:column;gap:16px;max-width:680px;">
    <!-- Profile -->
    <div class="card card-p">
      <h3 style="font-weight:700;margin:0 0 4px;">{{ $t('settings.profile') }}</h3>
      <p style="font-size:.8rem;color:#6b7280;margin:0 0 18px;">{{ $t('settings.personalInfo') }}</p>
      <div style="display:flex;align-items:center;gap:14px;margin-bottom:18px;padding-bottom:16px;border-bottom:1px solid #f3f4f6;">
        <div style="width:52px;height:52px;border-radius:12px;background:#f0fdf4;color:#16a34a;font-weight:800;font-size:1.2rem;display:flex;align-items:center;justify-content:center;">{{ initials }}</div>
        <div><div style="font-weight:700;font-size:1.05rem;">{{ auth.user?.name }}</div><div style="font-size:.82rem;color:#6b7280;">{{ auth.user?.email }}</div><span class="badge badge-green" style="margin-top:4px;display:inline-block;">{{ $te('roles', auth.user?.role) }}</span></div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px;">
        <div><label class="lbl">{{ $t('settings.fullName') }}</label><input v-model="profile.name" class="inp"/></div>
        <div><label class="lbl">{{ $t('common.phone') }}</label><input v-model="profile.phone" class="inp"/></div>
        <div style="grid-column:1/-1"><label class="lbl">{{ $t('common.address') }}</label><input v-model="profile.address" class="inp"/></div>
      </div>
      <div v-if="profileMsg" class="alert" :class="profileMsg.ok?'alert-green':'alert-red'" style="margin-bottom:10px;">{{ profileMsg.text }}</div>
      <button class="btn btn-primary btn-sm" @click="saveProfile" :disabled="savingProfile">{{ savingProfile?'...':$t('settings.saveProfile') }}</button>
    </div>

    <!-- Change password -->
    <div class="card card-p">
      <h3 style="font-weight:700;margin:0 0 4px;">{{ $t('auth.changePassword') }}</h3>
      <p style="font-size:.8rem;color:#6b7280;margin:0 0 16px;">{{ $t('settings.secureAccess') }}</p>
      <div style="display:flex;flex-direction:column;gap:12px;max-width:380px;">
        <div><label class="lbl">{{ $t('settings.currentPassword') }}</label><input v-model="pwd.current" class="inp" type="password"/></div>
        <div><label class="lbl">{{ $t('auth.newPassword') }}</label><input v-model="pwd.newPwd" class="inp" type="password"/></div>
        <div><label class="lbl">{{ $t('common.confirm') }}</label><input v-model="pwd.confirm" class="inp" type="password" @keyup.enter="changePwd"/></div>
      </div>
      <div v-if="pwdMsg" class="alert" :class="pwdMsg.ok?'alert-green':'alert-red'" style="margin-top:10px;max-width:380px;">{{ pwdMsg.text }}</div>
      <button class="btn btn-primary btn-sm" style="margin-top:14px;" @click="changePwd" :disabled="savingPwd">{{ savingPwd?'...':$t('auth.changePassword') }}</button>
    </div>

    <!-- Pharmacy info -->
    <div class="card card-p">
      <h3 style="font-weight:700;margin:0 0 16px;">{{ $t('settings.pharmacyInfo') }}</h3>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <div><label class="lbl">{{ $t('common.name') }}</label><input :value="auth.user?.pharmacy?.name||'—'" class="inp" disabled style="background:#f9fafb;cursor:not-allowed;"/></div>
        <div><label class="lbl">{{ $t('common.email') }}</label><input :value="auth.user?.pharmacy?.email||'—'" class="inp" disabled style="background:#f9fafb;cursor:not-allowed;"/></div>
        <div><label class="lbl">{{ $t('common.city') }}</label><input :value="auth.user?.pharmacy?.city||'—'" class="inp" disabled style="background:#f9fafb;cursor:not-allowed;"/></div>
        <div><label class="lbl">{{ $t('common.country') }}</label><input :value="auth.user?.pharmacy?.country||'—'" class="inp" disabled style="background:#f9fafb;cursor:not-allowed;"/></div>
      </div>
    </div>

    <!-- Logo -->
    <div class="card card-p">
      <h3 style="font-weight:700;margin:0 0 4px;"><ImageIcon size="1em" /> {{ $t('settings.logo') }}</h3>
      <p style="font-size:.8rem;color:#6b7280;margin:0 0 14px;">{{ $t('settings.logoHelp') }}</p>
      <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap;">
        <div style="width:88px;height:88px;border-radius:14px;border:1px solid var(--border);background:#f9fafb;display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0;">
          <img v-if="logoUrl" :src="logoUrl" :alt="$t('settings.logoAlt')" style="max-width:100%;max-height:100%;object-fit:contain;"/>
          <Pill v-else size="2em" style="color:#16a34a;" />
        </div>
        <div v-if="isAdmin" style="display:flex;gap:8px;flex-wrap:wrap;">
          <input ref="logoInput" type="file" accept="image/png,image/jpeg,image/webp" style="display:none;" @change="onLogoPicked"/>
          <button class="btn btn-primary btn-sm" @click="logoInput.click()" :disabled="savingLogo">{{ savingLogo ? '...' : (logoUrl ? $t('settings.changeLogo') : $t('settings.addLogo')) }}</button>
          <button v-if="logoUrl" class="btn btn-sm" @click="removeLogo" :disabled="savingLogo">{{ $t('common.delete') }}</button>
        </div>
        <p v-else style="font-size:.8rem;color:#6b7280;margin:0;">{{ $t('settings.adminOnlyLogo') }}</p>
      </div>
      <div v-if="logoMsg" class="alert" :class="logoMsg.ok?'alert-green':'alert-red'" style="margin-top:12px;">{{ logoMsg.text }}</div>
    </div>

    <!-- Duty schedule -->
    <div class="card card-p">
      <h3 style="font-weight:700;margin:0 0 4px;"><Moon size="1em" /> {{ $t('settings.duty') }}</h3>
      <p style="font-size:.8rem;color:#6b7280;margin:0 0 16px;">{{ $t('settings.dutyHelp') }}</p>
      <label class="lbl">{{ $t('settings.dutyDays') }}</label>
      <div style="display:flex;flex-wrap:wrap;gap:8px;">
        <label v-for="d in WEEK_DAYS" :key="d.value"
          style="display:flex;align-items:center;gap:6px;padding:7px 12px;border:1px solid #e5e7eb;border-radius:8px;font-size:.85rem;user-select:none;"
          :style="{ background: dutyDays.includes(d.value) ? '#f0fdf4' : 'white', borderColor: dutyDays.includes(d.value) ? '#86efac' : '#e5e7eb', cursor: isAdmin ? 'pointer' : 'not-allowed' }">
          <input type="checkbox" :value="d.value" v-model="dutyDays" :disabled="!isAdmin"/> {{ d.label }}
        </label>
      </div>

      <label class="lbl" style="margin-top:16px;">{{ $t('settings.dutyHours') }}</label>
      <label style="display:flex;align-items:center;gap:8px;font-size:.85rem;margin-bottom:10px;user-select:none;" :style="{ cursor: isAdmin ? 'pointer' : 'not-allowed' }">
        <input type="checkbox" v-model="dutyAllDay" :disabled="!isAdmin"/> {{ $t('settings.allDay') }}
      </label>
      <div v-if="!dutyAllDay" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;max-width:380px;">
        <div><label class="lbl">{{ $t('settings.start') }}</label><input v-model="dutyStart" type="time" class="inp" :disabled="!isAdmin"/></div>
        <div><label class="lbl">{{ $t('settings.end') }}</label><input v-model="dutyEnd" type="time" class="inp" :disabled="!isAdmin"/></div>
      </div>
      <p v-if="!dutyAllDay && dutyStart && dutyEnd && dutyEnd < dutyStart" style="font-size:.78rem;color:#4338ca;margin:8px 0 0;">
        {{ $t('settings.nightDuty', { start: dutyStart, end: dutyEnd }) }}
      </p>

      <p v-if="!isAdmin" style="font-size:.78rem;color:#9ca3af;margin:10px 0 0;">{{ $t('settings.adminOnlyDuty') }}</p>
      <div v-if="dutyMsg" class="alert" :class="dutyMsg.ok?'alert-green':'alert-red'" style="margin-top:12px;">{{ dutyMsg.text }}</div>
      <button v-if="isAdmin" class="btn btn-primary btn-sm" style="margin-top:14px;" @click="saveDuty" :disabled="savingDuty">{{ savingDuty?'...':$t('settings.saveDuty') }}</button>
    </div>

    <!-- Location -->
    <div class="card card-p">
      <h3 style="font-weight:700;margin:0 0 4px;"><MapPin size="1em" /> {{ $t('settings.location') }}</h3>
      <p style="font-size:.8rem;color:#6b7280;margin:0 0 14px;">{{ $t('settings.locationHelp') }}</p>
      <PharmacyMap v-if="hasLoc" :lat="locLat" :lng="locLng" style="margin-bottom:12px;"/>
      <div v-else class="alert alert-yellow" style="margin-bottom:12px;">{{ $t('settings.noLocation') }}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;max-width:380px;">
        <div><label class="lbl">{{ $t('settings.latitude') }}</label><input v-model.number="locLat" type="number" step="any" class="inp" :disabled="!isAdmin" :placeholder="$t('common.example', { v: '18.0858' })"/></div>
        <div><label class="lbl">{{ $t('settings.longitude') }}</label><input v-model.number="locLng" type="number" step="any" class="inp" :disabled="!isAdmin" :placeholder="$t('common.example', { v: '-15.9785' })"/></div>
      </div>
      <p v-if="!isAdmin" style="font-size:.78rem;color:#9ca3af;margin:10px 0 0;">{{ $t('settings.adminOnlyLocation') }}</p>
      <div v-if="locMsg" class="alert" :class="locMsg.ok?'alert-green':'alert-red'" style="margin-top:12px;">{{ locMsg.text }}</div>
      <div v-if="isAdmin" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:14px;">
        <button class="btn btn-outline btn-sm" @click="useMyPosition" :disabled="locating"><Crosshair size="1em" /> {{ locating ? $t('settings.locating') : $t('settings.useMyPosition') }}</button>
        <button class="btn btn-primary btn-sm" @click="saveLocation" :disabled="savingLoc">{{ savingLoc?'...':$t('settings.saveLocation') }}</button>
        <button v-if="auth.user?.pharmacy?.latitude != null" class="btn btn-sm" @click="clearLocation" :disabled="savingLoc">{{ $t('common.delete') }}</button>
      </div>
    </div>

    <!-- System info -->
    <div class="card card-p">
      <h3 style="font-weight:700;margin:0 0 14px;">{{ $t('settings.systemInfo') }}</h3>
      <div style="display:flex;flex-direction:column;gap:0;">
        <div v-for="info in sysInfo" :key="info.label" style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid #f3f4f6;">
          <span style="font-size:.875rem;color:#6b7280;">{{ info.label }}</span>
          <span style="font-family:'JetBrains Mono',monospace;font-size:.85rem;font-weight:600;" :style="{color:info.color||'#111827'}">{{ info.value }}</span>
        </div>
      </div>
      <button class="btn btn-danger btn-sm" style="margin-top:16px;" @click="doLogout"><LogOut size="1em" /> {{ $t('nav.logout') }}</button>
    </div>
  </div>
</template>

<script setup>
import { Moon, LogOut, Pill, MapPin, Crosshair, Image as ImageIcon } from 'lucide-vue-next'
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore }   from '../stores/auth.js'
import { usePharmaStore } from '../stores/pharma.js'
import { authApi }        from '../services/api.js'
import { WEEK_DAYS }      from '../utils/duty.js'
import { pharmacyLogoUrl, resizeImage } from '../utils/logo.js'
import { getCurrentPosition } from '../utils/geo.js'
import PharmacyMap from '../components/PharmacyMap.vue'
import { t, te } from '../i18n/index.js'

const auth   = useAuthStore()
const store  = usePharmaStore()
const router = useRouter()

const initials    = computed(() => (auth.user?.name || 'U').slice(0, 2).toUpperCase())
const savingProfile = ref(false)
const savingPwd   = ref(false)
const profileMsg  = ref(null)
const pwdMsg      = ref(null)

const profile = ref({
  name:    auth.user?.name    || '',
  phone:   auth.user?.phone   || '',
  address: auth.user?.address || '',
})
const pwd = ref({ current: '', newPwd: '', confirm: '' })

const isAdmin    = computed(() => auth.user?.role === 'ADMIN')
const dutyDays   = ref([])
const dutyAllDay = ref(true)
const dutyStart  = ref('20:00')
const dutyEnd    = ref('08:00')
const savingDuty = ref(false)
const dutyMsg    = ref(null)

function loadDuty(ph) {
  dutyDays.value   = [...(ph?.duty_days || [])]
  dutyAllDay.value = !ph?.duty_start
  if (ph?.duty_start) { dutyStart.value = ph.duty_start; dutyEnd.value = ph.duty_end }
}
loadDuty(auth.user?.pharmacy)

const locLat    = ref(null)
const locLng    = ref(null)
const locating  = ref(false)
const savingLoc = ref(false)
const locMsg    = ref(null)
const isCoord   = v => typeof v === 'number' && Number.isFinite(v)
const hasLoc    = computed(() => isCoord(locLat.value) && isCoord(locLng.value))

function loadLocation(ph) {
  locLat.value = ph?.latitude ?? null
  locLng.value = ph?.longitude ?? null
}
loadLocation(auth.user?.pharmacy)

async function useMyPosition() {
  locMsg.value = null
  locating.value = true
  try {
    const { lat, lng, accuracy } = await getCurrentPosition()
    locLat.value = +lat.toFixed(6)
    locLng.value = +lng.toFixed(6)
    locMsg.value = { ok: true, text: t('settings.positionFound', { m: Math.round(accuracy) }) }
  } catch (e) {
    locMsg.value = { ok: false, text: e.message }
  } finally { locating.value = false }
}

async function sendLocation(latitude, longitude, okText) {
  locMsg.value = null
  savingLoc.value = true
  try {
    const res = await authApi.updateLocation({ latitude, longitude })
    auth.setUser({ pharmacy: { ...auth.user?.pharmacy, latitude: res.data.latitude, longitude: res.data.longitude } })
    loadLocation(res.data)
    locMsg.value = { ok: true, text: okText }
  } catch (e) {
    locMsg.value = { ok: false, text: '' + e.message }
  } finally { savingLoc.value = false }
}

function saveLocation() {
  if (!hasLoc.value) { locMsg.value = { ok: false, text: t('settings.enterCoords') }; return }
  if (Math.abs(locLat.value) > 90 || Math.abs(locLng.value) > 180) { locMsg.value = { ok: false, text: t('settings.invalidCoords') }; return }
  sendLocation(locLat.value, locLng.value, t('settings.locationSaved'))
}

function clearLocation() { sendLocation(null, null, t('settings.locationRemoved')) }

onMounted(async () => {
  try {
    const res = await authApi.me()
    auth.setUser(res.data)
    profile.value = {
      name:    auth.user?.name    || '',
      phone:   auth.user?.phone   || '',
      address: auth.user?.address || '',
    }
    loadDuty(auth.user?.pharmacy)
    loadLocation(auth.user?.pharmacy)
  } catch (e) { /* keep cached values if refresh fails */ }
})

const logoInput  = ref(null)
const savingLogo = ref(false)
const logoMsg    = ref(null)
const logoUrl    = computed(() => pharmacyLogoUrl(auth.user?.pharmacy))

function setLogoVersion(logo_updated_at) {
  auth.setUser({ pharmacy: { ...auth.user?.pharmacy, logo_updated_at } })
}

async function onLogoPicked(e) {
  const file = e.target.files?.[0]
  e.target.value = ''
  if (!file) return
  logoMsg.value = null
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) { logoMsg.value = { ok: false, text: t('common.unsupportedFormat') }; return }
  savingLogo.value = true
  try {
    const res = await authApi.updateLogo({ logo: await resizeImage(file) })
    setLogoVersion(res.data.logo_updated_at)
    logoMsg.value = { ok: true, text: t('settings.logoSaved') }
  } catch (err) {
    logoMsg.value = { ok: false, text: '' + err.message }
  } finally { savingLogo.value = false }
}

async function removeLogo() {
  logoMsg.value = null
  savingLogo.value = true
  try {
    await authApi.deleteLogo()
    setLogoVersion(null)
    logoMsg.value = { ok: true, text: t('settings.logoRemoved') }
  } catch (err) {
    logoMsg.value = { ok: false, text: '' + err.message }
  } finally { savingLogo.value = false }
}

async function saveDuty() {
  dutyMsg.value = null
  if (!dutyAllDay.value) {
    if (!dutyStart.value || !dutyEnd.value) { dutyMsg.value = { ok: false, text: t('settings.enterHours') }; return }
    if (dutyStart.value === dutyEnd.value) { dutyMsg.value = { ok: false, text: t('settings.hoursDiffer') }; return }
  }
  savingDuty.value = true
  try {
    const res = await authApi.updateDuty({
      dutyDays:  dutyDays.value,
      dutyStart: dutyAllDay.value ? null : dutyStart.value,
      dutyEnd:   dutyAllDay.value ? null : dutyEnd.value,
    })
    const { duty_days, duty_start, duty_end } = res.data
    auth.setUser({ pharmacy: { ...auth.user?.pharmacy, duty_days, duty_start, duty_end } })
    dutyMsg.value = { ok: true, text: t('settings.dutySaved') }
  } catch (e) {
    dutyMsg.value = { ok: false, text: '' + e.message }
  } finally { savingDuty.value = false }
}

const sysInfo = computed(() => [
  { label: t('settings.sys.version'),   value: 'PharmaPulse v1.0.0',       color: '#16a34a' },
  { label: t('settings.sys.framework'), value: 'Vue 3 + Vite 5' },
  { label: t('settings.sys.backend'),   value: 'Express + Prisma v6' },
  { label: t('settings.sys.products'),  value: t('settings.sys.refs', { n: store.products.length }) },
  { label: t('settings.sys.alerts'),    value: `${store.alertCount}`, color: store.alertCount > 0 ? '#dc2626' : '#16a34a' },
  { label: t('settings.sys.role'),      value: te('roles', auth.user?.role) || '—' },
])

async function saveProfile() {
  savingProfile.value = true
  profileMsg.value = null
  try {
    const res = await authApi.updateMe({
      name:    profile.value.name,
      phone:   profile.value.phone,
      address: profile.value.address,
    })
    auth.setUser(res.data)
    profileMsg.value = { ok: true, text: t('settings.profileUpdated') }
  } catch (e) {
    profileMsg.value = { ok: false, text: '' + e.message }
  } finally { savingProfile.value = false }
}

async function changePwd() {
  pwdMsg.value = null
  if (!pwd.value.current || !pwd.value.newPwd) { pwdMsg.value = { ok: false, text: t('auth.fillAll') }; return }
  if (pwd.value.newPwd.length < 6) { pwdMsg.value = { ok: false, text: t('auth.passwordTooShort') }; return }
  if (pwd.value.newPwd !== pwd.value.confirm) { pwdMsg.value = { ok: false, text: t('auth.passwordMismatch') }; return }
  savingPwd.value = true
  try {
    await authApi.changePassword({ currentPassword: pwd.value.current, newPassword: pwd.value.newPwd })
    pwdMsg.value = { ok: true, text: t('settings.passwordChanged') }
    pwd.value = { current: '', newPwd: '', confirm: '' }
  } catch (e) {
    pwdMsg.value = { ok: false, text: '' + e.message }
  } finally { savingPwd.value = false }
}

function doLogout() { auth.logout(); router.push('/login') }
</script>
