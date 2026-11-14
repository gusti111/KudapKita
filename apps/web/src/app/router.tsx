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
import { OwnerProductsPage } from '@/areas/owner/products/pages/OwnerProductsPage';
import { OwnerModulePlaceholderPage } from '@/areas/owner/shared/OwnerModulePlaceholderPage';
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
      { path: 'kategori', element: <OwnerModulePlaceholderPage title="Kategori Produk" description="Kelola kategori katalog yang ditampilkan kepada pelanggan." /> },
      { path: 'produksi', element: <OwnerModulePlaceholderPage title="Produksi" description="Pantau antrean produksi, jadwal, dan kesiapan pesanan." /> },
      { path: 'persediaan', element: <OwnerModulePlaceholderPage title="Persediaan" description="Kelola stok produk jadi dan riwayat pergerakan stok." /> },
      { path: 'penjualan-langsung', element: <OwnerModulePlaceholderPage title="Penjualan Langsung" description="Catat penjualan langsung agar laporan online dan offline terpisah dengan jelas." /> },
      { path: 'laporan', element: <OwnerModulePlaceholderPage title="Laporan" description="Ringkasan pesanan, pembayaran, penjualan, dan produk terlaris." /> },
      { path: 'pengaturan', element: <OwnerModulePlaceholderPage title="Pengaturan" description="Kelola informasi toko, WhatsApp, rekening, dan preferensi operasional." /> },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]);
