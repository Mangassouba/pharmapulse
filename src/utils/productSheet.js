// Fichier Excel des produits : le même fichier sert à l'export et à l'import (exporter, modifier, réimporter).
// Les en-têtes sont écrits dans la langue de l'interface ; à l'import, ils sont reconnus dans les trois langues
// ou sous leur nom technique (barcode, sale_price…), pour qu'un fichier exporté en arabe se réimporte en français.
import { LOCALES, locale, t, tIn } from '../i18n/index.js'

// SheetJS (~400 Ko) n'est chargé qu'au moment d'exporter ou d'importer
const loadXlsx = () => import('xlsx')

const COLUMNS = [
  { key: 'barcode',          label: 'products.barcode',              width: 16 },
  { key: 'name',             label: 'common.name',                   width: 32 },
  { key: 'category',         label: 'common.category',               width: 18 },
  { key: 'sale_price',       label: 'products.salePriceMru',         width: 14 },
  { key: 'purchase_price',   label: 'reception.purchasePrice',      width: 14 },
  { key: 'stock',            label: 'common.stock',                  width: 10 },
  { key: 'threshold',        label: 'products.alertThreshold',       width: 12 },
  { key: 'unit_type',        label: 'products.unitType',             width: 12 },
  { key: 'unit_quantity',    label: 'products.qtyPerUnit',           width: 12 },
  { key: 'prescription_req', label: 'products.prescriptionRequired', width: 12 },
  { key: 'is_divisible',     label: 'products.divisible',            width: 10 },
  { key: 'description',      label: 'common.description',            width: 32 },
]
const REQUIRED = ['barcode', 'name', 'category', 'sale_price', 'purchase_price']

const norm = s => String(s ?? '').trim().toLowerCase()

// En-tête lu dans le fichier → clé de colonne
const HEADER_KEYS = new Map(COLUMNS.flatMap(c => [
  [norm(c.key), c.key],
  ...LOCALES.map(l => [norm(tIn(l.code, c.label)), c.key]),
]))

/** Télécharge les produits (réponse de GET /products/export) en .xlsx */
export async function downloadProductSheet(products) {
  const XLSX = await loadXlsx()
  const yesNo = v => t(v ? 'products.sheet.yes' : 'products.sheet.no')
  const rows = products.map(p => ({
    barcode:          String(p.barcode), // texte : Excel ne doit pas l'afficher en 1,23E+12
    name:             p.name,
    category:         p.category?.name ?? '',
    sale_price:       Number(p.sale_price),
    purchase_price:   Number(p.purchase_price),
    stock:            p.stock,
    threshold:        p.threshold,
    unit_type:        p.unit_type,
    unit_quantity:    p.unit_quantity ?? '',
    prescription_req: yesNo(p.prescription_req),
    is_divisible:     yesNo(p.is_divisible),
    description:      p.description ?? '',
  }))

  const sheet = XLSX.utils.aoa_to_sheet([
    COLUMNS.map(c => t(c.label)),
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
    const labels = missing.map(k => t(COLUMNS.find(c => c.key === k).label))
    throw new Error(t('products.sheet.missingColumns', { list: labels.join(', ') }))
  }

  const rows = []
  for (let i = headerAt + 1; i < table.length; i++) {
    const cells = table[i] ?? []
    if (cells.every(v => String(v).trim() === '')) continue
    const row = { line: firstLine + i }
    keys.forEach((k, j) => { if (k) row[k] = cells[j] })
    rows.push(row)
  }
  if (!rows.length) throw new Error(t('products.sheet.empty'))
  return rows
}
