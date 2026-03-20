import Image from "next/image";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import HowToBuy from "@/components/landing/HowToBuy";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black overflow-x-hidden">
      <div className="relative flex items-center justify-center p-6 min-h-screen overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-[20%] -right-[10%] w-[50%] h-[50%] rounded-full bg-blue-100/50 dark:bg-blue-900/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-blue-100/50 dark:bg-blue-900/20 blur-3xl pointer-events-none" />
        </div>

        <main className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20 items-center relative z-10">
          {/* Left Element: Descriptive Text and CTA */}
          <section className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-800 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
              B2B Laundry Marketplace 🛒
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
              Pusat Kulakan <br />
              <span className="text-blue-600 dark:text-blue-500">Alat & Bahan Laundry.</span>
            </h1>
            <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-lg leading-relaxed">
              Penuhi segala kebutuhan bisnis laundry Anda di satu tempat. Dari deterjen premium, pewangi parfum, hingga sparepart mesin dengan harga grosir terbaik untuk usaha Anda.
            </p>
            <div className="pt-4 flex items-center gap-4">
              <Link
                href="/login"
                id="tour-step-1"
                className="inline-flex items-center justify-center rounded-full bg-blue-600 px-8 py-4 text-base font-medium text-white shadow-lg transition-all hover:bg-blue-700 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900"
              >
                Belanja Sekarang
                <ShoppingCart className="ml-2 h-5 w-5" />
              </Link>
            </div>
          </section>

          {/* Right Element: Image */}
          <section className="relative h-[400px] md:h-[500px] lg:h-[600px] w-full rounded-[2rem] overflow-hidden shadow-2xl animate-in fade-in slide-in-from-right-8 duration-700 delay-150 group">
            <Image
              src="https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?q=80&w=2000&auto=format&fit=crop"
              alt="Perlengkapan dan Bahan Laundry Grosir"
              fill
              className="object-cover transition-transform duration-1000 group-hover:scale-105"
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </section>
        </main>
      </div>

      {/* How To Buy Section */}
      <HowToBuy />
    </div>
  );
}
