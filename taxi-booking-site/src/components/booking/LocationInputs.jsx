export default function LocationInputs({ formData, onChange, errors }) {
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Pickup City/Address */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
          Pickup City / Address *
        </label>
        <div className="relative">
          <input
            type="text"
            name="pickup"
            value={formData.pickup || ''}
            onChange={onChange}
            placeholder="e.g. Ambur / Chennai"
            required
            className={`w-full px-3.5 py-2.5 rounded-lg border text-sm font-medium text-dark focus:outline-none focus:ring-2 transition-all ${
              errors?.pickup
                ? 'border-red-500 focus:ring-red-300 bg-red-50/20'
                : 'border-slate-300 focus:border-accent focus:ring-amber-200 bg-slate-50/50'
            }`}
          />
        </div>
        {errors?.pickup && (
          <p className="text-red-500 text-xs mt-1 font-medium">{errors.pickup}</p>
        )}
      </div>

      {/* Drop City/Address */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
          Drop City / Address *
        </label>
        <div className="relative">
          <input
            type="text"
            name="drop"
            value={formData.drop || ''}
            onChange={onChange}
            placeholder="e.g. Chennai / Pondicherry"
            required
            className={`w-full px-3.5 py-2.5 rounded-lg border text-sm font-medium text-dark focus:outline-none focus:ring-2 transition-all ${
              errors?.drop
                ? 'border-red-500 focus:ring-red-300 bg-red-50/20'
                : 'border-slate-300 focus:border-accent focus:ring-amber-200 bg-slate-50/50'
            }`}
          />
        </div>
        {errors?.drop && (
          <p className="text-red-500 text-xs mt-1 font-medium">{errors.drop}</p>
        )}
      </div>

      {/* Pickup Date */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
          Pickup Date *
        </label>
        <div className="relative">
          <input
            type="date"
            name="date"
            min={today}
            value={formData.date || ''}
            onChange={onChange}
            required
            className={`w-full px-3.5 py-2.5 rounded-lg border text-sm font-medium text-dark focus:outline-none focus:ring-2 transition-all ${
              errors?.date
                ? 'border-red-500 focus:ring-red-300 bg-red-50/20'
                : 'border-slate-300 focus:border-accent focus:ring-amber-200 bg-slate-50/50'
            }`}
          />
        </div>
        {errors?.date && (
          <p className="text-red-500 text-xs mt-1 font-medium">{errors.date}</p>
        )}
      </div>

      {/* Pickup Time */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
          Pickup Time *
        </label>
        <div className="relative">
          <input
            type="time"
            name="time"
            value={formData.time || ''}
            onChange={onChange}
            required
            className={`w-full px-3.5 py-2.5 rounded-lg border text-sm font-medium text-dark focus:outline-none focus:ring-2 transition-all ${
              errors?.time
                ? 'border-red-500 focus:ring-red-300 bg-red-50/20'
                : 'border-slate-300 focus:border-accent focus:ring-amber-200 bg-slate-50/50'
            }`}
          />
        </div>
        {errors?.time && (
          <p className="text-red-500 text-xs mt-1 font-medium">{errors.time}</p>
        )}
      </div>
    </div>
  );
}
