import { addMonths } from '../../catalog/lib/rentalRange';

export interface RenewalQuote {
  totalAmount: number;
  newEndDate: string;
}

export const buildRenewalQuote = (
  monthlyPrice: number,
  currentEndDate: string,
  additionalMonths: number,
): RenewalQuote => ({
  totalAmount: monthlyPrice * additionalMonths,
  newEndDate: addMonths(currentEndDate, additionalMonths),
});
