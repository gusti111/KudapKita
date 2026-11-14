import type { PublicProduct } from '@/domain/entities/Product';

// Demo-only records. Replace these with the real KudapKita catalog in Firestore.
export const DEMO_PRODUCTS: PublicProduct[] = [
  { id: 'demo-klepon', name: 'Klepon', slug: 'klepon', shortDescription: 'Camilan tradisional dengan aroma pandan.', categoryId: 'tradisional', categoryName: 'Tradisional', price: null, availability: 'AVAILABLE', isPublished: true, sortOrder: 1 },
  { id: 'demo-risol', name: 'Risol Mayones', slug: 'risol-mayones', shortDescription: 'Risol gurih dengan isian creamy.', categoryId: 'gurih', categoryName: 'Gurih', price: null, availability: 'AVAILABLE', isPublished: true, sortOrder: 2 },
  { id: 'demo-doko', name: 'Doko-Doko', slug: 'doko-doko', shortDescription: 'Jajanan tradisional dengan tekstur lembut.', categoryId: 'tradisional', categoryName: 'Tradisional', price: null, availability: 'PRE_ORDER', isPublished: true, sortOrder: 3 },
  { id: 'demo-dadar', name: 'Dadar Gulung', slug: 'dadar-gulung', shortDescription: 'Camilan manis dengan isian kelapa.', categoryId: 'tradisional', categoryName: 'Tradisional', price: null, availability: 'AVAILABLE', isPublished: true, sortOrder: 4 },
];
