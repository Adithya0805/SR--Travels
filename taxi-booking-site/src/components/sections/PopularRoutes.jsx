import routesData from '../../data/routes.json';
import fleetData from '../../data/fleet.json';
import { calculateFare } from '../../lib/fareCalculator';

export default function PopularRoutes({ onBookRoute }) {
  const sedanRate = fleetData.find((f) => f.id === 'sedan')?.ratePerKm || 14;

  return (
    <section id="routes" className="py-16 md:py-24 bg-slate-50">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-trust font-semibold text-xs uppercase tracking-wider bg-emerald-100 px-3 py-1 rounded-full">
            Top Outstation Destinations
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-dark mt-3">Popular Routes</h2>
          <p className="text-slate-600 text-base mt-2">
            Instant booking for our most requested outstation highway routes across South India.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {routesData.map((route, idx) => {
            const fareResult = calculateFare({
              distanceKm: route.distanceKm,
              tripType: 'oneway',
              ratePerKm: sedanRate,
            });

            return (
              <div
                key={idx}
                className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold uppercase tracking-wider bg-amber-500/10 text-amber-800 px-2.5 py-1 rounded-md">
                      {route.highlight}
                    </span>
                    <span className="font-mono text-xs text-slate-500 font-medium">
                      {route.distanceKm} km
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-dark mb-1 flex items-center gap-2">
                    <span>{route.from}</span>
                    <span className="text-accent">→</span>
                    <span>{route.to}</span>
                  </h3>
                  <p className="text-xs text-slate-500 mb-4">One-Way Sedan Starting Rate</p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-2">
                  <div>
                    <span className="text-xs text-slate-400 block">Estimated Fare</span>
                    <span className="font-mono font-bold text-xl text-dark">
                      ₹{fareResult.fare.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <button
                    onClick={() => onBookRoute && onBookRoute(route)}
                    className="bg-accent hover:bg-amber-400 text-dark font-bold text-xs px-4 py-2.5 rounded-lg shadow-sm transition-all"
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
