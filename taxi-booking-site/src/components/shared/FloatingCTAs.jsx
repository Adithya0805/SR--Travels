export default function FloatingCTAs() {
  return (
    <div className="md:hidden fixed bottom-5 right-5 z-50 flex flex-col gap-3">
      {/* WhatsApp Button */}
      <a
        href="https://wa.me/919876543210?text=Hi%2C%20I%20need%20a%20taxi%20booking%20estimate"
        target="_blank"
        rel="noreferrer"
        className="w-13 h-13 rounded-full bg-trust text-white shadow-xl flex items-center justify-center text-2xl hover:scale-110 active:scale-95 transition-transform border-2 border-white p-3"
        aria-label="Chat on WhatsApp"
      >
        💬
      </a>

      {/* Phone Call Button */}
      <a
        href="tel:+919876543210"
        className="w-13 h-13 rounded-full bg-accent text-dark shadow-xl flex items-center justify-center text-2xl hover:scale-110 active:scale-95 transition-transform border-2 border-white p-3"
        aria-label="Call Dispatch Desk"
      >
        📞
      </a>
    </div>
  );
}
