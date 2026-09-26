export default function MobileMenu({ isOpen, onClose, onBookClick }) {
  if (!isOpen) return null;

  const navLinks = [
    { name: 'Home', href: '#' },
    { name: 'About Us', href: '#about' },
    { name: 'Tariff', href: '#tariff' },
    { name: 'Services', href: '#services' },
    { name: 'Popular Cities', href: '#routes' },
    { name: 'Routes', href: '#routes' },
    { name: 'FAQs', href: '#faqs' },
    { name: 'Contact Us', href: '#footer' },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 md:hidden"
        onClick={onClose}
      />

      {/* Slide-out Drawer */}
      <div className="fixed inset-y-0 right-0 z-50 w-72 bg-slate-900 text-white p-6 shadow-2xl flex flex-col justify-between md:hidden transform transition-transform duration-300">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-6 border-b border-slate-800">
            <div className="font-bold text-xl tracking-tight text-white flex items-center gap-1">
              Srinath <span className="bg-emerald-500 text-white text-xs px-2 py-0.5 rounded-lg font-black">TAXI</span>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 text-2xl font-bold"
              aria-label="Close menu"
            >
              ✕
            </button>
          </div>

          {/* Links */}
          <nav className="flex flex-col gap-4 mt-6">
            {navLinks.map((link, idx) => (
              <a
                key={idx}
                href={link.href}
                onClick={onClose}
                className="text-slate-300 hover:text-emerald-400 font-medium text-base transition-colors"
              >
                {link.name}
              </a>
            ))}
          </nav>
        </div>

        {/* Bottom CTA */}
        <div className="pt-6 border-t border-slate-800 space-y-3">
          <button
            onClick={() => {
              onClose();
              onBookClick && onBookClick();
            }}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3.5 rounded-2xl shadow-md transition-colors text-center block"
          >
            Book Now
          </button>
          <a
            href="tel:+919876543210"
            className="w-full bg-slate-800 text-slate-200 text-center py-2.5 rounded-2xl text-sm font-mono block hover:bg-slate-700"
          >
            📞 +91 98765 43210
          </a>
        </div>
      </div>
    </>
  );
}
