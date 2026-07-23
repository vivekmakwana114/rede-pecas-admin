/**
 * Formats a numeric value as an Angolan Kwanza currency string
 * (e.g. 1500 → "1.500 Kz"), with no decimal places.
 */
export const formatKwanza = (value: number) =>
  new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA', maximumFractionDigits: 0 }).format(value);
