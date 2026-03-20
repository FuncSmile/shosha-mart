"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, RefreshCw, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ErrorOverlay({ 
  error, 
  reset 
}: { 
  error: Error & { digest?: string; code?: string }; 
  reset: () => void 
}) {
  const [errorCode, setErrorCode] = useState("UNKNOWN_SERVER_ERROR");

  useEffect(() => {
    // Detect custom timeout error code
    if (error.message?.includes("Timeout") || error.code === "DB_TIMEOUT") {
      setErrorCode("DB_TIMEOUT");
    } else if (error.message?.includes("database") || error.message?.includes("connect")) {
      setErrorCode("DB_CONNECTION_FAILED");
    }
    
    // Log for debugging
    console.error("Critical Error Captured by Boundary:", error);
  }, [error]);

  const whatsappMessage = encodeURIComponent(
    `Halo Admin, saya mengalami kendala koneksi di web ShoshaMart. [Error: ${errorCode}]. Mohon bantuannya.`
  );
  const whatsappUrl = `https://wa.me/6281313456528?text=${whatsappMessage}`;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-2xl p-8 shadow-2xl border border-neutral-100 text-center animate-in zoom-in-95 duration-300">
        
        {/* Warning Icon */}
        <div className="w-16 h-16 bg-orange-50 border border-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-8 h-8 text-orange-500" />
        </div>

        <h3 className="text-xl font-bold text-neutral-900 mb-2">Sistem Bermasalah</h3>
        <p className="text-neutral-600 text-sm leading-relaxed mb-8">
          Mohon maaf, koneksi database kami sedang sibuk atau mengalami kendala. Kami sedang berupaya memperbaikinya segera.
        </p>

        <div className="flex flex-col gap-3">
          {/* WhatsApp CTA */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-xl transition-all active:scale-[0.98]"
          >
            <MessageCircle className="w-5 h-5" />
            Hubungi SuperAdmin via WhatsApp
          </a>

          {/* Retry Button */}
          <Button
            onClick={() => window.location.reload()}
            variant="secondary"
            className="py-6 rounded-xl font-medium border-neutral-200"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Coba Lagi
          </Button>
        </div>

        <div className="mt-8 pt-6 border-t border-neutral-50">
          <p className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest">
            Diagnostic Code: {errorCode}
          </p>
          {error.digest && (
            <p className="text-[9px] font-mono text-neutral-300 mt-1">
              Ref: {error.digest}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
