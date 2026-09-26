import { useState } from 'react';
import fleetData from '../../data/fleet.json';
import { calculateFare } from '../../lib/fareCalculator';

export default function ConfirmationModal({
  isOpen,
  onClose,
  bookingData,
  onConfirmSuccess,
}) {
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen) return null;

  const selectedVehicle = fleetData.find((v) => v.id === bookingData.vehicleId) || fleetData[0];
  const numericDistance = Math.max(1, Number(bookingData.distanceKm) || 150);

  const fareResult = calculateFare({
    distanceKm: numericDistance,
    tripType: bookingData.tripType,
    ratePerKm: selectedVehicle.ratePerKm,
  });

  const handleConfirm = (e) => {
    e.preventDefault();

    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      setPhoneError('Please enter a valid 10-digit Indian mobile number (starting with 6-9)');
      return;
    }

    setPhoneError('');

    const finalBookingObject = {
      ...bookingData,
      phone,
      vehicleName: selectedVehicle.name,
      ratePerKm: selectedVehicle.ratePerKm,
      billableKm: fareResult.billableKm,
      driverBata: fareResult.driverBata,
      totalFare: fareResult.fare,
      bookedAt: new Date().toISOString(),
    };

    console.log('✅ TAXI BOOKING CONFIRMED OBJECT:', finalBookingObject);
    setIsSubmitted(true);

    if (onConfirmSuccess) {
      onConfirmSuccess(finalBookingObject);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white text-slate-900 rounded-2xl max-w-lg w-full p-6 md:p-8 shadow-2xl relative border border-slate-100 transform transition-all animate-in fade-in zoom-in-95">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 font-bold text-xl p-1"
          aria-label="Close dialog"
        >
          ✕
        </button>

        {!isSubmitted ? (
          <>
            {/* Title */}
            <div className="mb-4">
              <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                Booking Summary
              </span>
              <h2 className="text-2xl font-bold text-slate-900 mt-2">Confirm Your Taxi Ride</h2>
              <p className="text-slate-500 text-sm">Review journey details & fare estimate</p>
            </div>

            {/* Journey Details */}
            <div className="bg-slate-50 rounded-2xl p-4 mb-5 border border-slate-200 text-xs sm:text-sm space-y-2">
              <div className="flex justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500">Trip Type</span>
                <span className="font-semibold text-slate-900 capitalize">{bookingData.tripType === 'oneway' ? 'One Way' : 'Round Trip'}</span>
              </div>

              <div className="flex justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500">Pickup</span>
                <span className="font-semibold text-slate-900 text-right max-w-[200px] truncate">{bookingData.pickup}</span>
              </div>

              <div className="flex justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500">Drop</span>
                <span className="font-semibold text-slate-900 text-right max-w-[200px] truncate">{bookingData.drop}</span>
              </div>

              <div className="flex justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500">Date & Time</span>
                <span className="font-semibold text-slate-900 font-mono">{bookingData.date} at {bookingData.time}</span>
              </div>

              <div className="flex justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500">Vehicle</span>
                <span className="font-semibold text-slate-900">{selectedVehicle.name}</span>
              </div>

              {/* Fare Breakdown */}
              <div className="pt-2">
                <div className="flex justify-between text-slate-600">
                  <span>Billable Distance ({fareResult.billableKm} km @ ₹{selectedVehicle.ratePerKm}/km)</span>
                  <span className="font-mono font-medium">₹{(fareResult.billableKm * selectedVehicle.ratePerKm).toLocaleString('en-IN')}</span>
                </div>

                <div className="flex justify-between text-slate-600 mt-1">
                  <span>Driver Allowance</span>
                  <span className="font-mono font-medium">₹{fareResult.driverBata}</span>
                </div>

                <div className="flex justify-between text-base font-bold text-slate-900 mt-3 pt-2 border-t border-slate-300">
                  <span>Total Estimated Fare</span>
                  <span className="font-mono text-xl text-emerald-600">₹{fareResult.fare.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Customer Phone Form */}
            <form onSubmit={handleConfirm} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Mobile Phone Number *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3 text-slate-400 font-mono text-sm">+91</span>
                  <input
                    type="tel"
                    maxLength={10}
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value.replace(/\D/g, ''));
                      if (phoneError) setPhoneError('');
                    }}
                    placeholder="e.g. 9876543210"
                    required
                    className={`w-full pl-12 pr-4 py-3 rounded-2xl border text-sm font-mono font-medium text-slate-900 focus:outline-none focus:ring-2 transition-all ${
                      phoneError
                        ? 'border-red-500 focus:ring-red-300 bg-red-50/20'
                        : 'border-slate-300 focus:border-emerald-500 focus:ring-emerald-200'
                    }`}
                  />
                </div>
                {phoneError && (
                  <p className="text-red-500 text-xs mt-1 font-medium">{phoneError}</p>
                )}
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3.5 px-4 rounded-2xl shadow-lg shadow-emerald-500/20 transition-all text-base flex items-center justify-center gap-2"
              >
                <span>✅</span> Confirm Booking
              </button>
            </form>
          </>
        ) : (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 text-3xl rounded-full flex items-center justify-center mx-auto">
              ✓
            </div>
            <h3 className="text-2xl font-bold text-slate-900">Booking Confirmed!</h3>
            <p className="text-slate-600 text-sm max-w-xs mx-auto">
              Our 24/7 dispatch team is assigning your vehicle. You will receive SMS & WhatsApp confirmation shortly.
            </p>
            <button
              onClick={onClose}
              className="mt-4 bg-slate-900 text-white font-medium px-6 py-2.5 rounded-2xl text-sm hover:bg-slate-800 shadow-md"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
