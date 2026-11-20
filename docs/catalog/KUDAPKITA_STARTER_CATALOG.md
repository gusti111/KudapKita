# KudapKita — Starter Catalog & Price Guide

This catalog is based on the six products already discussed for the business. It does not add unconfirmed snack SKUs.

## Products

| Product | Category | Public description | Initial availability |
|---|---|---|---|
| Doko-Doko Bugis | Tradisional | Kudapan tradisional berbahan ketan dengan isian manis dan balutan daun | Pre-order / confirm schedule |
| Risol Kentang Bengkuang | Gurih | Risol gurih dengan isian kentang dan bengkuang | Pre-order / confirm schedule |
| Risol Mayo | Gurih | Risol gurih dengan isian mayones | Pre-order / confirm schedule |
| Onde-onde | Tradisional | Camilan bulat berbalut wijen | Pre-order / confirm schedule |
| Dadar Gulung | Tradisional | Kue dadar berwarna hijau dengan isian kelapa | Pre-order / confirm schedule |
| Apam | Tradisional | Kue tradisional rumahan dengan tekstur lembut | Pre-order / confirm schedule |

## Price guidance (not final SKU prices)

The earlier unit and package ranges remain internal discussion notes only. They are not published to guest visitors and are not treated as SKU prices, checkout totals, or active promotions. The owner must enter and approve the final selling price for each product. Package prices and discounts must be explicitly approved before they can be offered.

## Data intentionally left for owner confirmation

- Final selling price per individual product.
- HPP for each product (private owner-only data).
- Current ready-stock quantity and daily availability.
- Exact package quantities by product and final package price.
- Recipe details, ingredients, allergens, net weight, storage instructions and shelf life.
- Product photograph from the actual production batch.

## Images

Starter products are created without a public image. The storefront only displays product photos uploaded/approved by the Owner. The previous six generated illustrations are treated as legacy layout assets and are intentionally hidden from public catalog cards, product details, the cart, and the homepage. Upload actual production photos through the Owner product editor before expecting images to appear.

## Owner import

The owner-only Products page contains a **Muat 6 menu dasar** action. It:

1. Creates the `Tradisional` and `Gurih` categories if missing (or reactivates existing matching categories).
2. Creates only products whose slug does not already exist in the private `products` collection.
3. Writes the matching public projection to `publicProducts` through the existing product save operation.
4. Sets `price` and `hpp` to `null`, sets availability to `PRE_ORDER`, uses the local illustration path, and publishes the product.
5. Does not overwrite existing product price, HPP, image, stock, availability, or visibility.

After import, the owner should edit each product, enter its approved final price and HPP, then update availability according to actual stock/production schedule.
