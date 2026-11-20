import { createHash } from "node:crypto";

export const ORDER_TRANSITIONS = Object.freeze({
  REQUESTED: ["WAITING_PAYMENT", "REJECTED", "CANCELLED"],
  WAITING_PAYMENT: ["PREPARING", "REJECTED", "CANCELLED"],
  PREPARING: ["READY_FOR_PICKUP", "OUT_FOR_DELIVERY"],
  READY_FOR_PICKUP: ["COMPLETED"],
  OUT_FOR_DELIVERY: ["COMPLETED"],
  COMPLETED: [],
  REJECTED: [],
  CANCELLED: [],
});

export function boundedString(value, label, max = 120, min = 0) {
  if (typeof value !== "string") throw new TypeError(`${label} tidak valid.`);
  const text = value.trim();
  if (text.length < min || text.length > max) {
    throw new RangeError(`${label} harus berisi ${min}-${max} karakter.`);
  }
  return text;
}

export function asInteger(value, label, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  const number = typeof value === "number" ? value : Number(value);
  if (!Number.isSafeInteger(number) || number < min || number > max) {
    throw new RangeError(`${label} harus berupa bilangan bulat antara ${min} dan ${max}.`);
  }
  return number;
}

export function normalizeLines(raw, { maxLines = 6, maxQuantity = 50 } = {}) {
  if (!Array.isArray(raw) || raw.length < 1 || raw.length > maxLines) {
    throw new RangeError(`Pilih 1 sampai ${maxLines} produk.`);
  }
  const merged = new Map();
  for (const row of raw) {
    const productId = boundedString(row?.productId, "ID produk", 128, 1);
    const quantity = asInteger(row?.quantity, "Jumlah produk", { min: 1, max: maxQuantity });
    const total = (merged.get(productId) ?? 0) + quantity;
    if (total > maxQuantity) throw new RangeError("Jumlah gabungan per produk melebihi batas.");
    merged.set(productId, total);
  }
  return [...merged.entries()].map(([productId, quantity]) => ({ productId, quantity }));
}

export function validateClientRequestId(value) {
  const id = boundedString(value, "ID permintaan", 80, 16);
  if (!/^[A-Za-z0-9_-]+$/.test(id)) {
    throw new TypeError("ID permintaan mengandung karakter yang tidak diizinkan.");
  }
  return id;
}

export function operationDocumentId(uid, requestId, prefix = "op") {
  const digest = createHash("sha256").update(`${uid}:${requestId}`).digest("hex").slice(0, 36);
  return `${prefix}_${digest}`;
}

export function isAllowedTransition(currentStatus, paymentStatus, fulfillmentMethod, nextStatus) {
  if (!Object.hasOwn(ORDER_TRANSITIONS, currentStatus)) return false;
  if (!ORDER_TRANSITIONS[currentStatus].includes(nextStatus)) return false;
  if (nextStatus === "WAITING_PAYMENT") return currentStatus === "REQUESTED" && paymentStatus === "UNPAID";
  if (nextStatus === "PREPARING") return currentStatus === "WAITING_PAYMENT" && paymentStatus === "PAID";
  if (nextStatus === "REJECTED" || nextStatus === "CANCELLED") {
    return paymentStatus === "UNPAID" && ["REQUESTED", "WAITING_PAYMENT"].includes(currentStatus);
  }
  if (nextStatus === "READY_FOR_PICKUP") return currentStatus === "PREPARING" && fulfillmentMethod === "PICKUP";
  if (nextStatus === "OUT_FOR_DELIVERY") return currentStatus === "PREPARING" && fulfillmentMethod === "DELIVERY";
  if (nextStatus === "COMPLETED") return ["READY_FOR_PICKUP", "OUT_FOR_DELIVERY"].includes(currentStatus);
  return false;
}

export function calculateTrustedSaleItems(lines, products) {
  let total = 0;
  const items = lines.map(({ productId, quantity }) => {
    const product = products.get(productId);
    if (!product) throw new Error(`Produk ${productId} tidak ditemukan.`);
    if (product.isArchived === true) throw new Error(`Produk ${product.name || productId} sudah diarsipkan.`);
    const unitPrice = asInteger(product.price, `Harga ${product.name || productId}`, { min: 1, max: 1_000_000_000 });
    const subtotal = unitPrice * quantity;
    if (!Number.isSafeInteger(subtotal)) throw new RangeError("Subtotal transaksi melebihi batas angka yang aman.");
    total += subtotal;
    if (!Number.isSafeInteger(total)) throw new RangeError("Total transaksi melebihi batas angka yang aman.");
    return {
      productId,
      productName: boundedString(String(product.name || productId), "Nama produk", 120, 1),
      unitPrice,
      quantity,
      subtotal,
    };
  });
  return { items, total };
}
