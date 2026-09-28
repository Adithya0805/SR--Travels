"use client";

import { siteConfig } from "@/config/siteConfig";

export default function ContactView() {
  const handleCall = () => {
    window.location.href = `tel:${siteConfig.phone}`;
  };

  const handleWhatsApp = () => {
    const url = `https://wa.me/${siteConfig.whatsapp}?text=${encodeURIComponent(
      "Hello SR Travels, I would like to enquire about taxi booking."
    )}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="w-full max-w-lg mx-auto pb-10 space-y-4 select-none animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl p-5 shadow-xl border border-slate-100 space-y-4">
        <div>
          <h2 className="text-base font-black text-slate-900">Contact SR Travels</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            24/7 customer support and instant WhatsApp bookings
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5">
          {/* WhatsApp Button */}
          <button
            type="button"
            onClick={handleWhatsApp}
            className="w-full h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.275.072.376-.044c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.1.824z" />
            </svg>
            <span>Chat on WhatsApp ({siteConfig.phoneDisplay})</span>
          </button>

          {/* Call Button */}
          <button
            type="button"
            onClick={handleCall}
            className="w-full h-12 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
            </svg>
            <span>Call Us Directly: {siteConfig.phoneDisplay}</span>
          </button>
        </div>

        {/* Office & Operations Card */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 text-xs text-slate-700">
          <div>
            <span className="text-[9px] font-black uppercase text-slate-400 block tracking-wider">
              Operating Hours
            </span>
            <span className="font-extrabold text-slate-900">24 Hours, 7 Days a Week</span>
          </div>

          <div>
            <span className="text-[9px] font-black uppercase text-slate-400 block tracking-wider">
              Primary Service Area
            </span>
            <span className="font-medium text-slate-800">
              Chennai, Vellore, Ambur, Tirupathur, Bangalore, Tirupati, Pondicherry, and all across Tamil Nadu.
            </span>
          </div>

          <div>
            <span className="text-[9px] font-black uppercase text-slate-400 block tracking-wider">
              Fleet Types
            </span>
            <span className="font-medium text-slate-800">
              Sedans (Dzire/Etios), Executive SUVs (Ertiga/Carens), Premium MUVs (Innova Crysta).
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
