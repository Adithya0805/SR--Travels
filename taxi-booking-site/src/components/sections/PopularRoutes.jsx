import routesData from '../../data/routes.json';
import fleetData from '../../data/fleet.json';
import { calculateFare } from '../../lib/fareCalculator';

export default function PopularRoutes({ onBookRoute }) {
  const sedanRate = fleetData.find((f) => f.id === 'sedan')?.ratePerKm || 14;

  return (
    <section id="routes" className="py-16 md:py-24 bg-slate-50">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-10 md:mb-12">
          <span className="text-emerald-700 font-semibold text-xs uppercase tracking-wider bg-emerald-100/70 px-3 py-1 rounded-full">
            Top Outstation Destinations
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mt-3">Popular Routes</h2>
          <p className="text-slate-600 text-base mt-2">
            Instant booking for our most requested outstation highway routes across South India.
          </p>
        </div>

        {/* Mobile Horizontal Scroll Row (overflow-x-auto snap-x) / Desktop Grid */}
        <div className="flex overflow-x-auto snap-x snap-mandatory scrollbar-none gap-4 pb-4 md:grid md:grid-cols-3 md:gap-6">
          {routesData.map((route, idx) => {
            const fareResult = calculateFare({
              distanceKm: route.distanceKm,
              tripType: 'oneway',
              ratePerKm: sedanRate,
            });

            return (
              <div
                key={idx}
                className="flex-none w-[290px] md:w-auto snap-start bg-white rounded-2xl p-6 shadow-md border border-slate-100 hover:shadow-lg transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    {/* Gold Accent allowed on Popular Tag */}
                    <span className="text-xs font-bold uppercase tracking-wider bg-amber-500/10 text-amber-900 border border-amber-300/80 px-2.5 py-1 rounded-full">
                      🔥 Popular &middot; {route.highlight}
                    </span>
                    <span className="font-mono text-xs text-slate-500 font-medium">
                      {route.distanceKm} km
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 mb-1 flex items-center gap-2">
                    <span>{route.from}</span>
                    <span className="text-emerald-600">→</span>
                    <span>{route.to}</span>
                  </h3>
                  <p className="text-xs text-slate-500 mb-4">One-Way Sedan Starting Rate</p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-2">
                  <div>
                    <span className="text-xs text-slate-400 block">Estimated Fare</span>
                    <span className="font-mono font-bold text-xl text-slate-900">
                      ₹{fareResult.fare.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <button
                    onClick={() => onBookRoute && onBookRoute(route)}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs px-4 py-2.5 rounded-2xl shadow-md transition-all"
                  >
                    Book Route
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
