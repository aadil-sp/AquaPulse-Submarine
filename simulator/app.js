/**
 * AquaPulse ASV-UUV Marine Intelligence Simulator
 * Simulation Engine: Multi-Agent Physics, Navigation, AI Vision, Radar, and Telemetry
 */

// ==================== GLOBAL SIMULATION STATE ====================
const simState = {
  running: true,
  warpSpeed: 1,
  tick: 0,
  
  // Navigation & Vessel
  vessel: {
    lat: 9.965,
    lon: 76.220,
    heading: 268,
    speedKnots: 4.8,
    cog: 270.2,
    activeRouteIndex: 0,
    currentWpIndex: 0,
    distanceToNextWp: 2.4,
    batteryKwh: 9.6,
    batteryMaxKwh: 10.2,
    solarWatts: 845,
    propulsionWatts: 380,
    hotelWatts: 85,
    umbilicalWatts: 180,
    status: "AUTONOMOUS PATROL"
  },

  // Subsea Probe (UUV)
  probe: {
    targetDepth: 45.0,
    currentDepth: 45.0,
    umbilicalLength: 48.2,
    tensionN: 82.4,
    tempC: 24.6,
    thrusterRpm: 1450,
    pitchDeg: -1.2,
    rollDeg: 0.1,
    snagged: false
  },

  // Environmental Sensors
  environment: {
    solarIrradiance: 850, // W/m^2
    seaState: 2,          // Beaufort scale 0-6
    pollutionLevel: 25,   // 0 - 100
    fishDensity: 4,       // 1 - 5
    dissolvedOxygen: 6.84, // mg/L
    ph: 8.14,
    salinity: 34.8,       // PSU
    turbidity: 1.2,       // NTU
    chlorophyllA: 2.1,    // ug/L
    microplastics: 12.4,  // particles/m^3
    hypoxiaAlert: false
  },

  // AI Fisheries Analytics
  fisheries: {
    totalTracked: 1842,
    biomassDensity: 0.42, // kg/m^3
    healthQualityIndex: 94.8, // 0 - 100%
    speciesCounts: {
      mackerel: 684,
      sardine: 892,
      tuna: 48,
      pomfret: 218
    }
  },

  // Security & Radar
  radar: {
    sweepAngle: 0,
    targets: [
      { id: "MMSI-419001248", name: "Ever Given (Cargo)", distNm: 4.8, bearingDeg: 310, speedKts: 14.2 },
      { id: "MMSI-419008741", name: "Sea Pearl (Trawler)", distNm: 1.6, bearingDeg: 145, speedKts: 3.1 },
      { id: "MMSI-419003399", name: "Pilot Craft Cochin", distNm: 6.2, bearingDeg: 78, speedKts: 18.0 },
      { id: "BUOY-CO-04", name: "Fairway Channel Buoy", distNm: 2.1, bearingDeg: 88, speedKts: 0.0 }
    ],
    illegalTrawlerAlert: false
  },

  // Event Logs Buffer
  logs: []
};

// Preset Maritime Routes along the Southwest Indian Coast (Arabian Sea)
const PRESET_ROUTES = [
  {
    name: "Route Alpha: Cochin Offshore Shelf",
    description: "Cochin Port Channel → Chetwai Bank → 12nm Territorial Waters → Deep Shelf",
    waypoints: [
      { name: "Cochin Harbour Exit", lat: 9.965, lon: 76.220 },
      { name: "Fairway Channel Light", lat: 9.955, lon: 76.150 },
      { name: "Chetwai Fishery Ground", lat: 10.120, lon: 76.010 },
      { name: "Territorial Border 12nm", lat: 10.050, lon: 75.880 },
      { name: "Deep Arabian Sea Shelf", lat: 9.850, lon: 75.820 },
      { name: "Return Waypoint Cochin", lat: 9.940, lon: 76.180 }
    ]
  },
  {
    name: "Route Bravo: Vizhinjam Deep Canyon",
    description: "Vizhinjam Deep Port → Wadge Bank Fishery → Coral Sanctuary Border",
    waypoints: [
      { name: "Vizhinjam Terminal", lat: 8.375, lon: 76.990 },
      { name: "Kovalam Shelf Edge", lat: 8.320, lon: 76.910 },
      { name: "Wadge Bank Bio Sanctuary", lat: 8.180, lon: 76.800 },
      { name: "Kollam Deep Trench", lat: 8.450, lon: 76.620 },
      { name: "Return Vizhinjam Channel", lat: 8.360, lon: 76.960 }
    ]
  },
  {
    name: "Route Charlie: Lakshadweep Sea Pelagic",
    description: "Deep High-Seas Transect → Pelagic Tuna Corridor → Ocean Health Survey",
    waypoints: [
      { name: "Continental Slope Start", lat: 10.000, lon: 75.800 },
      { name: "Pelagic Tuna Aggregation", lat: 10.150, lon: 75.300 },
      { name: "Lakshadweep Basin East", lat: 9.900, lon: 74.850 },
      { name: "Thermocline Acoustic Transect", lat: 9.600, lon: 75.200 },
      { name: "Inshore Patrol Rendezvous", lat: 9.800, lon: 75.750 }
    ]
  }
];

// Marine Protected Area (MPA) Boundaries for compliance alerts
const MPA_ZONE = {
  name: "Arabian Sea Coral & Mangrove Marine Protected Area",
  bounds: [
    [10.08, 75.92],
    [10.18, 76.04],
    [10.12, 76.12],
    [10.02, 75.98]
  ]
};

// ==================== INITIALIZATION & TABS ====================
let leafletMap = null;
let vesselMarker = null;
let subMarker = null;
let routePolyline = null;
let wakePolyline = null;
let mpaPolygon = null;
const wakeHistory = [];

let telemetryChart = null;

document.addEventListener("DOMContentLoaded", () => {
  initTabs();
  initMap();
  initTelemetryChart();
  initControls();
  initLogStream();
  startSimulationLoops();
});

function initTabs() {
  const tabs = document.querySelectorAll(".tab-btn");
  tabs.forEach(btn => {
    btn.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
      
      btn.classList.add("active");
      const targetId = btn.getAttribute("data-tab");
      const targetContent = document.getElementById(targetId);
      if (targetContent) targetContent.classList.add("active");

      // Invalidate Leaflet map size when map tab is activated
      if (targetId === "tab-map" && leafletMap) {
        setTimeout(() => leafletMap.invalidateSize(), 150);
      }
    });
  });
}

