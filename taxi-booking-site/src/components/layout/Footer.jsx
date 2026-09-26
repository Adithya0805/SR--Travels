export default function Footer() {
  return (
    <footer id="footer" className="bg-slate-900 text-white pt-12 pb-24 md:pb-8 border-t border-slate-800">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Column 1: About */}
          <div className="space-y-4">
            <div className="font-bold text-2xl tracking-tight flex items-center gap-1.5">
              <span>Srinath</span>
              <span className="bg-emerald-500 text-white font-black text-xs px-2 py-1 rounded-lg">TAXI</span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed">
              Tamil Nadu's premier one-way outstation taxi service. Transparent per-km rates, zero return charges, and guaranteed 24/7 doorstep dispatch.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <a href="#" className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 hover:bg-emerald-500 hover:text-white transition-colors" aria-label="Facebook">
                FB
              </a>
              <a href="#" className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 hover:bg-emerald-500 hover:text-white transition-colors" aria-label="Twitter">
                X
              </a>
              <a href="#" className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 hover:bg-emerald-500 hover:text-white transition-colors" aria-label="Instagram">
                IG
              </a>
              <a href="https://wa.me/919876543210" target="_blank" rel="noreferrer" className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 hover:bg-emerald-500 hover:text-white transition-colors" aria-label="WhatsApp">
                WA
              </a>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h3 className="text-emerald-400 font-semibold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li><a href="#" className="hover:text-white transition-colors">Home</a></li>
              <li><a href="#about" className="hover:text-white transition-colors">About Us</a></li>
              <li><a href="#tariff" className="hover:text-white transition-colors">Tariff & Rates</a></li>
              <li><a href="#routes" className="hover:text-white transition-colors">Popular Routes</a></li>
              <li><a href="#faqs" className="hover:text-white transition-colors">Frequently Asked Questions</a></li>
            </ul>
          </div>

          {/* Column 3: Services */}
          <div>
            <h3 className="text-emerald-400 font-semibold text-lg mb-4">Services</h3>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li><a href="#services" className="hover:text-white transition-colors">One Way Outstation Taxi</a></li>
              <li><a href="#services" className="hover:text-white transition-colors">Round Trip Taxi</a></li>
              <li><a href="#services" className="hover:text-white transition-colors">Airport Drops & Pickups</a></li>
              <li><a href="#services" className="hover:text-white transition-colors">Local Rental Packages</a></li>
              <li><a href="#services" className="hover:text-white transition-colors">Corporate Taxi Rental</a></li>
            </ul>
          </div>

          {/* Column 4: Contact */}
          <div>
            <h3 className="text-emerald-400 font-semibold text-lg mb-4">Contact Us</h3>
            <ul className="space-y-3 text-sm text-slate-400">
              <li className="flex items-start gap-2.5">
                <span className="text-emerald-400 mt-0.5">📍</span>
                <span>No. 45, Anna Salai, Guindy, Chennai, Tamil Nadu - 600032</span>
              </li>
              <li className="flex items-center gap-2.5">
                <span className="text-emerald-400">📞</span>
                <a href="tel:+919876543210" className="hover:text-white font-mono">+91 98765 43210</a>
              </li>
              <li className="flex items-center gap-2.5">
                <span className="text-emerald-400">✉️</span>
                <a href="mailto:support@srinathtravels.com" className="hover:text-white">support@srinathtravels.com</a>
              </li>
              <li className="flex items-center gap-2.5 text-emerald-400 font-medium">
                <span>🟢</span>
                <span>24/7 Dispatch Desk Active</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-800 text-center text-xs text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p>© 2026 Srinath Travels. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-slate-400">Privacy Policy</a>
            <a href="#" className="hover:text-slate-400">Terms of Service</a>
            <a href="#" className="hover:text-slate-400">Refund Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
