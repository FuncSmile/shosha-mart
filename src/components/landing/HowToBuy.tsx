"use client";

import { useEffect, useRef } from "react";
// @ts-ignore
import anime from "animejs/lib/anime.es.js";
import Image from "next/image";
import {
  Globe,
  MousePointer2,
  LogIn,
  LayoutGrid,
  PlusCircle,
  ShoppingCart,
  ListTodo,
  CheckSquare,
  Clock,
  Play,
  MessageCircle
} from "lucide-react";

export default function HowToBuy() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Faster animation per step using IntersectionObserver
    const steps = document.querySelectorAll(".vertical-step");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target;
            const index = el.getAttribute("data-index");

            const tl = anime.timeline({
              easing: "easeOutQuart",
              duration: 500,
            });

            tl.add({
              targets: el.querySelector(".step-indicator"),
              scale: [0, 1],
              opacity: [0, 1],
              duration: 400,
            })
              .add({
                targets: el.querySelector(".step-content-left"),
                translateX: [-30, 0],
                opacity: [0, 1],
              }, "-=300")
              .add({
                targets: el.querySelector(".step-content-right"),
                translateX: [30, 0],
                opacity: [0, 1],
              }, "-=400")
              .add({
                targets: el.querySelector(".step-line-draw"),
                height: [0, "100%"],
                duration: 600,
                easing: "linear"
              }, "-=200");

            observer.unobserve(el);
          }
        });
      },
      { threshold: 0.3 }
    );

    steps.forEach((step) => observer.observe(step));

    return () => observer.disconnect();
  }, []);



  return (
    <section className="py-24 bg-white px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">

        {/* Video Tutorial Section (Now at the bottom of the steps) */}
        <div className=" pt-20 border-t border-neutral-100">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-neutral-900 mb-4">Masih Bingung? Tonton Video Ini</h2>
            <p className="text-neutral-500 max-w-xl mx-auto">
              Simak panduan visual lengkap dalam video 1 menit berikut untuk mempermudah Anda dalam bertransaksi.
            </p>
          </div>

          <div className="max-w-4xl mx-auto aspect-video bg-neutral-900 rounded-[2.5rem] overflow-hidden shadow-2xl relative group cursor-pointer border-8 border-neutral-50">
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/50 transition-colors z-10">
              <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-2xl group-hover:scale-110 transition-transform">
                <Play className="w-8 h-8 fill-current ml-1" />
              </div>
            </div>
            <img
              src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1200&auto=format&fit=crop"
              alt="Video Placeholder"
              className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-700"
            />
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20">
              <p className="text-white text-sm font-bold bg-black/60 backdrop-blur-md px-6 py-2 rounded-full whitespace-nowrap">
                VIDEO TUTORIAL SEDANG DISIAPKAN
              </p>
            </div>
          </div>
        </div>

        {/* WhatsApp Support CTA */}
        <div className="mt-24 text-center">
          <div className="inline-flex flex-col items-center gap-6">
            <div className="h-px w-20 bg-neutral-200" />
            <a
              href="https://wa.me/6281313456528?text=Halo%20Admin%2C%20saya%20butuh%20panduan%20cara%20pemesanan%20di%20ShoshaMart."
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 bg-green-600 hover:bg-green-700 text-white px-10 py-5 rounded-full text-lg font-bold shadow-xl hover:shadow-green-200 transition-all active:scale-95 group"
            >
              <MessageCircle className="w-6 h-6 fill-current group-hover:rotate-12 transition-transform" />
              Hubungi SuperAdmin via WhatsApp
            </a>
            <p className="text-sm font-medium text-neutral-400">Aktif 24/7 untuk membantu operasional Anda</p>
          </div>
        </div>
      </div>
    </section>
  );
}