// ==================== TAB 1: TACTICAL NAUTICAL MAP ====================
function initMap() {
  const mapElem = document.getElementById("nauticalMap");
  if (!mapElem) return;

  // Center on Cochin / Southwest India Coast
  leafletMap = L.map("nauticalMap", {
    center: [9.965, 76.100],
    zoom: 10,
    zoomControl: true
  });

  // CARTO Basemaps with user's authorized API key
  const CARTO_API_KEY = "cb1_4m4g_1_05b4c340365b09d8184bff39";

  const cartoVoyager = L.tileLayer(`https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?key=${CARTO_API_KEY}`, {
    attribution: "&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> &copy; <a href='https://carto.com/attributions'>CARTO</a>",
    maxZoom: 19,
    subdomains: "abcd"
  });

  const cartoDark = L.tileLayer(`https://basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}.png?key=${CARTO_API_KEY}`, {
    attribution: "&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> &copy; <a href='https://carto.com/attributions'>CARTO</a>",
    maxZoom: 19,
    subdomains: "abcd"
  });

  const osmLayer = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors",
    maxZoom: 19
  });

  const esriOcean = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}", {
    attribution: "&copy; Esri &mdash; Sources: GEBCO, NOAA, CHS, OSU, UNH, CSUMB, National Geographic, DeLorme, NAVTEQ, and Esri",
    maxZoom: 13
  });

  // Default to CARTO Voyager as requested by user
  cartoVoyager.addTo(leafletMap);

  // Add interactive layer selector control
  const baseLayers = {
    "🗺️ CARTO Voyager (Clean Navigation)": cartoVoyager,
    "🌙 CARTO Dark Matter (Night Tactical)": cartoDark,
    "🌊 ESRI World Ocean Bathymetry": esriOcean,
    "🌍 OpenStreetMap (Standard Free)": osmLayer
  };
  L.control.layers(baseLayers, null, { position: "topright" }).addTo(leafletMap);

  // Marine Protected Area (MPA) overlay
  mpaPolygon = L.polygon(MPA_ZONE.bounds, {
    color: "#ff3366",
    fillColor: "#ff3366",
    fillOpacity: 0.25,
    weight: 2,
    dashArray: "6, 6"
  }).addTo(leafletMap);
  mpaPolygon.bindPopup("<b>⚠️ Marine Protected Sanctuary (MPA)</b><br>Bottom Trawling Strictly Prohibited by Law.");

  // Port Markers
  L.circleMarker([9.965, 76.220], {
    radius: 7,
    color: "#00ff88",
    fillColor: "#00ff88",
    fillOpacity: 0.8
  }).addTo(leafletMap).bindPopup("<b>⚓ Cochin Port & Naval Base</b><br>Autonomous Docking Cradle 01");

  L.circleMarker([8.375, 76.990], {
    radius: 7,
    color: "#00ff88",
    fillColor: "#00ff88",
    fillOpacity: 0.8
  }).addTo(leafletMap).bindPopup("<b>⚓ Vizhinjam Deep Sea Port</b><br>Autonomous Station 02");

  // AquaPulse Surface Vessel Marker (Custom SVG Icon)
  const asvIcon = L.divIcon({
    className: "asv-leaflet-icon",
    html: `<div style="
      width: 26px; height: 26px; 
      background: radial-gradient(circle, #00f2ff, #0088ff); 
      border: 2px solid #ffffff; 
      border-radius: 50%; 
      box-shadow: 0 0 15px #00f2ff;
      display: flex; align-items: center; justify-content: center;
      font-size: 13px; transform: rotate(0deg); transition: transform 0.3s ease;">
      ▲
    </div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13]
  });

  vesselMarker = L.marker([simState.vessel.lat, simState.vessel.lon], { icon: asvIcon }).addTo(leafletMap);
  vesselMarker.bindPopup("<b>AquaPulse ASV (Surface Pilot)</b><br>Solar Powered Catamaran");

  // Tethered Submarine Probe Marker
  const subIcon = L.divIcon({
    className: "sub-leaflet-icon",
    html: `<div style="
      width: 18px; height: 18px; 
      background: #ffb700; 
      border: 1px solid #fff; 
      border-radius: 50%; 
      box-shadow: 0 0 10px #ffb700;">
    </div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9]
  });

  subMarker = L.marker([simState.vessel.lat - 0.002, simState.vessel.lon - 0.002], { icon: subIcon }).addTo(leafletMap);
  subMarker.bindPopup("<b>AquaPulse UUV (Tethered Sub Probe)</b><br>Depth: 45m");

  // Wake history polyline
  wakePolyline = L.polyline([], {
    color: "rgba(0, 242, 255, 0.5)",
    weight: 2,
    dashArray: "4, 4"
  }).addTo(leafletMap);

  // Render initial route
  renderActiveRoute();
}

function renderActiveRoute() {
  if (!leafletMap) return;
  if (routePolyline) leafletMap.removeLayer(routePolyline);

  const route = PRESET_ROUTES[simState.vessel.activeRouteIndex];
  const latLngs = route.waypoints.map(wp => [wp.lat, wp.lon]);

  routePolyline = L.polyline(latLngs, {
    color: "#00f2ff",
    weight: 3,
    opacity: 0.8
  }).addTo(leafletMap);

  // Fit bounds nicely
  leafletMap.fitBounds(routePolyline.getBounds(), { padding: [40, 40] });
}

function selectPresetRoute(index) {
  simState.vessel.activeRouteIndex = index;
  simState.vessel.currentWpIndex = 0;
  
  const buttons = document.querySelectorAll(".route-card-btn");
  buttons.forEach((btn, i) => {
    if (i === index) btn.classList.add("active");
    else btn.classList.remove("active");
  });

  const route = PRESET_ROUTES[index];
  simState.vessel.lat = route.waypoints[0].lat;
  simState.vessel.lon = route.waypoints[0].lon;
  wakeHistory.length = 0;

  renderActiveRoute();
  addLog("INFO", `New mission route dispatched: ${route.name}`);
}

function setWarpSpeed(factor) {
  simState.warpSpeed = factor;
  addLog("INFO", `Simulation warp speed set to ${factor}x`);
}

// ==================== TAB 2: SUBSEA TANDEM 2D CUTAWAY ANIMATION ====================
const oceanCanvas = document.getElementById("oceanCutawayCanvas");
const oceanCtx = oceanCanvas ? oceanCanvas.getContext("2d") : null;

// Dynamic fish particles in the cutaway canvas
const fishParticles = [];
for (let i = 0; i < 22; i++) {
  fishParticles.push({
    x: Math.random() * 980,
    depthM: 10 + Math.random() * 95,
    speed: 0.8 + Math.random() * 1.5,
    size: 14 + Math.random() * 22,
    species: ["Mackerel", "Sardine", "Tuna", "Pomfret"][Math.floor(Math.random() * 4)],
    tailAngle: 0
  });
}

// Floating microplastic particles
const plasticParticles = [];
for (let i = 0; i < 40; i++) {
  plasticParticles.push({
    x: Math.random() * 980,
    depthM: 5 + Math.random() * 110,
    speed: 0.2 + Math.random() * 0.4,
    size: 2 + Math.random() * 3
  });
}

