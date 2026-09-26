export default function TopBar() {
  return (
    <div className="bg-slate-900 text-white text-xs md:text-sm py-2 px-4 border-b border-slate-800 hidden md:flex justify-between items-center z-50">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center gap-6">
          <a
            href="tel:+919876543210"
            className="flex items-center gap-2 hover:text-emerald-400 transition-colors"
          >
            <span>📞</span>
            <span className="font-mono font-medium">+91 98765 43210</span>
          </a>
          <a
            href="mailto:support@srinathtravels.com"
            className="flex items-center gap-2 hover:text-emerald-400 transition-colors"
          >
            <span>✉️</span>
            <span>support@srinathtravels.com</span>
          </a>
        </div>
        <div className="flex items-center gap-4">
          <span className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-emerald-500/40">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Open 24/7 Dispatch
          </span>
        </div>
      </div>
    </div>
  );
}
