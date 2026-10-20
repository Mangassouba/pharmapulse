// Conditionnements d'un produit (productUnits) : boîte → plaquette → comprimé.
// L'API les stocke à plat (base_quantity = unités de base contenues) ; le formulaire les édite en chaîne
// de niveaux, du plus grand au plus petit : « 1 boîte contient 2 plaquettes », « 1 plaquette contient 10 comprimés ».

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