function drawOceanCutaway() {
  if (!oceanCtx || !oceanCanvas) return;
  const w = oceanCanvas.width;
  const h = oceanCanvas.height;

  // Clear canvas
  oceanCtx.clearRect(0, 0, w, h);

  const surfaceY = 90; // Sky is top 0-90px, water is 90-480px
  const maxDepthMeters = 120; // 90 to 480 px represents 0m to 120m depth

  // 1. Draw Sky & Sun
  const skyGrad = oceanCtx.createLinearGradient(0, 0, 0, surfaceY);
  skyGrad.addColorStop(0, "#081326");
  skyGrad.addColorStop(1, "#122a4d");
  oceanCtx.fillStyle = skyGrad;
  oceanCtx.fillRect(0, 0, w, surfaceY);

  // Sun with brightness scaling by solar irradiance
  const sunOpacity = Math.min(1.0, simState.environment.solarIrradiance / 800);
  oceanCtx.save();
  oceanCtx.beginPath();
  oceanCtx.arc(120, 45, 26, 0, Math.PI * 2);
  oceanCtx.fillStyle = `rgba(255, 230, 110, ${0.4 * sunOpacity + 0.1})`;
  oceanCtx.fill();
  oceanCtx.beginPath();
  oceanCtx.arc(120, 45, 16, 0, Math.PI * 2);
  oceanCtx.fillStyle = `rgba(255, 250, 180, ${sunOpacity})`;
  oceanCtx.fill();

  // Sun rays downward
  if (sunOpacity > 0.3) {
    oceanCtx.strokeStyle = `rgba(255, 245, 180, ${0.15 * sunOpacity})`;
    oceanCtx.lineWidth = 2;
    for (let r = 0; r < 8; r++) {
      const angle = (r * Math.PI) / 8 + 0.2;
      oceanCtx.beginPath();
      oceanCtx.moveTo(120, 45);
      oceanCtx.lineTo(120 + Math.cos(angle) * 160, 45 + Math.sin(angle) * 160);
      oceanCtx.stroke();
    }
  }
  oceanCtx.restore();

  // Satellite in orbit (Starlink symbol in upper right sky)
  oceanCtx.fillStyle = "rgba(0, 242, 255, 0.8)";
  oceanCtx.fillRect(w - 140, 20, 14, 6);
  oceanCtx.fillRect(w - 147, 22, 5, 2);
  oceanCtx.fillRect(w - 124, 22, 5, 2);
  oceanCtx.font = "9px monospace";
  oceanCtx.fillText("STARLINK LEO", w - 165, 38);

  // Beaming comms ray to vessel
  const vesselX = w * 0.45;
  const waveHeight = simState.environment.seaState * 3;
  const waveY = surfaceY + Math.sin(simState.tick * 0.05) * waveHeight;

  oceanCtx.save();
  oceanCtx.setLineDash([3, 5]);
  oceanCtx.strokeStyle = "rgba(0, 242, 255, 0.4)";
  oceanCtx.beginPath();
  oceanCtx.moveTo(w - 133, 26);
  oceanCtx.lineTo(vesselX, waveY - 20);
  oceanCtx.stroke();
  oceanCtx.restore();

  // 2. Draw Ocean Water Strata
  const waterGrad = oceanCtx.createLinearGradient(0, surfaceY, 0, h);
  waterGrad.addColorStop(0, "#084166");    // Epipelagic (sunlit)
  waterGrad.addColorStop(0.3, "#042544");  // Mesopelagic
  waterGrad.addColorStop(0.7, "#021226");  // Bathypelagic
  waterGrad.addColorStop(1, "#010712");    // Seafloor abyss
  oceanCtx.fillStyle = waterGrad;
  oceanCtx.fillRect(0, surfaceY, w, h - surfaceY);

  // Thermocline Layer Dashed Line at ~35m
  const thermoclinePx = surfaceY + (35 / maxDepthMeters) * (h - surfaceY);
  oceanCtx.save();
  oceanCtx.setLineDash([6, 6]);
  oceanCtx.strokeStyle = "rgba(0, 242, 255, 0.25)";
  oceanCtx.beginPath();
  oceanCtx.moveTo(0, thermoclinePx);
  oceanCtx.lineTo(w, thermoclinePx);
  oceanCtx.stroke();
  oceanCtx.fillStyle = "rgba(0, 242, 255, 0.5)";
  oceanCtx.font = "10px monospace";
  oceanCtx.fillText("--- THERMOCLINE BOUNDARY (35m) : TEMP GRADIENT ---", 18, thermoclinePx - 4);
  oceanCtx.restore();

  // 3. Draw Seafloor Bed & Reefs
  oceanCtx.fillStyle = "#0c1a1f";
  oceanCtx.beginPath();
  oceanCtx.moveTo(0, h);
  for (let x = 0; x <= w; x += 40) {
    const y = h - 25 + Math.sin(x * 0.02) * 12 + Math.cos(x * 0.05) * 6;
    oceanCtx.lineTo(x, y);
  }
  oceanCtx.lineTo(w, h);
  oceanCtx.closePath();
  oceanCtx.fill();

  // 4. Dynamic Water Waves on Surface
  oceanCtx.fillStyle = "rgba(0, 180, 255, 0.35)";
  oceanCtx.beginPath();
  oceanCtx.moveTo(0, surfaceY);
  for (let x = 0; x <= w; x += 20) {
    const y = surfaceY + Math.sin(x * 0.03 + simState.tick * 0.08) * waveHeight;
    oceanCtx.lineTo(x, y);
  }
  oceanCtx.lineTo(w, surfaceY + 15);
  oceanCtx.lineTo(0, surfaceY + 15);
  oceanCtx.closePath();
  oceanCtx.fill();

  // 5. Draw Surface Catamaran (AquaPulse ASV)
  const asvY = surfaceY + Math.sin(vesselX * 0.03 + simState.tick * 0.08) * waveHeight;
  const asvPitch = Math.sin(simState.tick * 0.06) * 0.04 * (simState.environment.seaState + 1);

  oceanCtx.save();
  oceanCtx.translate(vesselX, asvY);
  oceanCtx.rotate(asvPitch);

  // Twin hulls
  oceanCtx.fillStyle = "#ffffff";
  oceanCtx.beginPath();
  oceanCtx.roundRect(-42, -6, 84, 12, [3, 10, 8, 3]);
  oceanCtx.fill();
  oceanCtx.strokeStyle = "#00f2ff";
  oceanCtx.lineWidth = 1.5;
  oceanCtx.stroke();

  // Deck cabin
  oceanCtx.fillStyle = "#0b203a";
  oceanCtx.fillRect(-24, -20, 48, 14);

  // Solar PV Panels on Deck (Glowing Cyan/Green based on generation)
  const solarGlow = simState.vessel.solarWatts > 400 ? "#00ff88" : "#0088ff";
  oceanCtx.fillStyle = solarGlow;
  oceanCtx.fillRect(-22, -22, 44, 4);

  // Radar Mast & Rotating Scanner
  oceanCtx.fillStyle = "#7e9bb6";
  oceanCtx.fillRect(4, -34, 4, 14);
  oceanCtx.beginPath();
  oceanCtx.arc(6, -34, 5, 0, Math.PI * 2);
  oceanCtx.fillStyle = "#00f2ff";
  oceanCtx.fill();

  // Rotating radar beam symbol
  const radarSpin = (simState.tick * 0.15) % (Math.PI * 2);
  oceanCtx.strokeStyle = "rgba(0, 255, 136, 0.7)";
  oceanCtx.beginPath();
  oceanCtx.moveTo(6, -34);
  oceanCtx.lineTo(6 + Math.cos(radarSpin) * 14, -34 + Math.sin(radarSpin) * 6);
  oceanCtx.stroke();

  // Water wake behind vessel
  oceanCtx.fillStyle = "rgba(255, 255, 255, 0.6)";
  oceanCtx.beginPath();
  oceanCtx.ellipse(-46, 2, 8, 3, 0, 0, Math.PI * 2);
  oceanCtx.fill();

  oceanCtx.restore();

  // 6. Draw Umbilical Tether Catenary Curve
  // Sub probe target depth in pixels
  const probeDepthPx = surfaceY + (simState.probe.currentDepth / maxDepthMeters) * (h - surfaceY);
  const probeX = vesselX - 35 - (simState.vessel.speedKnots * 3.5); // drifts backward under tow drag

  oceanCtx.save();
  oceanCtx.strokeStyle = "#ffb700";
  oceanCtx.lineWidth = 2.5;
  oceanCtx.shadowColor = "#ffb700";
  oceanCtx.shadowBlur = 6;
  oceanCtx.beginPath();
  oceanCtx.moveTo(vesselX, asvY + 4);
  
  // Catenary quadratic curve
  const midX = (vesselX + probeX) / 2 - 20;
  const midY = (asvY + probeDepthPx) / 2 + 15;
  oceanCtx.quadraticCurveTo(midX, midY, probeX, probeDepthPx);
  oceanCtx.stroke();
  oceanCtx.restore();

  // 7. Draw Subsea Probe (AquaPulse UUV)
  oceanCtx.save();
  oceanCtx.translate(probeX, probeDepthPx);

  // Multibeam Forward Sonar Beam (Translucent cone pulsing ahead)
  const sonarAlpha = 0.15 + Math.sin(simState.tick * 0.2) * 0.08;
  oceanCtx.fillStyle = `rgba(0, 242, 255, ${sonarAlpha})`;
  oceanCtx.beginPath();
  oceanCtx.moveTo(18, 0);
  oceanCtx.lineTo(140, -45);
  oceanCtx.lineTo(140, 45);
  oceanCtx.closePath();
  oceanCtx.fill();

  // Headlight beam (warm white)
  oceanCtx.fillStyle = "rgba(255, 255, 200, 0.22)";
  oceanCtx.beginPath();
  oceanCtx.moveTo(16, 0);
  oceanCtx.lineTo(110, -22);
  oceanCtx.lineTo(110, 22);
  oceanCtx.closePath();
  oceanCtx.fill();

  // Submarine Titanium Hull
  oceanCtx.fillStyle = "#ffb700";
  oceanCtx.beginPath();
  oceanCtx.roundRect(-22, -10, 44, 20, [8, 14, 14, 8]);
  oceanCtx.fill();
  oceanCtx.strokeStyle = "#ffffff";
  oceanCtx.lineWidth = 1.5;
  oceanCtx.stroke();

  // Front Acrylic Camera Dome
  oceanCtx.beginPath();
  oceanCtx.arc(18, 0, 7, -Math.PI / 2, Math.PI / 2);
  oceanCtx.fillStyle = "#00f2ff";
  oceanCtx.fill();

  // Subsea Thrusters (Top and Tail)
  oceanCtx.fillStyle = "#1e3a5f";
  oceanCtx.fillRect(-26, -4, 6, 8);
  oceanCtx.fillRect(-6, -14, 12, 4);

  // Thruster cavitation bubbles
  if (simState.tick % 4 === 0) {
    oceanCtx.fillStyle = "rgba(255, 255, 255, 0.7)";
    oceanCtx.beginPath();
    oceanCtx.arc(-30 - Math.random() * 8, Math.random() * 6 - 3, 2, 0, Math.PI * 2);
    oceanCtx.fill();
  }

  // Probe depth text label
  oceanCtx.font = "10px monospace";
  oceanCtx.fillStyle = "#ffffff";
  oceanCtx.fillText(`PROBE: ${simState.probe.currentDepth.toFixed(1)}m`, -30, 24);

  oceanCtx.restore();

  // 8. Draw Swimming Marine Life
  fishParticles.forEach(fish => {
    fish.x += fish.speed * (simState.warpSpeed * 0.8);
    if (fish.x > w + 40) fish.x = -40;

    const fishY = surfaceY + (fish.depthM / maxDepthMeters) * (h - surfaceY);
    fish.tailAngle = Math.sin(simState.tick * 0.2 + fish.x * 0.05) * 0.3;

    oceanCtx.save();
    oceanCtx.translate(fish.x, fishY);
    
    // Fish body
    oceanCtx.fillStyle = fish.species === "Tuna" ? "#ffb703" : 
                         fish.species === "Pomfret" ? "#f28482" : "#90e0ef";
    oceanCtx.beginPath();
    oceanCtx.ellipse(0, 0, fish.size * 0.7, fish.size * 0.35, 0, 0, Math.PI * 2);
    oceanCtx.fill();

    // Tail fin
    oceanCtx.beginPath();
    oceanCtx.moveTo(-fish.size * 0.6, 0);
    oceanCtx.lineTo(-fish.size - 4, -fish.size * 0.35 + fish.tailAngle * 5);
    oceanCtx.lineTo(-fish.size - 4, fish.size * 0.35 + fish.tailAngle * 5);
    oceanCtx.closePath();
    oceanCtx.fill();

    // Species badge in cutaway
    oceanCtx.font = "8px monospace";
    oceanCtx.fillStyle = "rgba(255, 255, 255, 0.6)";
    oceanCtx.fillText(fish.species, -10, -fish.size * 0.45);

    oceanCtx.restore();
  });

  // 9. Draw Microplastics (particles)
  if (simState.environment.pollutionLevel > 10) {
    const activeCount = Math.floor((simState.environment.pollutionLevel / 100) * plasticParticles.length);
    for (let p = 0; p < activeCount; p++) {
      const plastic = plasticParticles[p];
      plastic.x += plastic.speed;
      if (plastic.x > w) plastic.x = 0;
      const py = surfaceY + (plastic.depthM / maxDepthMeters) * (h - surfaceY);

      oceanCtx.fillStyle = "rgba(255, 100, 150, 0.75)";
      oceanCtx.beginPath();
      oceanCtx.arc(plastic.x, py, plastic.size, 0, Math.PI * 2);
      oceanCtx.fill();
    }
  }
}

