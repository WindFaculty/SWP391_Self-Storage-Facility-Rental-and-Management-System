const currencyFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
});

const numberFormatter = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 });

const dateFormatter = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const dateTimeFormatter = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

const timeFormatter = new Intl.DateTimeFormat('vi-VN', {
  hour: '2-digit',
  minute: '2-digit',
});

const toDate = (value: string): Date | null => {
  const date = new Date(value.length === 10 ? `${value}T00:00:00` : value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const formatDateTime = (isoDateTime: string): string => {
  const date = toDate(isoDateTime);
  return date ? dateTimeFormatter.format(date) : isoDateTime;
};

export const formatTime = (isoDateTime: string): string => {
  const date = toDate(isoDateTime);
  return date ? timeFormatter.format(date) : isoDateTime;
};

export const formatCurrency = (value: number): string => currencyFormatter.format(value);

export const formatNumber = (value: number): string => numberFormatter.format(value);

export const formatPriceRange = (min: number, max: number): string =>
  min === max ? formatCurrency(min) : `${formatCurrency(min)} – ${formatCurrency(max)}`;

export const formatDate = (isoDate: string): string => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (match) {
    const [, year, month, day] = match;
    return `${day}/${month}/${year}`;
  }
  const date = toDate(isoDate);
  return date ? dateFormatter.format(date) : isoDate;
};

export const formatArea = (sizeOrWidth: number, length?: number): string =>
  `${numberFormatter.format(length === undefined ? sizeOrWidth : sizeOrWidth * length)} m²`;

export const formatMeters = (value: number): string => `${numberFormatter.format(value)} m`;
