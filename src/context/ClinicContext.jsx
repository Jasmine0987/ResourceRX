import React, { createContext, useContext, useState, useCallback } from 'react';

const ClinicContext = createContext(null);

export function ClinicProvider({ children }) {
  const [clinic, setClinic] = useState(null);
  const [currentBooking, setCurrentBooking] = useState(null);
  const [bookingHistory, setBookingHistory] = useState([
    {
      id: "RRX-9920",
      asset: "Siemens Magnetom Vida 3T",
      assetType: "MRI",
      status: "ACTIVE SESSION",
      timeSlot: "09:00 AM - 05:00 PM",
      operator: "Dr. Aris Thorne",
      location: "Bay 4 - Radiology",
      progress: 65,
      price: 450,
      from: "Mayo Clinic Rochester",
      duration: "8 Hours",
    },
    {
      id: "RRX-9924",
      asset: "GE Revolution CT Scanner",
      assetType: "CT Scanner",
      status: "IN TRANSIT",
      timeSlot: "Tomorrow, 08:00 AM",
      operator: "Staff Assigned",
      location: "En Route from Central Hub",
      progress: 0,
      price: 320,
      from: "Houston Methodist",
      duration: "4 Hours",
    },
    {
      id: "RRX-9881",
      asset: "Fresenius 5008S Dialysis x2",
      assetType: "Dialysis",
      status: "PENDING SETUP",
      timeSlot: "Jan 15, 10:00 AM",
      operator: "Tech Support Req.",
      location: "Storage Wing A",
      progress: 0,
      price: 180,
      from: "Boston General",
      duration: "6 Hours",
    },
  ]);

  const [ownerAssets, setOwnerAssets] = useState([]);
  const [calibrationLog, setCalibrationLog] = useState([]);

  // ── Step 1: User picks equipment from search → create currentBooking shell ──
  const startBooking = useCallback((equipment) => {
    const id = `RRX-${Math.floor(Math.random() * 90000) + 10000}`;
    const newBooking = {
      id,
      asset: equipment.name,
      assetType: equipment.type,
      from: equipment.location,
      price: equipment.price,
      status: "PENDING BOOKING",
      timeSlot: null,
      operator: null,
      location: null,
      progress: 0,
      selectedDate: null,
      selectedTime: null,
      duration: null,
    };
    setCurrentBooking(newBooking);
    return id;
  }, []);

  // ── Step 2: User fills date/time/operator → merge details into booking ──────
  // KEY FIX: also upserts into bookingHistory so dashboard shows it immediately
  const confirmBookingDetails = useCallback((details) => {
    setCurrentBooking(prev => {
      if (!prev) return prev;
      const updated = { ...prev, ...details, status: "PENDING PAYMENT" };

      setBookingHistory(h => {
        const exists = h.some(b => b.id === updated.id);
        return exists
          ? h.map(b => b.id === updated.id ? updated : b)
          : [updated, ...h];
      });

      return updated;
    });
  }, []);

  // ── Step 3: Payment done → mark IN TRANSIT in both slices of state ──────────
  const completePayment = useCallback(() => {
    setCurrentBooking(prev => {
      if (!prev) return prev;
      const updated = { ...prev, status: "IN TRANSIT", progress: 0 };
      setBookingHistory(h => h.map(b => b.id === prev.id ? updated : b));
      return updated;
    });
  }, []);

  // ── Step 4: Feedback submitted → mark COMPLETED ──────────────────────────────
  // KEY FIX: do NOT null out currentBooking — ClinicCompletion still needs
  // price/duration/id after this is called to render the invoice summary.
  const completeBooking = useCallback((outcome) => {
    setCurrentBooking(prev => {
      if (!prev) return prev;
      const updated = { ...prev, status: "COMPLETED", outcome };
      setBookingHistory(h => {
        const exists = h.some(b => b.id === prev.id);
        return exists
          ? h.map(b => b.id === prev.id ? updated : b)
          : [updated, ...h];
      });
      return updated; // keep reference alive, don't set null
    });
  }, []);

  // ── Cancel from active tab ────────────────────────────────────────────────────
  const cancelBooking = useCallback((id) => {
    setBookingHistory(h => h.filter(b => b.id !== id));
    setCurrentBooking(prev => (prev?.id === id ? null : prev));
  }, []);
  const addOwnerAsset = useCallback((asset) => {
    const newAsset = {
      ...asset,
      id: `ASSET-${Math.floor(Math.random() * 90000) + 10000}`,
      listedAt: new Date().toLocaleDateString(),
    };
    setOwnerAssets(prev => [newAsset, ...prev]);
  }, []);

  const addCalibrationEntry = useCallback((entry) => {
    const newEntry = {
      ...entry,
      id: `CAL-${Math.floor(Math.random() * 90000) + 10000}`,
      timestamp: new Date().toLocaleDateString(),
    };
    setCalibrationLog(prev => [newEntry, ...prev]);
  }, []);

  return (
    <ClinicContext.Provider value={{
      clinic,
      setClinic,
      currentBooking,
      setCurrentBooking,
      bookingHistory,
      startBooking,
      confirmBookingDetails,
      completePayment,
      completeBooking,
      cancelBooking,
      ownerAssets, addOwnerAsset,          // ← new
      calibrationLog, addCalibrationEntry, // ← new
    }}>
      {children}
    </ClinicContext.Provider>
  );
}

export function useClinic() {
  const ctx = useContext(ClinicContext);
  if (!ctx) throw new Error('useClinic must be used within ClinicProvider');
  return ctx;
}