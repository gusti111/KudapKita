import { createHash, randomBytes } from "node:crypto";
import { initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
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

setGlobalOptions({ region: "asia-southeast2", maxInstances: 10, timeoutSeconds: 30, memory: "256MiB" });
initializeApp();
const db = getFirestore();
const authAdmin = getAuth();
const callableOptions = { region: "asia-southeast2", enforceAppCheck: process.env.KUDAPKITA_ENFORCE_APP_CHECK === "true" };

function fail(code, message) {
  throw new HttpsError(code, message);
}

function requestId(data) {
  try {
    return validateClientRequestId(data && data.clientRequestId);
  } catch (error) {
    fail("invalid-argument", error.message);
  }
}

function text(value, label, max = 120, min = 0) {
  try {
    return boundedString(value, label, max, min);
  } catch (error) {
    fail("invalid-argument", error.message);
  }
}

function integer(value, label, options) {
  try {
    return asInteger(value, label, options);
  } catch (error) {
    fail("invalid-argument", error.message);
  }
}

function linesFrom(value) {
  try {
    return normalizeLines(value, { maxLines: 6, maxQuantity: 50 });
  } catch (error) {
    fail("invalid-argument", error.message);
  }
}

function ensureAuthenticated(request) {
  if (!request.auth?.uid) fail("unauthenticated", "Silakan masuk terlebih dahulu.");
  return request.auth.uid;
}

function ensureGuest(request) {
  const uid = ensureAuthenticated(request);
  if (request.auth.token?.firebase?.sign_in_provider !== "anonymous") {
    fail("permission-denied", "Checkout pelanggan harus menggunakan sesi pelanggan.");
  }
  return uid;
}

async function ensureOwner(request) {
  const uid = ensureAuthenticated(request);
  const profile = await db.collection("userProfiles").doc(uid).get();
  if (!profile.exists || profile.data()?.role !== "owner" || profile.data()?.isActive !== true) {
    fail("permission-denied", "Akses hanya tersedia untuk owner KudapKita.");
  }
  const ownerDeviceId = request.auth.token?.ownerDeviceId;
  if (ownerDeviceId) {
    const device = await db.collection("ownerDevices").doc(uid)
      .collection("devices").doc(ownerDeviceId).get();
    if (!device.exists || device.data()?.status !== "ACTIVE") {
      fail("permission-denied", "Perangkat owner sudah dicabut atau tidak aktif.");
    }
  }
  return uid;
}

function now() {
  return FieldValue.serverTimestamp();
}

function millis(value) {
  if (value && typeof value.toMillis === "function") return value.toMillis();
  if (value && typeof value.toDate === "function") return value.toDate().getTime();
  return new Date(value).getTime();
}

function proofFingerprint(value) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

async function readProducts(transaction, lines, { requirePublished = true } = {}) {
  const refs = lines.map((line) => db.collection("products").doc(line.productId));
  const snapshots = await Promise.all(refs.map((ref) => transaction.get(ref)));
  const products = new Map();
  snapshots.forEach((snapshot, index) => {
    const productId = lines[index].productId;
    if (!snapshot.exists) fail("not-found", "Produk " + productId + " tidak ditemukan.");
    const product = snapshot.data();
    if (product.isArchived === true) fail("failed-precondition", "Produk " + (product.name || productId) + " sudah diarsipkan.");
    if (requirePublished && product.isPublished !== true) fail("failed-precondition", "Produk " + (product.name || productId) + " tidak tersedia di katalog.");
    if (product.availability === "SOLD_OUT") fail("failed-precondition", "Produk " + (product.name || productId) + " sedang habis.");
    products.set(productId, product);
  });
  return products;
}

/** Guest checkout reads trusted product prices on the server and is idempotent. */
export const createOnlineOrder = onCall(callableOptions, async (request) => {
  const uid = ensureGuest(request);
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
  const lines = linesFrom(request.data?.items);
  const orderId = operationDocumentId(uid, clientRequestId, "ord");
  const orderRef = db.collection("orders").doc(orderId);
  const fingerprint = proofFingerprint({ uid, customerName, customerWhatsApp, fulfillmentMethod, deliveryAddress, customerNote, lines });

  return db.runTransaction(async (transaction) => {
    const existing = await transaction.get(orderRef);
    if (existing.exists) {
      if (existing.data()?.createdByUid !== uid || existing.data()?.requestFingerprint !== fingerprint) {
        fail("already-exists", "ID permintaan ini sudah digunakan untuk data lain.");
      }
      return { orderId, created: false };
    }
    const products = await readProducts(transaction, lines);
    const items = lines.map((line) => {
      const product = products.get(line.productId);
      const unitPrice = Number(product.price);
      if (!Number.isSafeInteger(unitPrice) || unitPrice < 0) fail("failed-precondition", "Harga " + product.name + " belum ditetapkan.");
      return {
        productId: line.productId,
        productName: String(product.name || line.productId).slice(0, 120),
        quantity: line.quantity,
        displayedUnitPrice: unitPrice,
      };
    });
    transaction.create(orderRef, {
      createdByUid: uid,
      clientRequestId,
      requestFingerprint: fingerprint,
      customerName,
      customerWhatsApp,
      fulfillmentMethod,
      ...(deliveryAddress ? { deliveryAddress } : {}),
      ...(customerNote ? { customerNote } : {}),
      items,
      orderStatus: "REQUESTED",
      paymentStatus: "UNPAID",
      productionStatus: "NOT_STARTED",
      deliveryStatus: "NOT_SCHEDULED",
      deliveryDocumentStatus: "NOT_CREATED",
      source: "ONLINE",
      createdAt: now(),
      updatedAt: now(),
    });
    return { orderId, created: true };
  });
});

export const confirmOrderQuote = onCall(callableOptions, async (request) => {
  const ownerUid = await ensureOwner(request);
  const orderId = text(request.data?.orderId, "ID pesanan", 120, 1);
  const confirmedTotal = integer(request.data?.confirmedTotal, "Total konfirmasi", { min: 1, max: 1_000_000_000 });
  const ref = db.collection("orders").doc(orderId);
  return db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists) fail("not-found", "Pesanan tidak ditemukan.");
    const order = snapshot.data();
    if (order.orderStatus === "WAITING_PAYMENT" && order.confirmedTotal === confirmedTotal) {
      return { updated: false, confirmedTotal };
    }
    if (order.orderStatus !== "REQUESTED" || order.paymentStatus !== "UNPAID") {
      fail("failed-precondition", "Total hanya dapat dikonfirmasi untuk permintaan baru yang belum dibayar.");
    }
    transaction.update(ref, {
      confirmedTotal,
      orderStatus: "WAITING_PAYMENT",
      quoteConfirmedByUid: ownerUid,
      quoteConfirmedAt: now(),
      updatedAt: now(),
    });
    return { updated: true, confirmedTotal };
  });
});

