import {
  collection, doc, getDoc, getDocs, limit, orderBy, query, serverTimestamp,
  where, writeBatch, type DocumentData, type Firestore,
} from 'firebase/firestore';
import { db } from '@/infrastructure/firebase/client';
import { callIdempotentKudapKita } from '@/infrastructure/firebase/functions';

function database(): Firestore {
  if (!db) throw new Error('Firebase belum dikonfigurasi.');
  return db;
}

export type ManagedProduct = {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  categoryId: string;
  categoryName: string;
  price: number | null;
  hpp?: number | null;
  unit: string;
  imagePath?: string;
  imageGallery?: string[];
  availability: 'AVAILABLE' | 'SOLD_OUT' | 'PRE_ORDER';
  isPublished: boolean;
  isArchived?: boolean;
  sortOrder: number;
};
export type ProductInput = Omit<ManagedProduct, 'id'>;
export type StockRecord = { productId: string; productName: string; availableQty: number; unit: string; updatedAt?: unknown };
export type CategoryRecord = { id: string; name: string; sortOrder: number; isActive: boolean };
export type DirectSaleLine = { productId: string; quantity: number };

export async function listManagedProducts(): Promise<ManagedProduct[]> {
  const snapshot = await getDocs(collection(database(), 'products'));
  return snapshot.docs
    .map((item) => ({ id: item.id, ...item.data() }) as ManagedProduct)
    .filter((item) => item.isArchived !== true)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, 'id'));
}

export async function listCategories(): Promise<CategoryRecord[]> {
  const snapshot = await getDocs(collection(database(), 'categories'));
  return snapshot.docs.map((item) => ({
    id: item.id,
    name: String(item.data().name ?? ''),
    sortOrder: Number(item.data().sortOrder ?? 0),
    isActive: item.data().isActive !== false,
  })).sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, 'id'));
}

export async function saveCategory(
  input: { name: string; sortOrder: number; isActive: boolean },
  categoryId?: string,
): Promise<string> {
  const name = input.name.trim();
  if (name.length < 2) throw new Error('Nama kategori minimal 2 karakter.');
  if (!Number.isSafeInteger(input.sortOrder) || input.sortOrder < 0) throw new Error('Urutan kategori tidak valid.');
  const store = database();
  const privateRef = categoryId ? doc(store, 'categories', categoryId) : doc(collection(store, 'categories'));
  const data = { name, sortOrder: input.sortOrder, isActive: input.isActive, updatedAt: serverTimestamp() };
  const batch = writeBatch(store);
  batch.set(privateRef, data, { merge: true });
  batch.set(doc(store, 'publicCategories', privateRef.id), data);
  await batch.commit();
  return privateRef.id;
}

