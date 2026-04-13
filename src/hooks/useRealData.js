// src/hooks/useRealData.js
// Central hook — every portal imports from here
// Fetches: FDA equipment, live weather, live positions, currency rates

import { useState, useEffect, useCallback } from "react";

const BASE = "http://localhost:5000";

// Weather icon map (text codes from server -> emoji)
const WEATHER_ICONS = {
  "sunny": "☀️", "partly-cloudy": "⛅", "foggy": "🌫️",
  "rainy": "🌧️", "snowy": "🌨️", "showers": "🌦️", "stormy": "⛈️",
};

// ── 1. FDA Equipment ─────────────────────────────────────────────────────────
export function useEquipment(type = "MRI") {
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [source,  setSource]  = useState("");

  useEffect(() => {
    setLoading(true);
    fetch(BASE + "/api/equipment?type=" + encodeURIComponent(type) + "&limit=6")
      .then(r => r.json())
      .then(data => {
        setItems(data.items || []);
        setSource(data.source || "");
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [type]);

  return { items, loading, source };
}

// ── 2. All equipment types at once (for ClinicSearch) ────────────────────────
export function useAllEquipment() {
  const TYPES = ["MRI", "CT Scanner", "Dialysis", "Ventilator", "Defibrillator", "Surgical Robot", "Patient Monitor"];
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [source,  setSource]  = useState("");

  useEffect(() => {
    setLoading(true);
    Promise.all(
      TYPES.map(type =>
        fetch(BASE + "/api/equipment?type=" + encodeURIComponent(type) + "&limit=2")
          .then(r => r.json())
          .catch(() => ({ items: [] }))
      )
    ).then(results => {
      const all = results.flatMap((r, i) =>
        (r.items || []).map((item, j) => ({
          ...item,
          id: item.id || TYPES[i] + "-" + j,
        }))
      );
      setItems(all);
      setSource(results[0]?.source || "Curated Database");
      setLoading(false);
    });
  }, []);

  return { items, loading, source };
}

// ── 3. Live weather at a coordinate ─────────────────────────────────────────
export function useWeather(lat = 19.0760, lng = 72.8777) {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    fetch(BASE + "/api/weather?lat=" + lat + "&lng=" + lng)
      .then(r => r.json())
      .then(data => {
        setWeather({ ...data, emoji: WEATHER_ICONS[data.icon] || "🌤️" });
        setLoading(false);
      })
      .catch(() => {
        setWeather({ temp: 18, wind: 12, condition: "Clear", emoji: "☀️", affectsETA: false, etaImpact: 0 });
        setLoading(false);
      });
  }, [lat, lng]);

  useEffect(() => {
    refresh();
    // Refresh weather every 5 minutes
    const t = setInterval(refresh, 5 * 60 * 1000);
    return () => clearInterval(t);
  }, [refresh]);

  return { weather, loading, refresh };
}

// ── 4. Real-time unit positions (polls every 5 seconds) ─────────────────────
export function useLivePositions() {
  const [positions, setPositions] = useState({});
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    const poll = () => {
      fetch(BASE + "/api/positions")
        .then(r => r.json())
        .then(data => {
          setPositions(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    };
    poll();
    const t = setInterval(poll, 5000);
    return () => clearInterval(t);
  }, []);

  return { positions, loading };
}

// ── 5. Live currency rates ───────────────────────────────────────────────────
export function useCurrency(base = "USD") {
  const [rates,   setRates]   = useState({ USD: 1, EUR: 0.92, GBP: 0.79, JPY: 149.5, SGD: 1.34, CAD: 1.37, AUD: 1.53 });
  const [loading, setLoading] = useState(true);
  const [source,  setSource]  = useState("");

  useEffect(() => {
    fetch(BASE + "/api/currency?base=" + base)
      .then(r => r.json())
      .then(data => {
        if (data.rates) setRates(data.rates);
        setSource(data.source || "");
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [base]);

  const convert = useCallback((amountUSD, toCurrency) => {
    const rate = rates[toCurrency] || 1;
    return (amountUSD * rate).toFixed(2);
  }, [rates]);

  const format = useCallback((amountUSD, toCurrency) => {
    const symbols = { USD: "$", INR: "₹", EUR: "€", GBP: "£", JPY: "¥", SGD: "S$", CAD: "C$", AUD: "A$" };
    const symbol = symbols[toCurrency] || toCurrency + " ";
    return symbol + convert(amountUSD, toCurrency);
  }, [convert]);

  return { rates, loading, source, convert, format };
}

// ── 6. Real road route ───────────────────────────────────────────────────────
export function useRoute(startLat, startLng, endLat, endLng) {
  const [route,   setRoute]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!startLat || !endLat) return;
    fetch(BASE + "/api/route?startLat=" + startLat + "&startLng=" + startLng + "&endLat=" + endLat + "&endLng=" + endLng)
      .then(r => r.json())
      .then(data => {
        setRoute(data);
        setLoading(false);
      })
      .catch(() => {
        setRoute({
          coordinates: [[startLng, startLat], [endLng, endLat]],
          distance_km: 0,
          duration_min: 0,
          source: "fallback",
        });
        setLoading(false);
      });
  }, [startLat, startLng, endLat, endLng]);

  return { route, loading };
}