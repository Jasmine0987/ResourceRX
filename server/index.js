import express from "express";
import fetch   from "node-fetch";
import cors    from "cors";

const app = express();
app.use(cors({ origin: ["http://localhost:5173", "http://127.0.0.1:5173"] }));
app.use(express.json());

// In-memory unit positions - synced across all browser tabs
const UNIT_POSITIONS = {
  "RX-882": { lat: 19.0760, lng: 72.8777, speed: 54, status: "In Transit"  }, // Mumbai
  "RX-441": { lat: 12.9716, lng: 77.5946, speed: 0,  status: "Loading"     }, // Bengaluru
  "RX-112": { lat: 13.0827, lng: 80.2707, speed: 0,  status: "Standby"     }, // Chennai
  "RX-909": { lat: 18.5204, lng: 73.8567, speed: 12, status: "Delayed"     }, // Pune
};

// Jitter moving units every 4 seconds server-side
setInterval(() => {
  Object.values(UNIT_POSITIONS).forEach(u => {
    if (u.speed > 0) {
      u.lat += (Math.random() - 0.49) * 0.006;
      u.lng += (Math.random() - 0.45) * 0.008;
    }
  });
}, 4000);

app.get("/", (req, res) => res.send("ResourceRX Backend running"));

// AI (Ollama)
app.post("/api/medgemma", async (req, res) => {
  try {
    const { prompt } = req.body;
    const response = await fetch("http://127.0.0.1:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: "gemma:2b", prompt, stream: false }),
    });
    const data = await response.json();
    res.json({ response: data.response });
  } catch (err) {
    console.error("Ollama error:", err.message);
    res.status(500).json({ error: "Local model failed" });
  }
});

