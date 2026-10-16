// Countries supported by the platform: ISO 3166-1 code → currency (ISO 4217) and its decimals.
// Same list as the API (pharmapulse-api/src/config/countries.js) — keep both in sync.
export const COUNTRIES = {
  MR: { currency: 'MRU', decimals: 2 }, // Mauritanie
  SN: { currency: 'XOF', decimals: 0 }, // Sénégal
  ML: { currency: 'XOF', decimals: 0 }, // Mali
  CI: { currency: 'XOF', decimals: 0 }, // Côte d'Ivoire
  BF: { currency: 'XOF', decimals: 0 }, // Burkina Faso
  NE: { currency: 'XOF', decimals: 0 }, // Niger
  GN: { currency: 'GNF', decimals: 0 }, // Guinée
  MA: { currency: 'MAD', decimals: 2 }, // Maroc
  DZ: { currency: 'DZD', decimals: 2 }, // Algérie
  TN: { currency: 'TND', decimals: 3 }, // Tunisie
}

export const DEFAULT_COUNTRY  = 'MR'
export const DEFAULT_CURRENCY = COUNTRIES[DEFAULT_COUNTRY].currency
export const COUNTRY_CODES    = Object.keys(COUNTRIES)
