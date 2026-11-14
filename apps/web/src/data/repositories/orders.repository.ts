import {
  collection, doc, getDoc, getDocs, limit, orderBy, query, runTransaction,
  serverTimestamp, setDoc,
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

  // A stable client request ID reduces accidental duplicate writes after a lost response.
  // It is not a replacement for a trusted server-side idempotency endpoint.
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
  const snapshot = await getDocs(query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(100)));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as OrderRecord);
}

export async function setOwnerOrderQuote(orderId: string, confirmedTotal: number): Promise<void> {
  if (!db) throw new Error('Firebase belum dikonfigurasi.');
  if (!Number.isSafeInteger(confirmedTotal) || confirmedTotal <= 0) {
    throw new Error('Total akhir harus berupa angka positif.');
  }
  const store = db;
  const orderRef = doc(store, 'orders', orderId);
  await runTransaction(store, async (transaction) => {
    const snapshot = await transaction.get(orderRef);
    if (!snapshot.exists()) throw new Error('Pesanan tidak ditemukan.');
    if (snapshot.data().orderStatus !== 'REQUESTED') {
      throw new Error('Total hanya dapat dikonfirmasi untuk permintaan baru.');
    }
    transaction.update(orderRef, {
      confirmedTotal,
      orderStatus: 'WAITING_PAYMENT',
      quoteConfirmedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });
}

export async function verifyOwnerPayment(
  orderId: string,
  paymentMethod: 'BANK_TRANSFER' | 'QRIS',
): Promise<void> {
  const ownerUid = auth?.currentUser?.uid;
  if (!db || !ownerUid) throw new Error('Sesi owner tidak tersedia.');
  const store = db;
  const orderRef = doc(store, 'orders', orderId);
  const paymentRef = doc(store, 'payments', `verified-${orderId}`);

  await runTransaction(store, async (transaction) => {
    const [orderSnapshot, paymentSnapshot] = await Promise.all([
      transaction.get(orderRef),
      transaction.get(paymentRef),
    ]);
    if (!orderSnapshot.exists()) throw new Error('Pesanan tidak ditemukan.');
    if (paymentSnapshot.exists() || orderSnapshot.data().paymentStatus === 'PAID') {
      throw new Error('Pembayaran pesanan ini sudah diverifikasi.');
    }
    const order = orderSnapshot.data();
    if (order.orderStatus !== 'WAITING_PAYMENT' || !Number.isSafeInteger(order.confirmedTotal) || order.confirmedTotal <= 0) {
      throw new Error('Pesanan belum memiliki total final yang menunggu pembayaran.');
    }
    transaction.update(orderRef, {
      paymentStatus: 'PAID',
      paymentMethod,
      paymentVerifiedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    transaction.set(paymentRef, {
      orderId,
      amount: order.confirmedTotal,
      method: paymentMethod,
      status: 'VERIFIED',
      verifiedByUid: ownerUid,
      verifiedAt: serverTimestamp(),
    });
  });
}

export async function setOwnerOrderStatus(orderId: string, orderStatus: OrderStatus): Promise<void> {
  if (!db) throw new Error('Firebase belum dikonfigurasi.');
  const store = db;
  const orderRef = doc(store, 'orders', orderId);

  await runTransaction(store, async (transaction) => {
    const snapshot = await transaction.get(orderRef);
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
    if (!allowed[currentStatus]?.includes(orderStatus)) {
      throw new Error('Perubahan status tidak sesuai alur operasional.');
    }

    if (orderStatus === 'PREPARING') {
      if (current.paymentStatus !== 'PAID') throw new Error('Pesanan harus memiliki pembayaran terverifikasi sebelum diproses.');
      const quantities = new Map<string, number>();
      for (const item of (current.items ?? []) as Array<{ productId: string; quantity: number }>) {
        if (!item.productId || !Number.isSafeInteger(item.quantity) || item.quantity < 1) {
          throw new Error('Snapshot item pesanan tidak valid. Periksa pesanan sebelum diproses.');
        }
        quantities.set(item.productId, (quantities.get(item.productId) ?? 0) + item.quantity);
      }
      const rows = Array.from(quantities.entries());
      const inventoryRefs = rows.map(([productId]) => doc(store, 'inventory', productId));
      const movementRefs = rows.map(() => doc(collection(store, 'stockMovements')));
      const snapshots = await Promise.all(inventoryRefs.map((ref) => transaction.get(ref)));

      const updates = rows.map(([productId, quantity], index) => {
        const inventory = snapshots[index];
        const currentQty = inventory.exists() ? Number(inventory.data().availableQty ?? 0) : 0;
        if (!Number.isSafeInteger(currentQty) || currentQty < quantity) {
          throw new Error(`Stok ${productId} tidak mencukupi. Catat produksi atau lakukan penyesuaian sebelum memulai pesanan.`);
        }
        return {
          ref: inventoryRefs[index],
          movementRef: movementRefs[index],
          productId,
          productName: String(inventory.data()?.productName ?? productId),
          unit: String(inventory.data()?.unit ?? 'pcs'),
          beforeQty: currentQty,
          afterQty: currentQty - quantity,
          quantity,
        };
      });

      for (const update of updates) {
        transaction.set(update.ref, {
          availableQty: update.afterQty,
          updatedAt: serverTimestamp(),
        }, { merge: true });
        transaction.set(update.movementRef, {
          productId: update.productId,
          productName: update.productName,
          type: 'ONLINE_ORDER',
          quantity: -update.quantity,
          beforeQty: update.beforeQty,
          afterQty: update.afterQty,
          referenceId: orderId,
          reason: 'Persiapan pesanan online',
          createdAt: serverTimestamp(),
        });
      }
    }
    transaction.update(orderRef, {
      orderStatus,
      updatedAt: serverTimestamp(),
    });
  });
}
