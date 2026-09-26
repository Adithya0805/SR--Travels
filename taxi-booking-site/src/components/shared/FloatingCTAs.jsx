export default function FloatingCTAs({ isMobileSheetOpen, onOpenSheet }) {
  if (isMobileSheetOpen) return null; // Hide floating pill when bottom sheet is open

  return (
    <div className="md:hidden">
      {/* Bottom Center Floating "Book Now" Pill Button */}
      <button
        type="button"
        onClick={onOpenSheet}
        className="fixed bottom-5 left-1/2 -translate-x-1/2 z-30 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm px-6 py-3.5 rounded-full shadow-2xl shadow-emerald-600/40 flex items-center gap-2.5 border-2 border-white transform active:scale-95 transition-all"
        aria-label="Open booking sheet"
      >
        <span>⚡</span>
        <span>Book Now</span>
      </button>

      {/* Side Floating WhatsApp Icon */}
      <a
        href="https://wa.me/919876543210?text=Hi%2C%20I%20need%20a%20taxi%20booking%20estimate"
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-5 right-4 z-30 w-12 h-12 rounded-full bg-emerald-500 text-white shadow-xl flex items-center justify-center text-xl hover:scale-110 active:scale-95 transition-transform border-2 border-white"
        aria-label="Chat on WhatsApp"
      >
        💬
      </a>
    </div>
  );
}
