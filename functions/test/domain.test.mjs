import test from "node:test";
import assert from "node:assert/strict";
import {
  ORDER_TRANSITIONS,
  asInteger,
  boundedString,
  calculateTrustedSaleItems,
  isAllowedTransition,
  normalizeLines,
  operationDocumentId,
  validateClientRequestId,
} from "../src/domain.js";

test("normalizeLines merges duplicate product IDs and preserves quantity", () => {
  assert.deepEqual(normalizeLines([
    { productId: "risol", quantity: 2 },
    { productId: "onde", quantity: 1 },
    { productId: "risol", quantity: 3 },
  ]), [
    { productId: "risol", quantity: 5 },
    { productId: "onde", quantity: 1 },
  ]);
});

test("normalizeLines rejects empty, oversized, fractional and excessive quantities", () => {
  assert.throws(() => normalizeLines([]), RangeError);
  assert.throws(() => normalizeLines(Array.from({ length: 7 }, (_, i) => ({ productId: String(i), quantity: 1 }))), RangeError);
  assert.throws(() => normalizeLines([{ productId: "risol", quantity: 1.5 }]), RangeError);
  assert.throws(() => normalizeLines([{ productId: "risol", quantity: 51 }]), RangeError);
});

test("request IDs are bounded and operation IDs are deterministic but UID-scoped", () => {
  assert.equal(validateClientRequestId("request_1234567890"), "request_1234567890");
  assert.throws(() => validateClientRequestId("short"), RangeError);
  assert.throws(() => validateClientRequestId("request/id/123456"), TypeError);
  const id = operationDocumentId("user-a", "request_1234567890", "sale");
  assert.match(id, /^sale_[a-f0-9]{36}$/);
  assert.equal(id, operationDocumentId("user-a", "request_1234567890", "sale"));
  assert.notEqual(id, operationDocumentId("user-b", "request_1234567890", "sale"));
});

test("bounded strings trim whitespace and reject invalid values", () => {
  assert.equal(boundedString("  KudapKita  ", "Nama", 20, 2), "KudapKita");
  assert.throws(() => boundedString("", "Nama", 20, 2), RangeError);
  assert.throws(() => boundedString(12, "Nama", 20, 2), TypeError);
});

test("asInteger rejects fractions, negative, non-finite and overflow values", () => {
  assert.equal(asInteger(1500, "Harga", { min: 1 }), 1500);
  assert.throws(() => asInteger(10.5, "Harga"), RangeError);
  assert.throws(() => asInteger(-1, "Harga"), RangeError);
  assert.throws(() => asInteger(Number.MAX_SAFE_INTEGER + 1, "Harga"), RangeError);
});

test("trusted direct sales use server product prices, not client amounts", () => {
  const products = new Map([
    ["risol", { name: "Risol Mayo", price: 2000, unit: "pcs" }],
    ["onde", { name: "Onde-onde", price: 1500, unit: "pcs" }],
  ]);
  const result = calculateTrustedSaleItems([
    { productId: "risol", quantity: 3 },
    { productId: "onde", quantity: 2 },
  ], products);
  assert.equal(result.total, 9000);
  assert.equal(result.items[0].subtotal, 6000);
  assert.equal(result.items[1].unitPrice, 1500);
});

test("trusted direct sales reject missing, archived, null-price and zero-price products", () => {
  assert.throws(() => calculateTrustedSaleItems([{ productId: "missing", quantity: 1 }], new Map()), /tidak ditemukan/);
  assert.throws(() => calculateTrustedSaleItems([{ productId: "old", quantity: 1 }], new Map([["old", { name: "Produk", price: 2000, isArchived: true }]])), /diarsipkan/);
  assert.throws(() => calculateTrustedSaleItems([{ productId: "null", quantity: 1 }], new Map([["null", { name: "Produk", price: null }]])), RangeError);
  assert.throws(() => calculateTrustedSaleItems([{ productId: "zero", quantity: 1 }], new Map([["zero", { name: "Produk", price: 0 }]])), RangeError);
});

test("order transitions require payment and matching fulfilment method", () => {
  assert.equal(isAllowedTransition("REQUESTED", "UNPAID", "PICKUP", "WAITING_PAYMENT"), true);
  assert.equal(isAllowedTransition("REQUESTED", "PAID", "PICKUP", "WAITING_PAYMENT"), false);
  assert.equal(isAllowedTransition("WAITING_PAYMENT", "UNPAID", "PICKUP", "PREPARING"), false);
  assert.equal(isAllowedTransition("WAITING_PAYMENT", "PAID", "PICKUP", "PREPARING"), true);
  assert.equal(isAllowedTransition("PREPARING", "PAID", "PICKUP", "READY_FOR_PICKUP"), true);
  assert.equal(isAllowedTransition("PREPARING", "PAID", "PICKUP", "OUT_FOR_DELIVERY"), false);
  assert.equal(isAllowedTransition("PREPARING", "PAID", "DELIVERY", "OUT_FOR_DELIVERY"), true);
  assert.equal(isAllowedTransition("COMPLETED", "PAID", "PICKUP", "CANCELLED"), false);
});

test("order transition map has terminal completed, rejected and cancelled states", () => {
  assert.deepEqual(ORDER_TRANSITIONS.COMPLETED, []);
  assert.deepEqual(ORDER_TRANSITIONS.REJECTED, []);
  assert.deepEqual(ORDER_TRANSITIONS.CANCELLED, []);
});
