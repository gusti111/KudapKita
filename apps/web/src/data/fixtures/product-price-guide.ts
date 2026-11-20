import { formatRupiah } from '@/shared/utils/format';

/** Rentang awal hasil pembahasan usaha; bukan harga final per SKU. */
export const PRODUCT_PRICE_GUIDE = {
  unitMin: 1_500,
  unitMax: 2_000,
  packFourMin: 6_000,
  packFourMax: 8_000,
  packFiveMin: 7_500,
  packFiveMax: 10_000,
  packTenPromoMin: 12_000,
  packTenPromoMax: 13_000,
} as const;

export function unitPriceGuideLabel() {
  return `${formatRupiah(PRODUCT_PRICE_GUIDE.unitMin)}–${formatRupiah(PRODUCT_PRICE_GUIDE.unitMax)}`;
}

export function fourPieceGuideLabel() {
  return `${formatRupiah(PRODUCT_PRICE_GUIDE.packFourMin)}–${formatRupiah(PRODUCT_PRICE_GUIDE.packFourMax)}`;
}

export function fivePieceGuideLabel() {
  return `${formatRupiah(PRODUCT_PRICE_GUIDE.packFiveMin)}–${formatRupiah(PRODUCT_PRICE_GUIDE.packFiveMax)}`;
}

export function tenPiecePromoGuideLabel() {
  return `${formatRupiah(PRODUCT_PRICE_GUIDE.packTenPromoMin)}–${formatRupiah(PRODUCT_PRICE_GUIDE.packTenPromoMax)}`;
}
