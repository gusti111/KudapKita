import { createHash } from "node:crypto";
import { initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { setGlobalOptions } from "firebase-functions/v2";
import {
  asInteger,
  boundedString,
  calculateTrustedSaleItems,
  isAllowedTransition,
  normalizeLines,
  operationDocumentId,
  validateClientRequestId,
} from "./domain.js";

const REGION = "asia-southeast2";
const MAX_INSTANCES = 10;
setGlobalOptions({ region: REGION, maxInstances: MAX_INSTANCES, memory: "256MiB", timeoutSeconds: 30 });

initializeApp();
const db = getFirestore();

function fail(code, message) {
  throw new HttpsError(code, message);
}

function requestId(data) {
  try { return validateClientRequestId(data?.clientRequestId); }
  catch (error) { fail("invalid-argument", error.message); }
}

function text(value, label, max, min = 0) {
  try { return boundedString(value, label, max, min); }
  catch (error) { fail("invalid-argument", error.message); }
}

function integer(value, label, options) {
  try { return asInteger(value, label, options); }
  catch (error) { fail("invalid-argument", error.message); }
}

function normalizeRequestLines(raw) {
  try { return normalizeLines(raw, { maxLines: 6, maxQuantity: 50 }); }
  catch (error) { fail("invalid-argument", error.message); }
}

function ensureAuthenticated(request) {
  if (!request.auth?.uid) fail("unauthenticated", "Silakan masuk terlebih dahulu.");
  return request.auth.uid;
}

async function requireAnonymousCustomer(request) {
  const uid = ensureAuthenticated(request);
  if (request.auth.token?.firebase?.sign_in_provider !== "anonymous") {
    fail("permission-denied", "Checkout pelanggan harus menggunakan sesi pelanggan.");
  }
  return uid;
}

async function requireOwner(request) {
  const uid = ensureAuthenticated(request);
  const profile = await db.collection("userProfiles").doc(uid).get();
  if (!profile.exists || profile.data()?.role !== "owner" || profile.data()?.isActive !== true) {
    fail("permission-denied", "Akses hanya tersedia untuk owner KudapKita.");
  }
  return uid;
}

function safeCallable(handler) {
  return async (request) => {
    try {
      return await handler(request);
    } catch (error) {
      if (error instanceof HttpsError) throw error;
      console.error("KudapKita callable error", {
        code: error?.code || "unknown",
        message: error?.message || String(error),
      });
      if (error instanceof TypeError || error instanceof RangeError) {
        throw new HttpsError("invalid-argument", error.message);
      }
      throw new HttpsError("internal", "Operasi gagal di server. Data belum boleh dianggap tersimpan.");
    }
  };
}

function timestamp() {
  return FieldValue.serverTimestamp();
}

async function readProducts(transaction, lines, { requirePublished = true } = {}) {
  const refs = lines.map((line) => db.collection("products").doc(line.productId));
  const snapshots = await Promise.all(refs.map((ref) => transaction.get(ref)));
  const byId = new Map();
  for (let index = 0; index < lines.length; index += 1) {
    const snap = snapshots[index];
    const productId = lines[index].productId;
    if (!snap.exists) fail("not-found", `Produk ${productId} tidak ditemukan.`);
    const product = snap.data();
    if (product.isArchived === true) fail("failed-precondition", `Produk ${product.name || productId} sudah diarsipkan.`);
    if (requirePublished && product.isPublished !== true) fail("failed-precondition", `Produk ${product.name || productId} tidak tersedia di katalog.`);
    if (product.availability === "SOLD_OUT") fail("failed-precondition", `Produk ${product.name || productId} sedang habis.`);
    byId.set(productId, product);
  }
  return byId;
}

/**
 * Guest checkout only creates a request. Product name and displayed price are read
 * from Firestore, never trusted from the browser. No stock or revenue is changed.
 */
export const createOnlineOrder = onCall({ region: REGION }, safeCallable(async (request) => {
  const uid = await requireAnonymousCustomer(request);
  const clientRequestId = requestId(request.data);
  const customerName = text(request.data?.customerName, "Nama pelanggan", 80, 2);
  const customerWhatsApp = text(request.data?.customerWhatsApp, "Nomor WhatsApp", 20, 8);
  if (!/^[0-9+(). -]+$/.test(customerWhatsApp)) fail("invalid-argument", "Nomor WhatsApp tidak valid.");
  const fulfillmentMethod = request.data?.fulfillmentMethod;
  if (!["PICKUP", "DELIVERY"].includes(fulfillmentMethod)) fail("invalid-argument", "Metode pengambilan tidak valid.");
  const deliveryAddress = fulfillmentMethod === "DELIVERY"
    ? text(request.data?.deliveryAddress, "Alamat pengantaran", 300, 5)
    : "";
  const customerNote = text(request.data?.customerNote || "", "Catatan pelanggan", 500);
  const lines = normalizeRequestLines(request.data?.items);
  const orderId = operationDocumentId(uid, clientRequestId, "ord");
  const orderRef = db.collection("orders").doc(orderId);
  const requestFingerprint = createHash("sha256").update(JSON.stringify({ uid, customerName, customerWhatsApp, fulfillmentMethod, deliveryAddress, customerNote, lines })).digest("hex");

  return db.runTransaction(async (transaction) => {
    const existing = await transaction.get(orderRef);
    if (existing.exists) {
      if (existing.data()?.createdByUid !== uid || existing.data()?.clientRequestId !== clientRequestId || existing.data()?.requestFingerprint !== requestFingerprint) {
        fail("already-exists", "ID permintaan ini telah digunakan untuk data lain.");
      }
      return { orderId, created: false };
    }

    const products = await readProducts(transaction, lines, { requirePublished: true });
    const items = lines.map((line) => {
      const product = products.get(line.productId);
      return {
        productId: line.productId,
        productName: String(product.name || line.productId).slice(0, 120),
        quantity: line.quantity,
        displayedUnitPrice: Number.isSafeInteger(product.price) ? product.price : null,
      };
    });

    transaction.create(orderRef, {
      createdByUid: uid,
      clientRequestId,
      requestFingerprint,
      customerName,
      customerWhatsApp,
      fulfillmentMethod,
      ...(deliveryAddress ? { deliveryAddress } : {}),
      ...(customerNote ? { customerNote } : {}),
      items,
      orderStatus: "REQUESTED",
      paymentStatus: "UNPAID",
      source: "ONLINE",
      createdAt: timestamp(),
      updatedAt: timestamp(),
    });
    return { orderId, created: true };
  });
}));

export const confirmOrderQuote = onCall({ region: REGION }, safeCallable(async (request) => {
  const ownerUid = await requireOwner(request);
  const orderId = text(request.data?.orderId, "ID pesanan", 120, 1);
  const confirmedTotal = integer(request.data?.confirmedTotal, "Total konfirmasi", { min: 1, max: 1_000_000_000 });
  const orderRef = db.collection("orders").doc(orderId);

  return db.runTransaction(async (transaction) => {
    const snap = await transaction.get(orderRef);
    if (!snap.exists) fail("not-found", "Pesanan tidak ditemukan.");
    const order = snap.data();
    if (order.orderStatus === "WAITING_PAYMENT" && order.confirmedTotal === confirmedTotal) {
      return { updated: false, confirmedTotal };
    }
    if (order.orderStatus !== "REQUESTED" || order.paymentStatus !== "UNPAID") {
      fail("failed-precondition", "Total hanya dapat dikonfirmasi untuk permintaan baru yang belum dibayar.");
    }
    transaction.update(orderRef, {
      confirmedTotal,
      orderStatus: "WAITING_PAYMENT",
      quoteConfirmedByUid: ownerUid,
      quoteConfirmedAt: timestamp(),
      updatedAt: timestamp(),
    });
    return { updated: true, confirmedTotal };
  });
}));

export const verifyOrderPayment = onCall({ region: REGION }, safeCallable(async (request) => {
  const ownerUid = await requireOwner(request);
  const orderId = text(request.data?.orderId, "ID pesanan", 120, 1);
  const paymentMethod = request.data?.paymentMethod;
  if (!["BANK_TRANSFER", "QRIS"].includes(paymentMethod)) {
    fail("invalid-argument", "Metode pembayaran online tidak valid.");
  }
  const orderRef = db.collection("orders").doc(orderId);
  const paymentRef = db.collection("payments").doc(`online-${orderId}`);

  return db.runTransaction(async (transaction) => {
    const [orderSnap, paymentSnap] = await Promise.all([
      transaction.get(orderRef),
      transaction.get(paymentRef),
    ]);
    if (!orderSnap.exists) fail("not-found", "Pesanan tidak ditemukan.");
    if (paymentSnap.exists) {
      if (orderSnap.data()?.paymentStatus === "PAID") return { verified: false, alreadyVerified: true };
      fail("failed-precondition", "Catatan pembayaran ada tetapi status pesanan tidak konsisten. Periksa transaksi.");
    }
    const order = orderSnap.data();
    if (order.orderStatus !== "WAITING_PAYMENT" || order.paymentStatus !== "UNPAID") {
      fail("failed-precondition", "Pesanan belum berada pada tahap menunggu pembayaran.");
    }
    const amount = integer(order.confirmedTotal, "Total pembayaran", { min: 1, max: 1_000_000_000 });
    transaction.update(orderRef, {
      paymentStatus: "PAID",
      paymentMethod,
      paymentVerifiedByUid: ownerUid,
      paymentVerifiedAt: timestamp(),
      updatedAt: timestamp(),
    });
    transaction.create(paymentRef, {
      orderId,
      amount,
      method: paymentMethod,
      status: "VERIFIED",
      verifiedByUid: ownerUid,
      verifiedAt: timestamp(),
    });
    return { verified: true, amount };
  });
}));

export const transitionOrderStatus = onCall({ region: REGION }, safeCallable(async (request) => {
  await requireOwner(request);
  const orderId = text(request.data?.orderId, "ID pesanan", 120, 1);
  const nextStatus = request.data?.orderStatus;
  const orderRef = db.collection("orders").doc(orderId);

  return db.runTransaction(async (transaction) => {
    const orderSnap = await transaction.get(orderRef);
    if (!orderSnap.exists) fail("not-found", "Pesanan tidak ditemukan.");
    const order = orderSnap.data();
    const currentStatus = String(order.orderStatus || "");
    if (currentStatus === nextStatus) return { updated: false, orderStatus: currentStatus };
    if (!isAllowedTransition(currentStatus, order.paymentStatus, order.fulfillmentMethod, nextStatus)) {
      fail("failed-precondition", "Perubahan status tidak sesuai alur pesanan atau status pembayaran.");
    }

    if (nextStatus === "PREPARING") {
      const lines = normalizeRequestLines((order.items || []).map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      })));
      const inventoryRefs = lines.map((line) => db.collection("inventory").doc(line.productId));
      const inventorySnaps = await Promise.all(inventoryRefs.map((ref) => transaction.get(ref)));
      const updates = lines.map((line, index) => {
        const inventorySnap = inventorySnaps[index];
        const currentQty = inventorySnap.exists ? Number(inventorySnap.data()?.availableQty ?? 0) : 0;
        if (!Number.isSafeInteger(currentQty) || currentQty < line.quantity) {
          fail("failed-precondition", `Stok ${line.productId} tidak mencukupi. Catat produksi sebelum memulai pesanan.`);
        }
        return {
          line,
          ref: inventoryRefs[index],
          currentQty,
          nextQty: currentQty - line.quantity,
          productName: String(inventorySnap.data()?.productName || line.productId),
          unit: String(inventorySnap.data()?.unit || "pcs"),
          movementRef: db.collection("stockMovements").doc(`online-${orderId}-${line.productId}`),
        };
      });
      const movementSnaps = await Promise.all(updates.map((item) => transaction.get(item.movementRef)));
      if (movementSnaps.some((snap) => snap.exists)) {
        fail("failed-precondition", "Riwayat pengurangan stok sudah ada. Periksa data pesanan sebelum melanjutkan.");
      }
      for (const update of updates) {
        transaction.set(update.ref, {
          productId: update.line.productId,
          productName: update.productName,
          availableQty: update.nextQty,
          unit: update.unit,
          updatedAt: timestamp(),
        }, { merge: true });
        transaction.create(update.movementRef, {
          productId: update.line.productId,
          productName: update.productName,
          type: "ONLINE_ORDER",
          quantity: -update.line.quantity,
          beforeQty: update.currentQty,
          afterQty: update.nextQty,
          referenceId: orderId,
          reason: "Persiapan pesanan online",
          createdAt: timestamp(),
        });
      }
      transaction.update(orderRef, {
        orderStatus: nextStatus,
        stockDeducted: true,
        stockDeductedAt: timestamp(),
        updatedAt: timestamp(),
      });
      return { updated: true, orderStatus: nextStatus, stockDeducted: true };
    }

    transaction.update(orderRef, { orderStatus: nextStatus, updatedAt: timestamp() });
    return { updated: true, orderStatus: nextStatus };
  });
}));