export const verifyOrderPayment = onCall(callableOptions, async (request) => {
  const ownerUid = await ensureOwner(request);
  const orderId = text(request.data?.orderId, "ID pesanan", 120, 1);
  const paymentMethod = request.data?.paymentMethod;
  if (!["BANK_TRANSFER", "QRIS"].includes(paymentMethod)) fail("invalid-argument", "Metode pembayaran tidak valid.");
  const orderRef = db.collection("orders").doc(orderId);
  const paymentRef = db.collection("payments").doc("online-" + orderId);
  return db.runTransaction(async (transaction) => {
    const [orderSnapshot, paymentSnapshot] = await Promise.all([
      transaction.get(orderRef),
      transaction.get(paymentRef),
    ]);
    if (!orderSnapshot.exists) fail("not-found", "Pesanan tidak ditemukan.");
    const order = orderSnapshot.data();
    if (paymentSnapshot.exists) {
      if (order.paymentStatus === "PAID") return { verified: false, amount: paymentSnapshot.data()?.amount, alreadyVerified: true };
      fail("failed-precondition", "Catatan pembayaran sudah ada tetapi status pesanan tidak konsisten.");
    }
    if (order.orderStatus !== "WAITING_PAYMENT" || order.paymentStatus !== "WAITING_VERIFICATION") {
      fail("failed-precondition", "Bukti pembayaran belum menunggu verifikasi.");
    }
    const amount = integer(order.confirmedTotal, "Total pembayaran", { min: 1, max: 1_000_000_000 });
    transaction.update(orderRef, {
      paymentStatus: "PAID",
      paymentMethod,
      paymentVerifiedByUid: ownerUid,
      paymentVerifiedAt: now(),
      updatedAt: now(),
    });
    transaction.create(paymentRef, {
      orderId,
      amount,
      method: paymentMethod,
      status: "VERIFIED",
      verifiedByUid: ownerUid,
      verifiedAt: now(),
      createdAt: now(),
    });
    return { verified: true, amount };
  });
});

