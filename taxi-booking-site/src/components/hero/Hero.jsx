export default function Hero({ onBookClick }) {
  return (
    <section className="bg-slate-900 text-white pt-12 pb-20 md:pt-16 md:pb-28 relative overflow-hidden">
      {/* Decorative Blur Accents */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto px-4 text-center relative z-10">
        {/* Main Headline */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight max-w-4xl mx-auto leading-tight md:leading-tight mb-4 text-white">
          Book One Way Outstation Taxi at <span className="text-emerald-400 underline decoration-emerald-400/40 decoration-wavy">Lowest Per-KM Rates</span>
        </h1>

        {/* Subheadline */}
        <p className="text-slate-300 text-base sm:text-lg md:text-xl max-w-2xl mx-auto mb-8 font-normal">
          Pay only for one-way distance. No return fare charges.
        </p>

        {/* Trust Badges Row (Allowed Gold Accent Usage) */}
        <div className="flex flex-wrap items-center justify-center gap-3 max-w-3xl mx-auto mb-8">
          <div className="border border-[#F5B700]/40 bg-[#F5B700]/10 text-amber-300 text-xs sm:text-sm px-4 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
            <span>⭐⭐⭐⭐⭐</span>
            <span className="font-medium text-white">Trusted By 1 Lakh+ Customers</span>
          </div>

          <div className="border border-[#F5B700]/40 bg-[#F5B700]/10 text-amber-300 text-xs sm:text-sm px-4 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
            <span>📡</span>
            <span className="font-medium text-white">GPS Tracked Vehicles</span>
          </div>

          <div className="border border-[#F5B700]/40 bg-[#F5B700]/10 text-amber-300 text-xs sm:text-sm px-4 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
            <span>🛡️</span>
            <span className="font-medium text-white">Zero Return Fare</span>
          </div>
        </div>

        {/* Action Button for Hero (Emerald Primary Action) */}
        <div className="hidden md:flex justify-center">
          <button
            onClick={onBookClick}
            className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-8 py-4 rounded-2xl shadow-xl shadow-emerald-500/25 transition-all transform hover:-translate-y-0.5 text-base flex items-center gap-2"
          >
            <span>⚡</span> Estimate Fare & Book Taxi
          </button>
        </div>
      </div>
    </section>
  );
}