export const recordProduction = onCall({ region: REGION }, safeCallable(async (request) => {
  await requireOwner(request);
  const clientRequestId = requestId(request.data);
  const productId = text(request.data?.productId, "ID produk", 128, 1);
  const quantity = integer(request.data?.quantity, "Jumlah produksi", { min: 1, max: 100_000 });
  const note = text(request.data?.note || "", "Catatan produksi", 300);
  const runId = operationDocumentId(request.auth.uid, clientRequestId, "prod");
  const runRef = db.collection("productionRuns").doc(runId);
  const requestFingerprint = createHash("sha256").update(JSON.stringify({ uid: request.auth.uid, productId, quantity, note })).digest("hex");
  const productRef = db.collection("products").doc(productId);
  const inventoryRef = db.collection("inventory").doc(productId);
  const movementRef = db.collection("stockMovements").doc(`production-${runId}`);

  return db.runTransaction(async (transaction) => {
    const existingRun = await transaction.get(runRef);
    if (existingRun.exists) {
      if (existingRun.data()?.requestFingerprint !== requestFingerprint) fail("already-exists", "ID produksi sudah digunakan untuk data berbeda.");
      return { created: false, id: runId };
    }
    const [productSnap, inventorySnap] = await Promise.all([
      transaction.get(productRef),
      transaction.get(inventoryRef),
    ]);
    if (!productSnap.exists || productSnap.data()?.isArchived === true) fail("not-found", "Produk tidak ditemukan atau sudah diarsipkan.");
    const product = productSnap.data();
    const beforeQty = inventorySnap.exists ? Number(inventorySnap.data()?.availableQty ?? 0) : 0;
    if (!Number.isSafeInteger(beforeQty) || beforeQty < 0 || beforeQty + quantity > 1_000_000) {
      fail("failed-precondition", "Saldo stok atau hasil produksi melebihi batas yang aman.");
    }
    const afterQty = beforeQty + quantity;
    transaction.set(inventoryRef, {
      productId,
      productName: String(product.name),
      availableQty: afterQty,
      unit: String(product.unit || "pcs"),
      updatedAt: timestamp(),
    }, { merge: true });
    transaction.create(movementRef, {
      productId,
      productName: String(product.name),
      type: "PRODUCTION",
      quantity,
      beforeQty,
      afterQty,
      referenceId: runId,
      reason: note || "Produksi selesai",
      createdAt: timestamp(),
    });
    transaction.create(runRef, {
      productId,
      productName: String(product.name),
      quantity,
      unit: String(product.unit || "pcs"),
      note,
      status: "COMPLETED",
      stockMovementId: movementRef.id,
      requestFingerprint,
      createdAt: timestamp(),
    });
    return { created: true, id: runId, availableQty: afterQty };
  });
}));