export async function saveManagedProduct(input: ProductInput, productId?: string): Promise<string> {
  const name = input.name.trim();
  const slug = input.slug.trim().toLowerCase();
  if (name.length < 2) throw new Error('Nama produk minimal 2 karakter.');
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error('Slug hanya boleh berisi huruf kecil, angka, dan tanda hubung.');
  if (!input.categoryId || !input.categoryName.trim()) throw new Error('Kategori produk wajib diisi.');
  if (input.price !== null && (!Number.isSafeInteger(input.price) || input.price < 0)) throw new Error('Harga harus berupa angka Rupiah positif atau dikosongkan.');
  if (input.hpp != null && (!Number.isSafeInteger(input.hpp) || input.hpp < 0)) throw new Error('HPP harus berupa angka Rupiah positif.');
  if (!Number.isSafeInteger(input.sortOrder) || input.sortOrder < 0) throw new Error('Urutan tampil tidak valid.');
  const imagePath = input.imagePath?.trim() || '';
  const imageGallery = Array.isArray(input.imageGallery) ? input.imageGallery.map((url) => String(url).trim()).filter(Boolean).slice(0, 5) : [];
  if (imagePath && !imagePath.startsWith('/images/products/') && !/^https:\/\/[^\s]+$/i.test(imagePath)) {
    throw new Error('Path foto harus berupa path lokal atau URL HTTPS yang valid.');
  }
  if (imageGallery.some((url) => !url.startsWith('/images/products/') && !/^https:\/\/[^\s]+$/i.test(url))) {
    throw new Error('Galeri foto hanya boleh berisi path lokal atau URL HTTPS yang valid.');
  }

  const store = database();
  const privateRef = productId ? doc(store, 'products', productId) : doc(collection(store, 'products'));
  const publicRef = doc(store, 'publicProducts', privateRef.id);
  const privateData = {
    name, slug, shortDescription: input.shortDescription.trim(),
    categoryId: input.categoryId, categoryName: input.categoryName.trim(),
    price: input.price, hpp: input.hpp ?? null, unit: input.unit.trim() || 'pcs',
    imagePath, imageGallery, availability: input.availability, isPublished: input.isPublished,
    isArchived: false, sortOrder: input.sortOrder, updatedAt: serverTimestamp(),
  };
  const publicData = {
    name: privateData.name, slug: privateData.slug, shortDescription: privateData.shortDescription,
    categoryId: privateData.categoryId, categoryName: privateData.categoryName,
    price: privateData.price, imagePath: privateData.imagePath, imageGallery: privateData.imageGallery,
    availability: privateData.availability, isPublished: privateData.isPublished,
    sortOrder: privateData.sortOrder, updatedAt: serverTimestamp(),
  };
  const batch = writeBatch(store);
  batch.set(privateRef, productId ? privateData : { ...privateData, createdAt: serverTimestamp() });
  batch.set(publicRef, publicData);
  await batch.commit();
  return privateRef.id;
}

export async function archiveManagedProduct(productId: string): Promise<void> {
  const store = database();
  const batch = writeBatch(store);
  batch.set(doc(store, 'products', productId), { isArchived: true, isPublished: false, updatedAt: serverTimestamp() }, { merge: true });
  batch.set(doc(store, 'publicProducts', productId), { isPublished: false, availability: 'SOLD_OUT', updatedAt: serverTimestamp() }, { merge: true });
  await batch.commit();
}

export async function listStock(): Promise<StockRecord[]> {
  const store = database();
  const [products, inventory] = await Promise.all([listManagedProducts(), getDocs(collection(store, 'inventory'))]);
  const byId = new Map(inventory.docs.map((item) => [item.id, item.data()]));
  return products.map((product) => {
    const data = byId.get(product.id) ?? {};
    return { productId: product.id, productName: product.name, availableQty: Number(data.availableQty ?? 0), unit: String(data.unit ?? product.unit ?? 'pcs'), updatedAt: data.updatedAt };
  });
}

export async function recordProduction(productId: string, quantity: number, note: string): Promise<void> {
  if (!Number.isSafeInteger(quantity) || quantity <= 0) throw new Error('Jumlah produksi harus bilangan bulat lebih dari nol.');
  await callIdempotentKudapKita('recordProduction', { productId, quantity, note });
}
export async function adjustFinishedStock(productId: string, delta: number, reason: string): Promise<void> {
  if (!Number.isSafeInteger(delta) || delta === 0) throw new Error('Perubahan stok harus bilangan bulat selain nol.');
  if (reason.trim().length < 3) throw new Error('Alasan penyesuaian stok wajib diisi.');
  await callIdempotentKudapKita('adjustFinishedStock', { productId, delta, reason });
}
export async function listStockMovements(maxRows = 30): Promise<Array<DocumentData & { id: string }>> {
  const snapshot = await getDocs(query(collection(database(), 'stockMovements'), orderBy('createdAt', 'desc'), limit(Math.max(1, Math.min(100, maxRows)))));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
}
export async function listRecentProductionRuns(maxRows = 20): Promise<Array<DocumentData & { id: string }>> {
  const snapshot = await getDocs(query(collection(database(), 'productionRuns'), orderBy('createdAt', 'desc'), limit(Math.max(1, Math.min(100, maxRows)))));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
}
export async function createDirectSale(
  lines: DirectSaleLine[],
  paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'QRIS',
  note = '',
): Promise<{ id: string; total: number }> {
  if (!lines.length) throw new Error('Tambahkan minimal satu produk pada transaksi.');
  const result = await callIdempotentKudapKita<{ items: DirectSaleLine[]; paymentMethod: string; note: string }, { id: string; total: number; created: boolean }>(
    'createDirectSale', { items: lines, paymentMethod, note },
  );
  return { id: result.id, total: result.total };
}

