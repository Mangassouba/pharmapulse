// Fichier Excel des produits : le même fichier sert à l'export et à l'import (exporter, modifier, réimporter).
// Les en-têtes sont écrits dans la langue de l'interface ; à l'import, ils sont reconnus dans les trois langues
// ou sous leur nom technique (barcode, sale_price…), pour qu'un fichier exporté en arabe se réimporte en français.
import { LOCALES, locale, t, te, tIn } from '../i18n/index.js'
import { COUNTRIES } from '../config/countries.js'
import { currentCurrency } from './money.js'
import { UNIT_CHOICES, productUnitsOf, mainUnitOf } from './units.js'

// SheetJS (~400 Ko) n'est chargé qu'au moment d'exporter ou d'importer
const loadXlsx = () => import('xlsx')

const COLUMNS = [
  { key: 'barcode',          label: 'products.barcode',              width: 16 },
  { key: 'name',             label: 'common.name',                   width: 32 },
  { key: 'category',         label: 'common.category',               width: 18 },
  { key: 'sale_price',       label: 'products.salePriceCurrency',    width: 14 },
  { key: 'purchase_price',   label: 'reception.purchasePrice',      width: 14 },
  { key: 'stock',            label: 'common.stock',                  width: 10 },
  { key: 'threshold',        label: 'products.alertThreshold',       width: 12 },
  { key: 'unit_type',        label: 'products.unitType',             width: 12 },
  { key: 'units',            label: 'products.packagingSheet',       width: 34 },
  { key: 'prescription_req', label: 'products.prescriptionRequired', width: 12 },
  { key: 'description',      label: 'common.description',            width: 32 },
]
const REQUIRED = ['barcode', 'name', 'category', 'sale_price', 'purchase_price']

const norm = s => String(s ?? '').trim().toLowerCase()

// En-tête lu dans le fichier → clé de colonne (prix : « Prix vente (MRU) », « Prix vente (XOF) »… quelle que soit la devise)
const CURRENCIES  = [...new Set(Object.values(COUNTRIES).map(c => c.currency))]
const HEADER_KEYS = new Map(COLUMNS.flatMap(c => [
  [norm(c.key), c.key],
  ...LOCALES.flatMap(l => CURRENCIES.map(currency => [norm(tIn(l.code, c.label, { currency })), c.key])),
]))

// Unités : libellé dans l'une des trois langues (« Boîte », « Box », « علبة ») ou code (BOX) → code pour l'API.
// Un texte inconnu est envoyé tel quel : le serveur le refuse en indiquant la ligne.
const UNIT_KEYS = new Map(UNIT_CHOICES.flatMap(u => [[norm(u), u], ...LOCALES.map(l => [norm(tIn(l.code, `unitTypes.${u}`)), u])]))
const unitCode  = s => UNIT_KEYS.get(norm(s)) ?? String(s).trim().toUpperCase()

/** Conditionnements → « Boîte=20 ; Plaquette=10 ; Comprimé=1 » (vide pour un produit à une seule unité) */
const packagingText = p => {
  const units = productUnitsOf(p)
  return units.length < 2 ? '' : units.map(u => `${te('unitTypes', u.unit)}=${u.base_quantity}`).join(' ; ')
}
/** « Plaquette=10 ; Comprimé : 1 » → « BLISTER=10;TABLET=1 » (format lu par l'API) */
const packagingCodes = v => String(v).split(/[;,]/).map(s => s.trim()).filter(Boolean)
  .map(s => { const m = /^(.+?)\s*[=:]\s*(\d+)$/.exec(s); return m ? `${unitCode(m[1])}=${m[2]}` : s })
  .join(';')

/** Télécharge les produits (réponse de GET /products/export) en .xlsx */
export async function downloadProductSheet(products) {
  const XLSX = await loadXlsx()
  const yesNo = v => t(v ? 'products.sheet.yes' : 'products.sheet.no')
  // Stock et seuil sont comptés en unités de base : le fichier les donne dans l'unité principale (boîtes)
  const inMain = (p, v) => Number((Number(v) / mainUnitOf(p).base_quantity).toFixed(2))
  const rows = products.map(p => ({
    barcode:          String(p.barcode), // texte : Excel ne doit pas l'afficher en 1,23E+12
    name:             p.name,
    category:         p.category?.name ?? '',
    sale_price:       Number(p.sale_price),
    purchase_price:   Number(p.purchase_price),
    stock:            inMain(p, p.stock),
    threshold:        inMain(p, p.threshold),
    unit_type:        te('unitTypes', p.unit_type),
    units:            packagingText(p),
    prescription_req: yesNo(p.prescription_req),
    description:      p.description ?? '',
  }))

  const sheet = XLSX.utils.aoa_to_sheet([
    COLUMNS.map(c => t(c.label, { currency: currentCurrency() })),
    ...rows.map(r => COLUMNS.map(c => r[c.key])),
  ])
  sheet['!cols'] = COLUMNS.map(c => ({ wch: c.width }))
  const book = XLSX.utils.book_new()
  if (LOCALES.find(l => l.code === locale.value)?.dir === 'rtl') book.Workbook = { Views: [{ RTL: true }] }
  XLSX.utils.book_append_sheet(book, sheet, t('products.sheet.name').slice(0, 31))
  XLSX.writeFile(book, `${t('products.sheet.file')}-${new Date().toISOString().slice(0, 10)}.xlsx`)
}

/**
 * Lit un .xlsx / .xls / .csv choisi par l'utilisateur → lignes pour POST /products/import.
 * Chaque ligne garde son numéro dans le fichier (line) pour que les erreurs du serveur pointent la bonne ligne.
 * Lance une Error (message traduit) si le fichier est illisible ou s'il manque des colonnes.
 */
export async function readProductSheet(file) {
  const XLSX = await loadXlsx()
  let book
  // raw : un CSV est lu tel quel (texte), sinon un code-barres « 0123 » deviendrait le nombre 123
  try { book = XLSX.read(await file.arrayBuffer(), { raw: true }) }
  catch { throw new Error(t('products.sheet.unreadable')) }

  const sheet = book.Sheets[book.SheetNames[0]]
  // blankrows : les lignes vides sont gardées pour que l'index donne le vrai numéro de ligne
  const table = sheet?.['!ref'] ? XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', blankrows: true }) : []
  const firstLine = sheet?.['!ref'] ? XLSX.utils.decode_range(sheet['!ref']).s.r + 1 : 1
  const headerAt = table.findIndex(cells => cells.some(v => String(v).trim() !== ''))
  if (headerAt < 0) throw new Error(t('products.sheet.empty'))

  const header = table[headerAt]
  const keys = header.map(h => HEADER_KEYS.get(norm(h)))
  const missing = REQUIRED.filter(k => !keys.includes(k))
  if (missing.length) {
    const labels = missing.map(k => t(COLUMNS.find(c => c.key === k).label, { currency: currentCurrency() }))
    throw new Error(t('products.sheet.missingColumns', { list: labels.join(', ') }))
  }

  const rows = []
  for (let i = headerAt + 1; i < table.length; i++) {
    const cells = table[i] ?? []
    if (cells.every(v => String(v).trim() === '')) continue
    const row = { line: firstLine + i }
    keys.forEach((k, j) => { if (k) row[k] = cells[j] })
    if (String(row.unit_type ?? '').trim()) row.unit_type = unitCode(row.unit_type)
    if (String(row.units ?? '').trim()) row.units = packagingCodes(row.units)
    rows.push(row)
  }
  if (!rows.length) throw new Error(t('products.sheet.empty'))
  return rows
}
