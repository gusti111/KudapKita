import { collection, doc, getDoc, getDocs, orderBy, query, where } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/infrastructure/firebase/client';
import { DEMO_PRODUCTS } from '@/data/fixtures/demo-products';
import type { PublicProduct } from '@/domain/entities/Product';

export async function getPublishedProducts(): Promise<PublicProduct[]> {
  if (!isFirebaseConfigured || !db) {
    return import.meta.env.VITE_ENABLE_DEMO_CATALOG === 'true' ? DEMO_PRODUCTS : [];
  }
  const productsQuery = query(
    collection(db, 'publicProducts'),
    where('isPublished', '==', true),
    orderBy('sortOrder', 'asc'),
  );
  const snapshot = await getDocs(productsQuery);
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as PublicProduct);
}

export async function getStorefrontPublicSettings(): Promise<Record<string, unknown>> {
  if (!db || !isFirebaseConfigured) return {};
  const snapshot = await getDoc(doc(db, 'publicSettings', 'storefront'));
  return snapshot.exists() ? snapshot.data() : {};
}
