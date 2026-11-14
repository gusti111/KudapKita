import type { PublicProduct } from '@/domain/entities/Product';

// Illustrative catalog only. Prices and availability must be confirmed by the owner.
export const DEMO_PRODUCTS: PublicProduct[] = [
  { id: 'demo-doko-doko-bugis', name: 'Doko-Doko Bugis', slug: 'doko-doko-bugis', shortDescription: 'Kudapan tradisional berbahan ketan dengan isian manis.', categoryId: 'tradisional', categoryName: 'Tradisional', price: null, availability: 'PRE_ORDER', isPublished: true, sortOrder: 1 },
  { id: 'demo-risol-kentang-bengkuang', name: 'Risol Kentang Bengkuang', slug: 'risol-kentang-bengkuang', shortDescription: 'Risol gurih dengan isian kentang dan bengkuang.', categoryId: 'gurih', categoryName: 'Gurih', price: null, availability: 'AVAILABLE', isPublished: true, sortOrder: 2 },
  { id: 'demo-risol-mayo', name: 'Risol Mayo', slug: 'risol-mayo', shortDescription: 'Risol gurih dengan isian mayones.', categoryId: 'gurih', categoryName: 'Gurih', price: null, availability: 'AVAILABLE', isPublished: true, sortOrder: 3 },
  { id: 'demo-onde-onde', name: 'Onde-onde', slug: 'onde-onde', shortDescription: 'Camilan bulat berbalut wijen.', categoryId: 'tradisional', categoryName: 'Tradisional', price: null, availability: 'AVAILABLE', isPublished: true, sortOrder: 4 },
  { id: 'demo-dadar-gulung', name: 'Dadar Gulung', slug: 'dadar-gulung', shortDescription: 'Kue dadar pandan dengan isian kelapa.', categoryId: 'tradisional', categoryName: 'Tradisional', price: null, availability: 'AVAILABLE', isPublished: true, sortOrder: 5 },
  { id: 'demo-apam', name: 'Apam', slug: 'apam', shortDescription: 'Kue tradisional rumahan dengan tekstur lembut.', categoryId: 'tradisional', categoryName: 'Tradisional', price: null, availability: 'AVAILABLE', isPublished: true, sortOrder: 6 },
];
