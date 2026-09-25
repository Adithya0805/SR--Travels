import { calculateFare } from '../../lib/fareCalculator';
import fleetData from '../../data/fleet.json';

export default function FareEstimator({
  distanceKm,
  onDistanceChange,
  selectedVehicleId,
  tripType,
}) {
  const selectedVehicle = fleetData.find((v) => v.id === selectedVehicleId) || fleetData[0];
  const ratePerKm = selectedVehicle.ratePerKm;

  const numericDistance = Math.max(1, Number(distanceKm) || 150);

  const fareResult = calculateFare({
    distanceKm: numericDistance,
    tripType,
    ratePerKm,
  });

  return (
    <div className="bg-slate-50 rounded-xl p-4 sm:p-5 border border-slate-200 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex-1">
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Approx Distance (km)
          </label>
          <input
            type="number"
            min="1"
            value={distanceKm}
            onChange={(e) => onDistanceChange(e.target.value)}
            placeholder="e.g. 180"
            className="w-full sm:w-48 px-3 py-2 rounded-lg border border-slate-300 font-mono font-medium text-sm focus:outline-none focus:border-accent bg-white"
          />
        </div>

        <div className="text-right sm:text-right">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Estimated Total Fare
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-dark">
            ₹{fareResult.fare.toLocaleString('en-IN')}
          </div>
        </div>
      </div>

      {/* Breakdown Details */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 text-xs text-slate-600">
        <div>
          <span className="block text-slate-400">Billable Distance</span>
          <span className="font-mono font-semibold text-slate-800">{fareResult.billableKm} km</span>
        </div>

        <div>
          <span className="block text-slate-400">Rate / KM</span>
          <span className="font-mono font-semibold text-slate-800">₹{ratePerKm}/km</span>
        </div>

        <div>
          <span className="block text-slate-400">Driver Bata</span>
          <span className="font-mono font-semibold text-slate-800">₹{fareResult.driverBata}</span>
        </div>

        <div>
          <span className="block text-slate-400">Tolls / State Permits</span>
          <span className="font-semibold text-amber-700">Extra at actuals</span>
        </div>
      </div>

      {fareResult.minKmApplied && (
        <div className="mt-3 pt-2 border-t border-slate-200 text-xs text-amber-800 flex items-center gap-1.5 font-medium">
          <span>ℹ️</span>
          <span>
            Minimum distance rule applied ({fareResult.minKm} km min for {tripType === 'oneway' ? 'One Way' : 'Round Trip'}).
          </span>
        </div>
      )}
    </div>
  );
}
