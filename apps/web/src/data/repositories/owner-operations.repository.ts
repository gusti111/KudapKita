import {
  collection, doc, getDoc, getDocs, limit, orderBy, query, runTransaction,
  serverTimestamp, writeBatch, where, type DocumentData, type Firestore,
} from 'firebase/firestore';
import { db } from '@/infrastructure/firebase/client';

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
  availability: 'AVAILABLE' | 'SOLD_OUT' | 'PRE_ORDER';
  isPublished: boolean;
  isArchived?: boolean;
  sortOrder: number;
};
export type ProductInput = Omit<ManagedProduct, 'id'>;
export type StockRecord = {
  productId: string;
  productName: string;
  availableQty: number;
  unit: string;
  updatedAt?: unknown;
};
export type CategoryRecord = { id: string; name: string; sortOrder: number; isActive: boolean };

export async function listManagedProducts(): Promise<ManagedProduct[]> {
  const snapshot = await getDocs(collection(database(), 'products'));
  return snapshot.docs
    .map((item) => ({ id: item.id, ...item.data() }) as ManagedProduct)
    .filter((item) => item.isArchived !== true)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, 'id'));
}

export async function saveManagedProduct(input: ProductInput, productId?: string): Promise<string> {
  const cleanName = input.name.trim();
  const cleanSlug = input.slug.trim().toLowerCase();
  if (cleanName.length < 2) throw new Error('Nama produk minimal 2 karakter.');
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(cleanSlug)) throw new Error('Slug hanya boleh berisi huruf kecil, angka, dan tanda hubung.');
  if (!input.categoryId || !input.categoryName.trim()) throw new Error('Kategori produk wajib diisi.');
  if (input.price !== null && (!Number.isSafeInteger(input.price) || input.price < 0)) {
    throw new Error('Harga harus berupa angka Rupiah positif atau dikosongkan bila belum ditetapkan.');
  }
  if (input.hpp !== null && input.hpp !== undefined && (!Number.isSafeInteger(input.hpp) || input.hpp < 0)) {
    throw new Error('HPP harus berupa angka Rupiah positif.');
  }
  if (!Number.isSafeInteger(input.sortOrder) || input.sortOrder < 0) throw new Error('Urutan tampil tidak valid.');

  const store = database();
  const privateRef = productId ? doc(store, 'products', productId) : doc(collection(store, 'products'));
  const publicRef = doc(store, 'publicProducts', privateRef.id);
  const batch = writeBatch(store);
  const privateData = {
    name: cleanName,
    slug: cleanSlug,
    shortDescription: input.shortDescription.trim(),
    categoryId: input.categoryId,
    categoryName: input.categoryName.trim(),
    price: input.price,
    hpp: input.hpp ?? null,
    unit: input.unit.trim() || 'pcs',
    imagePath: input.imagePath?.trim() || '',
    availability: input.availability,
    isPublished: input.isPublished,
    isArchived: false,
    sortOrder: input.sortOrder,
    updatedAt: serverTimestamp(),
  };
  // The public projection is an explicit whitelist: HPP and internal notes stay private.
  const publicData = {
    name: privateData.name,
    slug: privateData.slug,
    shortDescription: privateData.shortDescription,
    categoryId: privateData.categoryId,
    categoryName: privateData.categoryName,
    price: privateData.price,
    imagePath: privateData.imagePath,
    availability: privateData.availability,
    isPublished: privateData.isPublished,
    sortOrder: privateData.sortOrder,
    updatedAt: serverTimestamp(),
  };
  if (productId) {
    batch.set(privateRef, privateData, { merge: true });
  } else {
    batch.set(privateRef, { ...privateData, createdAt: serverTimestamp() });
  }
  batch.set(publicRef, publicData, { merge: true });
  await batch.commit();
  return privateRef.id;
}

export async function archiveManagedProduct(productId: string): Promise<void> {
  const store = database();
  const batch = writeBatch(store);
  batch.set(doc(store, 'products', productId), {
    isArchived: true, isPublished: false, updatedAt: serverTimestamp(),
  }, { merge: true });
  batch.set(doc(store, 'publicProducts', productId), {
    isPublished: false, availability: 'SOLD_OUT', updatedAt: serverTimestamp(),
  }, { merge: true });
  await batch.commit();
}

