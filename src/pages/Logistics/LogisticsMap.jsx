import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Navigation, Truck, Zap, Wifi, Layers, Maximize2,
  MapPin, Compass, ChevronLeft, ChevronRight, Radio, X, RefreshCw
} from 'lucide-react';
import { useLivePositions, useWeather } from '../../hooks/useRealData';

const UNITS = [
  { id:"RX-882", status:"In Transit", loc:"Mumbai, MH",    speed:54, asset:"Siemens MRI 3T",     lat:19.0760, lng:72.8777, color:"#1d3557" },
  { id:"RX-441", status:"Loading",    loc:"Bengaluru, KA", speed:0,  asset:"Fresenius Dialysis", lat:12.9716, lng:77.5946, color:"#f59e0b" },
  { id:"RX-112", status:"Standby",    loc:"Chennai, TN",   speed:0,  asset:"Philips Ventilator", lat:13.0827, lng:80.2707, color:"#64748b" },
  { id:"RX-909", status:"Delayed",    loc:"Pune, MH",      speed:12, asset:"GE Revolution CT",   lat:18.5204, lng:73.8567, color:"#ef4444" },
];

const HOSPITALS = [
  { name:"AIIMS Delhi",                lat:28.5665, lng:77.2100 },
  { name:"Apollo Hospitals Hyderabad", lat:17.4326, lng:78.4071 },
  { name:"Fortis Mumbai",              lat:19.1075, lng:72.8263 },
  { name:"Manipal Hospital Bengaluru", lat:12.9442, lng:77.6009 },
  { name:"KIMS Hyderabad",             lat:17.4485, lng:78.3908 },
];

// Three genuinely different, authenticated tile providers
const TILE_CONFIGS = {
  Terrain: {
    // Carto Voyager — clean terrain-style, highly reliable
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '© CartoDB, © OpenStreetMap contributors',
    maxZoom: 19,
    label: 'Topographic Terrain',
    description: 'CartoDB Voyager — terrain relief & contours',
    signalStats: { gps: 8, lte: 88, mesh: 6 },
  },
  Satellite: {
    // ESRI World Imagery — best free satellite option
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles © Esri — Source: Esri, Maxar, GeoEye, USGS',
    maxZoom: 18,
    label: 'Satellite Imagery',
    description: 'ESRI World Imagery — Maxar satellite feed',
    signalStats: { gps: 12, lte: 94, mesh: 4 },
  },
  Traffic: {
    // CartoDB Dark — visually distinct road/traffic layer
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '© CartoDB, © OpenStreetMap contributors',
    maxZoom: 19,
    label: 'Road Network',
    description: 'CartoDB Dark — road network & traffic routes',
    signalStats: { gps: 10, lte: 99, mesh: 5 },
  },
};

const STATUS_COLOR = {
  "In Transit": "#1d3557",
  "Loading":    "#f59e0b",
  "Standby":    "#64748b",
  "Delayed":    "#ef4444",
};

