export default function WhyChooseUs() {
  const features = [
    {
      icon: '🏷️',
      title: 'Lowest Price Guarantee',
      subtitle: 'Save up to 40% on one-way outstation taxi rides with zero return fare charges.',
    },
    {
      icon: '⏱️',
      title: '24/7 Doorstep Pickup',
      subtitle: 'Guaranteed 30-minute pickup dispatch anywhere across Tamil Nadu cities & airports.',
    },
    {
      icon: '📡',
      title: 'GPS-Tracked Safe Rides',
      subtitle: 'Background-verified professional highway drivers with real-time GPS vehicle tracking.',
    },
    {
      icon: '🧾',
      title: 'Transparent Billing',
      subtitle: 'Fixed per-km rates with driver bata included. No hidden surcharges or surprise fees.',
    },
  ];

  return (
    <section id="about" className="py-16 md:py-24 bg-slate-50">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-10 md:mb-12">
          <span className="text-emerald-700 font-semibold text-xs uppercase tracking-wider bg-emerald-100/70 px-3 py-1 rounded-full">
            The Srinath Advantage
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mt-3">Why Choose Us</h2>
          <p className="text-slate-600 text-base mt-2">
            The most reliable and affordable outstation taxi service in South India.
          </p>
        </div>

        {/* Mobile Horizontal Scroll Row (overflow-x-auto snap-x) / Desktop Grid */}
        <div className="flex overflow-x-auto snap-x snap-mandatory scrollbar-none gap-4 pb-4 md:grid md:grid-cols-4 md:gap-6">
          {features.map((item, idx) => (
            <div
              key={idx}
              className="flex-none w-[270px] md:w-auto snap-start bg-white p-6 rounded-2xl shadow-md border border-slate-100 hover:shadow-lg transition-all"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-2xl mb-4">
                {item.icon}
              </div>
              <h3 className="font-bold text-lg text-slate-900 mb-2">{item.title}</h3>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">{item.subtitle}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
