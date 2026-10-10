const currencyFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
});

const numberFormatter = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 });

export const formatCurrency = (value: number): string => currencyFormatter.format(value);

export const formatPriceRange = (min: number, max: number): string =>
  min === max ? formatCurrency(min) : `${formatCurrency(min)} – ${formatCurrency(max)}`;

export const formatDate = (isoDate: string): string => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) return isoDate;
  const [, year, month, day] = match;
  return `${day}/${month}/${year}`;
};

export const formatArea = (width: number, length: number): string =>
  `${numberFormatter.format(width * length)} m²`;

export const formatMeters = (value: number): string => `${numberFormatter.format(value)} m`;
