// Conditionnements d'un produit (productUnits) : boîte → plaquette → comprimé.
// L'API les stocke à plat (base_quantity = unités de base contenues) ; le formulaire les édite en chaîne
// de niveaux, du plus grand au plus petit : « 1 boîte contient 2 plaquettes », « 1 plaquette contient 10 comprimés ».

import { te, fmtNum } from '../i18n/index.js'
import { roundMoney } from './money.js'

// Unités proposées dans l'éditeur (pas de ml / mg : la vente se fait au flacon, au tube…)
export const UNIT_CHOICES = [
  'BOX', 'CARTON', 'BLISTER', 'TABLET', 'CAPSULE', 'SACHET', 'PACKET', 'BOTTLE', 'AMPOULE', 'VIAL',
  'TUBE', 'JAR', 'SPRAY', 'SUPPOSITORY', 'PATCH', 'INHALER', 'PIECE',
]

/** Unités de base contenues par chaque niveau : [boîte 2, plaquette 10, comprimé] → [20, 10, 1] (NaN si incomplet) */
export function levelSizes(levels) {
  const sizes = new Array(levels.length)
  sizes[levels.length - 1] = 1
  for (let i = levels.length - 2; i >= 0; i--) {
    const per = Number(levels[i].per)
    sizes[i] = Number.isInteger(per) && per > 0 ? sizes[i + 1] * per : NaN
  }
  return sizes
}

/** productUnits de l'API (plus grand d'abord) → niveaux du formulaire + index de l'unité principale */
export function levelsFromUnits(units, fallbackUnit = 'BOX') {
  if (!units?.length) return { levels: [newLevel(fallbackUnit)], mainIndex: 0 }
  const sorted = [...units].sort((a, b) => b.base_quantity - a.base_quantity)
  const levels = sorted.map((u, i) => ({
    unit:       u.unit,
    per:        i < sorted.length - 1 ? u.base_quantity / sorted[i + 1].base_quantity : null,
    sellable:   u.sellable,
    sale_price: u.sale_price != null ? Number(u.sale_price) : null,
  }))
  return { levels, mainIndex: Math.max(0, sorted.findIndex(u => u.is_main)) }
}

/** Niveaux du formulaire → productUnits pour l'API */
export function unitsFromLevels(levels, mainIndex) {
  const sizes = levelSizes(levels)
  return levels.map((l, i) => ({
    unit:          l.unit,
    base_quantity: sizes[i],
    is_main:       i === mainIndex,
    sellable:      i === mainIndex || l.sellable,
    sale_price:    i === mainIndex || l.sale_price === '' ? null : l.sale_price,
  }))
}

export const newLevel = unit => ({ unit, per: null, sellable: true, sale_price: null })

// ── Vente / réception / affichage d'un produit chargé avec ses `units` ─────────────────────────

/** Conditionnements du produit, plus grand d'abord ; un produit jamais configuré a sa seule unité (valant 1) */
export const productUnitsOf = p => (p?.units?.length
  ? [...p.units].sort((a, b) => b.base_quantity - a.base_quantity)
  : [{ unit: p?.unit_type || 'PIECE', base_quantity: 1, is_main: true, is_base: true, sellable: true, sale_price: null }])

export const mainUnitOf    = p => productUnitsOf(p).find(u => u.is_main) || productUnitsOf(p)[0]
export const sellableUnits = p => productUnitsOf(p).filter(u => u.sellable || u.is_main)

/** Prix d'une unité : celui de l'unité principale (sale_price), celui fixé sur l'unité, sinon calculé au prorata */
export function unitPrice(p, u) {
  if (u.is_main) return Number(p.sale_price)
  if (u.sale_price != null) return Number(u.sale_price)
  return roundMoney(Number(p.sale_price) * u.base_quantity / mainUnitOf(p).base_quantity)
}

/**
 * Stock (compté en unités de base) lisible : 47 comprimés d'une boîte de 20 en plaquettes de 10
 * → « 2 Boîte + 7 Comprimé ». Un produit à une seule unité garde l'affichage d'un simple nombre.
 */
export function fmtStock(p) {
  const units = productUnitsOf(p)
  let left = Number(p?.stock || 0)
  if (units.length < 2 || left <= 0) return fmtNum(left, { maximumFractionDigits: 2 })
  const parts = []
  for (const u of units) {
    const n = Math.floor(left / u.base_quantity + 1e-9)
    if (n > 0) { parts.push(`${fmtNum(n)} ${te('unitTypes', u.unit)}`); left -= n * u.base_quantity }
  }
  return parts.join(' + ')
}

/** Stock exprimé dans l'unité principale (pour comparer au seuil, à une quantité en boîtes…) */
export const stockInMainUnit = p => Number(p?.stock || 0) / mainUnitOf(p).base_quantity
