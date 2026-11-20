import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { initializeTestEnvironment, assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import { collection, doc, getDoc, getDocs, query, setDoc, where } from "firebase/firestore";

const projectId = "demo-kudapkita-rules";
const rules = await readFile(fileURLToPath(new URL("../../firebase/firestore.rules", import.meta.url)), "utf8");
let testEnv;

before(async () => {
  testEnv = await initializeTestEnvironment({ projectId, firestore: { rules } });
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const store = context.firestore();
    await setDoc(doc(store, "userProfiles", "owner-1"), { uid: "owner-1", role: "owner", isActive: true });
    await setDoc(doc(store, "userProfiles", "inactive-owner"), { uid: "inactive-owner", role: "owner", isActive: false });
    await setDoc(doc(store, "ownerDevices", "owner-1", "devices", "active-device"), { status: "ACTIVE" });
    await setDoc(doc(store, "ownerDevices", "owner-1", "devices", "revoked-device"), { status: "REVOKED" });
    await setDoc(doc(store, "publicProducts", "risol"), {
      name: "Risol Mayo", slug: "risol-mayo", shortDescription: "Risol",
      categoryId: "gurih", categoryName: "Gurih", price: 2000,
      imagePath: "", availability: "AVAILABLE", isPublished: true, sortOrder: 1,
    });
    await setDoc(doc(store, "publicProducts", "hidden"), {
      name: "Hidden Product", slug: "hidden-product", shortDescription: "",
      categoryId: "test", categoryName: "Test", price: 1500, imagePath: "",
      availability: "AVAILABLE", isPublished: false, sortOrder: 2,
    });
    await setDoc(doc(store, "products", "risol"), { name: "Risol Mayo", price: 2000, hpp: 1000, isPublished: true });
    await setDoc(doc(store, "orders", "guest-a-order"), { createdByUid: "guest-a", orderStatus: "REQUESTED", paymentStatus: "UNPAID" });
    await setDoc(doc(store, "orders", "guest-b-order"), { createdByUid: "guest-b", orderStatus: "REQUESTED", paymentStatus: "UNPAID" });
    await setDoc(doc(store, "privateSettings", "business"), { bankAccountNumber: "PRIVATE" });
    await setDoc(doc(store, "inventory", "risol"), { productId: "risol", availableQty: 10, unit: "pcs" });
    await setDoc(doc(store, "productionRuns", "run-1"), { productId: "risol", quantity: 5, status: "COMPLETED" });
  });
});

after(async () => { if (testEnv) await testEnv.cleanup(); });

test("public visitors can read only published product documents", async () => {
  const store = testEnv.unauthenticatedContext().firestore();
  await assertSucceeds(getDoc(doc(store, "publicProducts", "risol")));
  await assertFails(getDoc(doc(store, "publicProducts", "hidden")));
  await assertSucceeds(getDocs(query(collection(store, "publicProducts"), where("isPublished", "==", true))));
});

test("public visitors cannot read internal products or private business settings", async () => {
  const store = testEnv.unauthenticatedContext().firestore();
  await assertFails(getDoc(doc(store, "products", "risol")));
  await assertFails(getDoc(doc(store, "privateSettings", "business")));
});

test("customers can read only their own order", async () => {
  const store = testEnv.authenticatedContext("guest-a", { firebase: { sign_in_provider: "anonymous" } }).firestore();
  await assertSucceeds(getDoc(doc(store, "orders", "guest-a-order")));
  await assertFails(getDoc(doc(store, "orders", "guest-b-order")));
  await assertFails(getDocs(collection(store, "orders")));
});

test("direct browser order creation and mutation are denied even for owner", async () => {
  const store = testEnv.authenticatedContext("owner-1").firestore();
  await assertFails(setDoc(doc(store, "orders", "forged-order"), { createdByUid: "owner-1", orderStatus: "REQUESTED", paymentStatus: "UNPAID" }));
  await assertFails(setDoc(doc(store, "orders", "guest-a-order"), { createdByUid: "guest-a", orderStatus: "COMPLETED", paymentStatus: "PAID" }, { merge: true }));
});