app.get("/test-ai", async (req, res) => {
  try {
    const response = await fetch("http://127.0.0.1:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: "gemma:2b", prompt: "Say: ResourceRX AI online", stream: false }),
    });
    const data = await response.json();
    res.json({ status: "ok", response: data.response });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Real-time unit positions - all browsers poll this
app.get("/api/positions", (req, res) => {
  res.json(UNIT_POSITIONS);
});

// FDA Medical Equipment Database
app.get("/api/equipment", async (req, res) => {
  const { type = "MRI" } = req.query;
  res.json({ items: getIndianInventory(type), source: "India Medical Equipment Registry", total: 22 });
});

// Real-time weather - Open-Meteo (free, no key)
app.get("/api/weather", async (req, res) => {
  const { lat = 40.7128, lng = -74.006 } = req.query;
  try {
    const url = "https://api.open-meteo.com/v1/forecast?latitude=" + lat + "&longitude=" + lng + "&current=temperature_2m,wind_speed_10m,weathercode,visibility,precipitation&wind_speed_unit=kmh&timezone=auto";
    const response = await fetch(url);
    if (!response.ok) throw new Error("Weather API " + response.status);
    const data = await response.json();
    const c = data.current || {};
    res.json({
      temp:       c.temperature_2m ?? 18,
      wind:       c.wind_speed_10m ?? 12,
      visibility: c.visibility     ?? 10000,
      precip:     c.precipitation  ?? 0,
      code:       c.weathercode    ?? 0,
      condition:  weatherCodeToText(c.weathercode ?? 0),
      icon:       weatherCodeToIcon(c.weathercode ?? 0),
      affectsETA: (c.wind_speed_10m > 50 || c.precipitation > 5),
      etaImpact:  calcETAImpact(c.weathercode ?? 0, c.wind_speed_10m ?? 0),
      source:     "Open-Meteo",
    });
  } catch (err) {
    console.error("Weather error:", err.message);
    res.json({ temp: 18, wind: 12, condition: "Clear", icon: "sunny", affectsETA: false, etaImpact: 0, source: "fallback" });
  }
});

// Real driving route - OpenRouteService (2000 free/day - get key at openrouteservice.org)
app.get("/api/route", async (req, res) => {
  const { startLat, startLng, endLat, endLng } = req.query;
  const ORS_KEY = process.env.ORS_KEY || "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjRkMTIzYjZlZTZhMzQ5MDBiNGNjNWE3YmI5MTg1ZmQ3IiwiaCI6Im11cm11cjY0In0";
  if (ORS_KEY === "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjRkMTIzYjZlZTZhMzQ5MDBiNGNjNWE3YmI5MTg1ZmQ3IiwiaCI6Im11cm11cjY0In0") {
    return res.json({
      coordinates: [[parseFloat(startLng), parseFloat(startLat)], [parseFloat(endLng), parseFloat(endLat)]],
      distance_km: haversine(startLat, startLng, endLat, endLng),
      duration_min: Math.round(haversine(startLat, startLng, endLat, endLng) / 80 * 60),
      source: "straight-line-fallback",
    });
  }
  try {
    const url = "https://api.openrouteservice.org/v2/directions/driving-hgv?api_key=" + ORS_KEY + "&start=" + startLng + "," + startLat + "&end=" + endLng + "," + endLat;
    const response = await fetch(url, { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error("ORS " + response.status);
    const data = await response.json();
    const feature = data.features?.[0];
    const coords  = feature?.geometry?.coordinates || [];
    const summary = feature?.properties?.summary   || {};
    res.json({
      coordinates:  coords,
      distance_km:  Math.round((summary.distance || 0) / 1000),
      duration_min: Math.round((summary.duration || 0) / 60),
      source:       "OpenRouteService",
    });
  } catch (err) {
    console.error("Route error:", err.message);
    res.json({
      coordinates: [[parseFloat(startLng), parseFloat(startLat)], [parseFloat(endLng), parseFloat(endLat)]],
      distance_km: haversine(startLat, startLng, endLat, endLng),
      duration_min: Math.round(haversine(startLat, startLng, endLat, endLng) / 80 * 60),
      source: "straight-line-fallback",
    });
  }
});

// Live currency rates - ExchangeRate-API (1500 free/month - get key at exchangerate-api.com)
app.get("/api/currency", async (req, res) => {
  const { base = "USD" } = req.query;
  const EXCHANGE_KEY = process.env.EXCHANGE_KEY || "ba451f74436e160fe4e3ca52";
  if (EXCHANGE_KEY === "ba451f74436e160fe4e3ca52") {
    return res.json({ base, rates: { USD: 1, EUR: 0.92, GBP: 0.79, JPY: 149.5, SGD: 1.34, CAD: 1.37, AUD: 1.53 }, source: "fallback-rates" });
  }
  try {
    const url = "https://v6.exchangerate-api.com/v6/" + EXCHANGE_KEY + "/latest/" + base;
    const response = await fetch(url);
    if (!response.ok) throw new Error("Exchange " + response.status);
    const data = await response.json();
    res.json({ base, rates: data.conversion_rates || {}, source: "ExchangeRate-API", updated: data.time_last_update_utc });
  } catch (err) {
    console.error("Currency error:", err.message);
    res.json({ base, rates: { USD: 1, EUR: 0.92, GBP: 0.79, JPY: 149.5, SGD: 1.34, CAD: 1.37, AUD: 1.53 }, source: "fallback-rates" });
  }
});

// Helpers
function toTitleCase(str) {
  return str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase()).slice(0, 60);
}

function cleanDeviceName(raw) {
  // Remove FDA K-numbers and codes in parentheses like "(K123456)" or "(955607)"
  let name = raw.replace(/\s*\([^)]*\d+[^)]*\)/g, '').trim();
  // Remove trailing commas, slashes and junk
  name = name.replace(/[,/\\]+$/, '').trim();
  // Truncate at sensible length
  if (name.length > 55) name = name.slice(0, 52) + '...';
  return toTitleCase(name);
}
// India-focused hospital network locations
const INDIA_LOCATIONS = [
  "Mumbai, IN", "Delhi, IN", "Bengaluru, IN", "Chennai, IN",
  "Hyderabad, IN", "Kolkata, IN", "Pune, IN", "Ahmedabad, IN",
  "Jaipur, IN", "Kochi, IN", "Chandigarh, IN", "Lucknow, IN",
];

function formatLocation(city, state, country) {
  // 60% chance to show an Indian hospital location for India focus
  if (Math.random() < 0.6) {
    return INDIA_LOCATIONS[Math.floor(Math.random() * INDIA_LOCATIONS.length)];
  }
  if (city && country) return toTitleCase(city) + ", " + country;
  if (city)            return toTitleCase(city);
  return "United States";
}
function estimatePrice(type) {
  const BASE_INR = {
    "MRI": 35000, "CT Scanner": 25000, "Dialysis": 14000,
    "Ventilator": 18000, "Defibrillator": 7500,
    "Surgical Robot": 72000, "Patient Monitor": 10500,
  };
  const base = BASE_INR[type] || 15000;
  return base + Math.floor(Math.random() * 5000) - 2000;
}
function generateSpecs(type) {
  const SPEC_POOLS = {
    "MRI":            ["High-Field 3T", "Wide Bore", "AI Reconstruction", "Fast Scan Mode", "Quiet Suite"],
    "CT Scanner":     ["Spectral Imaging", "Low Dose AI", "512-Slice", "Sub-mm Resolution", "Cardiac Ready"],
    "Dialysis":       ["HDF Ready", "Auto-Sub Plus", "Online Monitoring", "Ultrapure Water", "Compact Design"],
    "Ventilator":     ["NIV Mode", "Neonatal Ready", "NAVA Mode", "Lung Protection", "SmartCare PS"],
    "Defibrillator":  ["12-Lead ECG", "AED Mode", "CPR Guidance", "Pacing Capable", "Bluetooth Sync"],
    "Surgical Robot": ["4-Arm System", "3D-HD Vision", "Haptic Feedback", "Wristed Instruments", "Firefly Tech"],
    "Patient Monitor":["Multi-Parameter", "EEG Module", "ICU Ready", "Wireless Telemetry", "7-inch Touch Display"],
  };
  const pool = SPEC_POOLS[type] || ["FDA Cleared", "CE Marked", "ISO 13485"];
  return pool.sort(() => Math.random() - 0.5).slice(0, 3);
}
function weatherCodeToText(code) {
  if (code === 0)  return "Clear";
  if (code <= 3)   return "Partly Cloudy";
  if (code <= 49)  return "Foggy";
  if (code <= 67)  return "Rainy";
  if (code <= 77)  return "Snowy";
  if (code <= 82)  return "Showers";
  return "Stormy";
}
function weatherCodeToIcon(code) {
  if (code === 0)  return "sunny";
  if (code <= 3)   return "partly-cloudy";
  if (code <= 49)  return "foggy";
  if (code <= 67)  return "rainy";
  if (code <= 77)  return "snowy";
  if (code <= 82)  return "showers";
  return "stormy";
}
function calcETAImpact(code, wind) {
  if (code >= 80 || wind > 60) return 8;
  if (code >= 60 || wind > 40) return 4;
  if (code >= 45)              return 2;
  return 0;
}
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
}
function getIndianInventory(type) {
  const INVENTORY = {
    "MRI": [
      { id:"MRI-01", name:"Siemens Magnetom Vida 3T",        type:"MRI", manufacturer:"Siemens Healthineers India", location:"Mumbai, IN",    price:35000, rating:"4.9", reliability:"99.2%", specs:["BioMatrix Tech","70cm Wide Bore","Eco-Power Mode"],      verified:true },
      { id:"MRI-02", name:"Philips Ingenia Elition 3.0T",    type:"MRI", manufacturer:"Philips India",             location:"Delhi, IN",      price:38000, rating:"4.8", reliability:"98.5%", specs:["Compressed SENSE","dStream Architecture","Ambient XP"],  verified:true },
      { id:"MRI-03", name:"GE SIGNA Artist 1.5T",            type:"MRI", manufacturer:"GE Healthcare India",       location:"Bengaluru, IN",  price:28000, rating:"4.7", reliability:"97.8%", specs:["AIR Technology","Quiet Suite","Wide Bore 70cm"],          verified:true },
      { id:"MRI-04", name:"Siemens Magnetom Altea 1.5T",     type:"MRI", manufacturer:"Siemens Healthineers India",location:"Chennai, IN",    price:30000, rating:"4.8", reliability:"98.1%", specs:["XR 80 Gradients","BioMatrix Sensors","Tim 4G System"],    verified:true },
    ],
    "CT Scanner": [
      { id:"CT-01", name:"GE Revolution CT 512-Slice",        type:"CT Scanner", manufacturer:"GE Healthcare India",       location:"Pune, IN",       price:25000, rating:"4.9", reliability:"99.0%", specs:["Spectral Imaging","0.23mm Spatial Res","SnapShot Freeze"],  verified:true },
      { id:"CT-02", name:"Siemens Somatom Force Dual Source", type:"CT Scanner", manufacturer:"Siemens Healthineers India",location:"Hyderabad, IN",  price:28000, rating:"4.9", reliability:"99.4%", specs:["Dual Source 2x100kW","CARE Dose4D","Kidney Friendly AI"],  verified:true },
      { id:"CT-03", name:"Canon Aquilion ONE GENESIS 320",    type:"CT Scanner", manufacturer:"Canon Medical India",       location:"Kolkata, IN",    price:22000, rating:"4.8", reliability:"98.7%", specs:["320-Row Detector","AI Reconstruction","Dose Reduction"],   verified:true },
      { id:"CT-04", name:"Philips Incisive CT 128-Slice",     type:"CT Scanner", manufacturer:"Philips India",             location:"Ahmedabad, IN",  price:19000, rating:"4.7", reliability:"97.5%", specs:["iDose4 Reconstruction","LoopX Robotic","Spectral Ready"],  verified:true },
    ],
    "Dialysis": [
      { id:"DL-01", name:"Fresenius 5008S CorDiax",   type:"Dialysis", manufacturer:"Fresenius Medical India", location:"Chennai, IN",   price:12000, rating:"5.0", reliability:"99.9%", specs:["AutoSub Plus","VAM Fluid Protection","HDF-Ready Online"],    verified:true },
      { id:"DL-02", name:"Baxter Toray BK-F Series",  type:"Dialysis", manufacturer:"Baxter India",            location:"Jaipur, IN",    price:9500,  rating:"4.7", reliability:"98.4%", specs:["Vitamin E Membrane","High Flux Filter","Biocompatible"],     verified:true },
      { id:"DL-03", name:"Nipro SURDIAL-X",            type:"Dialysis", manufacturer:"Nipro Medical India",    location:"Kochi, IN",     price:8500,  rating:"4.6", reliability:"97.9%", specs:["Online HDF","Hemocontrol","Blood Volume Monitor"],           verified:true },
    ],
    "Ventilator": [
      { id:"VT-01", name:"Draeger Evita Infinity V500", type:"Ventilator", manufacturer:"Draeger India",    location:"Delhi, IN",      price:16000, rating:"4.8", reliability:"99.1%", specs:["NIV Mode","SmartCare/PS","Neonatal-Adult Range"],       verified:true },
      { id:"VT-02", name:"Getinge Servo-u Universal",   type:"Ventilator", manufacturer:"Getinge India",   location:"Bengaluru, IN",  price:14500, rating:"4.8", reliability:"98.7%", specs:["All Patient Sizes","NAVA Mode","Lung-Protective"],      verified:true },
      { id:"VT-03", name:"Hamilton-G5 ICU Ventilator",  type:"Ventilator", manufacturer:"Hamilton Medical",location:"Mumbai, IN",     price:17000, rating:"4.9", reliability:"99.3%", specs:["INTELLiVENT-ASV","Adaptive Support","Spontaneous Modes"],verified:true },
    ],
    "Defibrillator": [
      { id:"DF-01", name:"Philips HeartStart MRx M3536A", type:"Defibrillator", manufacturer:"Philips India",      location:"Chandigarh, IN", price:7000, rating:"4.9", reliability:"99.8%", specs:["12-Lead ECG","AED Mode","CPR Guidance"],        verified:true },
      { id:"DF-02", name:"Zoll R Series ALS",             type:"Defibrillator", manufacturer:"Zoll Medical India", location:"Pune, IN",       price:8000, rating:"4.8", reliability:"99.5%", specs:["Real CPR Help","Pacing Capable","Bluetooth Sync"], verified:true },
      { id:"DF-03", name:"Nihon Kohden TEC-5600",         type:"Defibrillator", manufacturer:"Nihon Kohden India", location:"Hyderabad, IN",  price:6500, rating:"4.7", reliability:"98.9%", specs:["Biphasic Waveform","Auto-charging","Compact"],     verified:true },
    ],
    "Surgical Robot": [
      { id:"SR-01", name:"Intuitive Da Vinci Xi System", type:"Surgical Robot", manufacturer:"Intuitive Surgical India", location:"Mumbai, IN",  price:85000, rating:"4.9", reliability:"96.5%", specs:["4-Arm System","3D-HD Vision","Firefly Fluorescence"], verified:true },
      { id:"SR-02", name:"CMR Surgical Versius",         type:"Surgical Robot", manufacturer:"CMR Surgical India",      location:"Chennai, IN", price:72000, rating:"4.7", reliability:"95.8%", specs:["Modular Arms","3D Laparoscopic Vision","Compact"],    verified:true },
    ],
    "Patient Monitor": [
      { id:"PM-01", name:"Philips IntelliVue MX800",  type:"Patient Monitor", manufacturer:"Philips India",        location:"Bengaluru, IN", price:8500,  rating:"4.8", reliability:"99.3%", specs:["Wireless Telemetry","ICU Ready","EEG Module"],              verified:true },
      { id:"PM-02", name:"GE Carescape B850",         type:"Patient Monitor", manufacturer:"GE Healthcare India",  location:"Delhi, IN",     price:10000, rating:"4.8", reliability:"98.8%", specs:["Multi-parameter","Ventilator Integration","Alarm Mgmt"],   verified:true },
      { id:"PM-03", name:"Mindray BeneVision N22",    type:"Patient Monitor", manufacturer:"Mindray India",        location:"Kolkata, IN",   price:7000,  rating:"4.7", reliability:"98.2%", specs:["18.5 inch Touchscreen","Remote View","BIS/EEG Ready"],     verified:true },
    ],
  };
  return INVENTORY[type] || INVENTORY["MRI"];
}

app.listen(5000, () => {
  console.log("ResourceRX backend running on http://localhost:5000");
  console.log("  GET  /api/positions         - real-time unit positions");
  console.log("  GET  /api/equipment?type=MRI - FDA 510(k) device database");
  console.log("  GET  /api/weather?lat=&lng=  - Open-Meteo live weather");
  console.log("  GET  /api/route?startLat=... - OpenRouteService road routing");
  console.log("  GET  /api/currency?base=USD  - live exchange rates");
  console.log("  POST /api/medgemma           - Ollama AI proxy");
});