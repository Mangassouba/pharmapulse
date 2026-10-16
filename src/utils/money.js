import { fmtNum } from '../i18n/index.js'
import { COUNTRIES, DEFAULT_CURRENCY } from '../config/countries.js'
import { useAuthStore } from '../stores/auth.js'

const DECIMALS = Object.fromEntries(Object.values(COUNTRIES).map(c => [c.currency, c.decimals]))

/** Currency of the logged-in pharmacy (staff space), else that of its country; the default one elsewhere */
export function currentCurrency() {
  const ph = useAuthStore().user?.pharmacy
  return ph?.currency || COUNTRIES[ph?.country]?.currency || DEFAULT_CURRENCY
}

/**
 * fmtMoney(1500) → "1 500 MRU" in the current pharmacy's currency.
 * { currency } formats in another one (public pages: the pharmacy shown);
 * { fixed: true } always prints the decimals (receipts: "1 500,00 MRU").
 */
export function fmtMoney(v, { currency, fixed = false } = {}) {
  const cur = currency || currentCurrency()
  const d   = DECIMALS[cur] ?? 2
  return `${fmtNum(v, { minimumFractionDigits: fixed ? d : 0, maximumFractionDigits: d })} ${cur}`
}
