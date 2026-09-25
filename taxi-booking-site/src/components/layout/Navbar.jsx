import { useState } from 'react';
import MobileMenu from './MobileMenu';

export default function Navbar({ onBookClick }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
      <header className="bg-white text-dark shadow-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3.5 flex items-center justify-between">
          {/* Logo */}
          <a href="#" className="font-bold text-2xl tracking-tight flex items-center gap-1.5">
            <span className="text-dark">Srinath</span>
            <span className="bg-accent text-dark font-black text-xs px-2 py-1 rounded">TAXI</span>
          </a>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-6 lg:gap-8">
            {navLinks.map((link, idx) => (
              <a
                key={idx}
                href={link.href}
                className="text-sm font-medium text-slate-700 hover:text-accent transition-colors"
              >
                {link.name}
              </a>
            ))}
          </nav>

          {/* CTA & Mobile Hamburger */}
          <div className="flex items-center gap-3">
            <button
              onClick={onBookClick}
              className="bg-trust hover:bg-emerald-600 text-white font-medium px-4 py-2 rounded-lg text-sm transition-all shadow-sm hidden sm:inline-flex items-center gap-1.5"
            >
              <span>⚡</span> Book Now
            </button>

            {/* Hamburger Button */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 text-dark hover:text-accent focus:outline-none"
              aria-label="Open navigation menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Drawer */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        onBookClick={onBookClick}
      />
    </>
  );
}
