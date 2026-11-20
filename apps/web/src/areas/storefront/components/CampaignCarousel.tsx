import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const slides = [
  {
    kicker: 'KudapKita · Camilan rumahan',
    title: 'Pilih camilan. Kami bantu siapkan.',
    copy: 'Jelajahi menu KudapKita, kirim permintaan pesanan, lalu tunggu konfirmasi harga dan jadwal dari pengelola.',
    image: '/images/products/doko-doko-bugis.webp',
    alt: 'Doko-Doko Bugis',
  },
  {
    kicker: 'Tradisional · Gurih · Manis',
    title: 'Rasa tradisional, selalu dekat.',
    copy: 'Temukan jajanan pilihan untuk acara keluarga, teman kerja, atau menemani waktu istirahat.',
    image: '/images/products/risol-mayo.webp',
    alt: 'Risol Mayo',
  },
  {
    kicker: 'Pesan dengan jelas',
    title: 'Konfirmasi dulu, nikmati tanpa khawatir.',
    copy: 'Admin memeriksa ketersediaan, total akhir, pembayaran, produksi, dan pengiriman sebelum pesanan diteruskan.',
    image: '/images/products/onde-onde.webp',
    alt: 'Onde-onde',
  },
] as const;

export function CampaignCarousel() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [paused, setPaused] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  useEffect(() => {
    if (paused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % slides.length);
    }, 6000);
    return () => window.clearInterval(timer);
  }, [paused]);

  function showSlide(index: number) {
    setActiveSlide((index + slides.length) % slides.length);
  }

  const slide = slides[activeSlide];

  return (
    <section
      className="campaign-carousel-v2 relative isolate overflow-hidden bg-[#30221C] text-white"
      aria-roledescription="carousel"
      aria-label="Promosi utama KudapKita"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node)) setPaused(false);
      }}
      onTouchStart={(event) => setTouchStartX(event.touches[0]?.clientX ?? null)}
      onTouchEnd={(event) => {
        if (touchStartX == null) return;
        const endX = event.changedTouches[0]?.clientX ?? touchStartX;
        const distance = endX - touchStartX;
        if (Math.abs(distance) > 48) showSlide(activeSlide + (distance < 0 ? 1 : -1));
        setTouchStartX(null);
      }}
    >
      <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[48%] bg-[linear-gradient(100deg,transparent,rgba(231,180,119,.12))] lg:block" />
      <div className="relative mx-auto grid max-w-7xl items-center gap-8 px-5 py-12 sm:px-8 sm:py-16 lg:grid-cols-[1.08fr_.92fr] lg:py-20">
        <div className="campaign-v2-copy max-w-2xl" key={activeSlide}>
          <span className="inline-flex items-center rounded-full border border-white/20 bg-white/5 px-3 py-2 text-[10px] font-bold uppercase tracking-[.18em] text-[#E7B477]">{slide.kicker}</span>
          <h1 className="mt-6 max-w-[680px] font-serif text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">{slide.title}</h1>
          <p className="mt-5 max-w-xl text-sm leading-7 text-white/75 sm:text-base sm:leading-8">{slide.copy}</p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link to="/menu" className="inline-flex min-h-12 items-center gap-3 rounded-full bg-[#E7B477] px-6 text-sm font-extrabold text-[#35231A] transition hover:bg-[#F1C88F]">Lihat menu <ArrowRight size={17}/></Link>
            <a href="https://wa.me/6299509613547" target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center gap-2 rounded-full border border-white/25 px-5 text-sm font-semibold text-white transition hover:bg-white/10"><MessageCircle size={16}/> Hubungi kami</a>
          </div>
        </div>
        <figure className="campaign-v2-visual relative min-h-[220px] overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[.07] shadow-2xl sm:min-h-[300px] lg:min-h-[390px]" key={`image-${activeSlide}`}>
          <img src={slide.image} alt={slide.alt} className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#30221C]/78 via-[#30221C]/12 to-transparent" />
          <figcaption className="absolute bottom-5 left-5 right-5 flex items-center justify-between gap-3 rounded-2xl border border-white/15 bg-[#30221C]/72 px-4 py-3 backdrop-blur-md">
            <span>
              <strong className="block font-serif text-lg text-white">{slide.alt}</strong>
              <small className="mt-1 block text-[10px] text-white/70">Pilihan KudapKita</small>
            </span>
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#E7B477] text-cocoa">
              <ArrowRight size={16} />
            </span>
          </figcaption>
        </figure>
      </div>
      <div className="campaign-v2-controls absolute bottom-5 right-5 flex items-center gap-2 sm:bottom-7 sm:right-8">
        <button type="button" onClick={() => showSlide(activeSlide - 1)} className="campaign-v2-arrow" aria-label="Slide sebelumnya"><ArrowLeft size={15}/></button>
        <div className="flex items-center gap-1.5 px-1" aria-label="Pilih slide">
          {slides.map((item, index) => (
            <button
              key={item.title}
              type="button"
              onClick={() => showSlide(index)}
              className={`campaign-v2-dot ${index === activeSlide ? 'is-active' : ''}`}
              aria-label={`Slide ${index + 1} dari ${slides.length}`}
              aria-current={index === activeSlide ? 'true' : undefined}
            />
          ))}
        </div>
        <button type="button" onClick={() => showSlide(activeSlide + 1)} className="campaign-v2-arrow" aria-label="Slide berikutnya"><ArrowRight size={15}/></button>
      </div>
    </section>
  );
}
