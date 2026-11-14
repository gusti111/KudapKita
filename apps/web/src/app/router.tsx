import { lazy, Suspense, type ReactNode } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { OwnerOnlyRoute } from '@/app/guards/OwnerOnlyRoute';
import { LoadingScreen } from '@/shared/components/feedback/LoadingScreen';

const StorefrontLayout = lazy(() => import('@/areas/storefront/layouts/StorefrontLayout').then((module) => ({ default: module.StorefrontLayout })));
const HomePage = lazy(() => import('@/areas/storefront/pages/HomePage').then((module) => ({ default: module.HomePage })));
const CatalogPage = lazy(() => import('@/areas/storefront/pages/CatalogPage').then((module) => ({ default: module.CatalogPage })));
const CartPage = lazy(() => import('@/areas/storefront/pages/CartPage').then((module) => ({ default: module.CartPage })));
const CheckoutPage = lazy(() => import('@/areas/storefront/pages/CheckoutPage').then((module) => ({ default: module.CheckoutPage })));
const TrackOrderPage = lazy(() => import('@/areas/storefront/pages/TrackOrderPage').then((module) => ({ default: module.TrackOrderPage })));
const OwnerLoginPage = lazy(() => import('@/areas/owner/auth/pages/OwnerLoginPage').then((module) => ({ default: module.OwnerLoginPage })));
const OwnerLayout = lazy(() => import('@/areas/owner/layouts/OwnerLayout').then((module) => ({ default: module.OwnerLayout })));
const OwnerDashboardPage = lazy(() => import('@/areas/owner/dashboard/pages/OwnerDashboardPage').then((module) => ({ default: module.OwnerDashboardPage })));
const OwnerOrdersPage = lazy(() => import('@/areas/owner/orders/pages/OwnerOrdersPage').then((module) => ({ default: module.OwnerOrdersPage })));
const OwnerOperations = () => import('@/areas/owner/operations/OwnerOperationsPages');
const OwnerProductsPage = lazy(() => OwnerOperations().then((module) => ({ default: module.OwnerProductsPage })));
const OwnerCategoriesPage = lazy(() => OwnerOperations().then((module) => ({ default: module.OwnerCategoriesPage })));
const OwnerProductionPage = lazy(() => OwnerOperations().then((module) => ({ default: module.OwnerProductionPage })));
const OwnerInventoryPage = lazy(() => OwnerOperations().then((module) => ({ default: module.OwnerInventoryPage })));
const OwnerDirectSalesPage = lazy(() => OwnerOperations().then((module) => ({ default: module.OwnerDirectSalesPage })));
const OwnerReportsPage = lazy(() => OwnerOperations().then((module) => ({ default: module.OwnerReportsPage })));
const OwnerSettingsPage = lazy(() => OwnerOperations().then((module) => ({ default: module.OwnerSettingsPage })));
const NotFoundPage = lazy(() => import('@/shared/pages/NotFoundPage').then((module) => ({ default: module.NotFoundPage })));

function RouteFallback() {
  return <main className="grid min-h-[50vh] place-items-center bg-cream px-4 py-12">
    <LoadingScreen label="Memuat halaman KudapKita…"/>
  </main>;
}
function RouteBoundary({ children }: { children: ReactNode }) {
  return <Suspense fallback={<RouteFallback/>}>{children}</Suspense>;
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RouteBoundary><StorefrontLayout /></RouteBoundary>,
    children: [
      { index: true, element: <RouteBoundary><HomePage /></RouteBoundary> },
      { path: 'menu', element: <RouteBoundary><CatalogPage /></RouteBoundary> },
      { path: 'keranjang', element: <RouteBoundary><CartPage /></RouteBoundary> },
      { path: 'checkout', element: <RouteBoundary><CheckoutPage /></RouteBoundary> },
      { path: 'pesanan/:orderId', element: <RouteBoundary><TrackOrderPage /></RouteBoundary> },
    ],
  },
  { path: '/owner/login', element: <RouteBoundary><OwnerLoginPage /></RouteBoundary> },
  {
    path: '/owner',
    element: <OwnerOnlyRoute><RouteBoundary><OwnerLayout /></RouteBoundary></OwnerOnlyRoute>,
    children: [
      { index: true, element: <RouteBoundary><OwnerDashboardPage /></RouteBoundary> },
      { path: 'pesanan', element: <RouteBoundary><OwnerOrdersPage /></RouteBoundary> },
      { path: 'produk', element: <RouteBoundary><OwnerProductsPage /></RouteBoundary> },
      { path: 'kategori', element: <RouteBoundary><OwnerCategoriesPage /></RouteBoundary> },
      { path: 'produksi', element: <RouteBoundary><OwnerProductionPage /></RouteBoundary> },
      { path: 'persediaan', element: <RouteBoundary><OwnerInventoryPage /></RouteBoundary> },
      { path: 'penjualan-langsung', element: <RouteBoundary><OwnerDirectSalesPage /></RouteBoundary> },
      { path: 'laporan', element: <RouteBoundary><OwnerReportsPage /></RouteBoundary> },
      { path: 'pengaturan', element: <RouteBoundary><OwnerSettingsPage /></RouteBoundary> },
    ],
  },
  { path: '*', element: <RouteBoundary><NotFoundPage /></RouteBoundary> },
]);