// ==================== TAB 3: AI FISH QUALITY & BIOMASS LAB ====================
const aiCameraCanvas = document.getElementById("aiCameraCanvas");
const aiCtx = aiCameraCanvas ? aiCameraCanvas.getContext("2d") : null;

const aiFishTargets = [
  { x: 120, y: 160, vx: 1.2, vy: 0.2, species: "Indian Mackerel", lengthCm: 22.4, weightG: 165, hqi: 95.4, conf: 0.96 },
  { x: 380, y: 220, vx: 1.6, vy: -0.1, species: "Oil Sardine", lengthCm: 15.1, weightG: 48, hqi: 93.8, conf: 0.94 },
  { x: 580, y: 140, vx: 2.1, vy: 0.3, species: "Yellowfin Tuna", lengthCm: 74.5, weightG: 7200, hqi: 98.7, conf: 0.98 },
  { x: 260, y: 290, vx: 0.9, vy: -0.2, species: "Silver Pomfret", lengthCm: 28.0, weightG: 410, hqi: 92.2, conf: 0.92 }
];

function drawAICameraStream() {
  if (!aiCtx || !aiCameraCanvas) return;
  const w = aiCameraCanvas.width;
  const h = aiCameraCanvas.height;

  // Clear subsea viewport
  aiCtx.fillStyle = "#021020";
  aiCtx.fillRect(0, 0, w, h);

  // Subsea lighting gradient
  const lightGrad = aiCtx.createRadialGradient(w / 2, h / 2, 40, w / 2, h / 2, 380);
  lightGrad.addColorStop(0, "rgba(0, 160, 220, 0.25)");
  lightGrad.addColorStop(1, "rgba(1, 10, 22, 0.95)");
  aiCtx.fillStyle = lightGrad;
  aiCtx.fillRect(0, 0, w, h);

  // Marine snow & particulates
  aiCtx.fillStyle = "rgba(255, 255, 255, 0.25)";
  for (let s = 0; s < 35; s++) {
    const sx = (Math.sin(s * 99 + simState.tick * 0.02) * 0.5 + 0.5) * w;
    const sy = ((s * 17 + simState.tick * 0.6) % h);
    aiCtx.fillRect(sx, sy, 1.5, 1.5);
  }

  // Render fish and YOLO Bounding Boxes
  aiFishTargets.forEach((fish, idx) => {
    fish.x += fish.vx * simState.warpSpeed;
    fish.y += fish.vy * simState.warpSpeed;

    if (fish.x > w + 100) fish.x = -120;
    if (fish.y < 40 || fish.y > h - 40) fish.vy *= -1;

    // Draw Fish Silhouette
    aiCtx.save();
    aiCtx.translate(fish.x, fish.y);
    const boxW = fish.species === "Yellowfin Tuna" ? 140 : 85;
    const boxH = fish.species === "Yellowfin Tuna" ? 65 : 44;

    aiCtx.fillStyle = "#1e4d79";
    aiCtx.beginPath();
    aiCtx.ellipse(boxW / 2, boxH / 2, boxW * 0.45, boxH * 0.35, 0, 0, Math.PI * 2);
    aiCtx.fill();

    // AI Bounding Box (YOLOv10-Marine Style)
    aiCtx.strokeStyle = "#00ff88";
    aiCtx.lineWidth = 1.8;
    aiCtx.strokeRect(0, 0, boxW, boxH);

    // Box Header Label
    aiCtx.fillStyle = "rgba(0, 255, 136, 0.9)";
    aiCtx.fillRect(0, -18, boxW, 18);
    aiCtx.font = "bold 9px monospace";
    aiCtx.fillStyle = "#020f0a";
    aiCtx.fillText(`${fish.species} ${(fish.conf * 100).toFixed(1)}%`, 4, -5);

    // Box Sub-Label: Length, Weight, HQI
    aiCtx.fillStyle = "rgba(10, 25, 44, 0.85)";
    aiCtx.fillRect(0, boxH, boxW, 16);
    aiCtx.font = "8.5px monospace";
    aiCtx.fillStyle = "#00f2ff";
    aiCtx.fillText(`L:${fish.lengthCm}cm W:${fish.weightG}g Q:${fish.hqi.toFixed(0)}%`, 4, boxH + 11);

    aiCtx.restore();
  });

  // Crosshairs in Center
  aiCtx.strokeStyle = "rgba(0, 242, 255, 0.35)";
  aiCtx.lineWidth = 1;
  aiCtx.beginPath();
  aiCtx.moveTo(w / 2 - 25, h / 2);
  aiCtx.lineTo(w / 2 + 25, h / 2);
  aiCtx.moveTo(w / 2, h / 2 - 25);
  aiCtx.lineTo(w / 2, h / 2 + 25);
  aiCtx.stroke();
}