export const submitOrderPaymentProof = onCall(callableOptions, async (request) => {
  const uid = ensureGuest(request);
  const orderId = text(request.data?.orderId, "ID pesanan", 120, 1);
  const paymentMethod = request.data?.paymentMethod;
  if (!["BANK_TRANSFER", "EWALLET", "QRIS"].includes(paymentMethod)) fail("invalid-argument", "Metode pembayaran bukti tidak valid.");
  const paymentProofPath = text(request.data?.paymentProofPath, "Path bukti pembayaran", 300, 1);
  if (!paymentProofPath.startsWith("payment-proofs/" + uid + "/" + orderId + "/")) {
    fail("permission-denied", "Path bukti pembayaran tidak sesuai dengan pesanan.");
  }
  const ref = db.collection("orders").doc(orderId);
  return db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists || snapshot.data()?.createdByUid !== uid) fail("permission-denied", "Pesanan tidak ditemukan atau bukan milik pelanggan ini.");
    const order = snapshot.data();
    if (order.orderStatus !== "WAITING_PAYMENT" || order.paymentStatus === "PAID") {
      fail("failed-precondition", "Bukti hanya dapat dikirim sebelum pembayaran diverifikasi.");
    }
    transaction.update(ref, {
      paymentStatus: "WAITING_VERIFICATION",
      paymentMethod,
      paymentProofPath,
      paymentProofSubmittedAt: now(),
      updatedAt: now(),
    });
    return { submitted: true };
  });
});

export const rejectOrderPayment = onCall(callableOptions, async (request) => {
  const ownerUid = await ensureOwner(request);
  const orderId = text(request.data?.orderId, "ID pesanan", 120, 1);
  const reason = text(request.data?.reason || "Bukti pembayaran tidak valid", "Alasan penolakan", 240, 3);
  const ref = db.collection("orders").doc(orderId);
  return db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists) fail("not-found", "Pesanan tidak ditemukan.");
    const order = snapshot.data();
    if (order.paymentStatus !== "WAITING_VERIFICATION" || order.orderStatus !== "WAITING_PAYMENT") {
      fail("failed-precondition", "Pembayaran tidak sedang menunggu verifikasi.");
    }
    transaction.update(ref, {
      paymentStatus: "REJECTED",
      orderStatus: "REJECTED",
      paymentRejectedByUid: ownerUid,
      paymentRejectedAt: now(),
      paymentRejectionReason: reason,
      updatedAt: now(),
    });
    return { rejected: true };
  });
});

