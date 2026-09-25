export default function Hero() {
  return (
    <section className="bg-dark text-white pt-12 pb-24 md:pt-16 md:pb-28 relative overflow-hidden">
      {/* Glow Effects */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto px-4 text-center relative z-10">
        {/* Main Headline */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight max-w-4xl mx-auto leading-tight md:leading-tight mb-4">
          Book One Way Outstation Taxi at <span className="text-accent underline decoration-accent/40 decoration-wavy">Lowest Per-KM Rates</span>
        </h1>

        {/* Subheadline */}
        <p className="text-slate-300 text-base sm:text-lg md:text-xl max-w-2xl mx-auto mb-8 font-normal">
          Pay only for one-way distance. No return fare charges.
        </p>

        {/* Trust Badges Row */}
        <div className="flex flex-wrap items-center justify-center gap-3 max-w-3xl mx-auto mb-6">
          <div className="border border-accent/40 bg-white/5 text-amber-300 text-xs sm:text-sm px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
            <span>⭐⭐⭐⭐⭐</span>
            <span className="font-medium text-white">Trusted By 1 Lakh+ Customers</span>
          </div>

          <div className="border border-accent/40 bg-white/5 text-amber-300 text-xs sm:text-sm px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
            <span>📡</span>
            <span className="font-medium text-white">GPS Tracked Vehicles</span>
          </div>

          <div className="border border-accent/40 bg-white/5 text-amber-300 text-xs sm:text-sm px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
            <span>🛡️</span>
            <span className="font-medium text-white">Zero Return Fare</span>
          </div>
        </div>
      </div>
    </section>
  );
}