// ==================== TAB 4: GOVERNMENT TELEMETRY & CHART ====================
function initTelemetryChart() {
  const chartCanvas = document.getElementById("envTelemetryChart");
  if (!chartCanvas) return;

  const labels = Array.from({ length: 20 }, (_, i) => `-${(20 - i) * 3}s`);
  const initialDO = Array(20).fill(6.8);
  const initialTemp = Array(20).fill(25.2);
  const initialPlastic = Array(20).fill(12);

  telemetryChart = new Chart(chartCanvas, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Dissolved Oxygen (mg/L)",
          data: initialDO,
          borderColor: "#00f2ff",
          backgroundColor: "rgba(0, 242, 255, 0.1)",
          yAxisID: "yDO",
          tension: 0.3,
          borderWidth: 2
        },
        {
          label: "Water Temp (°C)",
          data: initialTemp,
          borderColor: "#00ff88",
          backgroundColor: "transparent",
          yAxisID: "yTemp",
          tension: 0.3,
          borderWidth: 2
        },
        {
          label: "Microplastics (part/m³)",
          data: initialPlastic,
          borderColor: "#ff3366",
          backgroundColor: "transparent",
          yAxisID: "yPlastic",
          borderDash: [4, 4],
          borderWidth: 2
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          grid: { color: "rgba(255, 255, 255, 0.05)" },
          ticks: { color: "#7e9bb6", font: { size: 10 } }
        },
        yDO: {
          type: "linear",
          position: "left",
          min: 0,
          max: 10,
          grid: { color: "rgba(255, 255, 255, 0.05)" },
          ticks: { color: "#00f2ff", font: { size: 10 } }
        },
        yTemp: {
          type: "linear",
          position: "right",
          min: 15,
          max: 35,
          grid: { drawOnChartArea: false },
          ticks: { color: "#00ff88", font: { size: 10 } }
        },
        yPlastic: {
          type: "linear",
          position: "right",
          min: 0,
          max: 60,
          grid: { drawOnChartArea: false },
          ticks: { color: "#ff3366", font: { size: 10 } }
        }
      },
      plugins: {
        legend: {
          labels: { color: "#e2f1ff", font: { size: 10 } }
        }
      }
    }
  });
}