test("owner can manage private products and a safe public projection", async () => {
  const store = testEnv.authenticatedContext("owner-1").firestore();
  await assertSucceeds(setDoc(doc(store, "products", "onde"), { name: "Onde-onde", price: 1500, hpp: 800, isPublished: true }));
  await assertSucceeds(setDoc(doc(store, "publicProducts", "onde"), {
    name: "Onde-onde", slug: "onde-onde", shortDescription: "Wijen",
    categoryId: "tradisional", categoryName: "Tradisional", price: 1500,
    imagePath: "", availability: "AVAILABLE", isPublished: true, sortOrder: 2,
  }));
  await assertFails(setDoc(doc(store, "publicProducts", "leak"), {
    name: "Leak", slug: "leak", shortDescription: "", categoryId: "x",
    categoryName: "X", price: 1000, imagePath: "", availability: "AVAILABLE",
    isPublished: true, sortOrder: 3, hpp: 700,
  }));
});

test("owner cannot write stock, production, payment, or sale records from browser", async () => {
  const store = testEnv.authenticatedContext("owner-1").firestore();
  await assertSucceeds(getDoc(doc(store, "inventory", "risol")));
  await assertSucceeds(getDoc(doc(store, "productionRuns", "run-1")));
  await assertFails(setDoc(doc(store, "inventory", "risol"), { availableQty: 999 }));
  await assertFails(setDoc(doc(store, "stockMovements", "manual"), { productId: "risol", quantity: 999, type: "ADJUSTMENT" }));
  await assertFails(setDoc(doc(store, "productionRuns", "manual"), { productId: "risol", quantity: 999 }));
  await assertFails(setDoc(doc(store, "directSales", "manual"), { total: 1, paymentStatus: "VERIFIED" }));
  await assertFails(setDoc(doc(store, "payments", "manual"), { amount: 1, status: "VERIFIED" }));
});

test("public settings accept only storefront fields, while private settings remain owner-only", async () => {
  const store = testEnv.authenticatedContext("owner-1").firestore();
  await assertSucceeds(setDoc(doc(store, "publicSettings", "storefront"), {
    displayName: "KudapKita", tagline: "Camilan buat hari-hari",
    whatsappNumber: "628000000000", instagramHandle: "@kudapkita",
    paymentBankName: "BRI", paymentAccountNumber: "000111", paymentAccountHolder: "KudapKita",
    paymentEwalletName: "DANA", paymentEwalletNumber: "628000000000",
  }));
  await assertFails(setDoc(doc(store, "publicSettings", "storefront"), {
    displayName: "KudapKita", bankAccountNumber: "123456",
  }, { merge: true }));
  await assertSucceeds(setDoc(doc(store, "privateSettings", "business"), { bankAccountNumber: "TEST-ACCOUNT" }, { merge: true }));
});

test("only an active owner profile may read owner operations", async () => {
  const inactive = testEnv.authenticatedContext("inactive-owner").firestore();
  const store = testEnv.authenticatedContext("owner-1").firestore();
  await assertFails(getDoc(doc(inactive, "inventory", "risol")));
  await assertSucceeds(getDoc(doc(store, "inventory", "risol")));
});

test("revoked paired owner devices lose Firestore access immediately", async () => {
  const activeDevice = testEnv.authenticatedContext("owner-1", { ownerDeviceId: "active-device" }).firestore();
  const revokedDevice = testEnv.authenticatedContext("owner-1", { ownerDeviceId: "revoked-device" }).firestore();
  await assertSucceeds(getDoc(doc(activeDevice, "inventory", "risol")));
  await assertFails(getDoc(doc(revokedDevice, "inventory", "risol")));
  await assertFails(setDoc(doc(revokedDevice, "products", "forged"), { name: "Blocked" }));
});
