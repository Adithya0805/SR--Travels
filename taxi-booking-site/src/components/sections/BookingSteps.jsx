export default function BookingSteps() {
  const steps = [
    {
      num: '1',
      title: 'Enter Locations',
      desc: 'Fill in your pickup city, destination, travel date and preferred time.',
    },
    {
      num: '2',
      title: 'Select Taxi',
      desc: 'Choose from Sedan, SUV or Innova based on your group size.',
    },
    {
      num: '3',
      title: 'Confirm Booking',
      desc: 'Check your transparent fare breakdown and confirm via mobile.',
    },
    {
      num: '4',
      title: 'Ride Safely',
      desc: 'Our driver arrives 10 minutes early for a comfortable journey.',
    },
  ];

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-accent font-semibold text-xs uppercase tracking-wider bg-amber-500/10 text-amber-800 px-3 py-1 rounded-full">
            Simple 4-Step Process
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-dark mt-3">How It Works</h2>
          <p className="text-slate-600 text-base mt-2">
            Book your outstation taxi in under 60 seconds with no upfront advance payment required.
          </p>
        </div>

        <div className="relative max-w-5xl mx-auto">
          {/* Connecting Line (Desktop) */}
          <div className="hidden md:block absolute top-1/2 left-0 right-0 h-1 bg-slate-200 -translate-y-6 z-0" />

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative z-10">
            {steps.map((step, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl p-6 border border-slate-200 text-center shadow-sm flex flex-col items-center"
              >
                {/* Step Circle */}
                <div className="w-12 h-12 rounded-full bg-accent text-dark font-bold text-xl flex items-center justify-center shadow-md mb-4 ring-8 ring-white">
                  {step.num}
                </div>

                <h3 className="font-bold text-lg text-dark mb-2">{step.title}</h3>
                <p className="text-slate-600 text-xs leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
