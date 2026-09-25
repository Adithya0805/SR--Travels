export default function AppBanner() {
  return (
    <section className="py-12 bg-white">
      <div className="container mx-auto px-4">
        <div className="bg-dark text-white rounded-3xl p-8 md:p-12 shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
          {/* Decorative Glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-accent/10 rounded-full blur-3xl pointer-events-none" />

          <div className="space-y-3 max-w-xl text-center md:text-left relative z-10">
            <span className="bg-accent text-dark text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider inline-block">
              Mobile App Offer
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-white">
              Get <span className="text-accent">₹150 OFF</span> on first app booking
            </h2>
            <p className="text-slate-300 text-sm md:text-base">
              Download the Srinath Travels app for live vehicle tracking, instant driver assignment, and exclusive discounts.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 relative z-10">
            {/* Play Store Badge Placeholder */}
            <a
              href="#"
              onClick={(e) => e.preventDefault()}
              className="bg-slate-800 hover:bg-slate-700 text-white px-5 py-3 rounded-xl border border-slate-700 flex items-center gap-3 transition-colors shadow-md"
            >
              <span className="text-3xl">🤖</span>
              <div className="text-left">
                <div className="text-[10px] text-slate-400 uppercase tracking-widest">GET IT ON</div>
                <div className="font-bold text-sm tracking-wide">Google Play</div>
              </div>
            </a>

            {/* App Store Badge Placeholder */}
            <a
              href="#"
              onClick={(e) => e.preventDefault()}
              className="bg-slate-800 hover:bg-slate-700 text-white px-5 py-3 rounded-xl border border-slate-700 flex items-center gap-3 transition-colors shadow-md"
            >
              <span className="text-3xl">🍎</span>
              <div className="text-left">
                <div className="text-[10px] text-slate-400 uppercase tracking-widest">Download on the</div>
                <div className="font-bold text-sm tracking-wide">App Store</div>
              </div>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
