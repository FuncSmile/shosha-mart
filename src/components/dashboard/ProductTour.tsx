"use client";

import { useEffect, useRef } from "react";
import { driver, Config } from "driver.js";
import "driver.js/dist/driver.css";
import anime from "animejs";
import { usePathname, useRouter } from "next/navigation";
import { completeTour } from "@/app/actions/userActions";

interface ProductTourProps {
    hasCompletedTour: boolean;
    userRole?: string;
}

export default function ProductTour({ hasCompletedTour, userRole }: ProductTourProps) {
    const pathname = usePathname();
    const router = useRouter();
    const driverObjRef = useRef<any>(null);

    // Konfigurasi langkah-langkah tour
    const steps = [
        { id: "#tour-step-1", path: "/" },
        { id: "#tour-dashboard-welcome", path: "/dashboard/buyer" },
        { id: "#tour-sidebar-katalog", path: "/dashboard/buyer" },
        { id: "#tour-step-3", path: "/dashboard/buyer/katalog" },
        { id: "#tour-step-4", path: "/dashboard/buyer/katalog" },
        { id: "#tour-step-5", path: "/dashboard/buyer/cart" },
        { id: "#tour-step-6", path: "/dashboard/buyer/cart" },
        { id: "#tour-step-7", path: "/dashboard/buyer/orders" },
    ];

    const finishTour = async () => {
        console.log("Tour: Finalizing and updating database...");
        // Hapus localStorage segera agar tidak muncul lagi saat refresh (Optimistic)
        localStorage.removeItem("product-tour-active");
        localStorage.removeItem("product-tour-step");
        
        // Update database
        try {
            await completeTour();
            console.log("Tour: Database updated successfully.");
        } catch (error) {
            console.error("Tour: Failed to update database:", error);
        }
    };

    useEffect(() => {
        // 1. Validasi Dasar
        if (!userRole || userRole !== "BUYER" || hasCompletedTour) return;

        // 2. Tentukan langkah awal berdasarkan URL
        let currentStepStr = localStorage.getItem("product-tour-step");
        let isTourActive = localStorage.getItem("product-tour-active") === "true";

        if (currentStepStr === null && !isTourActive) {
            const initialIndex = steps.findIndex(s => pathname === s.path);
            if (initialIndex !== -1) {
                localStorage.setItem("product-tour-active", "true");
                localStorage.setItem("product-tour-step", initialIndex.toString());
                currentStepStr = initialIndex.toString();
            } else {
                return;
            }
        }

        if (localStorage.getItem("product-tour-active") !== "true") return;

        let currentStepIndex = parseInt(currentStepStr || "0");
        const activeStep = steps[currentStepIndex];

        // Sinkronisasi Index dengan Halaman
        if (!activeStep || activeStep.path !== pathname) {
            const matchingIndex = steps.findIndex(s => s.path === pathname);
            if (matchingIndex !== -1) {
                localStorage.setItem("product-tour-step", matchingIndex.toString());
                currentStepIndex = matchingIndex;
            } else {
                if (driverObjRef.current) driverObjRef.current.destroy();
                return;
            }
        }

        const driverConfig: Config = {
            showProgress: true,
            animate: true,
            allowClose: true,
            overlayColor: "rgba(0, 0, 0, 0.75)",
            stagePadding: 4,
            nextBtnText: "Lanjut",
            prevBtnText: "Kembali",
            doneBtnText: "Selesai",
            progressText: "Langkah {{current}} dari {{total}}",
            onHighlightStarted: () => {
                const popover = document.querySelector(".driver-popover");
                if (popover) {
                    anime({
                        targets: popover,
                        opacity: [0, 1],
                        translateY: [10, 0],
                        duration: 400,
                        easing: "easeOutCubic"
                    });
                }
            },
            onNextClick: () => {
                const driverObj = driverObjRef.current;
                if (!driverObj) return;
                const activeIndex = driverObj.getActiveIndex();
                if (activeIndex === undefined) return;

                // Jika ini adalah langkah terakhir, panggil finishTour saat user klik "Selesai"
                if (activeIndex === steps.length - 1) {
                    finishTour();
                    driverObj.destroy();
                    return;
                }

                const nextIndex = activeIndex + 1;
                const nextStep = steps[nextIndex];
                localStorage.setItem("product-tour-step", nextIndex.toString());
                
                if (nextStep && nextStep.path !== pathname) {
                    router.push(nextStep.path);
                } else {
                    driverObj.moveNext();
                }
            },
            onPrevClick: () => {
                const driverObj = driverObjRef.current;
                if (!driverObj) return;
                const activeIndex = driverObj.getActiveIndex();
                if (activeIndex === undefined) return;

                const prevIndex = activeIndex - 1;
                if (prevIndex >= 0) {
                    localStorage.setItem("product-tour-step", prevIndex.toString());
                    if (steps[prevIndex].path !== pathname) {
                        router.push(steps[prevIndex].path);
                    } else {
                        driverObj.movePrevious();
                    }
                }
            },
            onCloseClick: () => {
                finishTour();
                driverObjRef.current?.destroy();
            },
            steps: [
                {
                    element: "#tour-step-1",
                    popover: { title: "Selamat Datang!", description: "Klik tombol ini untuk mulai menjelajahi katalog produk kami.", side: "bottom" }
                },
                {
                    element: "#tour-dashboard-welcome",
                    popover: { title: "Dashboard", description: "Pantau ringkasan aktivitas belanja Anda di sini.", side: "bottom" }
                },
                {
                    element: "#tour-sidebar-katalog",
                    popover: { title: "Menu Katalog", description: "Pindah ke halaman katalog melalui menu ini.", side: "right" }
                },
                {
                    element: "#tour-step-3",
                    popover: { title: "Katalog", description: "Pilih produk yang Anda inginkan di sini.", side: "bottom" }
                },
                {
                    element: "#tour-step-4",
                    popover: { title: "Ikon Keranjang", description: "Klik ikon ini untuk memproses daftar belanjaan Anda.", side: "left" }
                },
                {
                    element: "#tour-step-5",
                    popover: { title: "Kuantitas", description: "Atur jumlah pesanan sesuai kebutuhan.", side: "top" }
                },
                {
                    element: "#tour-step-6",
                    popover: { title: "Checkout", description: "Klik Checkout untuk mengirimkan pesanan ke Admin.", side: "top" }
                },
                {
                    element: "#tour-step-7",
                    popover: { title: "Selesai", description: "Pesanan terkirim! Pantau statusnya di halaman ini.", side: "bottom" }
                },
            ],
        };

        const tryStart = (retryCount = 0) => {
            const stepIdx = parseInt(localStorage.getItem("product-tour-step") || "0");
            const targetId = steps[stepIdx]?.id;
            if (!targetId) return;

            const element = document.querySelector(targetId);
            if (element) {
                const d = driver(driverConfig);
                driverObjRef.current = d;
                d.drive(stepIdx);
            } else if (retryCount < 10) {
                setTimeout(() => tryStart(retryCount + 1), 500);
            }
        };

        const timeout = setTimeout(tryStart, 500);
        return () => {
            clearTimeout(timeout);
            if (driverObjRef.current) driverObjRef.current.destroy();
        };
    }, [pathname, hasCompletedTour, userRole, router]);

    return null;
}
