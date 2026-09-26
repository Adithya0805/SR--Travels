import { useState, forwardRef, useImperativeHandle } from 'react';
import TripTabs from './TripTabs';
import LocationInputs from './LocationInputs';
import VehicleSelector from './VehicleSelector';
import FareEstimator from './FareEstimator';
import ConfirmationModal from './ConfirmationModal';
import fleetData from '../../data/fleet.json';

const BookingWidget = forwardRef(function BookingWidget({ isMobileExpanded, setIsMobileExpanded }, ref) {
  const today = new Date().toISOString().split('T')[0];

  const [rentalType, setRentalType] = useState('with-driver'); // 'with-driver' | 'self-drive'
  const [tripType, setTripType] = useState('oneway');
  const [formData, setFormData] = useState({
    pickup: 'Ambur',
    drop: 'Chennai',
    date: today,
    time: '08:00',
  });
  const [selectedVehicleId, setSelectedVehicleId] = useState(fleetData[0].id);
  const [distanceKm, setDistanceKm] = useState('180');
  const [daysCount, setDaysCount] = useState('1');
  const [errors, setErrors] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Expose pre-fill method to parent component
  useImperativeHandle(ref, () => ({
    prefillRoute({ from, to, distance }) {
      setRentalType('with-driver');
      setFormData((prev) => ({
        ...prev,
        pickup: from || prev.pickup,
        drop: to || prev.drop,
      }));
      if (distance) {
        setDistanceKm(String(distance));
      }
      setErrors({});
      setIsMobileExpanded(true); // Open bottom sheet when prefilled on mobile
    },
    openSheet() {
      setIsMobileExpanded(true);
    }
  }));

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.pickup || formData.pickup.trim().length < 3) {
      newErrors.pickup = 'Pickup location must be at least 3 characters.';
    }

    if (rentalType === 'with-driver' && (!formData.drop || formData.drop.trim().length < 3)) {
      newErrors.drop = 'Drop location must be at least 3 characters.';
    }

    if (!formData.date) {
      newErrors.date = 'Pickup date is required.';
    } else if (formData.date < today) {
      newErrors.date = 'Pickup date cannot be in the past.';
    }

    if (!formData.time) {
      newErrors.time = 'Pickup time is required.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      setIsModalOpen(true);
    }
  };

  return (
    <>
      {/* Mobile Overlay Backdrop */}
      {isMobileExpanded && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={() => setIsMobileExpanded(false)}
        />
      )}

      {/* Booking Widget Wrapper */}
      <div
        id="booking-widget"
        className={`
          md:container md:mx-auto md:px-4 md:relative md:z-20 md:-mt-16 md:block
          ${isMobileExpanded
            ? 'fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl shadow-2xl p-6 transition-transform duration-300 max-h-[90vh] overflow-y-auto border-t-2 border-emerald-500 md:rounded-2xl md:border md:border-slate-100 md:p-8 md:max-w-4xl md:max-h-none'
            : 'fixed inset-x-0 bottom-0 z-40 bg-white rounded-t-2xl shadow-2xl p-4 border-t border-slate-100 md:relative md:bg-white md:rounded-2xl md:shadow-xl md:p-8 md:max-w-4xl md:border md:border-slate-100'
          }
        `}
      >
        {/* Mobile Collapsed State Preview Bar */}
        {!isMobileExpanded && (
          <div
            onClick={() => setIsMobileExpanded(true)}
            className="flex items-center justify-between cursor-pointer md:hidden"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg">📍</span>
              <div>
                <div className="text-xs text-slate-400 uppercase font-semibold">
                  {rentalType === 'self-drive' ? 'Self Drive Rental' : 'With Driver Taxi'}
                </div>
                <div className="text-sm font-bold text-slate-800">Where to? (Enter Route)</div>
              </div>
            </div>
            <button
              type="button"
              className="bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-2xl shadow-md"
            >
              Book Now
            </button>
          </div>
        )}

        {/* Full Form (Visible on Desktop OR when Mobile is Expanded) */}
        <div className={!isMobileExpanded ? 'hidden md:block' : 'block'}>
          {/* Mobile Sheet Drag Handle & Close Header */}
          <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4 md:hidden">
            <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto absolute left-1/2 -translate-x-1/2 top-3" />
            <span className="font-bold text-slate-800 text-base">Book Vehicle</span>
            <button
              onClick={() => setIsMobileExpanded(false)}
              className="text-slate-400 hover:text-slate-800 text-lg font-bold p-1"
            >
              ✕
            </button>
          </div>

          {/* Rental Mode Toggle: Self Drive | With Driver */}
          <div className="bg-slate-100 p-1.5 rounded-2xl flex gap-1 mb-6 border border-slate-200/80">
            <button
              type="button"
              onClick={() => setRentalType('with-driver')}
              className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 ${
                rentalType === 'with-driver'
                  ? 'bg-emerald-500 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>👨‍✈️</span> With Driver (Taxi)
            </button>
            <button
              type="button"
              onClick={() => setRentalType('self-drive')}
              className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 ${
                rentalType === 'self-drive'
                  ? 'bg-emerald-500 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>🚘</span> Self Drive (Rental)
            </button>
          </div>

          {/* Trip Type Tabs (Only shown for With Driver mode) */}
          {rentalType === 'with-driver' && (
            <TripTabs activeTab={tripType} onChange={setTripType} />
          )}

          {/* Location & Time Inputs */}
          <LocationInputs
            formData={formData}
            onChange={handleInputChange}
            errors={errors}
          />

          {/* Vehicle Category Selector */}
          <VehicleSelector
            selectedVehicleId={selectedVehicleId}
            onSelect={setSelectedVehicleId}
            rentalType={rentalType}
          />

          {/* Dynamic Fare Estimator */}
          <FareEstimator
            distanceKm={distanceKm}
            onDistanceChange={setDistanceKm}
            daysCount={daysCount}
            onDaysChange={setDaysCount}
            selectedVehicleId={selectedVehicleId}
            tripType={tripType}
            rentalType={rentalType}
          />

          {/* Action Button */}
          <button
            type="button"
            onClick={handleSubmit}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 px-6 rounded-2xl shadow-lg shadow-emerald-500/25 transition-all text-base sm:text-lg flex items-center justify-center gap-2 transform active:scale-[0.99]"
          >
            <span>⚡</span> {rentalType === 'self-drive' ? 'Get Self-Drive Estimate & Reserve' : 'Get Fare Estimate & Book Now'}
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        bookingData={{
          rentalType,
          tripType,
          ...formData,
          vehicleId: selectedVehicleId,
          distanceKm,
          daysCount,
        }}
      />
    </>
  );
});

export default BookingWidget;
