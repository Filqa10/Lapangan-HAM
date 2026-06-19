import Link from 'next/link';
import Image from 'next/image';

const gallery = [
  {
    title: 'Lapangan utama',
    detail: 'Rumput sintetis, garis lapangan jelas, siap untuk 7v7.',
    image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80',
    alt: 'Lapangan sepak bola dengan garis putih dan tribun stadion.',
  },
  {
    title: 'Tribun pinggir',
    detail: 'Area tunggu tim dan keluarga dekat pintu masuk.',
    image: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?auto=format&fit=crop&w=1200&q=80',
    alt: 'Tribun stadion menghadap area bermain sepak bola.',
  },
  {
    title: 'Lampu malam',
    detail: 'Sesi malam tetap terang untuk sparing dan fun football.',
    image: 'https://images.unsplash.com/photo-1517927033932-b3d18e61fb3a?auto=format&fit=crop&w=1200&q=80',
    alt: 'Bola sepak di rumput dengan suasana lapangan pertandingan.',
  },
];

const priceNotes = [
  'Senin-Kamis mulai Rp800.000 per slot dua jam.',
  'Jumat dan akhir pekan mengikuti jam ramai stadion.',
  'DP minimal 30% dari total, paling sedikit Rp500.000.',
];

export default function AboutPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#06140f] text-lime-50">
      <section className="relative isolate px-6 py-10 sm:px-10 lg:px-16">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_0%,rgba(190,242,100,0.25),transparent_26%),linear-gradient(115deg,transparent_0_32%,rgba(255,255,255,0.08)_32%_33%,transparent_33%_100%)]" />
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="pt-10">
            <p className="mb-5 inline-flex rounded-full border border-lime-200/25 bg-lime-200/10 px-4 py-2 text-sm font-semibold tracking-[0.3em] text-lime-200 uppercase">
              HAM Stadium Booking
            </p>
            <h1 className="max-w-4xl text-5xl font-black tracking-tight text-balance sm:text-7xl">
              Booking lapangan tanpa tanya slot berkali-kali.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-lime-50/75">
              Pilih tanggal, ambil jam main, unggah bukti DP, lalu pantau status verifikasi dari portal customer.
              Alurnya dibuat untuk tim Indonesia yang butuh jadwal cepat dan pembayaran jelas.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/customer/booking/create"
                className="rounded-full bg-lime-300 px-6 py-3 text-center font-bold text-[#082014] shadow-[0_12px_40px_rgba(190,242,100,0.28)] transition hover:-translate-y-0.5 hover:bg-lime-200 active:translate-y-0"
              >
                Booking sekarang
              </Link>
              <Link
                href="/customer/history"
                className="rounded-full border border-lime-100/25 px-6 py-3 text-center font-bold text-lime-50 transition hover:border-lime-200/60 hover:bg-white/5 active:scale-[0.99]"
              >
                Cek status booking
              </Link>
            </div>
          </div>

          <div className="relative min-h-[420px] rounded-[2rem] border border-lime-100/20 bg-[#092018] p-5 shadow-2xl">
            <div className="absolute inset-x-10 top-0 h-32 bg-[radial-gradient(ellipse_at_top,rgba(253,224,71,0.38),transparent_65%)]" />
            <div className="relative h-full rounded-[1.5rem] border-2 border-lime-200/40 bg-[linear-gradient(90deg,rgba(190,242,100,0.08)_1px,transparent_1px),linear-gradient(0deg,rgba(190,242,100,0.08)_1px,transparent_1px),#0f2e20] bg-[size:72px_72px] p-5">
              <div className="flex h-full flex-col justify-between rounded-[1.25rem] border border-lime-200/60 p-5">
                <div className="flex items-center justify-between text-sm font-bold tracking-[0.2em] text-lime-100/70 uppercase">
                  <span>Kickoff</span>
                  <span>18.00-20.00</span>
                </div>
                <div className="mx-auto flex h-36 w-36 items-center justify-center rounded-full border border-lime-200/70 bg-lime-200/10 text-center text-sm font-bold uppercase tracking-[0.28em] text-lime-100">
                  Center circle
                </div>
                <div className="rounded-2xl bg-amber-200 p-5 text-[#22160a]">
                  <p className="text-sm font-black uppercase tracking-[0.2em]">Panduan bayar</p>
                  <p className="mt-2 text-2xl font-black">DP diverifikasi admin sebelum slot dikunci.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-12 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="font-mono text-sm tracking-[0.3em] text-lime-200 uppercase">Area lapangan</p>
              <h2 className="mt-2 text-3xl font-black">Lihat suasana sebelum pilih jam.</h2>
            </div>
            <p className="hidden max-w-sm text-sm text-lime-50/60 md:block">
              Slider ringan berbasis scroll-snap, nyaman di mobile tanpa animasi berat.
            </p>
          </div>
          <div className="flex snap-x gap-4 overflow-x-auto pb-4">
            {gallery.map((item, index) => (
              <article
                key={item.title}
                className="min-w-[82%] snap-start rounded-[1.75rem] border border-lime-100/15 bg-white/[0.06] p-5 sm:min-w-[420px]"
              >
                <div className="relative mb-5 flex h-52 items-end overflow-hidden rounded-[1.25rem] bg-[#113624] p-4">
                  <Image
                    src={item.image}
                    alt={item.alt}
                    fill
                    sizes="(max-width: 640px) 82vw, 420px"
                    className="object-cover"
                  />
                  <span className="relative rounded-full bg-[#06140f]/80 px-3 py-1 font-mono text-sm text-lime-100 backdrop-blur">
                    Frame {index + 1}
                  </span>
                </div>
                <h3 className="text-2xl font-black">{item.title}</h3>
                <p className="mt-2 text-lime-50/65">{item.detail}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 pb-16 sm:px-10 lg:px-16">
        <div className="mx-auto grid max-w-7xl gap-4 lg:grid-cols-3">
          {priceNotes.map((note) => (
            <div key={note} className="rounded-3xl border border-amber-100/30 bg-amber-100 p-6 text-[#241706]">
              <p className="font-mono text-xs font-bold tracking-[0.25em] uppercase">Harga & status</p>
              <p className="mt-3 text-xl font-black leading-snug">{note}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
