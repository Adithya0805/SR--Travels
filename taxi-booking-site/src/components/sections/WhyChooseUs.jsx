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
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-trust font-semibold text-xs uppercase tracking-wider bg-emerald-100/60 px-3 py-1 rounded-full">
            The Srinath Advantage
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-dark mt-3">Why Choose Us</h2>
          <p className="text-slate-600 text-base mt-2">
            The most reliable and affordable outstation taxi service in South India.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((item, idx) => (
            <div
              key={idx}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 group"
            >
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                {item.icon}
              </div>
              <h3 className="font-bold text-lg text-dark mb-2">{item.title}</h3>
              <p className="text-slate-600 text-sm leading-relaxed">{item.subtitle}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