export const transitionOrderStatus = onCall(callableOptions, async (request) => {
  await ensureOwner(request);
  const orderId = text(request.data?.orderId, "ID pesanan", 120, 1);
  const nextStatus = request.data?.orderStatus;
  const orderRef = db.collection("orders").doc(orderId);
  return db.runTransaction(async (transaction) => {
    const orderSnapshot = await transaction.get(orderRef);
    if (!orderSnapshot.exists) fail("not-found", "Pesanan tidak ditemukan.");
    const order = orderSnapshot.data();
    const currentStatus = String(order.orderStatus || "");
    if (currentStatus === nextStatus) return { updated: false, orderStatus: currentStatus };
    if (!isAllowedTransition(currentStatus, order.paymentStatus, order.fulfillmentMethod, nextStatus)) {
      fail("failed-precondition", "Perubahan status tidak sesuai alur pesanan atau pembayaran.");
    }

    if (nextStatus === "PREPARING") {
      const lines = linesFrom(order.items || []);
      const inventoryRefs = lines.map((line) => db.collection("inventory").doc(line.productId));
      const movementRefs = lines.map((line) => db.collection("stockMovements").doc("online-" + orderId + "-" + line.productId));
      const inventorySnapshots = await Promise.all(inventoryRefs.map((ref) => transaction.get(ref)));
      const movementSnapshots = await Promise.all(movementRefs.map((ref) => transaction.get(ref)));
      if (movementSnapshots.some((snapshot) => snapshot.exists)) {
        fail("failed-precondition", "Riwayat pengurangan stok sudah ada. Periksa pesanan sebelum melanjutkan.");
      }
      const updates = lines.map((line, index) => {
        const inventory = inventorySnapshots[index].exists ? inventorySnapshots[index].data() : {};
        const beforeQty = Number(inventory.availableQty ?? 0);
        if (!Number.isSafeInteger(beforeQty) || beforeQty < line.quantity) {
          fail("failed-precondition", "Stok produk " + line.productId + " tidak mencukupi.");
        }
        return { line, ref: inventoryRefs[index], movementRef: movementRefs[index], beforeQty, afterQty: beforeQty - line.quantity, productName: String(inventory.productName || line.productId), unit: String(inventory.unit || "pcs") };
      });
      for (const update of updates) {
        transaction.set(update.ref, { productId: update.line.productId, productName: update.productName, availableQty: update.afterQty, unit: update.unit, updatedAt: now() }, { merge: true });
        transaction.create(update.movementRef, {
          productId: update.line.productId,
          productName: update.productName,
          type: "ONLINE_ORDER",
          quantity: -update.line.quantity,
          beforeQty: update.beforeQty,
          afterQty: update.afterQty,
          referenceId: orderId,
          reason: "Persiapan pesanan online",
          createdAt: now(),
        });
      }
      transaction.update(orderRef, {
        orderStatus: nextStatus,
        productionStatus: "IN_PROGRESS",
        stockDeducted: true,
        stockDeductedAt: now(),
        updatedAt: now(),
      });
      return { updated: true, orderStatus: nextStatus, stockDeducted: true };
    }
    const statusUpdate = { orderStatus: nextStatus, updatedAt: now() };
    if (nextStatus === "READY_FOR_PICKUP") {
      statusUpdate.productionStatus = "READY";
      statusUpdate.deliveryStatus = "READY_FOR_PICKUP";
    } else if (nextStatus === "OUT_FOR_DELIVERY") {
      statusUpdate.productionStatus = "READY";
      statusUpdate.deliveryStatus = "OUT_FOR_DELIVERY";
    } else if (nextStatus === "COMPLETED") {
      statusUpdate.productionStatus = "READY";
      statusUpdate.deliveryStatus = order.fulfillmentMethod === "PICKUP" ? "PICKED_UP" : "DELIVERED";
    }
    transaction.update(orderRef, statusUpdate);
    return { updated: true, orderStatus: nextStatus };
  });
});

