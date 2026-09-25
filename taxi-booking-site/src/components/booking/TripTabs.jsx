export default function TripTabs({ activeTab, onChange }) {
  return (
    <div className="flex border-b border-slate-200 mb-6">
      <button
        type="button"
        onClick={() => onChange('oneway')}
        className={`flex-1 py-3 px-4 text-center font-semibold text-base transition-colors relative ${
          activeTab === 'oneway'
            ? 'text-dark border-b-2 border-accent'
            : 'text-slate-500 hover:text-dark'
        }`}
      >
        <span>🚕</span> One Way
      </button>
      <button
        type="button"
        onClick={() => onChange('roundtrip')}
        className={`flex-1 py-3 px-4 text-center font-semibold text-base transition-colors relative ${
          activeTab === 'roundtrip'
            ? 'text-dark border-b-2 border-accent'
            : 'text-slate-500 hover:text-dark'
        }`}
      >
        <span>🔄</span> Round Trip
      </button>
    </div>
  );
}
