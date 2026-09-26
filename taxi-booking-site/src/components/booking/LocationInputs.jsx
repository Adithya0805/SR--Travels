export default function LocationInputs({ formData, onChange, errors }) {
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Pickup City/Address */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
          Pickup City / Address *
        </label>
        <input
          type="text"
          name="pickup"
          value={formData.pickup || ''}
          onChange={onChange}
          placeholder="e.g. Ambur / Chennai"
          required
          className={`w-full px-4 py-3 rounded-2xl border text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 transition-all shadow-sm ${
            errors?.pickup
              ? 'border-red-500 focus:ring-red-300 bg-red-50/20'
              : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-200 bg-slate-50/40'
          }`}
        />
        {errors?.pickup && (
          <p className="text-red-500 text-xs mt-1 font-medium">{errors.pickup}</p>
        )}
      </div>

      {/* Drop City/Address */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
          Drop City / Address *
        </label>
        <input
          type="text"
          name="drop"
          value={formData.drop || ''}
          onChange={onChange}
          placeholder="e.g. Chennai / Pondicherry"
          required
          className={`w-full px-4 py-3 rounded-2xl border text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 transition-all shadow-sm ${
            errors?.drop
              ? 'border-red-500 focus:ring-red-300 bg-red-50/20'
              : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-200 bg-slate-50/40'
          }`}
        />
        {errors?.drop && (
          <p className="text-red-500 text-xs mt-1 font-medium">{errors.drop}</p>
        )}
      </div>

      {/* Pickup Date */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
          Pickup Date *
        </label>
        <input
          type="date"
          name="date"
          min={today}
          value={formData.date || ''}
          onChange={onChange}
          required
          className={`w-full px-4 py-3 rounded-2xl border text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 transition-all shadow-sm ${
            errors?.date
              ? 'border-red-500 focus:ring-red-300 bg-red-50/20'
              : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-200 bg-slate-50/40'
          }`}
        />
        {errors?.date && (
          <p className="text-red-500 text-xs mt-1 font-medium">{errors.date}</p>
        )}
      </div>

      {/* Pickup Time */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
          Pickup Time *
        </label>
        <input
          type="time"
          name="time"
          value={formData.time || ''}
          onChange={onChange}
          required
          className={`w-full px-4 py-3 rounded-2xl border text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 transition-all shadow-sm ${
            errors?.time
              ? 'border-red-500 focus:ring-red-300 bg-red-50/20'
              : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-200 bg-slate-50/40'
          }`}
        />
        {errors?.time && (
          <p className="text-red-500 text-xs mt-1 font-medium">{errors.time}</p>
        )}
      </div>
    </div>
  );
}