export const adjustFinishedStock = onCall({ region: REGION }, safeCallable(async (request) => {
  await requireOwner(request);
  const clientRequestId = requestId(request.data);
  const productId = text(request.data?.productId, "ID produk", 128, 1);
  const delta = integer(request.data?.delta, "Perubahan stok", { min: -100_000, max: 100_000 });
  if (delta === 0) fail("invalid-argument", "Perubahan stok tidak boleh nol.");
  const reason = text(request.data?.reason, "Alasan penyesuaian", 300, 3);
  const opId = operationDocumentId(request.auth.uid, clientRequestId, "adj");
  const requestFingerprint = createHash("sha256").update(JSON.stringify({ uid: request.auth.uid, productId, delta, reason })).digest("hex");
  const productRef = db.collection("products").doc(productId);
  const inventoryRef = db.collection("inventory").doc(productId);
  const movementRef = db.collection("stockMovements").doc(opId);

  return db.runTransaction(async (transaction) => {
    const movementSnap = await transaction.get(movementRef);
    if (movementSnap.exists) {
      if (movementSnap.data()?.requestFingerprint !== requestFingerprint) fail("already-exists", "ID penyesuaian sudah digunakan untuk data berbeda.");
      return { adjusted: false, id: opId, availableQty: movementSnap.data()?.afterQty };
    }
    const [productSnap, inventorySnap] = await Promise.all([
      transaction.get(productRef),
      transaction.get(inventoryRef),
    ]);
    if (!productSnap.exists || productSnap.data()?.isArchived === true) fail("not-found", "Produk tidak ditemukan atau sudah diarsipkan.");
    const product = productSnap.data();
    const beforeQty = inventorySnap.exists ? Number(inventorySnap.data()?.availableQty ?? 0) : 0;
    const afterQty = beforeQty + delta;
    if (!Number.isSafeInteger(beforeQty) || beforeQty < 0 || !Number.isSafeInteger(afterQty) || afterQty < 0 || afterQty > 1_000_000) {
      fail("failed-precondition", "Penyesuaian membuat saldo stok tidak valid atau negatif.");
    }
    transaction.set(inventoryRef, {
      productId,
      productName: String(product.name),
      availableQty: afterQty,
      unit: String(product.unit || "pcs"),
      updatedAt: timestamp(),
    }, { merge: true });
    transaction.create(movementRef, {
      productId,
      productName: String(product.name),
      type: "ADJUSTMENT",
      quantity: delta,
      beforeQty,
      afterQty,
      reason,
      requestFingerprint,
      createdAt: timestamp(),
    });
    return { adjusted: true, id: opId, availableQty: afterQty };
  });
}));

