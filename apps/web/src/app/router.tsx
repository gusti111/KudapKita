import { createBrowserRouter } from 'react-router-dom';
import { StorefrontLayout } from '@/areas/storefront/layouts/StorefrontLayout';
import { HomePage } from '@/areas/storefront/pages/HomePage';
import { CatalogPage } from '@/areas/storefront/pages/CatalogPage';
import { CartPage } from '@/areas/storefront/pages/CartPage';
import { CheckoutPage } from '@/areas/storefront/pages/CheckoutPage';
import { TrackOrderPage } from '@/areas/storefront/pages/TrackOrderPage';
import { OwnerLoginPage } from '@/areas/owner/auth/pages/OwnerLoginPage';
import { OwnerOnlyRoute } from '@/app/guards/OwnerOnlyRoute';
import { OwnerLayout } from '@/areas/owner/layouts/OwnerLayout';
import { OwnerDashboardPage } from '@/areas/owner/dashboard/pages/OwnerDashboardPage';
import { OwnerOrdersPage } from '@/areas/owner/orders/pages/OwnerOrdersPage';
import {
  OwnerCategoriesPage,
  OwnerDirectSalesPage,
  OwnerInventoryPage,
  OwnerProductionPage,
  OwnerReportsPage,
  OwnerSettingsPage,
} from '@/areas/owner/operations/OwnerOperationsPages';
import { OwnerProductsPage } from '@/areas/owner/products/pages/OwnerProductsPage';
import { NotFoundPage } from '@/shared/pages/NotFoundPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <StorefrontLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'menu', element: <CatalogPage /> },
      { path: 'keranjang', element: <CartPage /> },
      { path: 'checkout', element: <CheckoutPage /> },
      { path: 'pesanan/:orderId', element: <TrackOrderPage /> },
    ],
  },
  { path: '/owner/login', element: <OwnerLoginPage /> },
  {
    path: '/owner',
    element: <OwnerOnlyRoute><OwnerLayout /></OwnerOnlyRoute>,
    children: [
      { index: true, element: <OwnerDashboardPage /> },
      { path: 'pesanan', element: <OwnerOrdersPage /> },
      { path: 'produk', element: <OwnerProductsPage /> },
      { path: 'kategori', element: <OwnerCategoriesPage /> },
      { path: 'produksi', element: <OwnerProductionPage /> },
      { path: 'persediaan', element: <OwnerInventoryPage /> },
      { path: 'penjualan-langsung', element: <OwnerDirectSalesPage /> },
      { path: 'laporan', element: <OwnerReportsPage /> },
      { path: 'pengaturan', element: <OwnerSettingsPage /> },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]);