function updateTelemetryChart() {
  if (!telemetryChart) return;
  
  const dsDO = telemetryChart.data.datasets[0].data;
  const dsTemp = telemetryChart.data.datasets[1].data;
  const dsPlastic = telemetryChart.data.datasets[2].data;

  dsDO.shift();
  dsTemp.shift();
  dsPlastic.shift();

  dsDO.push(simState.environment.dissolvedOxygen);
  dsTemp.push(simState.probe.tempC);
  dsPlastic.push(simState.environment.microplastics);

  telemetryChart.update("none");
}

function initLogStream() {
  addLog("SYNC", "AP-GOV-2.4 Telemetry Gateway connected to National Fisheries Cloud.");
  addLog("INFO", "AIS & FMCW Marine Radar operational. Zero proximity collisions detected.");
  addLog("AI", "YOLOv10-Marine: Initialized with 6 pelagic classes. ByteTrack running on Orin NPU.");
}

function addLog(type, text) {
  const container = document.getElementById("govLogStream");
  if (!container) return;

  const now = new Date();
  const timeStr = now.toISOString().substring(11, 19);

  const entry = document.createElement("div");
  entry.className = "log-entry";
  entry.innerHTML = `
    <span class="log-time">[${timeStr}]</span>
    <span class="log-tag ${type.toLowerCase()}">[${type}]</span>
    <span>${text}</span>
  `;

  container.prepend(entry);

  // Keep max 50 log items
  while (container.children.length > 50) {
    container.removeChild(container.lastChild);
  }

  // Update badge counter
  const badge = document.getElementById("eventCounterBadge");
  if (badge) badge.innerText = `${container.children.length} Events`;
}

// ==================== TAB 5: FMCW RADAR CANVAS ====================
const radarCanvas = document.getElementById("radarCanvas");
const radarCtx = radarCanvas ? radarCanvas.getContext("2d") : null;

function drawRadarSweep() {
  if (!radarCtx || !radarCanvas) return;
  const w = radarCanvas.width;
  const h = radarCanvas.height;
  const cx = w / 2;
  const cy = h / 2;
  const radius = cx - 12;

  // Radar screen fade effect
  radarCtx.fillStyle = "rgba(1, 10, 8, 0.12)";
  radarCtx.fillRect(0, 0, w, h);

  // Concentric Range Rings (4nm, 8nm, 12nm, 16nm)
  radarCtx.strokeStyle = "rgba(0, 255, 136, 0.25)";
  radarCtx.lineWidth = 1;
  for (let r = 1; r <= 4; r++) {
    radarCtx.beginPath();
    radarCtx.arc(cx, cy, (radius / 4) * r, 0, Math.PI * 2);
    radarCtx.stroke();
  }

  // Crosshairs
  radarCtx.beginPath();
  radarCtx.moveTo(cx, cy - radius);
  radarCtx.lineTo(cx, cy + radius);
  radarCtx.moveTo(cx - radius, cy);
  radarCtx.lineTo(cx + radius, cy);
  radarCtx.stroke();

  // Degree markings (N, E, S, W)
  radarCtx.font = "9px monospace";
  radarCtx.fillStyle = "rgba(0, 255, 136, 0.7)";
  radarCtx.fillText("000°", cx - 12, cy - radius - 2);
  radarCtx.fillText("090°", cx + radius + 2, cy + 3);
  radarCtx.fillText("180°", cx - 12, cy + radius + 10);
  radarCtx.fillText("270°", cx - radius - 24, cy + 3);

  // Radar Rotating Sweep Beam
  simState.radar.sweepAngle = (simState.radar.sweepAngle + 0.04 * simState.warpSpeed) % (Math.PI * 2);

  const sweepGrad = radarCtx.createRadialGradient(cx, cy, 5, cx, cy, radius);
  sweepGrad.addColorStop(0, "rgba(0, 255, 136, 0.4)");
  sweepGrad.addColorStop(1, "rgba(0, 255, 136, 0.05)");

  radarCtx.save();
  radarCtx.beginPath();
  radarCtx.moveTo(cx, cy);
  radarCtx.arc(cx, cy, radius, simState.radar.sweepAngle - 0.35, simState.radar.sweepAngle);
  radarCtx.closePath();
  radarCtx.fillStyle = sweepGrad;
  radarCtx.fill();

  // Rotating sharp beam line
  radarCtx.strokeStyle = "rgba(0, 255, 136, 0.9)";
  radarCtx.lineWidth = 1.5;
  radarCtx.beginPath();
  radarCtx.moveTo(cx, cy);
  radarCtx.lineTo(cx + Math.cos(simState.radar.sweepAngle) * radius, cy + Math.sin(simState.radar.sweepAngle) * radius);
  radarCtx.stroke();
  radarCtx.restore();

  // Draw Radar Blips (Targets)
  simState.radar.targets.forEach(tgt => {
    const tgtDistFrac = tgt.distNm / 16.0;
    const tgtAngleRad = (tgt.bearingDeg * Math.PI) / 180;
    const tx = cx + Math.cos(tgtAngleRad) * (radius * tgtDistFrac);
    const ty = cy + Math.sin(tgtAngleRad) * (radius * tgtDistFrac);

    radarCtx.fillStyle = tgt.distNm < 2.0 ? "#ff3366" : "#00ff88";
    radarCtx.beginPath();
    radarCtx.arc(tx, ty, 3.5, 0, Math.PI * 2);
    radarCtx.fill();

    // Pulse ring around target
    radarCtx.strokeStyle = "rgba(0, 255, 136, 0.5)";
    radarCtx.strokeRect(tx - 5, ty - 5, 10, 10);
  });
}

// ==================== SIMULATION PHYSICS LOOP ====================
function startSimulationLoops() {
  // 60 FPS Render loop
  function renderFrame() {
    if (simState.running) {
      simState.tick++;
      drawOceanCutaway();
      drawAICameraStream();
      drawRadarSweep();
    }
    requestAnimationFrame(renderFrame);
  }
  requestAnimationFrame(renderFrame);

  // 1-Second Physics & Navigation Step
  setInterval(() => {
    if (!simState.running) return;
    stepSimulationPhysics();
  }, 1000);
}

