import {
  collection, doc, getDoc, getDocs, limit, orderBy, query,
} from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';
import { auth, db, isFirebaseConfigured } from '@/infrastructure/firebase/client';
import { callKudapKita } from '@/infrastructure/firebase/functions';
import type { OrderRecord, OrderRequestInput, OrderStatus } from '@/domain/entities/Order';
import { validateOrderRequest } from '@/domain/rules/order-rules';

const PENDING_ORDER_REQUEST_KEY = 'kudapkita.pending-order-request.v2';
let memoryRequestId = '';

function getOrCreateRequestId(): string {
  try {
    const stored = sessionStorage.getItem(PENDING_ORDER_REQUEST_KEY);
    if (stored) return stored;
    const created = crypto.randomUUID();
    sessionStorage.setItem(PENDING_ORDER_REQUEST_KEY, created);
    return created;
  } catch {
    if (!memoryRequestId) memoryRequestId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    return memoryRequestId;
  }
}
function clearRequestId(): void {
  memoryRequestId = '';
  try { sessionStorage.removeItem(PENDING_ORDER_REQUEST_KEY); } catch { /* Storage may be unavailable. */ }
}

export async function createGuestOrder(input: OrderRequestInput): Promise<string> {
  const validationMessage = validateOrderRequest(input);
  if (validationMessage) throw new Error(validationMessage);
  if (!auth || !db || !isFirebaseConfigured) {
    throw new Error('Firebase belum dikonfigurasi. Permintaan belum dikirim.');
  }

  let user = auth.currentUser;
  if (user && !user.isAnonymous) {
    throw new Error('Sesi owner sedang aktif. Keluar dari dashboard sebelum melakukan pemesanan pelanggan.');
  }
  if (!user) user = (await signInAnonymously(auth)).user;

  const clientRequestId = getOrCreateRequestId();
  const result = await callKudapKita<
    {
      clientRequestId: string;
      customerName: string;
      customerWhatsApp: string;
      fulfillmentMethod: string;
      deliveryAddress?: string;
      customerNote?: string;
      items: Array<{ productId: string; quantity: number }>;
    },
    { orderId: string; created: boolean }
  >('createOnlineOrder', {
    clientRequestId,
    customerName: input.customerName.trim(),
    customerWhatsApp: input.customerWhatsApp.trim(),
    fulfillmentMethod: input.fulfillmentMethod,
    ...(input.deliveryAddress?.trim() ? { deliveryAddress: input.deliveryAddress.trim() } : {}),
    ...(input.customerNote?.trim() ? { customerNote: input.customerNote.trim() } : {}),
    // The backend ignores browser-supplied labels/prices and reloads product records.
    items: input.items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
    })),
  });
  clearRequestId();
  return result.orderId;
}

export async function getOrderForCurrentGuest(orderId: string): Promise<OrderRecord | null> {
  if (!auth?.currentUser || !db) return null;
  const snapshot = await getDoc(doc(db, 'orders', orderId));
  if (!snapshot.exists()) return null;
  const record = { id: snapshot.id, ...snapshot.data() } as OrderRecord;
  return record.createdByUid === auth.currentUser.uid ? record : null;
}

export async function getRecentOwnerOrders(): Promise<OrderRecord[]> {
  if (!db) return [];
  const snapshot = await getDocs(query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(100)));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as OrderRecord);
}

export async function setOwnerOrderQuote(orderId: string, confirmedTotal: number): Promise<void> {
  if (!Number.isSafeInteger(confirmedTotal) || confirmedTotal <= 0) {
    throw new Error('Total akhir harus berupa angka Rupiah positif.');
  }
  await callKudapKita('confirmOrderQuote', { orderId, confirmedTotal });
}

export async function verifyOwnerPayment(
  orderId: string,
  paymentMethod: 'BANK_TRANSFER' | 'QRIS',
): Promise<void> {
  await callKudapKita('verifyOrderPayment', { orderId, paymentMethod });
}

export async function setOwnerOrderStatus(orderId: string, orderStatus: OrderStatus): Promise<void> {
  await callKudapKita('transitionOrderStatus', { orderId, orderStatus });
}
