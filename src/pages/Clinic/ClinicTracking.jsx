import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Navigation, Activity, Truck, Zap,
  PackageCheck, MapPin, Phone,
  CheckCircle, Package, ChevronLeft
} from 'lucide-react';
import { useClinic } from '../../context/ClinicContext';
import { useWeather } from '../../hooks/useRealData';

const MILESTONES = [
  { id: 0, status: "Order Confirmed",  icon: CheckCircle  },
  { id: 1, status: "Asset Dispatched", icon: Package      },
  { id: 2, status: "In Transit",       icon: Truck        },
  { id: 3, status: "Site Calibration", icon: Zap          },
  { id: 4, status: "Operation Ready",  icon: PackageCheck },
];

// Realistic road distances and truck ETAs (~60 km/h avg incl. stops)
function getRouteForBooking(from) {
  const HYDERABAD = [17.3850, 78.4867];
  const routes = {
    "Mumbai":        { origin: [19.0760,  72.8777], dest: HYDERABAD,           distanceKm: 710,   etaHours: 12.5 },
    "Delhi":         { origin: [28.6139,  77.2090], dest: HYDERABAD,           distanceKm: 1570,  etaHours: 26.0 },
    "Bengaluru":     { origin: [12.9716,  77.5946], dest: HYDERABAD,           distanceKm: 570,   etaHours: 9.5  },
    "Chennai":       { origin: [13.0827,  80.2707], dest: HYDERABAD,           distanceKm: 630,   etaHours: 10.5 },
    "Kolkata":       { origin: [22.5726,  88.3639], dest: HYDERABAD,           distanceKm: 1500,  etaHours: 25.0 },
    "Pune":          { origin: [18.5204,  73.8567], dest: HYDERABAD,           distanceKm: 560,   etaHours: 9.5  },
    "Ahmedabad":     { origin: [23.0225,  72.5714], dest: HYDERABAD,           distanceKm: 1060,  etaHours: 17.5 },
    "Jaipur":        { origin: [26.9124,  75.7873], dest: HYDERABAD,           distanceKm: 1310,  etaHours: 22.0 },
    "Kochi":         { origin: [ 9.9312,  76.2673], dest: HYDERABAD,           distanceKm: 680,   etaHours: 11.5 },
    "Chandigarh":    { origin: [30.7333,  76.7794], dest: HYDERABAD,           distanceKm: 1780,  etaHours: 29.5 },
    "Lucknow":       { origin: [26.8467,  80.9462], dest: HYDERABAD,           distanceKm: 1390,  etaHours: 23.0 },
    "Rochester":     { origin: [44.0234, -92.4699], dest: HYDERABAD,           distanceKm: 13500, etaHours: 96.0 },
    "Berlin":        { origin: [52.5200,  13.4050], dest: [19.0760, 72.8777],  distanceKm: 6500,  etaHours: 72.0 },
    "Genoa":         { origin: [44.4056,   8.9463], dest: [19.0760, 72.8777],  distanceKm: 6200,  etaHours: 68.0 },
    "Suzhou":        { origin: [31.2983, 120.5832], dest: [19.0760, 72.8777],  distanceKm: 5800,  etaHours: 62.0 },
    "San Francisco": { origin: [37.7749,-122.4194], dest: [19.0760, 72.8777],  distanceKm: 14000, etaHours: 96.0 },
    "Shenzhen":      { origin: [22.5431, 114.0579], dest: [19.0760, 72.8777],  distanceKm: 4800,  etaHours: 52.0 },
    "Fargo":         { origin: [46.8772, -96.7898], dest: [19.0760, 72.8777],  distanceKm: 13500, etaHours: 96.0 },
    "Redmond":       { origin: [47.6740,-122.1215], dest: [19.0760, 72.8777],  distanceKm: 13800, etaHours: 96.0 },
    "Doral":         { origin: [25.8196, -80.3496], dest: [19.0760, 72.8777],  distanceKm: 14200, etaHours: 96.0 },
    "Raritan":       { origin: [40.5706, -74.6371], dest: [19.0760, 72.8777],  distanceKm: 12500, etaHours: 96.0 },
    "Singapore":     { origin: [ 1.3521, 103.8198], dest: [19.0760, 72.8777],  distanceKm: 3500,  etaHours: 40.0 },
    "Tokyo":         { origin: [35.6762, 139.6503], dest: [19.0760, 72.8777],  distanceKm: 6000,  etaHours: 65.0 },
    "Toronto":       { origin: [43.6532, -79.3832], dest: [19.0760, 72.8777],  distanceKm: 12800, etaHours: 96.0 },
    "Paris":         { origin: [48.8566,   2.3522], dest: [19.0760, 72.8777],  distanceKm: 6700,  etaHours: 72.0 },
    "New York":      { origin: [40.7128, -74.0060], dest: [19.0760, 72.8777],  distanceKm: 12400, etaHours: 96.0 },
    "Munich":        { origin: [48.1351,  11.5820], dest: [19.0760, 72.8777],  distanceKm: 6200,  etaHours: 68.0 },
    "Sydney":        { origin: [-33.8688,151.2093], dest: [19.0760, 72.8777],  distanceKm: 10200, etaHours: 80.0 },
    "Stockholm":     { origin: [59.3293,  18.0686], dest: [19.0760, 72.8777],  distanceKm: 7100,  etaHours: 75.0 },
    "Amsterdam":     { origin: [52.3676,   4.9041], dest: [19.0760, 72.8777],  distanceKm: 6500,  etaHours: 70.0 },
    "Chicago":       { origin: [41.8781, -87.6298], dest: [19.0760, 72.8777],  distanceKm: 13000, etaHours: 96.0 },
    "Hamburg":       { origin: [53.5753,  10.0153], dest: [19.0760, 72.8777],  distanceKm: 6600,  etaHours: 71.0 },
    "London":        { origin: [51.5074,  -0.1278], dest: [19.0760, 72.8777],  distanceKm: 6700,  etaHours: 72.0 },
    "Zurich":        { origin: [47.3769,   8.5417], dest: [19.0760, 72.8777],  distanceKm: 6400,  etaHours: 70.0 },
    "El Dorado":     { origin: [38.6835, -120.9884],dest: [19.0760, 72.8777],  distanceKm: 14100, etaHours: 96.0 },
  };
  for (const key of Object.keys(routes)) {
    if (from?.toLowerCase().includes(key.toLowerCase())) return routes[key];
  }
  return { origin: [19.0760, 72.8777], dest: HYDERABAD, distanceKm: 710, etaHours: 12.5 };
}

