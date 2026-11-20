import { ArrowUpRight, Heart, Leaf, MapPin, MessageCircle, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Reveal } from '@/shared/components/ui/Reveal';

const storyMilestones = [
  {
    number: '01',
    title: 'Berawal dari usaha rumahan',
    description: 'KudapKita tumbuh dari kegiatan membuat dan menjual camilan rumahan yang dikelola Bunda.',
    icon: <Heart size={18}/>,
  },
  {
    number: '02',
    title: 'Dekat dengan pelanggan',
    description: 'Produk dikenalkan secara langsung, termasuk melalui lapak Pasar Bahagia dan penjualan di lingkungan kampus.',
    icon: <MapPin size={18}/>,
  },
  {
    number: '03',
    title: 'Dirapikan menjadi KudapKita',
    description: 'Kini pilihan camilan disatukan dalam satu identitas dan katalog digital agar lebih mudah dilihat dan dipesan.',
    icon: <ShoppingBag size={18}/>,
  },
];

const brandValues = [
  { title: 'Dekat dan terbuka', description: 'Pelanggan dapat bertanya langsung tentang menu, jadwal, dan pesanan.', icon: <MessageCircle size={18}/> },
  { title: 'Sederhana dan akrab', description: 'Pilihan camilan rumahan untuk jeda sehari-hari dan momen berbagi.', icon: <Heart size={18}/> },
  { title: 'Jelas sebelum sepakat', description: 'Harga, jumlah, ketersediaan, dan waktu pesanan dikonfirmasi terlebih dahulu.', icon: <Leaf size={18}/> },
];

export function BrandStorySection() {
  return (
    <section id="cerita-kami" className="story-section scroll-mt-24 overflow-hidden bg-[#F1E8DC] py-12 sm:py-14 lg:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-8 lg:grid-cols-[.95fr_1.05fr] lg:gap-12">
          <Reveal className="relative">
            <div className="rounded-[1.8rem] bg-[#493127] p-7 text-white shadow-card sm:p-9">
              <span className="text-[10px] font-bold uppercase tracking-[.18em] text-[#E7B477]">Perjalanan KudapKita</span>
              <div className="mt-7 grid gap-6">
                {storyMilestones.map((milestone) => <div key={milestone.number} className="flex gap-4 border-b border-white/10 pb-5 last:border-0 last:pb-0"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/10 text-[#E7B477]">{milestone.icon}</span><div><span className="text-[10px] font-bold tracking-[.15em] text-white/45">{milestone.number}</span><h3 className="mt-1 text-sm font-bold text-white">{milestone.title}</h3><p className="mt-1 text-xs leading-6 text-white/65">{milestone.description}</p></div></div>)}
              </div>
            </div>
          </Reveal>

          <Reveal delayMs={100}>
            <span className="eyebrow">Cerita kami</span>
            <h2 className="section-title max-w-2xl text-[2.25rem] sm:text-5xl">Berangkat dari dapur rumahan, tumbuh bersama pelanggan.</h2>
            <p className="mt-5 text-sm leading-7 text-muted sm:text-base sm:leading-8">KudapKita berawal dari usaha camilan rumahan yang dikelola Bunda. Sebelum hadir sebagai satu brand, produk-produk kami lebih dulu dikenalkan secara langsung kepada pelanggan—melalui lapak di Pasar Bahagia dan penjualan di lingkungan kampus.</p>
            <p className="mt-4 text-sm leading-7 text-muted sm:text-base sm:leading-8">Dari pengalaman sederhana itu, kami ingin membuat cara mengenal menu dan mengirim pesanan menjadi lebih mudah. KudapKita menyatukan pilihan camilan dalam satu katalog digital, sementara komunikasi dan konfirmasi pesanan tetap dilakukan dengan jelas dan langsung.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/menu" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-cocoa px-5 text-xs font-bold text-white transition hover:-translate-y-0.5 hover:bg-terracotta">Kenali menu kami <ArrowUpRight size={15}/></Link>
              <a href="#cara-pesan" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-cocoa/15 bg-white/60 px-5 text-xs font-bold text-cocoa transition hover:bg-white">Cara memesan</a>
            </div>
          </Reveal>
        </div>

        <Reveal>
          <div className="mt-12 border-y border-cocoa/10 py-6 sm:mt-14 sm:py-8">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
              <div><span className="eyebrow">Perjalanan singkat</span><h3 className="mt-2 font-serif text-2xl font-bold text-cocoa sm:text-3xl">Dari dekat, lalu semakin mudah dijangkau.</h3></div>
              <span className="text-[10px] font-semibold text-muted">Tanpa tanggal yang dibuat-buat</span>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {storyMilestones.map((item, index) => (
                <Reveal key={item.number} delayMs={index * 80}>
                  <article className="story-milestone h-full rounded-[1.35rem] border border-white/80 bg-[#FFFDF9]/75 p-5 transition duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-soft sm:p-6">
                    <div className="flex items-center justify-between"><span className="font-serif text-3xl font-bold text-[#D3B18A]">{item.number}</span><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#F0E4D5] text-terracotta">{item.icon}</span></div>
                    <h4 className="mt-5 font-serif text-xl font-bold text-cocoa">{item.title}</h4>
                    <p className="mt-2 text-xs leading-6 text-muted">{item.description}</p>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </Reveal>

        <Reveal>
          <div className="mt-10 grid gap-4 md:grid-cols-[.8fr_1.2fr] md:items-end">
            <div><span className="eyebrow">Yang kami jaga</span><h3 className="mt-2 font-serif text-3xl font-bold leading-tight text-cocoa">Bukan sekadar memilih camilan.</h3><p className="mt-3 max-w-sm text-xs leading-6 text-muted">Kami ingin proses memilih hingga menerima pesanan terasa lebih sederhana dan jelas.</p></div>
            <div className="grid gap-3 sm:grid-cols-3">
              {brandValues.map((value) => (
                <article key={value.title} className="rounded-[1.2rem] border border-white/80 bg-white/65 p-4 sm:p-5">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#F2E7D9] text-terracotta">{value.icon}</span>
                  <h4 className="mt-3 text-xs font-extrabold text-cocoa">{value.title}</h4>
                  <p className="mt-2 text-[10px] leading-5 text-muted">{value.description}</p>
                  <span className="mt-4 block h-1 w-10 rounded-full bg-[#D8B68F]" aria-hidden="true"/>
                </article>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