export async function listStock(): Promise<StockRecord[]> {
  const store = database();
  const [products, stock] = await Promise.all([
    listManagedProducts(),
    getDocs(collection(store, 'inventory')),
  ]);
  const byId = new Map<string, DocumentData>();
  stock.docs.forEach((item) => byId.set(item.id, item.data()));
  return products.map((product) => {
    const data = byId.get(product.id) ?? {};
    return {
      productId: product.id,
      productName: product.name,
      availableQty: Number(data.availableQty ?? 0),
      unit: String(data.unit ?? product.unit ?? 'pcs'),
      updatedAt: data.updatedAt,
    };
  });
}

async function writeStockMovement(
  productId: string,
  quantityDelta: number,
  type: 'PRODUCTION' | 'ADJUSTMENT',
  reason: string,
): Promise<void> {
  if (!Number.isSafeInteger(quantityDelta) || quantityDelta === 0) {
    throw new Error('Jumlah perubahan stok harus berupa bilangan bulat dan tidak boleh nol.');
  }
  const store = database();
  const inventoryRef = doc(store, 'inventory', productId);
  const productRef = doc(store, 'products', productId);
  const movementRef = doc(collection(store, 'stockMovements'));
  const productionRef = type === 'PRODUCTION' ? doc(collection(store, 'productionRuns')) : null;

  await runTransaction(store, async (transaction) => {
    const [inventorySnap, productSnap] = await Promise.all([
      transaction.get(inventoryRef),
      transaction.get(productRef),
    ]);
    if (!productSnap.exists() || productSnap.data().isArchived === true) {
      throw new Error('Produk tidak ditemukan atau sudah diarsipkan.');
    }
    const product = productSnap.data();
    const current = inventorySnap.exists() ? Number(inventorySnap.data().availableQty ?? 0) : 0;
    const next = current + quantityDelta;
    if (!Number.isSafeInteger(current) || current < 0 || next < 0) {
      throw new Error('Stok tidak cukup atau data persediaan tidak valid.');
    }
    transaction.set(inventoryRef, {
      productId,
      productName: String(product.name),
      availableQty: next,
      unit: String(product.unit ?? 'pcs'),
      updatedAt: serverTimestamp(),
    }, { merge: true });
    transaction.set(movementRef, {
      productId,
      productName: String(product.name),
      type,
      quantity: quantityDelta,
      beforeQty: current,
      afterQty: next,
      reason: reason.trim(),
      createdAt: serverTimestamp(),
    });
    if (productionRef) {
      transaction.set(productionRef, {
        productId,
        productName: String(product.name),
        quantity: quantityDelta,
        unit: String(product.unit ?? 'pcs'),
        note: reason.trim(),
        status: 'COMPLETED',
        stockMovementId: movementRef.id,
        createdAt: serverTimestamp(),
      });
    }
  });
}

export function recordProduction(productId: string, quantity: number, note: string): Promise<void> {
  if (!Number.isSafeInteger(quantity) || quantity <= 0) throw new Error('Jumlah produksi harus berupa bilangan bulat lebih dari nol.');
  return writeStockMovement(productId, quantity, 'PRODUCTION', note || 'Produksi selesai');
}

export function adjustFinishedStock(productId: string, delta: number, reason: string): Promise<void> {
  if (!Number.isSafeInteger(delta) || delta === 0) throw new Error('Masukkan perubahan stok dalam bilangan bulat selain nol.');
  if (reason.trim().length < 3) throw new Error('Alasan penyesuaian stok wajib diisi.');
  return writeStockMovement(productId, delta, 'ADJUSTMENT', reason);
}

export async function listStockMovements(maxRows = 30): Promise<Array<DocumentData & { id: string }>> {
  const snapshot = await getDocs(query(
    collection(database(), 'stockMovements'),
    orderBy('createdAt', 'desc'),
    limit(Math.max(1, Math.min(100, maxRows))),
  ));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
}

