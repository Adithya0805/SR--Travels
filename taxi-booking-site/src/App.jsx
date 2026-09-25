import { useRef } from 'react';
import TopBar from './components/layout/TopBar';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import Hero from './components/hero/Hero';
import BookingWidget from './components/booking/BookingWidget';
import WhyChooseUs from './components/sections/WhyChooseUs';
import TariffTable from './components/sections/TariffTable';
import PopularRoutes from './components/sections/PopularRoutes';
import BookingSteps from './components/sections/BookingSteps';
import Services from './components/sections/Services';
import AppBanner from './components/sections/AppBanner';
import FAQAccordion from './components/sections/FAQAccordion';
import FloatingCTAs from './components/shared/FloatingCTAs';

export default function App() {
  const bookingWidgetRef = useRef(null);

  const handleBookClick = () => {
    const widget = document.getElementById('booking-widget');
    if (widget) {
      widget.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleBookRoute = (route) => {
    if (bookingWidgetRef.current) {
      bookingWidgetRef.current.prefillRoute({
        from: route.from,
        to: route.to,
        distance: route.distanceKm,
      });
    }
    handleBookClick();
  };

  return (
    <div className="min-h-screen bg-white text-dark font-sans selection:bg-accent selection:text-dark">
      {/* 1. Top Bar */}
      <TopBar />

      {/* 2. Navbar */}
      <Navbar onBookClick={handleBookClick} />

      {/* 3. Hero + Booking Widget */}
      <main>
        <Hero />
        <BookingWidget ref={bookingWidgetRef} />

        {/* 4. Why Choose Us */}
        <WhyChooseUs />

        {/* 5. Tariff Table */}
        <TariffTable />

        {/* 6. Popular Routes */}
        <PopularRoutes onBookRoute={handleBookRoute} />

        {/* 7. Booking Steps */}
        <BookingSteps />

        {/* 8. Services */}
        <Services />

        {/* 9. App Banner */}
        <AppBanner />

        {/* 10. FAQ Accordion */}
        <FAQAccordion />
      </main>

      {/* 11. Footer */}
      <Footer />

      {/* 12. Floating Mobile CTAs */}
      <FloatingCTAs />
    </div>
  );
}
