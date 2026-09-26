export default function TripTabs({ activeTab, onChange }) {
  return (
    <div className="flex border-b border-slate-200 mb-6">
      <button
        type="button"
        onClick={() => onChange('oneway')}
        className={`flex-1 py-3 px-4 text-center font-bold text-sm sm:text-base transition-colors relative ${
          activeTab === 'oneway'
            ? 'text-emerald-600 border-b-2 border-emerald-500'
            : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        <span>🚕</span> One Way
      </button>
      <button
        type="button"
        onClick={() => onChange('roundtrip')}
        className={`flex-1 py-3 px-4 text-center font-bold text-sm sm:text-base transition-colors relative ${
          activeTab === 'roundtrip'
            ? 'text-emerald-600 border-b-2 border-emerald-500'
            : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        <span>🔄</span> Round Trip
      </button>
    </div>
  );
}