function formatEta(totalMinutes) {
  if (totalMinutes <= 0) return 'Arrived ✓';
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} hr`;
  return `${h}h ${m}m`;
}

const INITIAL_PROGRESS = 0.15;

export default function ClinicTracking() {
  const navigate = useNavigate();
  const { currentBooking, bookingHistory } = useClinic();

  const mapRef       = useRef(null);
  const leafletRef   = useRef(null);
  const truckRef     = useRef(null);
  const trailRef     = useRef(null);
  const initDone     = useRef(false);
  const animFrameRef = useRef(null);

  const activeBooking =
    (currentBooking && currentBooking.status !== 'COMPLETED')
      ? currentBooking
      : bookingHistory?.find(b => b.status === 'IN TRANSIT' || b.status === 'ACTIVE SESSION')
      || bookingHistory?.[0]
      || null;

  const asset     = activeBooking?.asset    || 'Siemens MRI 3T';
  const bookingId = activeBooking?.id       || 'RRX-9920';
  const from      = activeBooking?.from     || 'Mumbai';
  const operator  = activeBooking?.operator || 'Staff Assigned';
  const route     = getRouteForBooking(from);

  // ── Hooks BEFORE useState ──────────────────────────────────────────────────
  const midLat = (route.origin[0] + route.dest[0]) / 2;
  const midLng = (route.origin[1] + route.dest[1]) / 2;
  const { weather } = useWeather(midLat, midLng);

  const remainingMinutes = Math.round(route.etaHours * 60 * (1 - INITIAL_PROGRESS));

  const [milestoneIdx, setMilestoneIdx] = useState(2);
  const [etaMinutes,   setEtaMinutes]   = useState(remainingMinutes);
  const [velocity,     setVelocity]     = useState(58);
  const [progress,     setProgress]     = useState(INITIAL_PROGRESS);
  const [mapReady,     setMapReady]     = useState(false);

  // Sync weather ETA impact
  useEffect(() => {
    if (weather?.etaImpact) setEtaMinutes(e => e + weather.etaImpact);
  }, [weather]);

  // Countdown — 1 tick = 1 real minute = advances ETA by 1 min
  useEffect(() => {
    if (etaMinutes <= 0) return;
    const t = setInterval(() => {
      setEtaMinutes(e => Math.max(0, e - 1));
      setVelocity(v => Math.max(40, Math.min(85, v + (Math.random() > 0.5 ? 3 : -3))));
      setProgress(p => Math.min(0.97, p + (1 / (route.etaHours * 60))));
    }, 60000); // real 1-minute tick
    return () => clearInterval(t);
  }, [etaMinutes, route.etaHours]);

  useEffect(() => {
    if (etaMinutes <= 0 && milestoneIdx < 3) setMilestoneIdx(3);
  }, [etaMinutes, milestoneIdx]);

  useEffect(() => {
    if (etaMinutes <= 0 && milestoneIdx === 3) {
      const t = setTimeout(() => setMilestoneIdx(4), 3000);
      return () => clearTimeout(t);
    }
  }, [etaMinutes, milestoneIdx]);

  // Smooth truck animation with requestAnimationFrame
  useEffect(() => {
    if (!truckRef.current || !leafletRef.current) return;

    const targetLat = route.origin[0] + progress * (route.dest[0] - route.origin[0]);
    const targetLng = route.origin[1] + progress * (route.dest[1] - route.origin[1]);
    const currentPos = truckRef.current.getLatLng();
    const startLat = currentPos.lat;
    const startLng = currentPos.lng;
    const duration = 2500;
    const startTime = performance.now();

    const animate = (now) => {
      const t = Math.min((now - startTime) / duration, 1);
      const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      const lat = startLat + ease * (targetLat - startLat);
      const lng = startLng + ease * (targetLng - startLng);
      if (truckRef.current) truckRef.current.setLatLng([lat, lng]);
      // Update trail line
      if (trailRef.current) {
        trailRef.current.setLatLngs([route.origin, [lat, lng]]);
      }
      if (t < 1) animFrameRef.current = requestAnimationFrame(animate);
    };

    cancelAnimationFrame(animFrameRef.current);
    animFrameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [progress, route]);

  // Leaflet map init
  useEffect(() => {
    if (initDone.current) return;

    function initMap() {
      if (!mapRef.current) return;
      if (leafletRef.current) {
        leafletRef.current.remove();
        leafletRef.current = null;
        truckRef.current = null;
        trailRef.current = null;
      }
      initDone.current = true;
      const L = window.L;

      const map = L.map(mapRef.current, { center: [midLat, midLng], zoom: 5, zoomControl: true });
      leafletRef.current = map;

      L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
        { attribution: '© CartoDB, © OpenStreetMap contributors', maxZoom: 19 }
      ).addTo(map);

      // Full route (grey dashed)
      L.polyline([route.origin, route.dest], {
        color: '#94a3b8', weight: 3, dashArray: '8 5', opacity: 0.6,
      }).addTo(map);

      // Green trail — completed portion
      const startLat = route.origin[0] + INITIAL_PROGRESS * (route.dest[0] - route.origin[0]);
      const startLng = route.origin[1] + INITIAL_PROGRESS * (route.dest[1] - route.origin[1]);
      const trail = L.polyline([route.origin, [startLat, startLng]], {
        color: '#10b981', weight: 4, opacity: 0.8,
      }).addTo(map);
      trailRef.current = trail;

      // Origin marker
      L.circleMarker(route.origin, {
        radius: 9, fillColor: '#1d3557', fillOpacity: 1, color: 'white', weight: 3,
      }).addTo(map).bindPopup(`<strong>Origin</strong><br/>${from}`);

      // Destination marker (pulsing)
      const destIcon = L.divIcon({
        html: `<div style="position:relative;width:24px;height:24px;">
          <div style="position:absolute;inset:0;background:#10b981;border-radius:50%;opacity:0.3;animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></div>
          <div style="position:absolute;inset:4px;background:#10b981;border-radius:50%;border:2px solid white;"></div>
        </div>
        <style>@keyframes ping{75%,100%{transform:scale(2);opacity:0}}</style>`,
        className: '',
        iconAnchor: [12, 12],
      });
      L.marker(route.dest, { icon: destIcon }).addTo(map)
        .bindPopup('<strong>Your Clinic</strong><br/>Destination');

      // Truck marker
      const truckIcon = L.divIcon({
        html: `<div style="width:34px;height:34px;background:#457b9d;border-radius:50%;border:3px solid white;box-shadow:0 2px 14px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;">
                 <svg width="16" height="16" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                   <path d="M1 3h15v13H1z"/><path d="M16 7h3l3 3v6h-6V7z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
                 </svg>
               </div>`,
        className: '',
        iconAnchor: [17, 17],
      });

      const truck = L.marker([startLat, startLng], { icon: truckIcon }).addTo(map);
      truck.bindPopup(`<strong>${asset}</strong><br/>In Transit`);
      truckRef.current = truck;

      setMapReady(true);
    }

    if (!document.querySelector('link[href*="leaflet"]')) {
      const css = document.createElement('link');
      css.rel = 'stylesheet';
      css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(css);
    }
    if (!window.L) {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = initMap;
      document.head.appendChild(script);
    } else {
      initMap();
    }

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      if (leafletRef.current) {
        leafletRef.current.remove();
        leafletRef.current = null;
        truckRef.current = null;
        trailRef.current = null;
        initDone.current = false;
      }
    };
  // eslint-disable-next-line
  }, []);

  if (!activeBooking) {
    return (
      <div className="pt-40 px-6 max-w-4xl mx-auto text-center">
        <Package className="mx-auto opacity-20 mb-6" size={64} />
        <p className="font-black text-xl opacity-40">No active delivery to track</p>
        <p className="text-sm opacity-30 font-bold mt-2">Book equipment first, then track it here</p>
        <div className="flex gap-4 justify-center mt-6">
          <button onClick={() => navigate('/clinic/search')}
            className="bg-primary text-white px-8 py-4 rounded-2xl font-black text-sm hover:bg-secondary transition-all">
            Browse Equipment
          </button>
          <button onClick={() => navigate('/clinic/booking')}
            className="glass-panel px-8 py-4 rounded-2xl font-black text-sm hover:bg-white transition-all">
            My Bookings
          </button>
        </div>
      </div>
    );
  }

  const progressPercent = Math.round(progress * 100);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pt-36 pb-20 px-6 max-w-6xl mx-auto">

      <div className="mb-8 ml-4">
        <button onClick={() => navigate('/clinic')}
          className="flex items-center gap-2 text-[10px] font-black uppercase opacity-40 hover:opacity-100 mb-4 text-primary transition-opacity">
          <ChevronLeft size={14} /> Dashboard
        </button>
        <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-indigo-500/10 text-[10px] font-black uppercase mb-4 text-indigo-600">
          <Activity size={14} className="animate-pulse" /> Live Infrastructure Feed
        </div>
        <h2 className="text-5xl font-black tracking-tighter mb-2">Live Tracking</h2>
        <p className="text-gray-500 font-bold">{asset} · REF: {bookingId} · From: {from}</p>
        <p className="text-[10px] font-bold opacity-30 mt-1 uppercase tracking-widest">
          ~{route.distanceKm.toLocaleString('en-IN')} km road distance · {route.etaHours}h total transit
        </p>
      </div>

      {weather && (
        <div className={`mb-6 ml-4 inline-flex items-center gap-3 px-5 py-3 rounded-2xl text-sm font-black ${weather.affectsETA ? 'bg-amber-50 border border-amber-200 text-amber-800' : 'bg-white/40 text-primary'}`}>
          <span className="text-xl">{weather.emoji}</span>
          <span>{weather.condition} · {weather.temp}°C · Wind {weather.wind} km/h</span>
          {weather.affectsETA && (
            <span className="text-[10px] uppercase tracking-widest bg-amber-200 px-2 py-0.5 rounded-full">
              +{weather.etaImpact} min ETA impact
            </span>
          )}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">

          <div className="glass-panel rounded-[3.5rem] overflow-hidden relative" style={{ height: 420 }}>
            <div ref={mapRef} style={{ width: '100%', height: '100%' }} />

            {!mapReady && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-100/80 z-[500]">
                <div className="text-center">
                  <Activity size={32} className="text-primary animate-spin mx-auto mb-3" />
                  <p className="font-black text-xs uppercase opacity-40">Loading Live Map…</p>
                </div>
              </div>
            )}

            <div className="absolute bottom-4 left-4 z-[500] glass-panel bg-white/95 px-5 py-3 rounded-2xl shadow-xl pointer-events-none">
              <p className="text-[9px] font-black uppercase opacity-40">Velocity</p>
              <p className="text-xl font-black text-primary">
                {velocity} <span className="text-xs font-bold opacity-50">km/h</span>
              </p>
            </div>

            <div className={`absolute bottom-4 right-4 z-[500] px-5 py-3 rounded-2xl shadow-xl pointer-events-none ${etaMinutes <= 0 ? 'bg-emerald-500 text-white' : 'bg-primary text-white'}`}>
              <p className="text-[9px] font-black uppercase opacity-50">{etaMinutes <= 0 ? 'Arrived!' : 'ETA Remaining'}</p>
              <p className="text-xl font-black">{formatEta(etaMinutes)}</p>
            </div>
          </div>

          <div className="glass-panel rounded-[3rem] p-8">
            <h3 className="text-xs font-black uppercase opacity-40 tracking-widest mb-8">Deployment Timeline</h3>
            <div className="flex items-center gap-2">
              {MILESTONES.map((m, i) => (
                <React.Fragment key={i}>
                  <div className={`flex flex-col items-center text-center transition-all ${i <= milestoneIdx ? 'opacity-100' : 'opacity-20'}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-all ${
                      i < milestoneIdx  ? 'bg-emerald-500 text-white' :
                      i === milestoneIdx? 'bg-primary text-white animate-pulse' :
                      'bg-primary/10 text-primary'}`}>
                      <m.icon size={16} />
                    </div>
                    <p className="text-[8px] font-black uppercase text-center leading-tight max-w-[60px]">{m.status}</p>
                  </div>
                  {i < MILESTONES.length - 1 && (
                    <div className={`flex-1 h-0.5 transition-all ${i < milestoneIdx ? 'bg-emerald-400' : 'bg-primary/10'}`} />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="glass-panel rounded-[3rem] p-8 space-y-5">
            <h3 className="text-xs font-black uppercase opacity-40 tracking-widest">Shipment Info</h3>
            {[
              { icon: Package,    label: 'Equipment', val: asset     },
              { icon: MapPin,     label: 'From',       val: from      },
              { icon: Navigation, label: 'Booking ID', val: bookingId },
              { icon: Truck,      label: 'Operator',   val: operator  },
            ].map((row, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="w-9 h-9 bg-primary/5 rounded-2xl flex items-center justify-center shrink-0">
                  <row.icon size={16} className="text-primary opacity-40" />
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase opacity-30 mb-0.5">{row.label}</p>
                  <p className="text-sm font-black">{row.val}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="glass-panel rounded-[3rem] p-8 space-y-4">
            <h3 className="text-xs font-black uppercase opacity-40 tracking-widest">Delivery Progress</h3>
            <div className="h-2 bg-primary/5 rounded-full overflow-hidden">
              <motion.div
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 2.5, ease: 'easeInOut' }}
                className="h-full bg-secondary rounded-full"
              />
            </div>
            <div className="flex justify-between text-[9px] font-black uppercase opacity-40">
              <span>{from.split(',')[0]}</span>
              <span className="text-emerald-600 opacity-100">{progressPercent}% done</span>
              <span>Clinic</span>
            </div>
            <div className="p-5 bg-primary rounded-2xl text-white text-center">
              <p className="text-[9px] uppercase opacity-50 font-black">Estimated Arrival</p>
              <p className="text-3xl font-black">{formatEta(etaMinutes)}</p>
              <p className="text-[9px] uppercase opacity-40 font-black mt-1">
                ~{route.distanceKm.toLocaleString('en-IN')} km · {route.etaHours}h total
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <AnimatePresence>
              {milestoneIdx >= 4 ? (
                <motion.button
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => navigate('/clinic/completion')}
                  className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all shadow-xl">
                  <PackageCheck size={18} /> Acknowledge Arrival
                </motion.button>
              ) : (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={() => navigate('/clinic/completion')}
                  className="w-full glass-panel py-5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-white transition-all">
                  <PackageCheck size={18} /> Mark as Arrived Early
                </motion.button>
              )}
            </AnimatePresence>
            <button className="w-full glass-panel py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 opacity-60 hover:opacity-100 transition-all">
              <Phone size={14} /> Contact Driver
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}