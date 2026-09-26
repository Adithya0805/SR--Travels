export default function Services() {
  const serviceList = [
    {
      icon: '🚕',
      title: 'One Way Trip',
      desc: 'Pay strictly for one-way distance between major South Indian cities. Zero return fees.',
    },
    {
      icon: '🔄',
      title: 'Round Trip',
      desc: 'Flexible multi-day outstation packages for sight-seeing, family visits, or business.',
    },
    {
      icon: '🛣️',
      title: 'Outstation Cabs',
      desc: 'Interstate highway travel with experienced long-distance verified drivers.',
    },
    {
      icon: '✈️',
      title: 'Airport Pickup & Drop',
      desc: 'Guaranteed 24/7 timely airport transfers to Chennai (MAA), Bangalore & Coimbatore.',
    },
    {
      icon: '🏙️',
      title: 'City Local Package',
      desc: 'Hourly local rental packages (4hr/40km, 8hr/80km) for hassle-free city errands.',
    },
  ];

  return (
    <section id="services" className="py-16 md:py-24 bg-slate-50">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-10 md:mb-12">
          <span className="text-emerald-700 font-semibold text-xs uppercase tracking-wider bg-emerald-100/70 px-3 py-1 rounded-full">
            Tailored Travel Options
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mt-3">Our Taxi Services</h2>
          <p className="text-slate-600 text-base mt-2">
            Comprehensive travel solutions tailored for families, solo travelers, and businesses.
          </p>
        </div>

        {/* Mobile Horizontal Scroll Row (overflow-x-auto snap-x) / Desktop Grid */}
        <div className="flex overflow-x-auto snap-x snap-mandatory scrollbar-none gap-4 pb-4 md:grid md:grid-cols-3 md:gap-6 max-w-6xl mx-auto">
          {serviceList.map((service, idx) => (
            <div
              key={idx}
              className="flex-none w-[270px] md:w-auto snap-start bg-white rounded-2xl p-6 shadow-md border border-slate-100 hover:shadow-lg transition-all"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 text-2xl flex items-center justify-center mb-4">
                {service.icon}
              </div>
              <h3 className="font-bold text-lg text-slate-900 mb-2">{service.title}</h3>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">{service.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