export const recordProduction = onCall(callableOptions, async (request) => {
  const uid = await ensureOwner(request);
  const clientRequestId = requestId(request.data);
  const productId = text(request.data?.productId, "ID produk", 128, 1);
  const quantity = integer(request.data?.quantity, "Jumlah produksi", { min: 1, max: 100000 });
  const note = text(request.data?.note || "", "Catatan produksi", 300);
  const runId = operationDocumentId(uid, clientRequestId, "prod");
  const runRef = db.collection("productionRuns").doc(runId);
  const inventoryRef = db.collection("inventory").doc(productId);
  const movementRef = db.collection("stockMovements").doc("production-" + runId);
  return db.runTransaction(async (transaction) => {
    const [runSnapshot, productSnapshot, inventorySnapshot] = await Promise.all([
      transaction.get(runRef), transaction.get(db.collection("products").doc(productId)), transaction.get(inventoryRef),
    ]);
    if (runSnapshot.exists) return { created: false, id: runId };
    if (!productSnapshot.exists || productSnapshot.data()?.isArchived === true) fail("not-found", "Produk tidak ditemukan atau sudah diarsipkan.");
    const product = productSnapshot.data();
    const beforeQty = inventorySnapshot.exists ? Number(inventorySnapshot.data()?.availableQty ?? 0) : 0;
    if (!Number.isSafeInteger(beforeQty) || beforeQty < 0 || beforeQty + quantity > 1000000) fail("failed-precondition", "Saldo stok atau hasil produksi melebihi batas aman.");
    const afterQty = beforeQty + quantity;
    transaction.set(inventoryRef, { productId, productName: String(product.name), availableQty: afterQty, unit: String(product.unit || "pcs"), updatedAt: now() }, { merge: true });
    transaction.create(movementRef, { productId, productName: String(product.name), type: "PRODUCTION", quantity, beforeQty, afterQty, referenceId: runId, reason: note || "Produksi selesai", createdAt: now() });
    transaction.create(runRef, { productId, productName: String(product.name), quantity, unit: String(product.unit || "pcs"), note, status: "COMPLETED", stockMovementId: movementRef.id, createdByUid: uid, createdAt: now(), requestFingerprint: proofFingerprint({ uid, productId, quantity, note }) });
    return { created: true, id: runId, availableQty: afterQty };
  });
});

export const adjustFinishedStock = onCall(callableOptions, async (request) => {
  const uid = await ensureOwner(request);
  const clientRequestId = requestId(request.data);
  const productId = text(request.data?.productId, "ID produk", 128, 1);
  const delta = integer(request.data?.delta, "Perubahan stok", { min: -100000, max: 100000 });
  if (delta === 0) fail("invalid-argument", "Perubahan stok tidak boleh nol.");
  const reason = text(request.data?.reason, "Alasan penyesuaian", 300, 3);
  const operationId = operationDocumentId(uid, clientRequestId, "adj");
  const movementRef = db.collection("stockMovements").doc(operationId);
  const inventoryRef = db.collection("inventory").doc(productId);
  const productRef = db.collection("products").doc(productId);
  return db.runTransaction(async (transaction) => {
    const [movementSnapshot, productSnapshot, inventorySnapshot] = await Promise.all([
      transaction.get(movementRef), transaction.get(productRef), transaction.get(inventoryRef),
    ]);
    if (movementSnapshot.exists) return { adjusted: false, id: operationId, availableQty: movementSnapshot.data()?.afterQty };
    if (!productSnapshot.exists || productSnapshot.data()?.isArchived === true) fail("not-found", "Produk tidak ditemukan atau sudah diarsipkan.");
    const product = productSnapshot.data();
    const beforeQty = inventorySnapshot.exists ? Number(inventorySnapshot.data()?.availableQty ?? 0) : 0;
    const afterQty = beforeQty + delta;
    if (!Number.isSafeInteger(beforeQty) || beforeQty < 0 || afterQty < 0 || afterQty > 1000000) fail("failed-precondition", "Penyesuaian membuat saldo stok tidak valid atau negatif.");
    transaction.set(inventoryRef, { productId, productName: String(product.name), availableQty: afterQty, unit: String(product.unit || "pcs"), updatedAt: now() }, { merge: true });
    transaction.create(movementRef, { productId, productName: String(product.name), type: "ADJUSTMENT", quantity: delta, beforeQty, afterQty, reason, requestFingerprint: proofFingerprint({ uid, productId, delta, reason }), createdAt: now() });
    return { adjusted: true, id: operationId, availableQty: afterQty };
  });
});

