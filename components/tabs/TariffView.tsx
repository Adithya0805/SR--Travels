"use client";

import { siteConfig } from "@/config/siteConfig";

export default function TariffView() {
  return (
    <div className="w-full max-w-lg mx-auto pb-10 space-y-4 select-none animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl p-5 shadow-xl border border-slate-100 space-y-4">
        <div>
          <h2 className="text-base font-black text-slate-900">Standard Taxi Tariffs</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Transparent pricing for Tamil Nadu outstation &amp; local rentals
          </p>
        </div>

        {/* Vehicles Tariff Grid */}
        <div className="space-y-3">
          {siteConfig.vehicles.map((v) => (
            <div
              key={v.id}
              className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black text-slate-900">{v.name}</h3>
                  <span
                    className="inline-block px-2 py-0.5 rounded-full text-[9px] font-extrabold text-slate-900 mt-0.5"
                    style={{ backgroundColor: "#F5B700" }}
                  >
                    {v.seats} Seats Capacity
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-black text-emerald-600">₹{v.ratePerKm}/km</span>
                  <span className="text-[10px] text-slate-400 block">Pure real-distance billing</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 text-[11px] text-slate-600">
                <div>
                  <span className="font-bold text-slate-400 block text-[9px] uppercase">Self Drive Rental</span>
                  <span>₹{v.ratePerDay}/day ({v.kmCapPerDay} km cap)</span>
                </div>
                <div>
                  <span className="font-bold text-slate-400 block text-[9px] uppercase">Extra KM Rate</span>
                  <span>₹{v.extraKmRate}/km</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pricing Terms & Policies */}
        <div className="bg-slate-900 text-white rounded-2xl p-4 space-y-2.5 text-xs">
          <h4 className="font-black text-amber-400 uppercase tracking-wide text-[11px]">
            Pricing Guidelines &amp; Terms
          </h4>
          <ul className="space-y-1.5 text-[11px] text-slate-300 list-disc list-inside">
            <li>
              <strong className="text-white">No Minimum Distance:</strong> Pay only for the actual distance you travel — zero artificial distance floors.
            </li>
            <li>
              <strong className="text-white">One Way:</strong> Actual distance &times; rate/km + driver bata.
            </li>
            <li>
              <strong className="text-white">Round Trip:</strong> Actual round-trip distance &times; rate/km + driver bata.
            </li>
            <li>
              <strong className="text-white">Driver Bata:</strong> ₹{siteConfig.driverBataPerDay} per calendar day.
            </li>
            <li>
              <strong className="text-white">Tolls &amp; Parking:</strong> Extra as per actual receipts.
            </li>
            <li>
              <strong className="text-white">Cancellation:</strong> Zero cancellation fee before dispatch.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
