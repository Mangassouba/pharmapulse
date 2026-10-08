import { ref, watch } from 'vue'
import messages from './messages.js'

// Langues de l'interface. Chaque texte de messages.js est un tableau [fr, en, ar] dans cet ordre.
export const LOCALES = [
  { code: 'fr', label: 'Français', short: 'FR', intl: 'fr-FR',        dir: 'ltr' },
  { code: 'en', label: 'English',  short: 'EN', intl: 'en-GB',        dir: 'ltr' },
  { code: 'ar', label: 'العربية',  short: 'ع',  intl: 'ar-u-nu-latn', dir: 'rtl' },
]
const INDEX   = Object.fromEntries(LOCALES.map((l, i) => [l.code, i]))
const DEFAULT = 'fr'
const STORAGE = 'pharma_lang'

function initialLocale() {
  try {
    const saved = localStorage.getItem(STORAGE)
    if (saved in INDEX) return saved
  } catch { /* storage blocked */ }
  const nav = (navigator.language || '').slice(0, 2)
  return nav in INDEX ? nav : DEFAULT
}

export const locale = ref(initialLocale())

watch(locale, code => {
  const l = LOCALES[INDEX[code]]
  document.documentElement.lang = code
  document.documentElement.dir  = l.dir
  try { localStorage.setItem(STORAGE, code) } catch { /* storage blocked */ }
}, { immediate: true })

export function setLocale(code) { if (code in INDEX) locale.value = code }

/** Locale Intl de la langue courante (dates, nombres) */
export const intlLocale = () => LOCALES[INDEX[locale.value]].intl
export const isRtl      = () => LOCALES[INDEX[locale.value]].dir === 'rtl'

function lookup(key) {
  let node = messages
  for (const part of key.split('.')) {
    node = node?.[part]
    if (node === undefined) return undefined
  }
  return node
}

/**
 * t('nav.products') → texte dans la langue courante.
 * Paramètres : t('sales.count', { n: 3 }) remplace {n}.
 * Clé inconnue → la clé elle-même ; traduction vide → le français.
 */
export function t(key, params) { return tIn(locale.value, key, params) }

/** t() dans une langue donnée (ex. PDF : la police Helvetica de jsPDF n'a pas de glyphes arabes) */
export function tIn(code, key, params) {
  const entry = lookup(key)
  if (!Array.isArray(entry)) return key
  let s = entry[INDEX[code] ?? 0] || entry[0]
  if (params) s = s.replace(/\{(\w+)\}/g, (m, k) => (params[k] ?? m))
  return s
}

/** t() d'une valeur d'énumération, avec repli sur la valeur brute (ex. statut inconnu) */
export function te(prefix, value) {
  const key = `${prefix}.${value}`
  const s = t(key)
  return s === key ? (value ?? '') : s
}

/** Format de nombre / date dans la langue courante */
export const fmtNum  = (v, opts) => Number(v || 0).toLocaleString(intlLocale(), opts)
export const fmtDate = (d, opts) => new Date(d).toLocaleDateString(intlLocale(), opts)
export const fmtDateTime = (d, opts) => new Date(d).toLocaleString(intlLocale(), opts)

export const i18n = {
  install(app) {
    app.config.globalProperties.$t  = t
    app.config.globalProperties.$te = te
  },
}
