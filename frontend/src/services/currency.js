/**
 * Format a price with optional conversion to account base currency.
 *
 * If priceCurrency differs from targetCurrency and exchangeRate is provided,
 * shows: "120 USD | ~140 EUR"
 * Otherwise just: "120 EUR"
 */
export function formatDualPrice(amount, priceCurrency, targetCurrency, exchangeRate) {
  if (amount == null) return '—';
  const val = Number(amount);
  const orig = `${val.toFixed(2)} ${priceCurrency || targetCurrency || ''}`;

  if (priceCurrency && targetCurrency && priceCurrency !== targetCurrency && exchangeRate) {
    const converted = (val * Number(exchangeRate)).toFixed(2);
    return `${orig} | ≈${converted} ${targetCurrency}`;
  }

  return orig;
}

/**
 * Get just the converted amount (for summation purposes).
 * Returns amount in target currency.
 */
export function toBaseCurrency(amount, priceCurrency, targetCurrency, exchangeRate) {
  if (amount == null) return 0;
  const val = Number(amount);
  if (priceCurrency && targetCurrency && priceCurrency !== targetCurrency && exchangeRate) {
    return val * Number(exchangeRate);
  }
  return val;
}

/** Common currency list */
export const CURRENCIES = [
  'EUR',
  'USD',
  'GBP',
  'JPY',
  'CHF',
  'CAD',
  'AUD',
  'PLN',
  'CZK',
  'SEK',
  'NOK',
  'DKK',
  'HUF',
  'RON',
  'TRY',
  'THB',
  'IDR',
  'MYR',
  'SGD',
  'HKD',
  'KRW',
  'BRL',
  'MXN',
  'ARS',
  'CLP',
  'COP',
  'PEN',
  'INR',
  'CNY',
  'TWD',
  'NZD',
  'ZAR',
  'ILS',
  'AED',
  'UAH',
  'GEL',
  'MAD',
  'EGP',
];
