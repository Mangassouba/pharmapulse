<template>
  <div style="display:flex;flex-direction:column;gap:16px;max-width:680px;">
    <div class="scard">
      <div style="padding:14px 18px;border-bottom:1px solid #e9d5ff;">
        <h3 style="font-weight:700;margin:0;color:#1e1b4b;"><Type size="1em" /> Nom du site</h3>
      </div>
      <div style="padding:18px;">
        <p style="font-size:.8rem;color:#6b7280;margin:0 0 14px;">
          Affiché dans l'interface, l'onglet du navigateur et les emails. Laissez vide pour revenir à « {{ DEFAULT_SITE_NAME }} ».
        </p>
        <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
          <input v-model="nameInput" class="inp" maxlength="60" :placeholder="DEFAULT_SITE_NAME" style="flex:1;min-width:200px;border-color:#ddd6fe;" @keyup.enter="saveName"/>
          <button class="btn btn-sm" style="background:linear-gradient(135deg,#7c3aed,#4c1d95);color:#fff;border:none;" @click="saveName" :disabled="savingName || nameInput.trim() === site.name">
            {{ savingName ? '...' : 'Enregistrer' }}
          </button>
        </div>
        <p style="font-size:.8rem;color:#6b7280;margin:10px 0 0;">Aperçu : <strong style="font-size:.95rem;color:#1e1b4b;"><SiteName accent="#7c3aed" /></strong></p>
        <div v-if="nameMsg" class="alert" :class="nameMsg.ok?'alert-green':'alert-red'" style="margin-top:12px;">{{ nameMsg.text }}</div>
      </div>
    </div>

    <div class="scard">
      <div style="padding:14px 18px;border-bottom:1px solid #e9d5ff;">
        <h3 style="font-weight:700;margin:0;color:#1e1b4b;"><ImageIcon size="1em" /> Logo du site</h3>
      </div>
      <div style="padding:18px;">
        <p style="font-size:.8rem;color:#6b7280;margin:0 0 14px;">
          Affiché sur la vitrine publique, les pages de connexion, le menu des pharmacies sans logo, ce panel et l'onglet du navigateur. PNG, JPEG ou WebP.
        </p>
        <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap;">
          <div style="width:88px;height:88px;border-radius:14px;border:1px solid #e9d5ff;background:#faf5ff;display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0;color:#7c3aed;">
            <SiteLogo size="2em" />
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <input ref="fileInput" type="file" accept="image/png,image/jpeg,image/webp" style="display:none;" @change="onPicked"/>
            <button class="btn btn-sm" style="background:linear-gradient(135deg,#7c3aed,#4c1d95);color:#fff;border:none;" @click="fileInput.click()" :disabled="saving">
              {{ saving ? '...' : (site.logoUrl ? 'Changer le logo' : 'Ajouter un logo') }}
            </button>
            <button v-if="site.logoUrl" class="btn btn-sm" @click="remove" :disabled="saving">Supprimer</button>
          </div>
        </div>
        <div v-if="msg" class="alert" :class="msg.ok?'alert-green':'alert-red'" style="margin-top:12px;">{{ msg.text }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Image as ImageIcon, Type } from 'lucide-vue-next'
import { ref, watch } from 'vue'
import SiteLogo from '../../components/SiteLogo.vue'
import SiteName from '../../components/SiteName.vue'
import { useSiteStore, DEFAULT_SITE_NAME } from '../../stores/site.js'
import { superApi } from '../../services/api.js'
import { resizeImage } from '../../utils/logo.js'

const site      = useSiteStore()
const fileInput = ref(null)
const saving    = ref(false)
const msg       = ref(null)

// Show the custom name in the field; the default name shows as the placeholder
const nameInput  = ref('')
const savingName = ref(false)
const nameMsg    = ref(null)
watch(() => site.name, n => { nameInput.value = n === DEFAULT_SITE_NAME ? '' : n }, { immediate: true })

async function saveName() {
  nameMsg.value = null
  savingName.value = true
  try {
    const res = await superApi.updateSite({ name: nameInput.value.trim() })
    site.setName(res.data.name)
    nameMsg.value = { ok: true, text: 'Nom du site enregistré.' }
  } catch (err) {
    nameMsg.value = { ok: false, text: '' + err.message }
  } finally { savingName.value = false }
}

async function onPicked(e) {
  const file = e.target.files?.[0]
  e.target.value = ''
  if (!file) return
  msg.value = null
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) { msg.value = { ok: false, text: 'Format non supporté (PNG, JPEG ou WebP).' }; return }
  saving.value = true
  try {
    const res = await superApi.updateSiteLogo({ logo: await resizeImage(file) })
    site.setLogoVersion(res.data.logo_updated_at)
    msg.value = { ok: true, text: 'Logo du site enregistré.' }
  } catch (err) {
    msg.value = { ok: false, text: '' + err.message }
  } finally { saving.value = false }
}

async function remove() {
  msg.value = null
  saving.value = true
  try {
    await superApi.deleteSiteLogo()
    site.setLogoVersion(null)
    msg.value = { ok: true, text: 'Logo du site supprimé.' }
  } catch (err) {
    msg.value = { ok: false, text: '' + err.message }
  } finally { saving.value = false }
}
</script>