export async function listRecentProductionRuns(maxRows = 20): Promise<Array<DocumentData & { id: string }>> {
  const snapshot = await getDocs(query(
    collection(database(), 'productionRuns'),
    orderBy('createdAt', 'desc'),
    limit(Math.max(1, Math.min(100, maxRows))),
  ));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
}

export type DirectSaleLine = { productId: string; quantity: number };
export async function createDirectSale(
  lines: DirectSaleLine[],
  paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'QRIS',
  note = '',
): Promise<{ id: string; total: number }> {
  if (!lines.length) throw new Error('Tambahkan minimal satu produk pada transaksi.');
  if (lines.some((line) => !Number.isSafeInteger(line.quantity) || line.quantity < 1 || line.quantity > 100)) {
    throw new Error('Jumlah produk tidak valid.');
  }
  const merged = new Map<string, number>();
  for (const line of lines) merged.set(line.productId, (merged.get(line.productId) ?? 0) + line.quantity);
  const store = database();
  const saleRef = doc(collection(store, 'directSales'));
  const productRows = Array.from(merged.entries());
  const productRefs = productRows.map(([id]) => doc(store, 'products', id));
  const inventoryRefs = productRows.map(([id]) => doc(store, 'inventory', id));
  const movementRefs = productRows.map(() => doc(collection(store, 'stockMovements')));

  const result = await runTransaction(store, async (transaction) => {
    const productSnaps = await Promise.all(productRefs.map((ref) => transaction.get(ref)));
    const stockSnaps = await Promise.all(inventoryRefs.map((ref) => transaction.get(ref)));
    let total = 0;
    const items: Array<{ productId: string; productName: string; unitPrice: number; quantity: number; subtotal: number }> = [];
    const stockUpdates: Array<{ current: number; next: number; product: DocumentData; ref: typeof inventoryRefs[number]; movementRef: typeof movementRefs[number]; quantity: number }> = [];

    for (let index = 0; index < productRows.length; index += 1) {
      const [productId, quantity] = productRows[index];
      const productSnap = productSnaps[index];
      if (!productSnap.exists()) throw new Error('Salah satu produk tidak ditemukan.');
      const product = productSnap.data();
      if (product.isArchived === true) throw new Error('Produk sudah diarsipkan dan tidak dapat dijual.');
      const unitPrice = Number(product.price);
      if (!Number.isSafeInteger(unitPrice) || unitPrice <= 0) throw new Error('Harga produk belum ditetapkan atau tidak valid.');
      const stockSnap = stockSnaps[index];
      const current = stockSnap.exists() ? Number(stockSnap.data().availableQty ?? 0) : 0;
      if (!Number.isSafeInteger(current) || current < quantity) throw new Error('Stok tidak cukup untuk menyimpan penjualan.');
      const subtotal = unitPrice * quantity;
      total += subtotal;
      items.push({ productId, productName: String(product.name), unitPrice, quantity, subtotal });
      stockUpdates.push({ current, next: current - quantity, product, ref: inventoryRefs[index], movementRef: movementRefs[index], quantity });
    }

    transaction.set(saleRef, {
      channel: 'DIRECT',
      items,
      total,
      paymentMethod,
      paymentStatus: 'VERIFIED',
      note: note.trim(),
      createdAt: serverTimestamp(),
    });
    for (const update of stockUpdates) {
      transaction.set(update.ref, {
        productId: update.ref.id,
        productName: String(update.product.name),
        availableQty: update.next,
        unit: String(update.product.unit ?? 'pcs'),
        updatedAt: serverTimestamp(),
      }, { merge: true });
      transaction.set(update.movementRef, {
        productId: update.ref.id,
        productName: String(update.product.name),
        type: 'DIRECT_SALE',
        quantity: -update.quantity,
        beforeQty: update.current,
        afterQty: update.next,
        referenceId: saleRef.id,
        createdAt: serverTimestamp(),
      });
    }
    return { id: saleRef.id, total };
  });
  return result;
}

