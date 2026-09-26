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
              className={`cursor-pointer rounded-2xl p-4 transition-all flex flex-col justify-between relative ${
                isSelected
                  ? 'border-2 border-emerald-500 bg-emerald-50/40 shadow-md'
                  : 'border border-slate-200 bg-white hover:border-slate-300 shadow-sm hover:shadow-md'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="font-bold text-sm text-slate-900">{vehicle.name}</div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  isSelected ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300'
                }`}>
                  {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
              </div>

              <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-xs">
                <span className="text-slate-600 flex items-center gap-1 font-medium">
                  👥 {vehicle.seats} Seats
                </span>
                <span className="font-mono font-bold text-emerald-700 bg-emerald-100/60 px-2.5 py-0.5 rounded-full">
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
