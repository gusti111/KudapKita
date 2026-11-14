import {
  collection, doc, getDoc, getDocs, orderBy, query, serverTimestamp, setDoc, updateDoc, writeBatch,
} from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';
import { auth, db, isFirebaseConfigured } from '@/infrastructure/firebase/client';
import type { OrderRecord, OrderRequestInput, OrderStatus } from '@/domain/entities/Order';
import { validateOrderRequest } from '@/domain/rules/order-rules';

const PENDING_ORDER_ID_KEY = 'kudapkita.pending-order-id.v1';
let memoryPendingOrderId = '';

function getOrCreatePendingOrderId(): string {
  try {
    const stored = sessionStorage.getItem(PENDING_ORDER_ID_KEY);
    if (stored) return stored;
    const created = crypto.randomUUID().replaceAll('-', '');
    sessionStorage.setItem(PENDING_ORDER_ID_KEY, created);
    return created;
  } catch {
    if (!memoryPendingOrderId) memoryPendingOrderId = crypto.randomUUID().replaceAll('-', '');
    return memoryPendingOrderId;
  }
}

function clearPendingOrderId(): void {
  memoryPendingOrderId = '';
  try { sessionStorage.removeItem(PENDING_ORDER_ID_KEY); } catch { /* Storage may be unavailable. */ }
}

export async function createGuestOrder(input: OrderRequestInput): Promise<string> {
  const validationMessage = validateOrderRequest(input);
  if (validationMessage) throw new Error(validationMessage);
  if (!auth || !db || !isFirebaseConfigured) throw new Error('Firebase belum dikonfigurasi. Pesanan tidak dapat disimpan.');

  let user = auth.currentUser;
  if (user && !user.isAnonymous) {
    throw new Error('Sesi owner sedang aktif. Keluar dari dashboard sebelum melakukan simulasi pemesanan pelanggan.');
  }
  if (!user) user = (await signInAnonymously(auth)).user;

  // Keep one pending ID for the current tab: a retry after a lost response can
  // resolve the already-created document instead of generating a second order.
  // This is client-assisted duplicate protection, not a trusted backend engine.
  const orderId = getOrCreatePendingOrderId();
  const orderRef = doc(db, 'orders', orderId);
  try {
    await setDoc(orderRef, {
      createdByUid: user.uid,
      customerName: input.customerName.trim(),
      customerWhatsApp: input.customerWhatsApp.trim(),
      fulfillmentMethod: input.fulfillmentMethod,
      ...(input.deliveryAddress?.trim() ? { deliveryAddress: input.deliveryAddress.trim() } : {}),
      ...(input.customerNote?.trim() ? { customerNote: input.customerNote.trim() } : {}),
      items: input.items.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        ...(item.displayedUnitPrice !== null ? { displayedUnitPrice: item.displayedUnitPrice } : {}),
      })),
      orderStatus: 'REQUESTED',
      paymentStatus: 'UNPAID',
      source: 'ONLINE',
      createdAt: serverTimestamp(),
    });
    clearPendingOrderId();
    return orderId;
  } catch (writeError) {
    // A previous attempt may have reached Firestore even if the browser lost its response.
    try {
      const existing = await getDoc(orderRef);
      if (existing.exists() && existing.data().createdByUid === user.uid) {
        clearPendingOrderId();
        return orderId;
      }
    } catch { /* Preserve the original write error. */ }
    throw writeError;
  }
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
  const snapshot = await getDocs(query(collection(db, 'orders'), orderBy('createdAt', 'desc')));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as OrderRecord);
}

export async function setOwnerOrderQuote(orderId: string, confirmedTotal: number): Promise<void> {
  if (!db) throw new Error('Firebase belum dikonfigurasi.');
  if (!Number.isSafeInteger(confirmedTotal) || confirmedTotal <= 0) throw new Error('Total akhir harus berupa angka positif.');
  const ref = doc(db, 'orders', orderId);
  const snapshot = await getDoc(ref);
  if (!snapshot.exists()) throw new Error('Pesanan tidak ditemukan.');
  if (snapshot.data().orderStatus !== 'REQUESTED') throw new Error('Total hanya dapat dikonfirmasi untuk permintaan baru.');
  await updateDoc(ref, { confirmedTotal, orderStatus: 'WAITING_PAYMENT', quoteConfirmedAt: serverTimestamp(), updatedAt: serverTimestamp() });
}

export async function verifyOwnerPayment(
  orderId: string,
  paymentMethod: 'BANK_TRANSFER' | 'QRIS',
): Promise<void> {
  const ownerUid = auth?.currentUser?.uid;
  if (!db || !ownerUid) throw new Error('Sesi owner tidak tersedia.');
  const orderRef = doc(db, 'orders', orderId);
  const snapshot = await getDoc(orderRef);
  if (!snapshot.exists()) throw new Error('Pesanan tidak ditemukan.');
  const order = snapshot.data();
  if (order.paymentStatus === 'PAID') throw new Error('Pembayaran pesanan ini sudah diverifikasi.');
  if (order.orderStatus !== 'WAITING_PAYMENT' || typeof order.confirmedTotal !== 'number' || order.confirmedTotal <= 0) {
    throw new Error('Pesanan belum memiliki total final yang menunggu pembayaran.');
  }
  const paymentId = `verified-${orderId}`;
  const batch = writeBatch(db);
  batch.update(orderRef, {
    paymentStatus: 'PAID', paymentMethod, paymentVerifiedAt: serverTimestamp(), updatedAt: serverTimestamp(),
  });
  batch.set(doc(db, 'payments', paymentId), {
    orderId, amount: order.confirmedTotal, method: paymentMethod,
    status: 'VERIFIED', verifiedByUid: ownerUid, verifiedAt: serverTimestamp(),
  });
  await batch.commit();
}

export async function setOwnerOrderStatus(orderId: string, orderStatus: OrderStatus): Promise<void> {
  if (!db) throw new Error('Firebase belum dikonfigurasi.');
  const ref = doc(db, 'orders', orderId);
  const snapshot = await getDoc(ref);
  if (!snapshot.exists()) throw new Error('Pesanan tidak ditemukan.');
  const current = snapshot.data();
  const currentStatus = current.orderStatus as OrderStatus;
  const allowed: Record<OrderStatus, OrderStatus[]> = {
    REQUESTED: ['REJECTED', 'CANCELLED'],
    WAITING_PAYMENT: current.paymentStatus === 'PAID' ? ['PREPARING', 'REJECTED', 'CANCELLED'] : ['REJECTED', 'CANCELLED'],
    PREPARING: current.fulfillmentMethod === 'PICKUP' ? ['READY_FOR_PICKUP'] : ['OUT_FOR_DELIVERY'],
    READY_FOR_PICKUP: ['COMPLETED'],
    OUT_FOR_DELIVERY: ['COMPLETED'],
    COMPLETED: [], REJECTED: [], CANCELLED: [],
  };
  if (!allowed[currentStatus]?.includes(orderStatus)) throw new Error('Perubahan status tidak sesuai alur operasional.');
  await updateDoc(ref, { orderStatus, updatedAt: serverTimestamp() });
}