function stepSimulationPhysics() {
  const currentRoute = PRESET_ROUTES[simState.vessel.activeRouteIndex];
  const waypoints = currentRoute.waypoints;
  const targetWp = waypoints[simState.vessel.currentWpIndex];

  // 1. Waypoint Navigation Step
  const dLat = targetWp.lat - simState.vessel.lat;
  const dLon = targetWp.lon - simState.vessel.lon;
  const distDeg = Math.sqrt(dLat * dLat + dLon * dLon);
  const distNm = distDeg * 60; // 1 degree lat ~ 60 nautical miles
  simState.vessel.distanceToNextWp = distNm;

  // Heading calculation
  const targetHeading = ((Math.atan2(dLon, dLat) * 180) / Math.PI + 360) % 360;
  simState.vessel.heading = Math.round(targetHeading);
  simState.vessel.cog = (simState.vessel.heading + 1.2) % 360;

  // Move vessel along heading
  const speedKnots = simState.vessel.speedKnots * simState.warpSpeed;
  const stepDistDeg = (speedKnots / 3600 / 60) * 1.5; // step per second
  if (distDeg > 0.001) {
    simState.vessel.lat += (dLat / distDeg) * stepDistDeg;
    simState.vessel.lon += (dLon / distDeg) * stepDistDeg;
  } else {
    // Reached waypoint, advance to next
    simState.vessel.currentWpIndex = (simState.vessel.currentWpIndex + 1) % waypoints.length;
    addLog("INFO", `Waypoint reached. Proceeding to: ${waypoints[simState.vessel.currentWpIndex].name}`);
  }

  // Update wake history
  wakeHistory.push([simState.vessel.lat, simState.vessel.lon]);
  if (wakeHistory.length > 50) wakeHistory.shift();

  // Update Leaflet marker positions
  if (vesselMarker && subMarker && leafletMap) {
    vesselMarker.setLatLng([simState.vessel.lat, simState.vessel.lon]);
    
    // Sub probe follows with slight drag offset
    const subLat = simState.vessel.lat - 0.0015;
    const subLon = simState.vessel.lon - 0.0015;
    subMarker.setLatLng([subLat, subLon]);

    if (wakePolyline) {
      wakePolyline.setLatLngs(wakeHistory);
    }
  }

  // 2. Solar & Power Simulation
  const solarGen = (simState.environment.solarIrradiance / 1000) * 1200 * 0.985;
  simState.vessel.solarWatts = Math.round(solarGen);
  
  const totalDraw = simState.vessel.propulsionWatts + simState.vessel.hotelWatts + simState.vessel.umbilicalWatts;
  const netPowerWatts = simState.vessel.solarWatts - totalDraw;
  
  // Update battery level
  const deltaKwh = (netPowerWatts / 1000 / 3600) * simState.warpSpeed;
  simState.vessel.batteryKwh = Math.min(simState.vessel.batteryMaxKwh, Math.max(1.0, simState.vessel.batteryKwh + deltaKwh));

  // 3. Sub Probe Depth Dynamics (winch reels toward target)
  const depthDiff = simState.probe.targetDepth - simState.probe.currentDepth;
  if (Math.abs(depthDiff) > 0.1) {
    simState.probe.currentDepth += Math.sign(depthDiff) * 0.5 * simState.warpSpeed;
    simState.probe.umbilicalLength = simState.probe.currentDepth * 1.08;
  }

  // Water temp decreases with depth
  simState.probe.tempC = Math.max(18.0, 28.5 - simState.probe.currentDepth * 0.12);

  // 4. Environmental Sensor Fluctuations
  simState.environment.dissolvedOxygen = Math.max(
    1.2, 
    7.2 - (simState.probe.currentDepth * 0.02) - (simState.environment.pollutionLevel * 0.03) + (Math.sin(simState.tick * 0.1) * 0.1)
  );

  simState.environment.microplastics = Math.round(simState.environment.pollutionLevel * 0.5 + (Math.random() * 2));

  // 5. Fisheries Count increments
  if (Math.random() < 0.4) {
    simState.fisheries.totalTracked += Math.floor(Math.random() * 4 * simState.environment.fishDensity);
    simState.fisheries.speciesCounts.mackerel += Math.floor(Math.random() * 2);
    simState.fisheries.speciesCounts.sardine += Math.floor(Math.random() * 3);
  }

  // Check MPA violation simulation
  checkMpaCompliance();

  // 6. Update UI Telemetry & Chart
  updateDashboardUI();
  updateTelemetryChart();

  // Periodic Government Telemetry Heartbeat (every 10s)
  if (simState.tick % 10 === 0) {
    addLog("SYNC", `AP-GOV-2.4 Telemetry Packet sent to DoF Central DB. Stock Count: ${simState.fisheries.totalTracked}`);
  }
}

function checkMpaCompliance() {
  // If vessel or sub enters MPA boundary
  const inMpa = (
    simState.vessel.lat >= 10.02 && simState.vessel.lat <= 10.18 &&
    simState.vessel.lon >= 75.92 && simState.vessel.lon <= 76.12
  );

  if (inMpa && !simState.radar.illegalTrawlerAlert) {
    // Normal autonomous compliance scan
  }
}

// ==================== UI METRICS UPDATE ====================
function updateDashboardUI() {
  // Header Status Bar
  document.getElementById("topSolarWatts").innerText = `${simState.vessel.solarWatts} W`;
  const battPct = ((simState.vessel.batteryKwh / simState.vessel.batteryMaxKwh) * 100).toFixed(1);
  document.getElementById("topBattPct").innerText = `${battPct}%`;
  document.getElementById("topSubDepth").innerText = `${simState.probe.currentDepth.toFixed(1)} m`;

  // Coordinates
  const latStr = `${simState.vessel.lat.toFixed(4)}°N`;
  const lonStr = `${simState.vessel.lon.toFixed(4)}°E`;
  document.getElementById("mapCoordDisplay").innerText = `LAT: ${latStr} | LON: ${lonStr}`;

  // Tab 1 Nav Metrics
  document.getElementById("dispSpeed").innerHTML = `${simState.vessel.speedKnots.toFixed(1)} <span class="unit">kts</span>`;
  document.getElementById("dispHeading").innerHTML = `${simState.vessel.heading}° <span class="unit">T</span>`;
  document.getElementById("dispCog").innerHTML = `${simState.vessel.cog.toFixed(1)}° <span class="unit">M</span>`;
  document.getElementById("dispDistWp").innerHTML = `${simState.vessel.distanceToNextWp.toFixed(1)} <span class="unit">nm</span>`;
  
  const currentRoute = PRESET_ROUTES[simState.vessel.activeRouteIndex];
  document.getElementById("dispWpName").innerText = currentRoute.waypoints[simState.vessel.currentWpIndex].name;
  
  document.getElementById("dispSolarWatts").innerHTML = `${simState.vessel.solarWatts} <span class="unit">W</span>`;
  document.getElementById("dispBattKwh").innerHTML = `${simState.vessel.batteryKwh.toFixed(1)} <span class="unit">/ 10.2 kWh</span>`;

  // Tab 2 Sub Probe Metrics
  document.getElementById("dispProbeDepth").innerHTML = `${simState.probe.currentDepth.toFixed(1)} <span class="unit">m</span>`;
  document.getElementById("subVisualDepth").innerText = `${simState.probe.currentDepth.toFixed(1)}m`;
  document.getElementById("dispUmbilicalLen").innerHTML = `${simState.probe.umbilicalLength.toFixed(1)} <span class="unit">m</span>`;
  document.getElementById("dispProbeTemp").innerHTML = `${simState.probe.tempC.toFixed(1)} <span class="unit">°C</span>`;

  // Tab 3 AI Fisheries Metrics
  document.getElementById("camDepthHud").innerText = `${simState.probe.currentDepth.toFixed(1)}m`;
  document.getElementById("dispTotalFish").innerHTML = `${simState.fisheries.totalTracked.toLocaleString()} <span class="unit">specimens</span>`;
  document.getElementById("cntMackerel").innerText = simState.fisheries.speciesCounts.mackerel;
  document.getElementById("cntSardine").innerText = simState.fisheries.speciesCounts.sardine;
  document.getElementById("cntTuna").innerText = simState.fisheries.speciesCounts.tuna;
  document.getElementById("cntPomfret").innerText = simState.fisheries.speciesCounts.pomfret;

  // Tab 4 Government Environmental Telemetry
  document.getElementById("dispDO").innerHTML = `${simState.environment.dissolvedOxygen.toFixed(2)} <span class="unit">mg/L</span>`;
  document.getElementById("dispPlastic").innerHTML = `${simState.environment.microplastics} <span class="unit">particles/m³</span>`;

  const statusDO = document.getElementById("statusDO");
  if (simState.environment.dissolvedOxygen < 2.5) {
    statusDO.innerText = "CRITICAL HYPOXIA (<2.5 mg/L)";
    statusDO.className = "subtext danger";
  } else {
    statusDO.innerText = "Safe Aerobic Zone (>5.0 mg/L)";
    statusDO.className = "subtext";
  }
}