export const createDirectSale = onCall({ region: REGION }, safeCallable(async (request) => {
  await requireOwner(request);
  const clientRequestId = requestId(request.data);
  const lines = normalizeRequestLines(request.data?.items);
  const paymentMethod = request.data?.paymentMethod;
  if (!["CASH", "BANK_TRANSFER", "QRIS"].includes(paymentMethod)) fail("invalid-argument", "Metode pembayaran langsung tidak valid.");
  const note = text(request.data?.note || "", "Catatan penjualan", 300);
  const saleId = operationDocumentId(request.auth.uid, clientRequestId, "sale");
  const saleRef = db.collection("directSales").doc(saleId);
  const requestFingerprint = createHash("sha256").update(JSON.stringify({ uid: request.auth.uid, lines, paymentMethod, note })).digest("hex");

  return db.runTransaction(async (transaction) => {
    const existingSale = await transaction.get(saleRef);
    if (existingSale.exists) {
      if (existingSale.data()?.requestFingerprint !== requestFingerprint) {
        fail("already-exists", "ID transaksi sudah digunakan untuk isi transaksi yang berbeda.");
      }
      return { id: saleId, total: existingSale.data()?.total, created: false };
    }
    const products = await readProducts(transaction, lines, { requirePublished: false });
    const trusted = calculateTrustedSaleItems(lines, products);
    const inventoryRefs = lines.map((line) => db.collection("inventory").doc(line.productId));
    const movementRefs = lines.map((line) => db.collection("stockMovements").doc(`sale-${saleId}-${line.productId}`));
    const inventorySnaps = await Promise.all(inventoryRefs.map((ref) => transaction.get(ref)));
    const updates = lines.map((line, index) => {
      const snap = inventorySnaps[index];
      const beforeQty = snap.exists ? Number(snap.data()?.availableQty ?? 0) : 0;
      if (!Number.isSafeInteger(beforeQty) || beforeQty < line.quantity) {
        fail("failed-precondition", `Stok produk ${line.productId} tidak cukup untuk penjualan.`);
      }
      return {
        line,
        ref: inventoryRefs[index],
        movementRef: movementRefs[index],
        beforeQty,
        afterQty: beforeQty - line.quantity,
        productName: trusted.items[index].productName,
        unit: String(products.get(line.productId).unit || "pcs"),
      };
    });
    const movementSnaps = await Promise.all(movementRefs.map((ref) => transaction.get(ref)));
    if (movementSnaps.some((snap) => snap.exists)) fail("failed-precondition", "Riwayat penjualan sudah ada. Periksa transaksi sebelum mengulang.");

    transaction.create(saleRef, {
      channel: "DIRECT",
      items: trusted.items,
      total: trusted.total,
      paymentMethod,
      paymentStatus: "VERIFIED",
      recordedByUid: request.auth.uid,
      requestFingerprint,
      note,
      createdAt: timestamp(),
    });
    for (const update of updates) {
      transaction.set(update.ref, {
        productId: update.line.productId,
        productName: update.productName,
        availableQty: update.afterQty,
        unit: update.unit,
        updatedAt: timestamp(),
      }, { merge: true });
      transaction.create(update.movementRef, {
        productId: update.line.productId,
        productName: update.productName,
        type: "DIRECT_SALE",
        quantity: -update.line.quantity,
        beforeQty: update.beforeQty,
        afterQty: update.afterQty,
        referenceId: saleId,
        reason: "Penjualan langsung",
        createdAt: timestamp(),
      });
    }
    return { id: saleId, total: trusted.total, created: true };
  });
}));