export async function getVerifiedSalesSummary(): Promise<{
  onlineRevenue: number;
  directRevenue: number;
  verifiedTransactions: number;
}> {
  const store = database();
  const [payments, directSales] = await Promise.all([
    getDocs(query(collection(store, 'payments'), where('status', '==', 'VERIFIED'))),
    getDocs(query(collection(store, 'directSales'), where('paymentStatus', '==', 'VERIFIED'))),
  ]);
  const onlineRevenue = payments.docs.reduce((sum, item) => sum + Number(item.data().amount ?? 0), 0);
  const directRevenue = directSales.docs.reduce((sum, item) => sum + Number(item.data().total ?? 0), 0);
  return {
    onlineRevenue,
    directRevenue,
    verifiedTransactions: payments.size + directSales.size,
  };
}

export async function getStoreSettings(): Promise<{
  publicSettings: DocumentData;
  privateSettings: DocumentData;
}> {
  const store = database();
  const [publicSnapshot, privateSnapshot] = await Promise.all([
    getDoc(doc(store, 'publicSettings', 'storefront')),
    getDoc(doc(store, 'privateSettings', 'business')),
  ]);
  return {
    publicSettings: publicSnapshot.exists() ? publicSnapshot.data() : {},
    privateSettings: privateSnapshot.exists() ? privateSnapshot.data() : {},
  };
}

export async function saveStoreSettings(
  publicSettings: { displayName: string; tagline: string; whatsappNumber: string; instagramHandle: string },
  privateSettings: { bankName: string; bankAccountNumber: string; bankAccountHolder: string; pickupAddress: string },
): Promise<void> {
  const displayName = publicSettings.displayName.trim();
  const whatsappNumber = publicSettings.whatsappNumber.replace(/\D/g, '');
  if (!displayName) throw new Error('Nama toko wajib diisi.');
  if (whatsappNumber.length < 8 || whatsappNumber.length > 16) throw new Error('Nomor WhatsApp belum valid.');
  const store = database();
  const batch = writeBatch(store);
  batch.set(doc(store, 'publicSettings', 'storefront'), {
    displayName,
    tagline: publicSettings.tagline.trim(),
    whatsappNumber,
    instagramHandle: publicSettings.instagramHandle.trim(),
    updatedAt: serverTimestamp(),
  }, { merge: true });
  batch.set(doc(store, 'privateSettings', 'business'), {
    bankName: privateSettings.bankName.trim(),
    bankAccountNumber: privateSettings.bankAccountNumber.trim(),
    bankAccountHolder: privateSettings.bankAccountHolder.trim(),
    pickupAddress: privateSettings.pickupAddress.trim(),
    updatedAt: serverTimestamp(),
  }, { merge: true });
  await batch.commit();
}

export async function listCategories(): Promise<CategoryRecord[]> {
  const snapshot = await getDocs(collection(database(), 'categories'));
  return snapshot.docs
    .map((item) => ({
      id: item.id,
      name: String(item.data().name ?? ''),
      sortOrder: Number(item.data().sortOrder ?? 0),
      isActive: item.data().isActive !== false,
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, 'id'));
}

export async function saveCategory(input: { name: string; sortOrder: number; isActive: boolean }, categoryId?: string): Promise<string> {
  const name = input.name.trim();
  if (name.length < 2) throw new Error('Nama kategori minimal 2 karakter.');
  if (!Number.isSafeInteger(input.sortOrder) || input.sortOrder < 0) throw new Error('Urutan kategori tidak valid.');
  const store = database();
  const privateRef = categoryId ? doc(store, 'categories', categoryId) : doc(collection(store, 'categories'));
  const batch = writeBatch(store);
  batch.set(privateRef, {
    name, sortOrder: input.sortOrder, isActive: input.isActive, updatedAt: serverTimestamp(),
  }, { merge: true });
  batch.set(doc(store, 'publicCategories', privateRef.id), {
    name, sortOrder: input.sortOrder, isActive: input.isActive, updatedAt: serverTimestamp(),
  }, { merge: true });
  await batch.commit();
  return privateRef.id;
}