// ==================== TAB 6: PARAMETER TUNING CONTROLS ====================
function initControls() {
  // Depth slider
  const sDepth = document.getElementById("sliderDepth");
  sDepth.addEventListener("input", (e) => {
    simState.probe.targetDepth = parseFloat(e.target.value);
    document.getElementById("ctrlValDepth").innerText = `${simState.probe.targetDepth} m`;
    addLog("INFO", `Submersible target depth commanded to: ${simState.probe.targetDepth} m`);
  });

  // Solar Irradiance slider
  const sSolar = document.getElementById("sliderSolar");
  sSolar.addEventListener("input", (e) => {
    simState.environment.solarIrradiance = parseInt(e.target.value);
    document.getElementById("ctrlValSolar").innerText = `${simState.environment.solarIrradiance} W/m²`;
  });

  // Vessel Speed slider
  const sSpeed = document.getElementById("sliderSpeed");
  sSpeed.addEventListener("input", (e) => {
    simState.vessel.speedKnots = parseFloat(e.target.value);
    document.getElementById("ctrlValSpeed").innerText = `${simState.vessel.speedKnots.toFixed(1)} knots`;
  });

  // Sea State slider
  const sSea = document.getElementById("sliderSeaState");
  sSea.addEventListener("input", (e) => {
    simState.environment.seaState = parseInt(e.target.value);
    const names = ["State 0 (Calm glass)", "State 1 (Ripples)", "State 2 (Smooth wavelets)", "State 3 (Slight chop)", "State 4 (Moderate swells)", "State 5 (Rough waves)", "State 6 (Heavy seas)"];
    document.getElementById("ctrlValSeaState").innerText = names[simState.environment.seaState];
  });

  // Fish Density slider
  const sFish = document.getElementById("sliderFishDensity");
  sFish.addEventListener("input", (e) => {
    simState.environment.fishDensity = parseInt(e.target.value);
    const densityNames = ["Scarce", "Low", "Moderate", "High (Abundant)", "Swarm Concentration"];
    document.getElementById("ctrlValFishDensity").innerText = densityNames[simState.environment.fishDensity - 1];
  });

  // Pollution Slider
  const sPollution = document.getElementById("sliderPollution");
  sPollution.addEventListener("input", (e) => {
    simState.environment.pollutionLevel = parseInt(e.target.value);
    document.getElementById("ctrlValPollution").innerText = `Level ${simState.environment.pollutionLevel}%`;
  });

  // Header Pause/Resume Button
  document.getElementById("btnToggleSim").addEventListener("click", () => {
    simState.running = !simState.running;
    document.getElementById("btnToggleSim").innerText = simState.running ? "⏸️ Pause" : "▶️ Resume";
    addLog("INFO", `Simulation ${simState.running ? 'Resumed' : 'Paused'}`);
  });

  // Emergency Surface Button
  document.getElementById("btnEmergencySurface").addEventListener("click", () => {
    simState.probe.targetDepth = 0;
    document.getElementById("sliderDepth").value = 0;
    document.getElementById("ctrlValDepth").innerText = "0 m";
    addLog("ALERT", "EMERGENCY SURFACE INITIATED: High-speed winch retracting probe to 0m moonpool.");
  });

  // Export Data Log Button
  document.getElementById("btnExportData").addEventListener("click", exportGovDatabaseLog);
}

// Emergency Failsafe Triggers
function triggerEmergencySnag() {
  simState.probe.tensionN = 485.0; // Exceeds 450N limit
  simState.probe.snagged = true;
  addLog("DANGER", "UMBILICAL HIGH-TENSION ALARM: Tension > 450 N! Automated heave winch paying out slack to prevent cable severance.");
  simState.probe.targetDepth = Math.max(0, simState.probe.currentDepth - 10);
}

function triggerHypoxiaEvent() {
  simState.environment.pollutionLevel = 90;
  simState.environment.dissolvedOxygen = 1.4;
  document.getElementById("sliderPollution").value = 90;
  document.getElementById("ctrlValPollution").innerText = "Level 90%";
  addLog("DANGER", "CRITICAL HYPOXIC ANOMALY: DO dropped to 1.4 mg/L. Fish kill warning dispatched to CMFRI & State Fishery Board.");
}

function triggerIllegalTrawlerAlert() {
  simState.radar.illegalTrawlerAlert = true;
  addLog("ALERT", "SECURITY VIOLATION: Unregistered mechanized trawler detected trawling inside Marine Protected Sanctuary (Lat 10.12°N). Alert relayed to Indian Coast Guard & Marine Police.");
}

function resetAllFailsafes() {
  simState.probe.targetDepth = 45;
  simState.probe.tensionN = 82.4;
  simState.probe.snagged = false;
  simState.environment.pollutionLevel = 25;
  simState.environment.dissolvedOxygen = 6.84;
  simState.radar.illegalTrawlerAlert = false;
  document.getElementById("sliderDepth").value = 45;
  document.getElementById("sliderPollution").value = 25;
  document.getElementById("ctrlValDepth").innerText = "45 m";
  document.getElementById("ctrlValPollution").innerText = "Level 25%";
  addLog("INFO", "All emergency failsafes cleared. AquaPulse tandem returning to standard autonomous patrol.");
}

// ==================== DATA EXPORT ====================
function exportGovDatabaseLog() {
  const exportPayload = {
    vesselId: "AP-ASV-IND-042",
    reportTimestamp: new Date().toISOString(),
    systemState: simState,
    recentEvents: Array.from(document.querySelectorAll("#govLogStream .log-entry")).map(el => el.innerText)
  };

  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportPayload, null, 2));
  const downloadAnchor = document.createElement("a");
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `AquaPulse_GovDB_Telemetry_${Date.now()}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();

  addLog("SYNC", "Official National Fisheries inspection log downloaded as JSON payload.");
}