export const createDirectSale = onCall(callableOptions, async (request) => {
  const uid = await ensureOwner(request);
  const clientRequestId = requestId(request.data);
  const lines = linesFrom(request.data?.items);
  const paymentMethod = request.data?.paymentMethod;
  if (!["CASH", "BANK_TRANSFER", "QRIS"].includes(paymentMethod)) fail("invalid-argument", "Metode pembayaran langsung tidak valid.");
  const note = text(request.data?.note || "", "Catatan penjualan", 300);
  const saleId = operationDocumentId(uid, clientRequestId, "sale");
  const saleRef = db.collection("directSales").doc(saleId);
  return db.runTransaction(async (transaction) => {
    const existing = await transaction.get(saleRef);
    if (existing.exists) return { id: saleId, total: existing.data()?.total, created: false };
    const products = await readProducts(transaction, lines, { requirePublished: false });
    const trusted = calculateTrustedSaleItems(lines, products);
    const inventoryRefs = lines.map((line) => db.collection("inventory").doc(line.productId));
    const inventorySnapshots = await Promise.all(inventoryRefs.map((ref) => transaction.get(ref)));
    const updates = lines.map((line, index) => {
      const snapshot = inventorySnapshots[index];
      const beforeQty = snapshot.exists ? Number(snapshot.data()?.availableQty ?? 0) : 0;
      if (!Number.isSafeInteger(beforeQty) || beforeQty < line.quantity) fail("failed-precondition", "Stok produk " + line.productId + " tidak cukup untuk penjualan.");
      const product = products.get(line.productId);
      return { line, ref: inventoryRefs[index], movementRef: db.collection("stockMovements").doc("sale-" + saleId + "-" + line.productId), beforeQty, afterQty: beforeQty - line.quantity, productName: String(product.name), unit: String(product.unit || "pcs") };
    });
    const movementSnapshots = await Promise.all(updates.map((item) => transaction.get(item.movementRef)));
    if (movementSnapshots.some((snapshot) => snapshot.exists)) fail("failed-precondition", "Riwayat penjualan sudah ada. Periksa transaksi sebelum mencoba ulang.");
    transaction.create(saleRef, { channel: "DIRECT", items: trusted.items, total: trusted.total, paymentMethod, paymentStatus: "VERIFIED", recordedByUid: uid, requestFingerprint: proofFingerprint({ uid, lines, paymentMethod, note }), note, createdAt: now() });
    for (const update of updates) {
      transaction.set(update.ref, { productId: update.line.productId, productName: update.productName, availableQty: update.afterQty, unit: update.unit, updatedAt: now() }, { merge: true });
      transaction.create(update.movementRef, { productId: update.line.productId, productName: update.productName, type: "DIRECT_SALE", quantity: -update.line.quantity, beforeQty: update.beforeQty, afterQty: update.afterQty, referenceId: saleId, reason: "Penjualan langsung", createdAt: now() });
    }
    return { id: saleId, total: trusted.total, created: true };
  });
});

/** A customer can only attach proof to their own outstanding order. */
export const rejectOrderPaymentProof = onCall(callableOptions, async (request) => {
  const ownerUid = await ensureOwner(request);
  const orderId = text(request.data?.orderId, "ID pesanan", 120, 1);
  const reason = text(request.data?.reason || "Bukti pembayaran tidak valid", "Alasan penolakan", 240, 3);
  const ref = db.collection("orders").doc(orderId);
  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists) fail("not-found", "Pesanan tidak ditemukan.");
    const order = snapshot.data();
    if (order.paymentStatus !== "WAITING_VERIFICATION" || order.orderStatus !== "WAITING_PAYMENT") fail("failed-precondition", "Pembayaran tidak sedang menunggu verifikasi.");
    transaction.update(ref, { paymentStatus: "REJECTED", orderStatus: "REJECTED", paymentRejectedByUid: ownerUid, paymentRejectedAt: now(), paymentRejectionReason: reason, updatedAt: now() });
  });
  return { rejected: true };
});