export async function getVerifiedSalesSummary(): Promise<{ onlineRevenue: number; directRevenue: number; verifiedTransactions: number }> {
  const store = database();
  const [payments, sales] = await Promise.all([
    getDocs(query(collection(store, 'payments'), where('status', '==', 'VERIFIED'))),
    getDocs(query(collection(store, 'directSales'), where('paymentStatus', '==', 'VERIFIED'))),
  ]);
  return {
    onlineRevenue: payments.docs.reduce((sum, item) => sum + Number(item.data().amount ?? 0), 0),
    directRevenue: sales.docs.reduce((sum, item) => sum + Number(item.data().total ?? 0), 0),
    verifiedTransactions: payments.size + sales.size,
  };
}

export async function getStoreSettings(): Promise<{ publicSettings: DocumentData; privateSettings: DocumentData }> {
  const store = database();
  const [publicSnapshot, privateSnapshot] = await Promise.all([
    getDoc(doc(store, 'publicSettings', 'storefront')),
    getDoc(doc(store, 'privateSettings', 'business')),
  ]);
  return { publicSettings: publicSnapshot.exists() ? publicSnapshot.data() : {}, privateSettings: privateSnapshot.exists() ? privateSnapshot.data() : {} };
}

export async function saveStoreSettings(
  publicSettings: {
    displayName: string; tagline: string; whatsappNumber: string; instagramHandle: string;
    paymentBankName: string; paymentAccountNumber: string; paymentAccountHolder: string;
    paymentEwalletName: string; paymentEwalletNumber: string;
  },
  privateSettings: { bankName: string; bankAccountNumber: string; bankAccountHolder: string; pickupAddress: string },
): Promise<void> {
  const displayName = publicSettings.displayName.trim();
  const whatsappNumber = publicSettings.whatsappNumber.replace(/\D/g, '');
  if (!displayName) throw new Error('Nama toko wajib diisi.');
  if (whatsappNumber.length < 8 || whatsappNumber.length > 16) throw new Error('Nomor WhatsApp belum valid.');
  const store = database();
  const batch = writeBatch(store);
  batch.set(doc(store, 'publicSettings', 'storefront'), {
    displayName, tagline: publicSettings.tagline.trim(), whatsappNumber,
    instagramHandle: publicSettings.instagramHandle.trim(),
    paymentBankName: publicSettings.paymentBankName.trim(),
    paymentAccountNumber: publicSettings.paymentAccountNumber.trim(),
    paymentAccountHolder: publicSettings.paymentAccountHolder.trim(),
    paymentEwalletName: publicSettings.paymentEwalletName.trim(),
    paymentEwalletNumber: publicSettings.paymentEwalletNumber.trim(),
    updatedAt: serverTimestamp(),
  });
  batch.set(doc(store, 'privateSettings', 'business'), {
    bankName: privateSettings.bankName.trim(), bankAccountNumber: privateSettings.bankAccountNumber.trim(),
    bankAccountHolder: privateSettings.bankAccountHolder.trim(), pickupAddress: privateSettings.pickupAddress.trim(),
    updatedAt: serverTimestamp(),
  });
  await batch.commit();
}

