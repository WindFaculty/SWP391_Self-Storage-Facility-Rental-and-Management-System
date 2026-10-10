export interface RentEstimate {
  minTotal: number;
  maxTotal: number;
}

export const estimateRent = (
  minMonthlyPrice: number,
  maxMonthlyPrice: number,
  months: number,
): RentEstimate => ({
  minTotal: minMonthlyPrice * months,
  maxTotal: maxMonthlyPrice * months,
});
