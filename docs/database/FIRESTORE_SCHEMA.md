# Firestore Data Model — MVP

This is a logical collection plan, not a claim that every module is already implemented.

| Collection | Visibility | Purpose |
|---|---|---|
| `userProfiles/{uid}` | Owner and the same signed-in user | Owner role profile; provisioned manually |
| `publicProducts/{productId}` | Public published docs; owner | Minimal fields safe to show on storefront |
| `publicCategories/{categoryId}` | Public active docs; owner | Published category list |
| `products/{productId}` | Owner only | Internal product, cost/HPP and operations data |
| `categories/{categoryId}` | Owner only | Internal category management |
| `orders/{orderId}` | Owner; guest that created it | Request/order status visible to that customer |
| `orderPrivate/{orderId}` | Owner only | Internal review notes and operational information |
| `payments/{paymentId}` | Owner only | Manual payment verification records |
| `inventory/{productId}` | Owner only | Finished-goods stock balance |
| `stockMovements/{movementId}` | Owner only | Stock change history |
| `directSales/{saleId}` | Owner only | Offline/direct sales |
| `publicSettings/{documentId}` | Public get; owner write | Safe public store information, e.g. display name |
| `privateSettings/{documentId}` | Owner only | Bank account and internal settings |
| `activityLogs/{logId}` | Owner only | Best-effort client-side activity records |

## Order document (initial guest write)

```ts
{
  createdByUid: string,
  customerName: string,
  customerWhatsApp: string,
  fulfillmentMethod: 'PICKUP' | 'DELIVERY',
  deliveryAddress?: string,
  customerNote?: string,
  items: Array<{
    productId: string,
    productName: string, // display snapshot, must be checked by owner
    quantity: number,
    displayedUnitPrice?: number // untrusted display snapshot only
  }>,
  orderStatus: 'REQUESTED',
  paymentStatus: 'UNPAID',
  source: 'ONLINE',
  createdAt: serverTimestamp()
}
```

Customer writes are limited to this initial state. Owner can later set `confirmedTotal`, payment status, and order status. The scaffold records owner-verified payments in `payments` using a Firestore batch. Do not put internal payment notes or sensitive verification evidence in the customer-readable `orders` document; store private details in `orderPrivate` or `payments`.

## Stock and revenue rules

- Do not deduct stock when a request is first submitted.
- Owner confirms availability and capacity before accepting the order.
- For this no-Cloud-Functions MVP, do not promise atomic stock reservation or concurrent checkout guarantees.
- Revenue reports must count only owner-verified payments, not `REQUESTED` orders or submitted WhatsApp messages.
- `displayedUnitPrice` is never an authoritative payment amount.

## Public projection pattern

`publicProducts` contains only name, slug, short description, category display name/id, display price, availability, published flag, sort order, and public image path. Do not include recipe, HPP, supplier, internal stock notes, or cost breakdown. The private `products` collection remains owner-only.
