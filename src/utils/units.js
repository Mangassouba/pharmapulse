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

/**
 * Prix d'une unité : celui de l'unité principale (sale_price), celui fixé sur l'unité, sinon calculé au prorata
 * et arrondi dans la devise du produit (p.currency sur le site public, sinon celle de la pharmacie connectée).
 * Même règle que unitSalePrice() côté API.
 */
export function unitPrice(p, u) {
  if (u.is_main) return Number(p.sale_price)
  if (u.sale_price != null) return Number(u.sale_price)
  return roundMoney(Number(p.sale_price) * u.base_quantity / mainUnitOf(p).base_quantity, p.currency || undefined)
}

/** Nombre maximal de cette unité que le stock permet (2 boîtes et 7 comprimés : 2 boîtes, 47 comprimés) */
export const maxUnits = (p, u) => Math.floor(Number(p?.stock || 0) / u.base_quantity + 1e-9)

/**
 * Stock (compté en unités de base) lisible : 47 comprimés d'une boîte de 20 en plaquettes de 10
 * → « 2 Boîte + 7 Comprimé ». Un produit à une seule unité garde l'affichage d'un simple nombre.
 */
export const fmtStock = p => fmtQty(p, p?.stock)

/**
 * Toute quantité du produit en unités de base (stock, seuil, lot, mouvement, écart d'inventaire), lisible.
 * Le signe est gardé devant : −30 comprimés d'une boîte de 20 → « −1 Boîte + 10 Comprimé ».
 */
export function fmtQty(p, qty) {
  const value = Number(qty || 0)
  if (productUnitsOf(p).length < 2 || value === 0) return fmtNum(value, { maximumFractionDigits: 2 })
  const parts = Object.entries(splitQty(p, Math.abs(value)))
    .filter(([, n]) => n > 0)
    .map(([unit, n]) => `${fmtNum(n)} ${te('unitTypes', unit)}`)
  return (value < 0 ? '−' : '') + parts.join(' + ')
}

/** Quantité en unités de base répartie par unité, plus grande d'abord : 47 → { BOX: 2, BLISTER: 0, TABLET: 7 } */
export function splitQty(p, qty) {
  let left = Math.max(0, Number(qty || 0))
  const out = {}
  for (const u of productUnitsOf(p)) {
    out[u.unit] = Math.floor(left / u.base_quantity + 1e-9)
    left -= out[u.unit] * u.base_quantity
  }
  return out
}

/** Inverse de splitQty : { BOX: 2, TABLET: 7 } → 47 unités de base */
export const joinQty = (p, counts) =>
  productUnitsOf(p).reduce((s, u) => s + (Number(counts?.[u.unit]) || 0) * u.base_quantity, 0)

/** Stock exprimé dans l'unité principale (pour comparer au seuil, à une quantité en boîtes…) */
export const stockInMainUnit = p => Number(p?.stock || 0) / mainUnitOf(p).base_quantity
