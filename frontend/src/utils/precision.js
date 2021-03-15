import { USDC_DECIMAL_POINTS } from '@/config';

export function toDisplayValue(rawValue) {
  return Number(rawValue) / (10 ** USDC_DECIMAL_POINTS);
}

export function toRawValue(displayValue) {
  return Math.floor(Number(displayValue) * (10 ** USDC_DECIMAL_POINTS));
}