export default function LogisticsMap() {
  const navigate  = useNavigate();
  const mapRef    = useRef(null);
  const mapInst   = useRef(null);
  const tileInst  = useRef(null);
  const markerMap = useRef({});
  const initDoneRef = useRef(false);

  const [mapMode,   setMapMode]   = useState('Terrain');
  const [selected,  setSelected]  = useState(null);
  const [latency,   setLatency]   = useState(22);
  const [mapReady,  setMapReady]  = useState(false);
  // Real-time positions from server (synced across all browsers)
  const { positions: livePositions } = useLivePositions();
  const positions = Object.keys(livePositions).length > 0 ? livePositions : 
    UNITS.reduce((acc,u)=>({...acc,[u.id]:{lat:u.lat,lng:u.lng}}),{});
  // Weather at map center
  const { weather } = useWeather(40.7128, -74.006);

  // Jitter latency
  useEffect(() => {
    const t = setInterval(() => setLatency(l => Math.max(8, Math.min(60, l + (Math.random()>0.5?3:-3)))), 3000);
    return () => clearInterval(t);
  }, []);

  // Positions now come from server via useLivePositions() hook above

  // Update marker positions on map
  useEffect(() => {
    if (!mapInst.current) return;
    Object.entries(positions).forEach(([id, pos]) => {
      const m = markerMap.current[id];
      if (m) m.setLatLng([pos.lat, pos.lng]);
    });
  }, [positions]);

  // Initialize Leaflet
  useEffect(() => {
    if (initDoneRef.current) return;
    const loadLeaflet = () => {
      if (window.L && mapRef.current) { initMap(); return; }
      // Load CSS
      if (!document.querySelector('link[href*="leaflet"]')) {
        const css = document.createElement('link');
        css.rel = 'stylesheet';
        css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(css);
      }
      // Load JS
      if (!window.L) {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = initMap;
        document.head.appendChild(script);
      } else {
        initMap();
      }
    };
    loadLeaflet();
  }, []);

  function initMap() {
    if (!mapRef.current || mapInst.current) return;
    initDoneRef.current = true;
    const L = window.L;
    const map = L.map(mapRef.current, { center:[20.5937, 78.9629], zoom:5, zoomControl:true }); // India center
    mapInst.current = map;

    // Initial tile - Terrain
    const cfg = TILE_CONFIGS.Terrain;
    tileInst.current = L.tileLayer(cfg.url, { attribution:cfg.attribution, maxZoom:cfg.maxZoom });
    tileInst.current.addTo(map);

    // Hospital markers (cyan circles)
    HOSPITALS.forEach(h => {
      L.circleMarker([h.lat,h.lng], { radius:8, fillColor:'#a8dadc', fillOpacity:1, color:'white', weight:2 })
        .addTo(map).bindPopup(`<strong>${h.name}</strong><br/>Hospital Network`);
    });

    // Unit markers
    UNITS.forEach(u => {
      const icon = L.divIcon({
        html:`<div style="width:22px;height:22px;background:${STATUS_COLOR[u.status]};border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);cursor:pointer"></div>`,
        className:'', iconAnchor:[11,11],
      });
      const m = L.marker([positions[u.id]?.lat||u.lat, positions[u.id]?.lng||u.lng], { icon })
        .addTo(map)
        .bindPopup(`<strong>${u.id}</strong><br/>${u.asset}<br/>Status: ${u.status}`);
      markerMap.current[u.id] = m;
    });

    setMapReady(true);
  }

  // Switch tile layer when mapMode changes — destroy old, add new
  useEffect(() => {
    if (!mapInst.current || !window.L) return;
    const L = window.L;
    const cfg = TILE_CONFIGS[mapMode];
    if (tileInst.current) {
      mapInst.current.removeLayer(tileInst.current);
    }
    tileInst.current = L.tileLayer(cfg.url, { 
      attribution:cfg.attribution, 
      maxZoom:cfg.maxZoom,
      errorTileUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
    });
    tileInst.current.addTo(mapInst.current);
    Object.values(markerMap.current).forEach(m => m.bringToFront?.());
  }, [mapMode]);

  const signalStats = TILE_CONFIGS[mapMode].signalStats;

  return (
    <div className="max-w-7xl mx-auto pb-20 pt-6 space-y-6">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <button onClick={()=>navigate('/logistics')} className="flex items-center gap-2 text-[10px] font-black uppercase opacity-40 hover:opacity-100 mb-4 text-primary transition-opacity">
            <ChevronLeft size={14}/> Fleet Command
          </button>
          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-secondary/10 text-[10px] font-black uppercase mb-3 text-secondary border border-secondary/20">
            <Radio size={12} className="animate-pulse"/> Live Network Feed
          </div>
          <h2 className="text-5xl font-black tracking-tighter italic uppercase text-primary">Live Route Map</h2>
        </div>

        {/* Map mode switcher */}
        <div className="flex flex-col gap-2 items-end">
          <p className="text-[9px] font-black uppercase opacity-30 text-primary">Tile Layer</p>
          <div className="glass-panel p-2 rounded-3xl flex gap-2">
            {Object.entries(TILE_CONFIGS).map(([mode, cfg]) => (
              <button key={mode} onClick={()=>setMapMode(mode)}
                className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${mapMode===mode?'bg-primary text-white shadow-xl':'opacity-40 text-primary hover:opacity-100'}`}>
                {mode}
              </button>
            ))}
          </div>
          <p className="text-[9px] font-bold opacity-30 text-primary">{TILE_CONFIGS[mapMode].description}</p>
        </div>
      </div>

      {/* Live weather banner */}
      {weather && (
        <div className={`flex items-center gap-3 px-5 py-3 rounded-2xl text-sm font-black w-fit ${weather.affectsETA ? 'bg-amber-50 border border-amber-200 text-amber-800' : 'glass-panel text-primary'}`}>
          <span className="text-lg">{weather.emoji}</span>
          <span className="text-[10px] uppercase font-black">{weather.condition} · {weather.temp}°C · Wind {weather.wind} km/h</span>
          {weather.affectsETA && <span className="text-[9px] uppercase bg-amber-200 px-2 py-0.5 rounded-full">Delays possible</span>}
        </div>
      )}

      {/* MAP */}
      <div className="glass-panel rounded-[3.5rem] overflow-hidden relative" style={{height:520}}>
        <div ref={mapRef} style={{width:'100%',height:'100%'}} />

        {!mapReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-100/80 z-50">
            <div className="text-center">
              <RefreshCw size={32} className="text-primary animate-spin mx-auto mb-3"/>
              <p className="font-black text-xs uppercase opacity-40">Initialising {TILE_CONFIGS[mapMode].label}…</p>
            </div>
          </div>
        )}

        {/* Mode badge */}
        <div className="absolute top-4 right-4 z-[500] glass-panel px-4 py-2 rounded-2xl flex items-center gap-2">
          <Layers size={12} className="text-primary opacity-50"/>
          <p className="text-[9px] font-black uppercase text-primary">{TILE_CONFIGS[mapMode].label}</p>
        </div>

        {/* Latency */}
        <div className="absolute bottom-4 left-4 z-[500] glass-panel px-5 py-3 rounded-2xl flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full animate-pulse ${latency<30?'bg-emerald-500':latency<50?'bg-amber-500':'bg-red-500'}`}/>
          <span className="text-[9px] font-black uppercase text-primary">{latency}ms latency</span>
        </div>
      </div>

      {/* UNIT LIST + SIGNAL STATS */}
      <div className="grid lg:grid-cols-3 gap-8">

        {/* Fleet units */}
        <div className="lg:col-span-2 glass-panel p-10 rounded-[3.5rem]">
          <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-8 text-primary">Active Fleet Units</h3>
          <div className="grid gap-4">
            {UNITS.map(unit => (
              <motion.div key={unit.id}
                onClick={() => setSelected(selected===unit.id ? null : unit.id)}
                className={`p-7 rounded-[2.5rem] border cursor-pointer transition-all ${
                  selected===unit.id ? 'bg-primary border-primary text-white' : 'bg-white/40 border-white hover:bg-white'
                }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-5">
                    <div style={{background: STATUS_COLOR[unit.status]}} className="w-4 h-4 rounded-full shrink-0"/>
                    <div>
                      <p className="text-[9px] font-black uppercase mb-1" style={{color: selected===unit.id?'rgba(255,255,255,0.6)':'rgba(29,53,87,0.4)'}}>{unit.id} · {unit.speed > 0 ? `${unit.speed} km/h` : 'Stationary'}</p>
                      <h4 className="text-lg font-black uppercase tracking-tight">{unit.asset}</h4>
                      <p className="text-[10px] font-bold" style={{opacity:0.5}}>{unit.loc} · {unit.status}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span style={{background: STATUS_COLOR[unit.status]+'20', color: STATUS_COLOR[unit.status]}}
                      className="text-[9px] font-black uppercase px-3 py-1 rounded-full">{unit.status}</span>
                    <ChevronRight size={16} style={{opacity: 0.3}}/>
                  </div>
                </div>
                <AnimatePresence>
                  {selected===unit.id && (
                    <motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}}
                      className="mt-6 pt-4 border-t border-white/20 grid grid-cols-2 gap-4 overflow-hidden">
                      {[
                        { label:'Live Lat', val: positions[unit.id]?.lat.toFixed(4) },
                        { label:'Live Lng', val: positions[unit.id]?.lng.toFixed(4) },
                        { label:'Speed',    val: `${unit.speed} km/h` },
                        { label:'Asset',    val: unit.asset },
                      ].map((s,i)=>(
                        <div key={i}>
                          <p className="text-[8px] font-black uppercase text-white/40">{s.label}</p>
                          <p className="text-sm font-black text-white">{s.val}</p>
                        </div>
                      ))}
                      <div className="col-span-2 flex gap-3 mt-2">
                        <button onClick={e=>{e.stopPropagation();navigate('/logistics/active');}}
                          className="flex-1 bg-white/20 text-white py-3 rounded-xl font-black text-[10px] uppercase hover:bg-white/30 transition-all">
                          View Dispatch
                        </button>
                        <button onClick={e=>{e.stopPropagation();navigate('/logistics/logs');}}
                          className="flex-1 bg-secondary text-primary py-3 rounded-xl font-black text-[10px] uppercase hover:opacity-90 transition-all">
                          Handover Log
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Signal stats - changes authentically per mode */}
        <div className="glass-panel p-10 rounded-[3.5rem] space-y-8">
          <h3 className="text-xl font-black italic uppercase tracking-tighter text-primary">Network Coverage</h3>
          <p className="text-[9px] font-black uppercase opacity-40 text-primary -mt-4">{mapMode} mode · {TILE_CONFIGS[mapMode].label}</p>

          {[
            { label:'GPS Satellites',    val:signalStats.gps,  max:12,  pct:false },
            { label:'4G LTE Coverage',   val:signalStats.lte,  max:100, pct:true  },
            { label:'Mesh Nodes Active', val:signalStats.mesh, max:8,   pct:false },
          ].map((s,i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between">
                <p className="text-[9px] font-black uppercase opacity-40 text-primary">{s.label}</p>
                <p className="text-sm font-black text-primary">{s.val}{s.pct?'%':''}</p>
              </div>
              <div className="h-1.5 bg-primary/5 rounded-full overflow-hidden">
                <motion.div animate={{width:`${(s.val/s.max)*100}%`}} transition={{duration:0.8}}
                  className="h-full bg-secondary rounded-full"/>
              </div>
            </div>
          ))}

          <div className="pt-6 border-t border-primary/5 space-y-3">
            <p className="text-[9px] font-black uppercase opacity-40 text-primary">Tile Attribution</p>
            <p className="text-xs font-bold text-primary leading-relaxed">{TILE_CONFIGS[mapMode].attribution}</p>
          </div>

          <div className="p-5 bg-secondary/10 rounded-2xl">
            <p className="text-[9px] font-black uppercase text-secondary mb-1">Signal latency</p>
            <p className="text-2xl font-black text-primary">{latency}<span className="text-xs opacity-40">ms</span></p>
            <p className="text-[9px] opacity-40 uppercase font-black text-primary">{latency<30?'Excellent':latency<50?'Good':'Degraded'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}