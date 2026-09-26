import { calculateFare } from '../../lib/fareCalculator';
import fleetData from '../../data/fleet.json';

export default function FareEstimator({
  distanceKm,
  onDistanceChange,
  daysCount,
  onDaysChange,
  selectedVehicleId,
  tripType,
  rentalType = 'with-driver',
}) {
  const selectedVehicle = fleetData.find((v) => v.id === selectedVehicleId) || fleetData[0];

  const isSelfDrive = rentalType === 'self-drive';

  const fareResult = calculateFare({
    distanceKm,
    tripType,
    ratePerKm: selectedVehicle.ratePerKm,
    rentalType,
    daysCount,
    ratePerDay: selectedVehicle.ratePerDay,
  });

  return (
    <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/80 shadow-sm mb-6">
      {isSelfDrive ? (
        /* Self Drive Estimator Layout */
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Rental Duration (Days)
            </label>
            <input
              type="number"
              min="1"
              max="30"
              value={daysCount}
              onChange={(e) => onDaysChange(e.target.value)}
              placeholder="e.g. 2"
              className="w-full sm:w-48 px-3.5 py-2 rounded-2xl border border-slate-300 font-mono font-medium text-sm focus:outline-none focus:border-emerald-500 bg-white shadow-sm"
            />
          </div>

          <div className="text-left sm:text-right">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Estimated Total Fare
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-emerald-600">
              ₹{fareResult.fare.toLocaleString('en-IN')}
            </div>
          </div>
        </div>
      ) : (
        /* With Driver Estimator Layout */
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
              className="w-full sm:w-48 px-3.5 py-2 rounded-2xl border border-slate-300 font-mono font-medium text-sm focus:outline-none focus:border-emerald-500 bg-white shadow-sm"
            />
          </div>

          <div className="text-left sm:text-right">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Estimated Total Fare
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-emerald-600">
              ₹{fareResult.fare.toLocaleString('en-IN')}
            </div>
          </div>
        </div>
      )}

      {/* Breakdown Details */}
      {isSelfDrive ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 text-xs text-slate-600">
          <div>
            <span className="block text-slate-400">Total Rental Days</span>
            <span className="font-mono font-semibold text-slate-900">{fareResult.daysCount} Day(s)</span>
          </div>

          <div>
            <span className="block text-slate-400">Daily Rental Rate</span>
            <span className="font-mono font-semibold text-slate-900">₹{selectedVehicle.ratePerDay}/day</span>
          </div>

          <div>
            <span className="block text-slate-400">Fuel & Tolls</span>
            <span className="font-semibold text-slate-700">Paid by Customer</span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 text-xs text-slate-600">
          <div>
            <span className="block text-slate-400">Billable Distance</span>
            <span className="font-mono font-semibold text-slate-900">{fareResult.billableKm} km</span>
          </div>

          <div>
            <span className="block text-slate-400">Rate / KM</span>
            <span className="font-mono font-semibold text-slate-900">₹{selectedVehicle.ratePerKm}/km</span>
          </div>

          <div>
            <span className="block text-slate-400">Driver Allowance</span>
            <span className="font-mono font-semibold text-slate-900">₹{fareResult.driverBata}</span>
          </div>

          <div>
            <span className="block text-slate-400">Tolls & Permits</span>
            <span className="font-semibold text-slate-700">Extra at actuals</span>
          </div>
        </div>
      )}

      {/* Min-km note for with-driver */}
      {!isSelfDrive && fareResult.minKmApplied && (
        <div className="mt-3 pt-2.5 border-t border-slate-200 text-xs text-amber-900 bg-amber-500/10 border border-amber-300/60 rounded-2xl p-3 flex items-center gap-2 font-medium">
          <span>ℹ️</span>
          <span>
            Minimum distance rule applied ({fareResult.minKm} km min for {tripType === 'oneway' ? 'One Way' : 'Round Trip'}).
          </span>
        </div>
      )}
    </div>
  );
}
