// ponytail: tháng lịch theo đề xuất D02, chỉnh khi D02 được chốt
export const addMonths = (isoDate: string, months: number): string => {
  const [year, month, day] = isoDate.split('-').map(Number);
  const target = new Date(Date.UTC(year, month - 1 + months, 1));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(day, lastDay));
  return target.toISOString().slice(0, 10);
};

export const isValidIsoDate = (value: string): boolean =>
  /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(value).getTime());

export const todayIso = (): string => new Date().toISOString().slice(0, 10);

export interface RentalRange {
  startDate: string;
  endDate: string;
}

export const buildRentalRange = (startDate: string, months: number): RentalRange => ({
  startDate,
  endDate: addMonths(startDate, months),
});
