import fleetData from '../../data/fleet.json';

export default function VehicleSelector({ selectedVehicleId, onSelect }) {
  return (
    <div className="mb-6">
      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2.5">
        Select Vehicle Category *
      </label>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {fleetData.map((vehicle) => {
          const isSelected = selectedVehicleId === vehicle.id;
          return (
            <div
              key={vehicle.id}
              onClick={() => onSelect(vehicle.id)}
              className={`cursor-pointer rounded-xl p-4 border-2 transition-all flex flex-col justify-between relative ${
                isSelected
                  ? 'border-accent bg-amber-500/10 shadow-sm'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="font-semibold text-sm text-dark">{vehicle.name}</div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  isSelected ? 'border-amber-600 bg-accent' : 'border-slate-300'
                }`}>
                  {isSelected && <div className="w-2 h-2 rounded-full bg-dark" />}
                </div>
              </div>

              <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-xs">
                <span className="text-slate-600 flex items-center gap-1 font-medium">
                  👥 {vehicle.seats} Seats
                </span>
                <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                  ₹{vehicle.ratePerKm}/km
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
