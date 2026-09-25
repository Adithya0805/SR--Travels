import { useState, forwardRef, useImperativeHandle } from 'react';
import TripTabs from './TripTabs';
import LocationInputs from './LocationInputs';
import VehicleSelector from './VehicleSelector';
import FareEstimator from './FareEstimator';
import ConfirmationModal from './ConfirmationModal';
import fleetData from '../../data/fleet.json';

const BookingWidget = forwardRef(function BookingWidget(props, ref) {
  const today = new Date().toISOString().split('T')[0];

  const [tripType, setTripType] = useState('oneway');
  const [formData, setFormData] = useState({
    pickup: 'Ambur',
    drop: 'Chennai',
    date: today,
    time: '08:00',
  });
  const [selectedVehicleId, setSelectedVehicleId] = useState(fleetData[0].id);
  const [distanceKm, setDistanceKm] = useState('180');
  const [errors, setErrors] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Expose pre-fill method to parent component
  useImperativeHandle(ref, () => ({
    prefillRoute({ from, to, distance }) {
      setFormData((prev) => ({
        ...prev,
        pickup: from || prev.pickup,
        drop: to || prev.drop,
      }));
      if (distance) {
        setDistanceKm(String(distance));
      }
      setErrors({});
    },
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
      newErrors.pickup = 'Pickup city/address must be at least 3 characters.';
    }

    if (!formData.drop || formData.drop.trim().length < 3) {
      newErrors.drop = 'Drop city/address must be at least 3 characters.';
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
    <div id="booking-widget" className="container mx-auto px-4 relative z-20 -mt-16 md:-mt-20">
      <div className="bg-white text-dark rounded-2xl shadow-xl p-5 sm:p-8 border border-slate-100 max-w-4xl mx-auto">
        {/* Trip Type Tabs */}
        <TripTabs activeTab={tripType} onChange={setTripType} />

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
        />

        {/* Dynamic Fare Estimator */}
        <FareEstimator
          distanceKm={distanceKm}
          onDistanceChange={setDistanceKm}
          selectedVehicleId={selectedVehicleId}
          tripType={tripType}
        />

        {/* Action Button */}
        <button
          type="button"
          onClick={handleSubmit}
          className="w-full bg-accent hover:bg-amber-400 text-dark font-bold py-4 px-6 rounded-xl shadow-lg transition-all text-base sm:text-lg flex items-center justify-center gap-2 transform active:scale-[0.99]"
        >
          <span>⚡</span> Get Fare Estimate & Book Now
        </button>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        bookingData={{
          tripType,
          ...formData,
          vehicleId: selectedVehicleId,
          distanceKm,
        }}
      />
    </div>
  );
});

export default BookingWidget;