export const issueDeliveryOrder = onCall(callableOptions, async (request) => {
  await ensureOwner(request);
  const orderId = text(request.data?.orderId, "ID pesanan", 120, 1);
  const ref = db.collection("orders").doc(orderId);
  return db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists) fail("not-found", "Pesanan tidak ditemukan.");
    const order = snapshot.data();
    if (order.fulfillmentMethod !== "DELIVERY" || order.paymentStatus !== "PAID" || !["PREPARING", "OUT_FOR_DELIVERY"].includes(order.orderStatus)) {
      fail("failed-precondition", "Surat jalan hanya tersedia untuk pesanan pengantaran yang sudah dibayar dan sedang diproses.");
    }
    const suffix = orderId.replace(/[^A-Za-z0-9]/g, "").slice(-6).toUpperCase();
    const deliveryOrderNumber = order.deliveryOrderNumber || "DO-" + new Date().toISOString().slice(0, 10).replaceAll("-", "") + "-" + suffix;
    transaction.update(ref, { deliveryOrderNumber, deliveryDocumentStatus: "CREATED", deliveryStatus: "OUT_FOR_DELIVERY", orderStatus: "OUT_FOR_DELIVERY", updatedAt: now() });
    return { deliveryOrderNumber };
  });
});

/** Owner-device pairing: QR challenges expire quickly and only a one-time hashed token is stored. */
export const createOwnerPairingChallenge = onCall(callableOptions, async (request) => {
  const ownerUid = await ensureOwner(request);
  const challengeId = "pair_" + randomBytes(16).toString("hex");
  const token = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const expiresAt = Date.now() + 2 * 60 * 1000;
  await db.collection("ownerPairings").doc(challengeId).set({ ownerUid, tokenHash, status: "CREATED", createdAt: now(), expiresAt: new Date(expiresAt) });
  return { challengeId, token, expiresAt };
});

export const requestOwnerPairing = onCall(callableOptions, async (request) => {
  const uid = ensureGuest(request);
  const challengeId = text(request.data?.challengeId, "Challenge pairing", 80, 1);
  const token = text(request.data?.token, "Token pairing", 120, 32);
  const deviceLabel = text(request.data?.deviceLabel || "Perangkat Owner", "Nama perangkat", 80, 2);
  const ref = db.collection("ownerPairings").doc(challengeId);
  const tokenHash = createHash("sha256").update(token).digest("hex");
  return db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists) fail("not-found", "Challenge pairing tidak ditemukan.");
    const challenge = snapshot.data();
    if (challenge.tokenHash !== tokenHash) fail("permission-denied", "Token pairing tidak valid.");
    if (challenge.status !== "CREATED") fail("failed-precondition", "Challenge sudah digunakan atau diproses.");
    if (!Number.isFinite(millis(challenge.expiresAt)) || millis(challenge.expiresAt) < Date.now()) {
      transaction.update(ref, { status: "EXPIRED", updatedAt: now() });
      fail("deadline-exceeded", "Challenge pairing sudah kedaluwarsa.");
    }
    transaction.update(ref, { status: "REQUESTED", requestedByUid: uid, requestedDeviceLabel: deviceLabel, requestedAt: now(), updatedAt: now() });
    return { requested: true };
  });
});

