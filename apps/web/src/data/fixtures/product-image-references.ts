/**
 * Custom generated illustrations for the KudapKita starter catalog.
 * These visuals are intentionally labeled as illustrations and must be replaced
 * with owner-approved photographs of actual production before commercial launch.
 */
export type ProductImageReference = {
  src: string;
  alt: string;
  caption: string;
  sourcePage: string;
  creator: string;
  license: string;
  licenseUrl: string;
};

const creator = 'OpenAI ImageGen';
const sourcePage = 'Custom illustration generated for the KudapKita catalog, 16 November 2026';
const license = 'AI-generated illustration; verify applicable usage terms before external resale';

export const PRODUCT_IMAGE_REFERENCES: Record<string, ProductImageReference> = {
  'doko-doko-bugis': {
    src: '/images/products/doko-doko-bugis.webp',
    alt: 'Ilustrasi doko-doko Bugis berbentuk bungkusan daun hijau di atas piring anyaman',
    caption: 'Ilustrasi AI untuk referensi tampilan menu; bukan foto batch KudapKita.',
    sourcePage,
    creator,
    license,
    licenseUrl: '',
  },
  'risol-kentang-bengkuang': {
    src: '/images/products/risol-kentang-bengkuang.webp',
    alt: 'Ilustrasi risol goreng berwarna keemasan dengan isian kentang dan bengkuang',
    caption: 'Ilustrasi AI risol; sesuaikan dengan bentuk dan isi produk aktual.',
    sourcePage,
    creator,
    license,
    licenseUrl: '',
  },
  'risol-mayo': {
    src: '/images/products/risol-mayo.webp',
    alt: 'Ilustrasi risol mayo berbalut tepung panir dengan isian lembut',
    caption: 'Ilustrasi AI risol mayo; bukan foto produksi KudapKita.',
    sourcePage,
    creator,
    license,
    licenseUrl: '',
  },
  'onde-onde': {
    src: '/images/products/onde-onde.webp',
    alt: 'Ilustrasi onde-onde bulat berlapis wijen di atas piring kayu',
    caption: 'Ilustrasi AI onde-onde; isian dan ukuran aktual perlu dikonfirmasi.',
    sourcePage,
    creator,
    license,
    licenseUrl: '',
  },
  'dadar-gulung': {
    src: '/images/products/dadar-gulung.webp',
    alt: 'Ilustrasi dadar gulung pandan hijau dengan isian kelapa',
    caption: 'Ilustrasi AI dadar gulung; bukan foto batch KudapKita.',
    sourcePage,
    creator,
    license,
    licenseUrl: '',
  },
  apam: {
    src: '/images/products/apam.webp',
    alt: 'Ilustrasi kue apam kukus berwarna keemasan di dalam keranjang anyaman',
    caption: 'Ilustrasi AI apam; tampilan akhir mengikuti produk aktual.',
    sourcePage,
    creator,
    license,
    licenseUrl: '',
  },
};