export type DailyVerifiedSalesPoint = {
  dateKey: string;
  label: string;
  revenue: number;
  transactions: number;
};
export type VerifiedSalesAnalytics = {
  periodDays: number;
  onlineRevenue: number;
  directRevenue: number;
  totalRevenue: number;
  verifiedTransactions: number;
  previousTotalRevenue: number;
  daily: DailyVerifiedSalesPoint[];
  directBestSellers: Array<{ productId: string; productName: string; quantity: number }>;
};

function timestampDate(value: unknown): Date | null {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (value && typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
    const date = (value.toDate() as Date);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  return null;
}

/** Revenue analytics only includes payment records already marked VERIFIED. */
export async function getVerifiedSalesAnalytics(periodDays = 7): Promise<VerifiedSalesAnalytics> {
  const days = Math.max(7, Math.min(90, Number.isFinite(periodDays) ? Math.floor(periodDays) : 7));
  const store = database();
  const [payments, directSales] = await Promise.all([
    getDocs(query(collection(store, 'payments'), where('status', '==', 'VERIFIED'))),
    getDocs(query(collection(store, 'directSales'), where('paymentStatus', '==', 'VERIFIED'))),
  ]);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(today);
  start.setDate(start.getDate() - (days - 1));
  const previousStart = new Date(start);
  previousStart.setDate(previousStart.getDate() - days);
  const keyFor = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const keys = Array.from({ length: days }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return { key: keyFor(date), label: date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }) };
  });
  const dailyMap = new Map(keys.map((item) => [item.key, { dateKey: item.key, label: item.label, revenue: 0, transactions: 0 }]));
  let onlineRevenue = 0;
  let directRevenue = 0;
  let onlineCount = 0;
  let directCount = 0;
  let previousTotalRevenue = 0;
  const directUnits = new Map<string, { productId: string; productName: string; quantity: number }>();

  for (const snapshot of payments.docs) {
    const data = snapshot.data();
    const date = timestampDate(data.verifiedAt ?? data.createdAt);
    if (!date) continue;
    const key = keyFor(date);
    const bucket = dailyMap.get(key);
    const amount = Number(data.amount ?? 0);
    if (!Number.isSafeInteger(amount) || amount < 0) continue;
    if (!bucket) { if (date >= previousStart && date < start) previousTotalRevenue += amount; continue; }
    onlineRevenue += amount;
    onlineCount += 1;
    bucket.revenue += amount;
    bucket.transactions += 1;
  }

  for (const snapshot of directSales.docs) {
    const data = snapshot.data();
    const date = timestampDate(data.createdAt ?? data.verifiedAt);
    if (!date) continue;
    const key = keyFor(date);
    const bucket = dailyMap.get(key);
    const amount = Number(data.total ?? 0);
    if (!Number.isSafeInteger(amount) || amount < 0) continue;
    if (!bucket) { if (date >= previousStart && date < start) previousTotalRevenue += amount; continue; }
    directRevenue += amount;
    directCount += 1;
    bucket.revenue += amount;
    bucket.transactions += 1;
    if (Array.isArray(data.items)) {
      for (const raw of data.items) {
        if (!raw || typeof raw !== 'object') continue;
        const item = raw as Record<string, unknown>;
        const productId = String(item.productId ?? '');
        const quantity = Number(item.quantity ?? 0);
        if (!productId || !Number.isSafeInteger(quantity) || quantity <= 0) continue;
        const current = directUnits.get(productId) ?? { productId, productName: String(item.productName ?? productId), quantity: 0 };
        current.quantity += quantity;
        directUnits.set(productId, current);
      }
    }
  }

  return {
    periodDays: days,
    onlineRevenue,
    directRevenue,
    totalRevenue: onlineRevenue + directRevenue,
    verifiedTransactions: onlineCount + directCount,
    previousTotalRevenue,
    daily: [...dailyMap.values()],
    directBestSellers: [...directUnits.values()].sort((a, b) => b.quantity - a.quantity).slice(0, 5),
  };
}