export const getOwnerPairingStatus = onCall(callableOptions, async (request) => {
  const uid = ensureAuthenticated(request);
  const challengeId = text(request.data?.challengeId, "Challenge pairing", 80, 1);
  const ref = db.collection("ownerPairings").doc(challengeId);
  const snapshot = await ref.get();
  if (!snapshot.exists) fail("not-found", "Challenge pairing tidak ditemukan.");
  const data = snapshot.data();
  if (data.ownerUid !== uid && data.requestedByUid !== uid) fail("permission-denied", "Challenge bukan milik sesi ini.");
  if (data.status !== "CONSUMED" && millis(data.expiresAt) < Date.now() && ["CREATED", "REQUESTED", "APPROVED"].includes(data.status)) {
    await ref.update({ status: "EXPIRED", updatedAt: now() });
    return { status: "EXPIRED", deviceLabel: data.requestedDeviceLabel || "" };
  }
  return { status: data.status, deviceLabel: data.requestedDeviceLabel || "" };
});

export const approveOwnerPairing = onCall(callableOptions, async (request) => {
  const ownerUid = await ensureOwner(request);
  const challengeId = text(request.data?.challengeId, "Challenge pairing", 80, 1);
  const approve = request.data?.approve === true;
  const ref = db.collection("ownerPairings").doc(challengeId);
  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists) fail("not-found", "Challenge pairing tidak ditemukan.");
    const challenge = snapshot.data();
    if (challenge.ownerUid !== ownerUid) fail("permission-denied", "Challenge milik owner lain.");
    if (challenge.status !== "REQUESTED") fail("failed-precondition", "Tidak ada permintaan perangkat yang dapat diproses.");
    if (millis(challenge.expiresAt) < Date.now()) fail("deadline-exceeded", "Challenge pairing sudah kedaluwarsa.");
    transaction.update(ref, { status: approve ? "APPROVED" : "REJECTED", approvedAt: now(), updatedAt: now() });
  });
  return { approved: approve };
});

export const consumeOwnerPairing = onCall(callableOptions, async (request) => {
  const uid = ensureGuest(request);
  const challengeId = text(request.data?.challengeId, "Challenge pairing", 80, 1);
  const token = text(request.data?.token, "Token pairing", 120, 32);
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const challengeRef = db.collection("ownerPairings").doc(challengeId);
  const challenge = await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(challengeRef);
    if (!snapshot.exists) fail("not-found", "Challenge pairing tidak ditemukan.");
    const data = snapshot.data();
    if (data.requestedByUid !== uid || data.tokenHash !== tokenHash) fail("permission-denied", "Token atau perangkat pairing tidak sesuai.");
    if (data.status !== "APPROVED") fail("failed-precondition", "Pairing belum disetujui.");
    if (millis(data.expiresAt) < Date.now()) fail("deadline-exceeded", "Challenge pairing sudah kedaluwarsa.");
    transaction.update(challengeRef, { status: "CONSUMED", consumedAt: now(), updatedAt: now() });
    return data;
  });
  const deviceId = "device_" + randomBytes(16).toString("hex");
  await db.collection("ownerDevices").doc(challenge.ownerUid).collection("devices").doc(deviceId).set({
    label: challenge.requestedDeviceLabel || "Perangkat Owner",
    status: "ACTIVE",
    authMethod: "QR_PAIRING",
    createdAt: now(),
    lastSeenAt: now(),
  });
  const customToken = await authAdmin.createCustomToken(challenge.ownerUid, { role: "owner", ownerDeviceId: deviceId });
  return { customToken };
});

export const listOwnerDevices = onCall(callableOptions, async (request) => {
  const uid = await ensureOwner(request);
  const snapshot = await db.collection("ownerDevices").doc(uid).collection("devices").orderBy("createdAt", "desc").get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
});

export const revokeOwnerDevice = onCall(callableOptions, async (request) => {
  const uid = await ensureOwner(request);
  const deviceId = text(request.data?.deviceId, "ID perangkat", 100, 1);
  const ref = db.collection("ownerDevices").doc(uid).collection("devices").doc(deviceId);
  const snapshot = await ref.get();
  if (!snapshot.exists) fail("not-found", "Perangkat tidak ditemukan.");
  await ref.set({ status: "REVOKED", revokedAt: now() }, { merge: true });
  return { revoked: true };
});
