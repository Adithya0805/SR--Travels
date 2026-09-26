import fleetData from '../../data/fleet.json';
import siteConfig from '../../data/siteConfig.json';

export default function TariffTable() {
  return (
    <section id="tariff" className="py-16 md:py-24 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-10 md:mb-12">
          <span className="text-emerald-700 font-semibold text-xs uppercase tracking-wider bg-emerald-100/70 px-3 py-1 rounded-full">
            Transparent Pricing
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mt-3">Tariff & Rate Card</h2>
          <p className="text-slate-600 text-base mt-2">
            Clear per-kilometer rates with zero hidden charges across all vehicle categories.
          </p>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-hidden rounded-2xl border border-slate-100 shadow-md max-w-4xl mx-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white text-sm">
                <th className="py-4 px-6 font-semibold">Vehicle Category</th>
                <th className="py-4 px-6 font-semibold text-center">Seating</th>
                <th className="py-4 px-6 font-semibold text-center">Per-KM Rate</th>
                <th className="py-4 px-6 font-semibold text-center">Driver Allowance</th>
                <th className="py-4 px-6 font-semibold text-right">Min KM Rule</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {fleetData.map((v) => (
                <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-4 px-6 font-semibold text-slate-900 flex items-center gap-2">
                    <span>🚕</span> {v.name}
                  </td>
                  <td className="py-4 px-6 text-center text-slate-700">
                    <span className="bg-slate-100 px-3 py-1 rounded-full font-medium">
                      {v.seats} Seats
                    </span>
                  </td>
                  <td className="py-4 px-6 text-center font-mono font-bold text-emerald-600 text-base">
                    ₹{v.ratePerKm}/km
                  </td>
                  <td className="py-4 px-6 text-center font-mono text-slate-700">
                    ₹{siteConfig.driverBata} / day
                  </td>
                  <td className="py-4 px-6 text-right text-xs text-slate-600 font-medium">
                    {siteConfig.minKmOneWay} km (One Way) <br /> {siteConfig.minKmRoundTrip} km (Round Trip)
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="grid grid-cols-1 gap-4 md:hidden">
          {fleetData.map((v) => (
            <div key={v.id} className="bg-slate-50 border border-slate-100 rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                <h3 className="font-bold text-slate-900 text-base">{v.name}</h3>
                <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full font-mono">
                  ₹{v.ratePerKm}/km
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                <div>
                  <span className="block text-slate-400">Seating Capacity</span>
                  <span className="font-medium text-slate-900">{v.seats} Passengers</span>
                </div>

                <div>
                  <span className="block text-slate-400">Driver Allowance</span>
                  <span className="font-mono font-medium text-slate-900">₹{siteConfig.driverBata} / day</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 text-xs text-slate-600 font-medium">
                ℹ️ Min KM Rule: {siteConfig.minKmOneWay} km One Way | {siteConfig.minKmRoundTrip} km Round Trip
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
